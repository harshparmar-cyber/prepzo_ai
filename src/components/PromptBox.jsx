import { toast } from "sonner";
import { useState } from "react";
import { generateSmartNotes } from "../services/gemini";

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
  };

  const loadingText = {
    notes: "Generating Smart Notes...",
    mcq: "Generating MCQs...",
    viva: "Generating Viva Questions...",
  };

  const successText = {
    notes: "Smart Notes generated successfully!",
    mcq: "MCQs generated successfully!",
    viva: "Viva Questions generated successfully!",
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

      const result = await generateSmartNotes(
        pdfText,
        focus,
        mode
      );

      setGeneratedNotes(result);

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

      <h2>Focus (Optional)</h2>

      <textarea
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        placeholder={`Example:

Focus on Chapter 3

Explain in simple language

Generate only important points...`}
      />

      <button
        className="generate-btn"
        onClick={handleGenerate}
      >
         {mode === "notes"
        ? "Generate Smart Notes"
        : mode === "mcq"
        ? "Generate MCQs"
        : "Generate Viva Questions"}
      </button>

    </div>
  );
}

export default PromptBox;