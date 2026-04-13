"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken, setUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(form);
      setToken(data.access_token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      <div style={{ position: "absolute", top: "2rem", left: "2rem" }}>
        <Link href="/" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>HelpNow</Link>
      </div>

      {/* Background glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(108,99,255,0.1), transparent 70%)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Welcome back</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9rem" }}>Log in to continue your journey</p>

        {error && (
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "1.5rem", color: "var(--danger)", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Log In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--primary-light)", textDecoration: "none", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
