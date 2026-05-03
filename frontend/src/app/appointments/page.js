"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getUser, logout } from "@/lib/api";

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("browse"); // browse | my
  const [bookingModal, setBookingModal] = useState(null);
  const [postBookingModal, setPostBookingModal] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const cities = ["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"];

  useEffect(() => {
    if (bookingModal?.id && bookingDate) {
      api.getTherapistSlots(bookingModal.id, bookingDate)
        .then(setAvailableSlots)
        .catch(console.error);
    } else {
      setAvailableSlots([]);
    }
  }, [bookingDate, bookingModal]);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUserState(u);
    const userCity = u.city || "";
    setSelectedCity(userCity);
    loadData(userCity);
  }, []);

  useEffect(() => {
    if (user) loadData(selectedCity);
  }, [selectedCity]);

  const loadData = async (city) => {
    try {
      setLoading(true);
      const [therapistData, apptData] = await Promise.all([
        api.getTherapists(null, city || null),
        api.getAppointments(),
      ]);
      setTherapists(therapistData);
      setAppointments(apptData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const bookAppointment = async () => {
    if (!bookingDate || !bookingTime || !bookingModal) return;
    setBookingLoading(true);
    try {
      const scheduled = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      const newAppointment = await api.createAppointment({
        therapist_id: bookingModal.id,
        scheduled_at: scheduled,
        duration_minutes: 60,
        notes: bookingNotes || null,
      });
      setPostBookingModal({ appointment: newAppointment, therapist: bookingModal });
      setBookingModal(null);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
      loadData(selectedCity);
    } catch (e) {
      setMessage("Failed to book: " + e.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.updateAppointment(id, { status: "cancelled" });
      setMessage("Appointment cancelled");
      loadData(selectedCity);
    } catch (e) { setMessage("Failed to cancel"); }
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="navbar">
        <Link href="/dashboard" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>HelpNow</Link>
        <div className="nav-links">
          <Link href="/dashboard" className="nav-link">🏠 Home</Link>
          <Link href="/chat" className="nav-link">💬 Chat</Link>
          <button onClick={logout} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>Logout</button>
        </div>
      </nav>

      <div className="page-container">
        <h1 className="section-title animate-fade-in">📅 Appointments</h1>

        {message && (
          <div className="animate-fade-in" style={{ padding: "12px 18px", borderRadius: "var(--radius-sm)", background: message.includes("✅") ? "rgba(0,217,166,0.1)" : "rgba(255,107,107,0.1)", border: `1px solid ${message.includes("✅") ? "rgba(0,217,166,0.3)" : "rgba(255,107,107,0.3)"}`, color: message.includes("✅") ? "var(--success)" : "var(--danger)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            {message}
          </div>
        )}

        {/* Tabs */}
        {user.role === "patient" && (
          <div style={{ display: "flex", gap: "4px", marginBottom: "2rem", background: "var(--bg-card)", padding: "4px", borderRadius: "var(--radius-sm)", width: "fit-content" }}>
            {[
              { key: "browse", label: "🩺 Browse Therapists" },
              { key: "my", label: "📋 My Appointments" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: tab === t.key ? "var(--primary)" : "transparent",
                  color: tab === t.key ? "white" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* City Filter */}
        {tab === "browse" && user?.role === "patient" && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>📍 Location:</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedCity("")}
                style={{
                  padding: "7px 16px", borderRadius: "20px", border: `1px solid ${!selectedCity ? "var(--primary)" : "var(--border)"}`,
                  background: !selectedCity ? "rgba(108,99,255,0.15)" : "var(--bg-card)",
                  color: !selectedCity ? "var(--primary-light)" : "var(--text-secondary)",
                  cursor: "pointer", fontWeight: 500, fontSize: "0.8rem", fontFamily: "inherit", transition: "all 0.2s",
                }}
              >All Cities</button>
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  style={{
                    padding: "7px 16px", borderRadius: "20px", border: `1px solid ${selectedCity === c ? "var(--primary)" : "var(--border)"}`,
                    background: selectedCity === c ? "rgba(108,99,255,0.15)" : "var(--bg-card)",
                    color: selectedCity === c ? "var(--primary-light)" : "var(--text-secondary)",
                    cursor: "pointer", fontWeight: 500, fontSize: "0.8rem", fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >{c}</button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}><span className="spinner" /></div>
        ) : tab === "browse" && user.role === "patient" ? (
          /* Therapist Cards */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {therapists.length === 0 ? (
              <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>No therapists available yet.</p>
            ) : (
              therapists.map((t, i) => (
                <div key={t.id} className="glass-card animate-fade-in" style={{ padding: "1.5rem", animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {t.user?.full_name?.[0] || "T"}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{t.user?.full_name || "Therapist"}</h3>
                      <span className="badge badge-primary" style={{ marginTop: "4px" }}>{t.specialization}</span>
                    </div>
                  </div>
                  {t.bio && <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1rem" }}>{t.bio}</p>}
                  <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <span>⭐ {t.rating.toFixed(1)}</span>
                    <span>🕐 {t.experience_years}y exp</span>
                    {t.city && <span>📍 {t.city}</span>}
                  </div>
                  {t.availability_slots?.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Available:</span>
                      <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                        {t.availability_slots.map((s, j) => (
                          <span key={j} style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "0.7rem", background: "rgba(0,217,166,0.1)", color: "var(--accent)" }}>
                            {dayNames[s.day_of_week]} {s.start_time}-{s.end_time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const hasActiveAppt = appointments.some(a => 
                      String(a.therapist_id) === String(t.id) || String(a.therapist?.id) === String(t.id)
                    ) && appointments.some(a => 
                      (String(a.therapist_id) === String(t.id) || String(a.therapist?.id) === String(t.id)) && 
                      (a.status === "pending" || a.status === "confirmed")
                    );
                    return (
                      <div title={hasActiveAppt ? "You already have an appointment" : ""} style={{ width: "100%", cursor: hasActiveAppt ? "not-allowed" : "pointer" }}>
                        <button 
                          onClick={() => setBookingModal(t)} 
                          className="btn btn-accent" 
                          style={{ 
                            width: "100%", 
                            fontSize: "0.85rem", 
                            padding: "10px", 
                            opacity: hasActiveAppt ? 0.5 : 1,
                            pointerEvents: hasActiveAppt ? "none" : "auto"
                          }}
                          disabled={hasActiveAppt}
                        >
                          Book Session
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        ) : (
          /* My Appointments */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "700px" }}>
            {appointments.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>No appointments yet.</p>
            ) : (
              appointments.map((a, i) => (
                <div key={a.id} className="glass-card animate-fade-in" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", animationDelay: `${i * 0.05}s` }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                      {user.role === 'therapist' ? (a.user?.full_name || "Patient") : (a.therapist?.user?.full_name || "Therapist")}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {new Date(a.scheduled_at).toLocaleString()} · {a.duration_minutes}min
                    </div>
                    {a.notes && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>📝 {a.notes}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`badge badge-${a.status === "confirmed" ? "success" : a.status === "cancelled" ? "danger" : a.status === "completed" ? "primary" : "warning"}`}>
                      {a.status}
                    </span>
                    {(a.status === "pending" || a.status === "confirmed") && (
                      <button onClick={() => cancelAppointment(a.id)} className="btn btn-danger" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                        Cancel
                      </button>
                    )}
                    <Link href={`/chat?appointment=${a.id}&patient=${encodeURIComponent(a.user?.full_name)}&therapist=${encodeURIComponent(a.therapist?.user?.full_name)}`} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.75rem", textDecoration: "none" }}>
                      💬 Chat
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {bookingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
          onClick={(e) => e.target === e.currentTarget && setBookingModal(null)}
        >
          <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.3rem" }}>Book Appointment</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              with <span style={{ color: "var(--primary-light)", fontWeight: 600 }}>{bookingModal.user?.full_name}</span>
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Date</label>
              <input type="date" className="input-field" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Time</label>
              {bookingDate ? (
                availableSlots.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {availableSlots.map(s => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => setBookingTime(s.time)}
                        disabled={!s.available}
                        style={{
                          padding: "8px", borderRadius: "6px", border: "1px solid var(--border)",
                          background: !s.available ? "var(--bg-input)" : bookingTime === s.time ? "var(--primary)" : "transparent",
                          color: !s.available ? "var(--text-muted)" : bookingTime === s.time ? "white" : "inherit",
                          cursor: !s.available ? "not-allowed" : "pointer",
                          fontFamily: "inherit", fontSize: "0.85rem"
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No slots available.</div>
                )
              ) : (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Please select a date first.</div>
              )}
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Notes (optional)</label>
              <textarea className="input-field" rows={3} placeholder="Anything you'd like the therapist to know..." value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setBookingModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={bookAppointment} className="btn btn-primary" style={{ flex: 1 }} disabled={!bookingDate || !bookingTime || bookingLoading}>
                {bookingLoading ? <span className="spinner" /> : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {postBookingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
          <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "400px", padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>Appointment Booked</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Share your feelings with our AI chatbot before your session. This helps your therapist understand you better.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setPostBookingModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
              <Link
                href={`/chat?appointment=${postBookingModal.appointment.id}&patient=${encodeURIComponent(user.full_name)}&therapist=${encodeURIComponent(postBookingModal.therapist.user?.full_name)}`}
                className="btn btn-primary"
                style={{ flex: 1, textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
