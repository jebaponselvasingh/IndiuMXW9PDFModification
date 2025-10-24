"use client";

import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type Modification = {
  page: number;
  action: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: { r: number; g: number; b: number };
};

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(
    null,
  );
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [inputText, setInputText] = useState('');

  // Reads an uploaded PDF, applies an initial placeholder modification,
  // stores both original and modified bytes, and logs the placeholder.
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    // Keep a copy of the unmodified bytes
    const originalBytes = new Uint8Array(arrayBuffer);
    setOriginalPdfBytes(originalBytes);

    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Optional placeholder modification: draw empty text on the first page
    const pages = pdfDoc.getPages();
    const newMods: Modification[] = [];
    if (pages.length > 0) {
      const page = pages[0];
      const { width, height } = page.getSize();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const x = width - 100;
      const y = height - 50;
      const size = 14;
      const color = { r: 1, g: 0, b: 0 };

      page.drawText('', { x, y, size, font: helvetica, color: rgb(1, 0, 0) });

      newMods.push({
        page: 1,
        action: 'drawText',
        text: '',
        x,
        y,
        size,
        color,
      });
    }

    const modifiedBytes = await pdfDoc.save();
    setPdfBytes(modifiedBytes);

    const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    setModifications(newMods);
    console.log(JSON.stringify(newMods));
  };

  // Adds user‑entered text to the first page, records the modification,
  // updates the PDF preview, and logs the updated JSON.
  const handleAddText = async () => {
    if (!pdfBytes || !inputText) return;

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const x = 50;
    const y = height - 100;
    const size = 14;
    const color = { r: 0, g: 0, b: 1 };

    page.drawText(inputText, {
      x,
      y,
      size,
      font: helvetica,
      color: rgb(color.r, color.g, color.b),
    });

    const newMods = [
      ...modifications,
      {
        page: 1,
        action: 'drawText',
        text: inputText,
        x,
        y,
        size,
        color,
      },
    ];

    const newBytes = await pdfDoc.save();
    setPdfBytes(newBytes);
    const blob = new Blob([newBytes], { type: 'application/pdf' });
    setPdfUrl(URL.createObjectURL(blob));
    setModifications(newMods);

    console.log(JSON.stringify(newMods));
    setInputText('');
  };


  return (
    <div style={{ padding: '1rem' }}>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ marginBottom: '1rem' }}
      />
      {pdfUrl && (
        <embed
          src={pdfUrl}
          type="application/pdf"
          width="100%"
          height="600px"
        />
      )}

    </div>
  );
}