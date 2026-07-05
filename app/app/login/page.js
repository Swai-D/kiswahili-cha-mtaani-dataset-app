"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Hitilafu imetokea.");
      }
    } catch (err) {
      setError("Imeshindwa kuunganisha na server.");
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 style={{ fontSize: 22 }}>Kiswahili cha Mtaani</h1>
        <p className="sub" style={{ marginBottom: 18 }}>Weka password ili kuendelea.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="error-msg">{error}</div>}
          <div className="btn-row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Inaingia..." : "Ingia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
