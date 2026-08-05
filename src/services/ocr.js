import { toast } from "sonner";
import { getWorker } from "../utils/tesseractWorker";

export async function extractTextFromImage(image) {
  const worker = await getWorker((m) => {
    if (m.status === "recognizing text") {
      toast.loading(`Scanning ${Math.round(m.progress * 100)}%`, {
        id: "pdf",
      });
    }
  });

  const {
    data: { text },
  } = await worker.recognize(image);

  return text;
}