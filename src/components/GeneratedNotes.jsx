import { FaDownload } from "react-icons/fa";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { uploadPDF } from "../services/cloudinary";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

function GeneratedNotes({
  notes,
  mode,
  selectedFile,
}) {
  if (!notes) return null;

  const handleDownload = async () => {
    try {
      toast.loading("Preparing PDF...", {
        id: "pdf",
      });

      const doc = new jsPDF();

      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;

      // Original uploaded PDF name (without extension)
      const originalName =
        selectedFile?.name.replace(/\.[^/.]+$/, "") || "Prepzo_AI";

      // Decide suffix based on current mode
      const suffix =
        mode === "notes"
          ? "Smart Notes"
          : mode === "mcq"
          ? "MCQs"
          : "Viva Questions";

      // Final filename
      const fileName = `${originalName} - ${suffix}.pdf`;

      // PDF Title
      const title = `${originalName} - ${suffix}`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(title, margin, 20);

      // Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const lines = doc.splitTextToSize(notes, maxWidth);

      let y = 35;

      lines.forEach((line) => {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }

        doc.text(line, margin, y);
        y += 7;
      });

      // Create PDF Blob
      const pdfBlob = doc.output("blob");

      toast.loading("Uploading PDF...", {
        id: "pdf",
      });

      // Upload to Cloudinary
      const uploaded = await uploadPDF(pdfBlob, fileName);

      console.log("Cloudinary Response:", uploaded);

      // Save metadata in Firestore
      await addDoc(collection(db, "recentFiles"), {
        uid: auth.currentUser.uid,

        title,
        fileName,

        type: mode,

        pdfUrl: uploaded.secure_url,

        publicId: uploaded.public_id,

        createdAt: serverTimestamp(),
      });

      // Download locally
      doc.save(fileName);

      toast.success("PDF uploaded & saved successfully! 🎉", {
        id: "pdf",
      });

    } catch (error) {
      console.error(error);

      toast.error("Failed to save PDF.", {
        id: "pdf",
      });
    }
  };

  return (
    <div className="generated-notes">
      <div className="notes-header">
        <h2>
          {mode === "notes"
            ? "📘 Smart Notes"
            : mode === "mcq"
            ? "❓ MCQs"
            : "🎤 Viva Questions"}
        </h2>

        <button
          className="download-btn"
          onClick={handleDownload}
        >
          <FaDownload />
          Download PDF
        </button>
      </div>

      <div className="notes-content">
        <pre>{notes}</pre>
      </div>
    </div>
  );
}

export default GeneratedNotes;