
import React, { createElement, ReactElement, useRef, useState } from "react";
import { IndiuMXPDFEditorContainerProps } from "../typings/IndiuMXPDFEditorProps";
import { PDFDocument } from "pdf-lib";

import "./ui/IndiuMXPDFEditor.css";

export function IndiuMXPDFEditor(props: IndiuMXPDFEditorContainerProps): ReactElement {
    console.log("IndiuMXPDFEditor props:", props);
    // Note: props.inputFile / props.outputFile are available on runtime if needed via props
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState("edited.pdf");
    const [jsonResult, setJsonResult] = useState<string | null>(null);
    const [uploadedBytes, setUploadedBytes] = useState<ArrayBuffer | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [fieldTypes, setFieldTypes] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name.replace(/\.pdf$/i, "") + "_edited.pdf");

        const arrayBuffer = await file.arrayBuffer();
        setUploadedBytes(arrayBuffer);
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        setPdfUrl(URL.createObjectURL(blob));

        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            const values: Record<string, any> = {};
            const types: Record<string, string> = {};

            for (const f of fields) {
                const name = f.getName();
                const anyF = f as any;
                let value: any = "";
                if (typeof anyF.getText === "function") {
                    try { value = anyF.getText(); } catch { value = ""; }
                    types[name] = "text";
                } else if (typeof anyF.isChecked === "function") {
                    try { value = anyF.isChecked(); } catch { value = false; }
                    types[name] = "checkbox";
                } else if (typeof anyF.getSelected === "function") {
                    try { value = anyF.getSelected(); } catch { value = ""; }
                    types[name] = "select";
                } else {
                    try { value = anyF.getText ? anyF.getText() : ""; } catch { value = ""; }
                    types[name] = "text";
                }
                if (value === undefined || value === null) value = "";
                values[name] = value;
            }

            setFormValues(values);
            setFieldTypes(types);
            setJsonResult(JSON.stringify({ fileName, fields: values }, null, 2));
        } catch (err) {
            console.error("pdf-lib parse failed:", err);
        }
    }

    async function handleSave() {
        if (!uploadedBytes) return;
        try {
            const pdfDoc = await PDFDocument.load(uploadedBytes);
            const form = pdfDoc.getForm();

            for (const [name, val] of Object.entries(formValues)) {
                const type = fieldTypes[name];
                const anyVal = val as any;
                try {
                    if (type === "text") {
                        try { (form.getTextField(name) as any).setText(String(anyVal)); }
                        catch { (form.getField(name) as any)?.setText?.(String(anyVal)); }
                    } else if (type === "checkbox") {
                        try {
                            const cb = form.getCheckBox(name) as any;
                            anyVal ? cb.check() : cb.uncheck();
                        } catch {
                            try { (form.getTextField(name) as any).setText(String(anyVal)); } catch { }
                        }
                    } else if (type === "select") {
                        try { (form.getDropdown(name) as any).select(String(anyVal)); }
                        catch { (form.getOptionList(name) as any).select(String(anyVal)); }
                    } else {
                        try { (form.getTextField(name) as any).setText(String(anyVal)); } catch { }
                    }
                } catch {
                    // ignore per-field errors
                }
            }

            const modifiedBytes = await pdfDoc.save();
            const bytesView = modifiedBytes instanceof Uint8Array ? modifiedBytes : new Uint8Array(modifiedBytes as any);
            const modifiedBlob = new Blob([bytesView], { type: "application/pdf" });
            const modifiedUrl = URL.createObjectURL(modifiedBlob);
            setPdfUrl(modifiedUrl);

            // update JSON from PDF
            const allFields = form.getFields();
            const resultValues: Record<string, any> = {};
            for (const f of allFields) {
                const name = f.getName();
                const anyF = f as any;
                let value: any = "";
                if (typeof anyF.getText === "function") {
                    try { value = anyF.getText(); } catch { value = ""; }
                } else if (typeof anyF.isChecked === "function") {
                    try { value = anyF.isChecked(); } catch { value = false; }
                } else if (typeof anyF.getSelected === "function") {
                    try { value = anyF.getSelected(); } catch { value = ""; }
                } else {
                    try { value = anyF.getText ? anyF.getText() : ""; } catch { value = ""; }
                }
                if (value === undefined || value === null) value = "";
                resultValues[name] = value;
            }

            setFormValues(resultValues);
            setJsonResult(JSON.stringify({ fileName, fields: resultValues }, null, 2));

            // trigger download of modified PDF
            const a = document.createElement("a");
            a.href = modifiedUrl;
            a.download = fileName.replace(/\.pdf$/i, "") + ".pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(modifiedUrl);
        } catch (err) {
            console.error(err);
            alert("Failed to save PDF with current values.");
        }
    }

    return (
        <div className="indiu-mx-pdf-editor-container">
            <h3>IndiuMX PDF Editor</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFile} />
                <button onClick={handleSave} disabled={!uploadedBytes} className="mx-button">Save PDF</button>
            </div>

            <div style={{ marginTop: 12 }}>
                {pdfUrl ? (
                    <iframe title="pdf-preview" src={pdfUrl} style={{ width: "100%", height: "60vh", border: "none" }} />
                ) : (
                    <div style={{ color: "#666" }}>Upload a PDF to preview and edit.</div>
                )}
            </div>

            {Object.keys(formValues).length > 0 ? (
                <div style={{ marginTop: 12 }}>
                    <h4>Fields</h4>
                    <div style={{ display: "grid", gap: 8 }}>
                        {Object.entries(formValues).map(([name, val]) => (
                            <div key={name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <label style={{ width: 240, fontFamily: "monospace", fontSize: 12 }}>{name}</label>
                                {fieldTypes[name] === "checkbox" ? (
                                    <input type="checkbox" checked={Boolean(val)} onChange={(e) => setFormValues((s) => ({ ...s, [name]: e.target.checked }))} />
                                ) : (
                                    <input style={{ flex: 1, padding: 6, fontFamily: "monospace" }} value={val} onChange={(e) => setFormValues((s) => ({ ...s, [name]: e.target.value }))} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {jsonResult ? (
                <div style={{ marginTop: 12 }}>
                    <h4>Extracted fields (JSON)</h4>
                    <textarea readOnly value={jsonResult} rows={8} style={{ width: "100%" }} />
                </div>
            ) : null}
        </div>
    );
}
