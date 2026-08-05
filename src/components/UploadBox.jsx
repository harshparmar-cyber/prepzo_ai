import { useState } from "react";
import { FaCloudUploadAlt, FaFilePdf } from "react-icons/fa";
import { toast } from "sonner";
import { extractTextFromPDF } from "../services/pdfExtractor";

function UploadBox({

  selectedFile,
  setSelectedFile,

  pdfText,
  setPdfText

}) {

  const [reading, setReading] = useState(false);

  const handleUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {

      toast.error("Please upload only PDF files.");

      return;

    }

    try {

      setReading(true);

      toast.loading("Analyzing PDF...", {

        id: "pdf",

      });

      const extractedText = await extractTextFromPDF(file);

      setSelectedFile(file);

      setPdfText(extractedText);

      console.log("========== PDF TEXT ==========");

      console.log(extractedText);

      console.log("==============================");

      toast.success("PDF processed successfully! 🎉", {

        id: "pdf",

      });

    }

    catch (error) {

      console.error(error);

      toast.error("Failed to read PDF.", {

        id: "pdf",

      });

    }

    finally {

      setReading(false);

    }

  };

  return (

    <div className="upload-box">

      <h2>Upload Document</h2>

      <label className="drop-area">

        {!selectedFile ? (

          <>

            <FaCloudUploadAlt />

            <h3>

              {reading

                ? "Reading PDF..."

                : "Click to Upload PDF"}

            </h3>

            <p>Drag & Drop or click here</p>

          </>

        ) : (

          <>

            <FaFilePdf

              size={60}

              color="#DB1A1A"

            />

            <h3>{selectedFile.name}</h3>

            <p>

              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB

            </p>

            <small

              style={{

                color: "#6C63FF",

                marginTop: "10px",

                fontWeight: "600"

              }}

            >

              ✓ PDF Ready for AI

            </small>

          </>

        )}

        <input

          type="file"

          accept=".pdf"

          hidden

          onChange={handleUpload}

        />

      </label>

    </div>

  );

}

export default UploadBox;