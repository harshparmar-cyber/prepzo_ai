import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function renderPage(page) {
  const viewport = page.getViewport({
    scale: 2,
  });

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

export async function extractObservationImages(file) {

  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: buffer,
  }).promise;

  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {

    console.log(`Rendering page ${i}`);

    const page = await pdf.getPage(i);

    const image = await renderPage(page);

    pages.push(image);

  }

  return pages;
}