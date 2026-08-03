import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
         <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      <Toaster
      position="bottom-center"
      richColors
      expand={false}
      closeButton={false}
      duration={2500}
      offset={25}
      />

    </BrowserRouter>
    
  );
}

export default App;