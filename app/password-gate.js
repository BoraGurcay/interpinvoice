"use client";

import { useState, useEffect } from "react";

export default function PasswordGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");

  const PASSWORD = "interpinvoice2026"; // 🔑 change this

  useEffect(() => {
    const saved = sessionStorage.getItem("access_granted");
    if (saved === "true") setAuthorized(true);
  }, []);

  const handleSubmit = () => {
    if (input === PASSWORD) {
      sessionStorage.setItem("access_granted", "true");
      setAuthorized(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (authorized) return children;

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f172a",
      color: "white",
      flexDirection: "column",
      fontFamily: "sans-serif"
    }}>
      <h2 style={{ marginBottom: 20 }}>Interpreter Invoice Builder</h2>
      <p style={{ marginBottom: 20 }}>Enter access password</p>

      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 8,
          border: "none",
          marginBottom: 10,
          width: 250
        }}
      />

      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: "pointer"
        }}
      >
        Enter
      </button>
    </div>
  );
}