"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getUser, logout, createChatWebSocket } from "@/lib/api";

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)" }}><span className="spinner" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUserState] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUserState(u);
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const appointmentId = searchParams.get("appointment");
      const data = await api.getSessions(appointmentId);
      setSessions(data);
      const sessionParam = searchParams.get("session");
      if (sessionParam) {
        selectSession(sessionParam);
      } else if (appointmentId && data.length > 0) {
        selectSession(data[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const selectSession = async (id) => {
    setActiveSession(id);
    try {
      const msgs = await api.getMessages(id);
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await api.renameSession(sessionId, newTitle);
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    } catch (e) {
      alert("Failed to rename session: " + e.message);
    }
  };

  const createNewSession = async () => {
    const appointmentId = searchParams.get("appointment");
    const patient = searchParams.get("patient");
    const therapist = searchParams.get("therapist");

    if (!appointmentId || !patient || !therapist) {
      alert("Please select an appointment from the Appointments page first.");
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      const sessionName = `${patient}_${therapist}_${today}`;
      const session = await api.createSession(appointmentId, sessionName);
      setSessions([session, ...sessions]);
      setActiveSession(session.id);
      setMessages([]);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !activeSession) return;

    const userMsg = { id: Date.now(), sender: "user", content: input, sent_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const aiMsg = await api.sendMessage(activeSession, input);
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", content: "Sorry, I couldn't respond right now. Please try again. 💙", sent_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav className="navbar">
        <Link href="/dashboard" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>HelpNow</Link>
        <div className="nav-links">
          <Link href="/dashboard" className="nav-link">🏠 Home</Link>
          <Link href="/appointments" className="nav-link">📅 Appointments</Link>
          <button onClick={logout} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>Logout</button>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? "280px" : "0px",
          minWidth: sidebarOpen ? "280px" : "0px",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          overflow: "hidden",
          background: "var(--bg-card)",
        }}>
          <div style={{ padding: "1rem" }}>
            <button onClick={createNewSession} className="btn btn-primary" style={{ width: "100%", fontSize: "0.85rem" }}>
              ✨ New Chat Segment
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0.5rem" }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: activeSession === s.id ? "rgba(108,99,255,0.15)" : "transparent",
                  color: activeSession === s.id ? "var(--primary-light)" : "var(--text-secondary)",
                  marginBottom: "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div onClick={() => selectSession(s.id)} style={{ flex: 1, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.85rem", fontWeight: activeSession === s.id ? 600 : 400 }}>{s.title}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTitle = prompt("Enter new chat title:", s.title);
                    if (newTitle && newTitle !== s.title) handleRenameSession(s.id, newTitle);
                  }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: "1.2rem", opacity: 0.6, color: "inherit", marginLeft: "4px" }}
                  title="Rename"
                >
                  ⋮
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Toggle sidebar + session name */}
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              {activeSession ? sessions.find(s => s.id === activeSession)?.title || "Chat" : "Select or create a chat"}
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {!activeSession ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.5 }}>💬</div>
                {searchParams.get("appointment") ? (
                  <>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>No active chat</h2>
                    <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>Create a new chat segment to message.</p>
                    <button onClick={createNewSession} className="btn btn-primary">✨ Start Chat</button>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Select an Appointment</h2>
                    <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem", maxWidth: "300px" }}>You must select an appointment from the Dashboard or Appointments page to start messaging.</p>
                    <Link href="/appointments" className="btn btn-primary" style={{ textDecoration: "none" }}>Go to Appointments</Link>
                  </>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👋</div>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>This is the beginning of the conversation. Send a message below.</p>
              </div>
            ) : (
              <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{
                      maxWidth: "75%",
                      padding: "14px 18px",
                      borderRadius: m.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: m.sender === "user"
                        ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                        : "var(--bg-card)",
                      border: m.sender === "user" ? "none" : "1px solid var(--border)",
                      color: "var(--text-primary)",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      boxShadow: m.sender === "user" ? "0 4px 15px rgba(108,99,255,0.2)" : "none",
                    }}>
                      {m.sender === "ai" && (
                        <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, marginBottom: "4px", letterSpacing: "0.5px" }}>
                          HELPNOW AI
                        </div>
                      )}
                      {m.sender !== "ai" && m.sender !== user.role && (
                        <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, marginBottom: "4px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                          {m.sender}
                        </div>
                      )}
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                      <div style={{ fontSize: "0.65rem", color: m.sender === "user" ? "rgba(255,255,255,0.5)" : "var(--text-muted)", marginTop: "6px", textAlign: "right" }}>
                        {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", animation: "pulse-glow 1s infinite" }} />
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", animation: "pulse-glow 1s infinite 0.2s" }} />
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", animation: "pulse-glow 1s infinite 0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {activeSession && (
            user.role === 'therapist' ? (
              <div style={{ padding: "1.5rem", background: "var(--bg-card)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <span style={{ fontSize: "1.2rem", verticalAlign: "middle" }}>👁️</span> You are in view-only mode. Therapists monitor patient-AI chats but cannot intervene here.
                </p>
              </div>
            ) : (
              <form onSubmit={sendMessage} style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", gap: "0.75rem" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!input.trim() || sending}
                    style={{ padding: "12px 24px", flexShrink: 0 }}
                  >
                    {sending ? <span className="spinner" style={{ width: "18px", height: "18px" }} /> : "Send ↑"}
                  </button>
                </div>
                <p style={{ textAlign: "center", marginTop: "8px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  HelpNow AI is here to offer support and companionship, but your therapist is best for professional guidance.
                </p>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
