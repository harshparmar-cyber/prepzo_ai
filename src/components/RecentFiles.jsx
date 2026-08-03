import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";

import {
  FaFilePdf,
  FaDownload,
  FaExternalLinkAlt,
} from "react-icons/fa";

function RecentFiles() {
  const [files, setFiles] = useState([]);

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

  return (
    <div className="recent-files">

      <div className="recent-header">
        <h2>Recent Files</h2>
      </div>

      {files.length === 0 ? (
        <p className="empty-files">
          No generated PDFs yet.
        </p>
      ) : (
        <div className="recent-grid">
          {files.map((file) => (
            <div className="recent-card" key={file.id}>

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
                  download
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
  );
}

export default RecentFiles;