import { useState } from "react";
import { FaBars, FaBell } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import DashboardHero from "../components/DashboardHero";
import ToolCards from "../components/ToolCards";
import UploadBox from "../components/UploadBox";
import PromptBox from "../components/PromptBox";
import RecentFiles from "../components/RecentFiles";
import GeneratedNotes from "../components/GeneratedNotes";
import Profile from "../components/Profile";

import "./Dashboard.css";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [activeTool, setActiveTool] = useState("Smart Notes");

  const [generatedNotes, setGeneratedNotes] = useState("");

  const [mode, setMode] = useState("notes");

  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfText, setPdfText] = useState("");

  return (
    <div className="dashboard">

      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        setMode={setMode}
      />

      <main className="main">

        <div className="mobile-header">

          <div className="mobile-left">

            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>

            <div className="mobile-logo">
              <h2>🎓 Prepzo AI</h2>
              <p>Learn smarter with AI</p>
            </div>

          </div>

          <button className="bell-btn">
            <FaBell />
          </button>

        </div>

        {/* ================= PROFILE ================= */}

        {activeMenu === "Profile" ? (

          <Profile />

        ) : (

          <>
            <DashboardHero />

            <ToolCards
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              mode={mode}
              setMode={setMode}
            />

            <div className="generator">

              <UploadBox
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                pdfText={pdfText}
                setPdfText={setPdfText}
              />

              <PromptBox
                mode={mode}
                selectedFile={selectedFile}
                pdfText={pdfText}
                setGeneratedNotes={setGeneratedNotes}
              />

            </div>

            <GeneratedNotes
              mode={mode}
              notes={generatedNotes}
              selectedFile={selectedFile}
            />

            <RecentFiles />

          </>

        )}

      </main>

    </div>
  );
}

export default Dashboard;