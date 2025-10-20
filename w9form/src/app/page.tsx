"use client"

import Image from "next/image";
import { useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("edited.pdf");
  const [jsonResult, setJsonResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.pdf$/i, "") + "_edited.pdf");

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    setPdfUrl(URL.createObjectURL(blob));
  }

  // (Removed previous utility buttons — saving now extracts form field JSON)

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[24px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <h1 className="text-2xl font-semibold">PDF Editor (pdf-lib)</h1>

        <div className="flex gap-3 items-center w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFile}
            className=""
          />
          <button
            onClick={async () => {
              // Save button: extract form fields -> JSON and trigger download + show
              if (!pdfUrl) return;
              try {
                const resp = await fetch(pdfUrl);
                const bytes = await resp.arrayBuffer();
                const pdfDoc = await PDFDocument.load(bytes);
                const form = pdfDoc.getForm();
                const fields = form.getFields();
                const result: Record<string, any> = {};

                for (const f of fields) {
                  const name = f.getName();
                  let value: any = null;
                  // try common accessors
                  try {
                    // text fields
                    if (typeof (f as any).getText === "function") {
                      value = (f as any).getText();
                    } else if (typeof (f as any).isChecked === "function") {
                      // checkbox
                      value = (f as any).isChecked() ? true : false;
                    } else if (typeof (f as any).getSelected === "function") {
                      // dropdown / radio
                      value = (f as any).getSelected();
                    } else if (typeof (f as any).getOptions === "function") {
                      // option list - fallback
                      value = (f as any).getOptions();
                    } else {
                      // last resort: try acroField value
                      try {
                        // @ts-ignore internal
                        const v = (f as any).acroField?.get?.(PDFDocument.PDFName?.of?.("V"));
                        value = v ? String(v) : "";
                      } catch (e) {
                        value = "";
                      }
                    }
                  } catch (err) {
                    value = "";
                  }

                  // normalize undefined/null to empty string
                  if (value === undefined || value === null) value = "";
                  result[name] = value;
                }

                const out = {
                  fileName,
                  fields: result,
                };
                const json = JSON.stringify(out, null, 2);
                // show in textarea
                setJsonResult(json);
                console.log("Extracted fields:", out);
                console.log(json);
                // offer download
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName.replace(/\.pdf$/i, "") + ".json";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error(e);
                alert("Failed to extract fields from PDF.");
              }
            }}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
            disabled={!pdfUrl}
          >
            Save PDF
          </button>
        </div>

        <div className="w-full bg-white rounded shadow p-4">
          {pdfUrl ? (
            <iframe
              title="pdf-preview"
              src={pdfUrl}
              style={{ width: "100%", height: "80vh", border: "none" }}
            />
          ) : (
            <div className="text-sm text-muted">Upload a PDF to preview and edit.</div>
          )}
        </div>
        {jsonResult ? (
          <div className="w-full mt-4">
            <h2 className="font-medium mb-2">Extracted fields (JSON)</h2>
            <textarea
              readOnly
              value={jsonResult}
              rows={12}
              className="w-full font-mono text-sm p-3 border rounded bg-gray-50"
            />
          </div>
        ) : null}
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://pdf-lib.js.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn pdf-lib
        </a>
      </footer>
    </div>
  );
}
