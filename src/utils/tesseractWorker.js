import { createWorker } from "tesseract.js";

let worker = null;

export async function getWorker(logger) {
  if (!worker) {
    worker = await createWorker("eng", 1, {
      logger: logger,
    });
  }

  return worker;
}

export async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}