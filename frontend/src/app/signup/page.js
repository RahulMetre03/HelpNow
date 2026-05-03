"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken, setUser } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "patient", city: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.signup(form);
      setToken(data.access_token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      <div style={{ position: "absolute", top: "2rem", left: "2rem" }}>
        <Link href="/" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>HelpNow</Link>
      </div>

      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(0,217,166,0.08), transparent 70%)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Create account</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9rem" }}>Start your journey to better mental health</p>

        {error && (
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "1.5rem", color: "var(--danger)", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Full Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Your full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
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
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>I am a</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["patient", "therapist"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${form.role === role ? "var(--primary)" : "var(--border)"}`,
                    background: form.role === role ? "rgba(108,99,255,0.15)" : "var(--bg-input)",
                    color: form.role === role ? "var(--primary-light)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                >
                  {role === "patient" ? "🧑 Patient" : "🩺 Therapist"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>City</label>
            <select
              className="input-field"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
              style={{ cursor: "pointer" }}
            >
              <option value="">Select your city</option>
              {["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary-light)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
