import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";
import { toast } from "sonner";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Please fill all fields");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Welcome Back! 🎉", {
        description: "Login successful.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error("Login Failed");
    }
  };

  return (
    <div className="container">
      <div className="card">

        <div className="logo-box">
          🎓
        </div>

        <h1>Login</h1>

        <p>Welcome back to Prepzo AI</p>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          LOGIN
        </button>

        <div className="bottom-text">
          Don't have an account?{" "}
          <Link to="/signup">Sign Up</Link>
        </div>

      </div>
    </div>
  );
}

export default Login;