import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db, auth } from "../firebase";

import {
  FaFilePdf,
  FaDownload,
  FaExternalLinkAlt,
  FaTrashAlt,
} from "react-icons/fa";

import { toast } from "sonner";
import DeleteModal from "./DeleteModal";

function RecentFiles() {
  const [files, setFiles] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "recentFiles"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFiles(data);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      toast.loading("Deleting file...", {
        id: "delete-file",
      });

      await deleteDoc(
        doc(db, "recentFiles", selectedFile.id)
      );

      toast.success("File deleted successfully!", {
        id: "delete-file",
      });

      setShowDeleteModal(false);
      setSelectedFile(null);

    } catch (error) {
      console.error(error);

      toast.error("Failed to delete file.", {
        id: "delete-file",
      });
    }
  };

  return (
    <>
      <div className="recent-files">

        <div className="recent-header">
          <h2>📂 Recent Files</h2>
        </div>

        {files.length === 0 ? (
          <p className="empty-files">
            No generated PDFs yet.
          </p>
        ) : (
          <div className="recent-grid">

            {files.map((file) => (

              <div
                className="recent-card"
                key={file.id}
              >

                <button
                  className="delete-file-btn"
                  title="Delete File"
                  onClick={() => {
                    setSelectedFile(file);
                    setShowDeleteModal(true);
                  }}
                >
                  <FaTrashAlt />
                </button>

                <FaFilePdf className="pdf-icon" />

                <h3>{file.title}</h3>

                <p>{file.type.toUpperCase()}</p>

                <div className="recent-actions">

                  <a
                    href={file.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="open-btn"
                  >
                    <FaExternalLinkAlt />
                    Open
                  </a>

                  <a
                    href={file.pdfUrl}
                    download={file.fileName}
                    className="download-btn-small"
                  >
                    <FaDownload />
                    Download
                  </a>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        fileName={selectedFile?.title}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFile(null);
        }}
        onDelete={handleDelete}
      />
    </>
  );
}

export default RecentFiles;