import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "";

const fontLinks = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
  </>
);

const statusColors = {
  active: "text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/40",
  idle: "text-[#f5c518] bg-[#f5c518]/10 border border-[#f5c518]/40",
  dormant: "text-[#e11d48] bg-[#e11d48]/10 border border-[#e11d48]/30",
};

function getStatus(lastSeen) {
  if (!lastSeen) return "dormant";
  const delta = Date.now() - new Date(lastSeen).getTime();
  const days = delta / (1000 * 60 * 60 * 24);
  if (days <= 3) return "active";
  if (days <= 14) return "idle";
  return "dormant";
}

async function fetchAdminDirectory() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session) {
    throw new Error("Session expired");
  }
  const host = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const endpoint = `${host}/api/admin/users`;
  const resp = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || "Failed to fetch admin data");
  }
  const payload = await resp.json();
  return (payload?.users || []).map((row) => ({
    id: row.id,
    name: row.name || row.user?.email?.split("@")[0] || "—",
    email: row.user?.email || row.email || "—",
    institute: row.institute || "—",
    createdAt: row.created_at,
    lastSeen: row.user?.last_sign_in_at || row.updated_at,
  }));
}

export default function AdminControls() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    setLoading(true);
    fetchAdminDirectory()
      .then((rows) => {
        if (!mounted) return;
        setUsers(rows);
        setError(null);
      })
      .catch((err) => {
        console.error("Admin fetch failed", err);
        setError(err.message || "Unable to load users. Please try again in a bit.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.institute]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => getStatus(u.lastSeen) === "active").length;
    const newThisWeek = users.filter((u) => {
      if (!u.createdAt) return false;
      const delta = Date.now() - new Date(u.createdAt).getTime();
      return delta <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, active, newThisWeek };
  }, [users]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center text-[#00F2FF] font-mono tracking-[0.3em] text-xs">
        {fontLinks}
        <div className="w-12 h-12 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin mb-6" />
        SYNCING ADMIN CONTROLS...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#04040a] text-[#e2e8f0]" style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
      {fontLinks}
      {/* Top hero */}
      <div className="relative overflow-hidden border-b border-white/5" style={{ background: "radial-gradient(circle at top, rgba(0,242,255,0.18), transparent 55%)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-14 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#94a3b8]">Admin Controls</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif" }}>
                Mission Control <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00F2FF] via-[#00FFB2] to-[#7000FF]">Console</span>
              </h1>
              <p className="text-sm text-[#94a3b8] max-w-2xl font-mono">
                Monitor every learner in the lab, keep tabs on institutes joining, and spot dormant accounts at a glance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] bg-transparent border border-white/20 hover:border-white/50 transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate("/sandbox")}
                className="px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#050505]"
                style={{ background: "linear-gradient(135deg, #00F2FF, #00FFB2)" }}
              >
                Launch Sandbox
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Accounts", value: stats.total, icon: "⬢" },
              { label: "Active (72h)", value: stats.active, icon: "⚡" },
              { label: "New (7d)", value: stats.newThisWeek, icon: "★" },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="border border-white/6 bg-white/2 px-5 py-4 relative overflow-hidden"
                style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))" }}
              >
                <div className="absolute top-0 right-0 w-5 h-5">
                  <div className="absolute top-0 right-0 w-px h-5 bg-[#00F2FF]/30" />
                  <div className="absolute top-0 right-0 h-px w-5 bg-[#00F2FF]/30" />
                </div>
                <p className="text-[10px] font-mono tracking-[0.2em] text-[#64748B] uppercase mb-2">{item.label}</p>
                <div className="text-3xl font-black tracking-tight">{item.value}</div>
                <span className="text-sm text-[#94a3b8]">{item.icon}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#64748B] font-mono mb-1">Directory</p>
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif" }}>User Roster</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, institute"
                className="bg-[#05050b] border border-white/10 px-4 py-2 w-72 text-sm focus:outline-none focus:border-[#00F2FF] text-[#e2e8f0]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">⌕</span>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#64748B]">
              Showing {filteredUsers.length} / {users.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="border border-[#e11d48]/40 text-[#e11d48] bg-[#e11d48]/10 px-4 py-3 text-sm font-mono">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border border-white/8 bg-[#05050b]/80" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
          <table className="min-w-full text-left text-sm">
            <thead className="uppercase text-[11px] tracking-[0.3em] text-[#64748B] font-mono bg-[#090915]">
              <tr>
                {["User", "Institute", "Email", "Created", "Last Seen", "Status"].map((label) => (
                  <th key={label} className="px-5 py-4">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const status = getStatus(user.lastSeen);
                return (
                  <tr key={user.id} className="border-t border-white/5 hover:bg-white/3 transition">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold" style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif" }}>{user.name}</span>
                        <span className="text-xs text-[#94a3b8] font-mono">{user.id.slice(0, 8)}···</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#cbd5f5]">{user.institute}</td>
                    <td className="px-5 py-4 text-[#e2e8f0]">{user.email}</td>
                    <td className="px-5 py-4 text-[#94a3b8] font-mono">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-[#94a3b8] font-mono">
                      {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] uppercase tracking-[0.2em] font-mono px-3 py-1 inline-flex items-center gap-1 ${statusColors[status]}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status === "active" ? "#22d3ee" : status === "idle" ? "#f5c518" : "#e11d48" }} />
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#64748B] font-mono text-sm tracking-[0.2em]">
                    No users match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
