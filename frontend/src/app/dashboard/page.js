"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getUser, logout } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ specialization: "", bio: "", experience_years: 0 });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUserState(u);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessData, apptData] = await Promise.all([
        api.getSessions(),
        api.getAppointments(),
      ]);
      setSessions(sessData);
      setAppointments(apptData);

      if (user?.role === "therapist") {
        try {
          const p = await api.getMyTherapistProfile();
          if (p) setProfileData({ specialization: p.specialization || "", bio: p.bio || "", experience_years: p.experience_years || 0 });
        } catch(e) {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.updateTherapistProfile({
        specialization: profileData.specialization,
        bio: profileData.bio,
        experience_years: parseInt(profileData.experience_years) || 0
      });
      setProfileModalOpen(false);
    } catch(err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  if (!user) return null;

  const upcomingAppts = appointments.filter(a => a.status !== "cancelled" && a.status !== "completed").slice(0, 5);
  const recentSessions = sessions.slice(0, 5);

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="navbar">
        <Link href="/dashboard" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>HelpNow</Link>
        <div className="nav-links">
          <Link href="/chat" className="nav-link">💬 Chat</Link>
          <Link href="/appointments" className="nav-link">📅 Appointments</Link>
          <button onClick={logout} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="page-container">
        {/* Welcome */}
        <div className="animate-fade-in" style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.4rem" }}>
            Welcome back, <span className="gradient-text">{user.full_name?.split(" ")[0]}</span> 👋
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {user.role === "therapist" ? "Manage your schedule and patients" : "How are you feeling today?"}
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          <Link href="/chat" className="glass-card animate-fade-in" style={{ padding: "1.5rem", textDecoration: "none", color: "inherit", animationDelay: "0.1s" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>💬</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Messages</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Chat with your {user.role === 'therapist' ? "patients" : "therapist"}</p>
          </Link>
          <Link href="/appointments" className="glass-card animate-fade-in" style={{ padding: "1.5rem", textDecoration: "none", color: "inherit", animationDelay: "0.2s" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>📅</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.3rem" }}>
              {user.role === "therapist" ? "My Schedule" : "Book Session"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {user.role === "therapist" ? "View upcoming appointments" : "Find a therapist"}
            </p>
          </Link>
          <div className="glass-card animate-fade-in" style={{ padding: "1.5rem", animationDelay: "0.3s" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>📊</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Stats</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {sessions.length} chats · {appointments.length} appointments
            </p>
          </div>
          {user.role === "therapist" && (
            <button onClick={() => setProfileModalOpen(true)} className="glass-card animate-fade-in" style={{ padding: "1.5rem", border: "none", background: "var(--bg-card)", color: "inherit", cursor: "pointer", fontFamily: "inherit", textAlign: "left", animationDelay: "0.4s" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>⚙️</div>
              <h3 style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Edit Profile</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Update bio & specialization</p>
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {/* Recent Chat Sessions */}
          <div className="glass-card animate-fade-in" style={{ padding: "1.5rem", animationDelay: "0.2s" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              💬 Recent Chats
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}><span className="spinner" /></div>
            ) : recentSessions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
                No chats yet. <Link href="/chat" style={{ color: "var(--primary-light)" }}>Start one!</Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/chat?session=${s.id}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", textDecoration: "none", color: "inherit", transition: "background 0.2s" }}
                  >
                    <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{s.title}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="glass-card animate-fade-in" style={{ padding: "1.5rem", animationDelay: "0.3s" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              📅 Upcoming Appointments
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}><span className="spinner" /></div>
            ) : upcomingAppts.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
                No appointments. <Link href="/appointments" style={{ color: "var(--primary-light)" }}>Book one!</Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {upcomingAppts.map((a) => (
                  <div
                    key={a.id}
                    style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                        {user.role === 'therapist' ? (a.user?.full_name || "Patient") : (a.therapist?.user?.full_name || "Therapist")}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(a.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`badge badge-${a.status === "confirmed" ? "success" : a.status === "pending" ? "warning" : "primary"}`}>
                        {a.status}
                      </span>
                      <Link href={`/chat?appointment=${a.id}`} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem", textDecoration: "none" }}>
                        💬 Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {profileModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
          onClick={(e) => e.target === e.currentTarget && setProfileModalOpen(false)}
        >
          <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.5rem" }}>Edit Profile</h2>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Specialization</label>
                <input type="text" className="input-field" value={profileData.specialization} onChange={(e) => setProfileData({...profileData, specialization: e.target.value})} required />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Experience (Years)</label>
                <input type="number" min="0" className="input-field" value={profileData.experience_years} onChange={(e) => setProfileData({...profileData, experience_years: e.target.value})} required />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Bio</label>
                <textarea className="input-field" rows={4} value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} style={{ resize: "vertical" }} required />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => setProfileModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={profileLoading}>
                  {profileLoading ? <span className="spinner" /> : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
