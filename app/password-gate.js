"use client";

import { useState, useEffect } from "react";

export default function PasswordGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");

  const PASSWORD = "interpinvoice2026";

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
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "white",
        flexDirection: "column",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>Interpreter Invoice</h2>
      <p style={{ marginBottom: 20, opacity: 0.75 }}>Secure demo access</p>

      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        placeholder="Enter password"
        style={{
          padding: 10,
          borderRadius: 8,
          border: "none",
          marginBottom: 10,
          width: 250,
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
          cursor: "pointer",
        }}
      >
        Enter
      </button>

      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.55 }}>
        Built by Bora Gurcay
      </p>
    </div>
  );
}