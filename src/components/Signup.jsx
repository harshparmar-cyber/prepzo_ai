import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import { toast } from "sonner";

import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !password || !confirmPassword) {
      toast.warning("Please fill all fields.");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.warning("Invalid Email", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    if (password.length < 6) {
      toast.warning("Weak Password", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are identical.",
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      await signOut(auth);

      toast.success("Account Created 🎉", {
        description: "Please login to continue.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("Email already exists", {
            description: "Please login instead.",
          });
          break;

        case "auth/invalid-email":
          toast.error("Invalid Email");
          break;

        case "auth/weak-password":
          toast.warning("Weak Password");
          break;

        default:
          toast.error("Signup Failed", {
            description: "Something went wrong. Please try again.",
          });
      }
    }
  };

  return (
    <div className="container">
      <div className="card">

        <div className="logo-box">
          🎓
        </div>

        <h1>Create Account</h1>

        <p>Join Prepzo AI and start learning smarter.</p>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button onClick={handleSignup}>
          CREATE ACCOUNT
        </button>

        <div className="bottom-text">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </div>

      </div>
    </div>
  );
}

export default Signup;