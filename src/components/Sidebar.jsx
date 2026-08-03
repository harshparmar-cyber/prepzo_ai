import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FaHome,
  FaBook,
  FaQuestionCircle,
  FaMicrophone,
  FaHistory,
  FaUser,
  FaCog,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeMenu,
  setActiveMenu,
  mode,
  setMode,
}) {

  const navigate = useNavigate();
  const handleMenuClick = (menu) => {
    setActiveMenu(menu);

    if (menu === "Smart Notes") {
      setMode("notes");
    } else if (menu === "MCQs") {
      setMode("mcq");
    } else if (menu === "Viva Questions") {
      setMode("viva");
    }

    // Close sidebar on mobile after selecting
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
  try {
    await signOut(auth);

    toast.success("Logged out successfully 👋");

    navigate("/");
    // or navigate("/login")
    // depending on your routes

  } catch (error) {
    toast.error("Failed to logout");
    console.log(error);
  }
};

  return (
    <aside className={`sidebar ${sidebarOpen ? "show" : ""}`}>

      <button
        className="close-btn"
        onClick={() => setSidebarOpen(false)}
      >
        <FaTimes />
      </button>

      <div className="sidebar-top">

        {/* Logo */}
        <div className="logo">

          <div className="logo-icon">
            🎓
          </div>

          <div className="logo-text">
            <h2>Prepzo AI</h2>
            <span>Learn Smarter</span>
          </div>

        </div>

        <ul>

          <li
            className={activeMenu === "Dashboard" ? "active" : ""}
            onClick={() => handleMenuClick("Dashboard")}
          >
            <FaHome />
            <span>Dashboard</span>
          </li>

          <li
            className={activeMenu === "Smart Notes" ? "active" : ""}
            onClick={() => {
              setActiveMenu("Smart Notes");
              setMode("notes");
            }}
          >
            <FaBook />
            <span>Smart Notes</span>
          </li>

          <li
            className={activeMenu === "MCQs" ? "active" : ""}
            onClick={() => {
              setActiveMenu("MCQs");
              setMode("mcq");
            }}
          >
            <FaQuestionCircle />
            <span>MCQs</span>
          </li>

          <li
            className={activeMenu === "Viva Questions" ? "active" : ""}
            onClick={() => {
              setActiveMenu("Viva Questions");
              setMode("viva");
            }}
          >
            <FaMicrophone />
            <span>Viva Questions</span>
          </li>

          <li
            className={activeMenu === "History" ? "active" : ""}
            onClick={() => handleMenuClick("History")}
          >
            <FaHistory />
            <span>History</span>
          </li>

          <li
            className={activeMenu === "Profile" ? "active" : ""}
            onClick={() => handleMenuClick("Profile")}
          >
            <FaUser />
            <span>Profile</span>
          </li>

          <li
            className={activeMenu === "Settings" ? "active" : ""}
            onClick={() => handleMenuClick("Settings")}
          >
            <FaCog />
            <span>Settings</span>
          </li>

        </ul>

      </div>

      <div className="sidebar-bottom">

        <button className="logout"  onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;