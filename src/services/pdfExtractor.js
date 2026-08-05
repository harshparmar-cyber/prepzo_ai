import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { extractTextFromImage } from "./ocr";
import { terminateWorker } from "../utils/tesseractWorker";
import { cleanOCRText } from "../utils/cleanOCRText";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function renderPageToImage(page) {
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL("image/png");
}

export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    let finalText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Reading Page ${i}`);

      const page = await pdf.getPage(i);

      // Try extracting selectable text
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");

      // If enough text exists, use it
      if (pageText.trim().length > 30) {
        console.log(`Page ${i}: Text Layer Found`);

        finalText += pageText + "\n\n";
      }

      // Otherwise use OCR
      else {
        console.log(`Page ${i}: Running OCR...`);

        const image = await renderPageToImage(page);

        const ocrText = await extractTextFromImage(image);

        finalText += ocrText + "\n\n";
      }
    }

    const cleanedText = cleanOCRText(finalText);

    return cleanedText;
  } finally {
    // Always terminate the worker after processing
    await terminateWorker();
  }
}