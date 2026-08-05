import {
  FaBook,
  FaQuestionCircle,
  FaMicrophone,
} from "react-icons/fa";

function ToolCards({
  activeTool,
  setActiveTool,
  mode,
  setMode,
}) {
  const selectTool = (tool) => {
    setActiveTool(tool);

    if (tool === "Smart Notes") {
      setMode("notes");
    } else if (tool === "MCQs") {
      setMode("mcq");
    } else if (tool === "Viva Questions") {
      setMode("viva");
    }
  };

  return (
    <div className="tool-grid">

      {/* Smart Notes */}
      <div
        className={`tool-card ${mode === "notes" ? "active" : ""
          }`}
        onClick={() => selectTool("Smart Notes")}
      >
        <div className="tool-icon">
          <FaBook />
        </div>

        <h3>Smart Notes</h3>

        <p>
          Structured, exam-ready AI notes from your PDFs and
          documents.
        </p>
      </div>

      {/* MCQs */}
      <div
        className={`tool-card ${mode === "mcq" ? "active" : ""
          }`}
        onClick={() => selectTool("MCQs")}
      >
        <div className="tool-icon">
          <FaQuestionCircle />
        </div>

        <h3>MCQs</h3>

        <p>
          Auto-generate multiple-choice questions with answers.
        </p>
      </div>

      {/* Viva */}
      <div
        className={`tool-card ${mode === "viva" ? "active" : ""
          }`}
        onClick={() => selectTool("Viva Questions")}
      >
        <div className="tool-icon">
          <FaMicrophone />
        </div>

        <h3>Viva Questions</h3>

        <p>
          AI-generated viva questions with model answers.
        </p>
      </div>

      <div
        className={`tool-card ${mode === "observation" ? "active" : ""}`}
        onClick={() => {
          setMode("observation");
          setActiveTool("Observations");
        }}
      >
        <div className="tool-icon">👀</div>

        <h3>Observations</h3>

        <p>Generate observations for screenshots inside your PDF.</p>
      </div>

    </div>
  );
}

export default ToolCards;