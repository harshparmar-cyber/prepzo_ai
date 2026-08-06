import { toast } from "sonner";
import { useState } from "react";

import { generateSmartNotes } from "../services/gemini";
import { extractObservationImages } from "../services/pdfObservationExtractor";
import { generateObservations } from "../services/generateObservations";

function PromptBox({
  mode,
  selectedFile,
  pdfText,
  setGeneratedNotes,
}) {
  const [focus, setFocus] = useState("");

  const buttonText = {
    notes: "Generate Smart Notes",
    mcq: "Generate MCQs",
    viva: "Generate Viva Questions",
    observation: "Generate Observations",
  };

  const loadingText = {
    notes: "Generating Smart Notes...",
    mcq: "Generating MCQs...",
    viva: "Generating Viva Questions...",
    observation: "Analyzing Screenshots...",
  };

  const successText = {
    notes: "Smart Notes generated successfully!",
    mcq: "MCQs generated successfully!",
    viva: "Viva Questions generated successfully!",
    observation: "Observations generated successfully!",
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please upload a PDF first.");
      return;
    }

    try {
      toast.loading(loadingText[mode], {
        id: "generate",
      });

      // ===============================
      // OBSERVATION MODE
      // ===============================

      if (mode === "observation") {
        const screenshots =
          await extractObservationImages(selectedFile);

        if (screenshots.length === 0) {
          toast.error(
            "No screenshots detected inside this PDF.",
            {
              id: "generate",
            }
          );
          return;
        }

        const observations =
          await generateObservations(screenshots);

        setGeneratedNotes(observations);
      }

      // ===============================
      // SMART NOTES / MCQ / VIVA
      // ===============================

      else {
        const result = await generateSmartNotes(
          pdfText,
          focus,
          mode
        );

        setGeneratedNotes(result);
      }

      toast.success(successText[mode], {
        id: "generate",
      });

    } catch (err) {
      console.error(err);

      toast.error("Failed to generate content.", {
        id: "generate",
      });
    }
  };

  return (
    <div className="prompt-box">

      <h2>
        {mode === "observation"
          ? "Observation Mode"
          : "Focus (Optional)"}
      </h2>

      <textarea
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        disabled={mode === "observation"}
        placeholder={
          mode === "observation"
            ? `Observation mode ignores text inside the PDF.

Prepzo AI will:

• Detect screenshots
• Crop each screenshot
• Analyze each one separately using Gemini Vision
• Generate Observation 1, Observation 2, ...`
            : `Example:

Focus on Chapter 3

Explain in simple language

Generate only important points...`
        }
      />

      <button
        className="generate-btn"
        onClick={handleGenerate}
      >
        {buttonText[mode]}
      </button>

    </div>
  );
}

export default PromptBox;