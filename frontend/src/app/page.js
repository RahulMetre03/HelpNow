"use client";
import Link from "next/link";

const features = [
  { icon: "💬", title: "AI Chat Support", desc: "Talk to an empathetic AI companion whenever you need — available 24/7 between sessions." },
  { icon: "📅", title: "Book Appointments", desc: "Browse therapists, check availability, and schedule sessions in seconds." },
  { icon: "🔒", title: "Private & Secure", desc: "Your conversations are protected. You control what's shared, always." },
  { icon: "🌙", title: "Continuous Care", desc: "Bridge the gap between sessions — never lose track of your thoughts and feelings." },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Create your free account in seconds" },
  { num: "02", title: "Start Chatting", desc: "Talk to our AI whenever you need support" },
  { num: "03", title: "Book a Session", desc: "Find the right therapist and schedule" },
  { num: "04", title: "Get Better Care", desc: "Your therapist arrives prepared" },
];

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="navbar">
        <span className="nav-logo gradient-text">HelpNow</span>
        <div className="nav-links">
          <Link href="/login" className="nav-link">Log In</Link>
          <Link href="/signup" className="btn btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "6rem 2rem 4rem", position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", top: "-120px", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(108,99,255,0.15), transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-100px", right: "10%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(0,217,166,0.1), transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

        <div className="animate-fade-in" style={{ position: "relative", zIndex: 1, maxWidth: "720px", margin: "0 auto" }}>
          <div className="badge badge-primary" style={{ marginBottom: "1.5rem", fontSize: "0.8rem" }}>
            🧠 AI-Powered Mental Health Support
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-1px" }}>
            Your mind deserves
            <br />
            <span className="gradient-text">continuous care</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "540px", margin: "0 auto 2.5rem" }}>
            Bridge the gap between therapy sessions with empathetic AI support, smart appointment scheduling, and seamless continuity of care.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn btn-primary" style={{ padding: "14px 36px", fontSize: "1rem" }}>
              Start Free — No Card Needed
            </Link>
            <Link href="/login" className="btn btn-secondary">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="gradient-text" style={{ fontSize: "1.8rem", fontWeight: 700 }}>Everything you need</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card animate-fade-in" style={{ padding: "2rem", animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>{f.icon}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.6rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "4rem 2rem 6rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="gradient-text" style={{ fontSize: "1.8rem", fontWeight: 700 }}>How it works</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {steps.map((s, i) => (
            <div key={i} className="animate-fade-in" style={{ textAlign: "center", animationDelay: `${i * 0.12}s` }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--primary)", opacity: 0.3, marginBottom: "0.5rem" }}>{s.num}</div>
              <h4 style={{ fontWeight: 700, marginBottom: "0.4rem" }}>{s.title}</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <span className="gradient-text" style={{ fontWeight: 700 }}>HelpNow</span> — Your companion between sessions. Not a replacement for professional care.
      </footer>
    </div>
  );
}
