import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import "./Profile.css";
import {
  collection,
 query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  FaUserCircle,
  FaFilePdf,
  FaBook,
  FaQuestionCircle,
  FaMicrophone,
} from "react-icons/fa";

function Profile() {
  const [stats, setStats] = useState({
    total: 0,
    notes: 0,
    mcq: 0,
    viva: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "recentFiles"),
        where("uid", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);

      let notes = 0;
      let mcq = 0;
      let viva = 0;

      snapshot.forEach((doc) => {
        const type = doc.data().type;

        if (type === "notes") notes++;
        if (type === "mcq") mcq++;
        if (type === "viva") viva++;
      });

      setStats({
        total: snapshot.size,
        notes,
        mcq,
        viva,
      });
    };

    loadStats();
  }, []);

  const user = auth.currentUser;

  return (
    <div className="profile-page">

      <div className="profile-card">

        <FaUserCircle className="profile-avatar" />

        <h2>
          {user?.displayName || "Prepzo Student"}
        </h2>

        <p>{user?.email}</p>

        <span>
          Joined:{" "}
          {new Date(
            user?.metadata.creationTime
          ).toLocaleDateString()}
        </span>

      </div>

      <div className="profile-stats">

        <div className="stat-card">
          <FaFilePdf />
          <h3>{stats.total}</h3>
          <p>Total PDFs</p>
        </div>

        <div className="stat-card">
          <FaBook />
          <h3>{stats.notes}</h3>
          <p>Smart Notes</p>
        </div>

        <div className="stat-card">
          <FaQuestionCircle />
          <h3>{stats.mcq}</h3>
          <p>MCQs</p>
        </div>

        <div className="stat-card">
          <FaMicrophone />
          <h3>{stats.viva}</h3>
          <p>Viva</p>
        </div>

      </div>

    </div>
  );
}

export default Profile;