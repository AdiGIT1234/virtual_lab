import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session) throw new Error("Session expired");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function fetchAdminDirectory() {
  const headers = await getAuthHeaders();
  const host = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const resp = await fetch(`${host}/api/admin/users`, { headers });
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

async function fetchAdminStats() {
  const headers = await getAuthHeaders();
  const host = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const resp = await fetch(`${host}/api/admin/stats`, { headers });
  if (!resp.ok) return null;
  return resp.json();
}

async function deleteUser(userId) {
  const headers = await getAuthHeaders();
  const host = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const resp = await fetch(`${host}/api/admin/users/${userId}`, {
    method: "DELETE",
    headers,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || "Delete failed");
  }
  return resp.json();
}

export default function AdminControls() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // user object to confirm
  const [actionMsg, setActionMsg] = useState(null); // { type: 'success'|'error', text }
  const [backendStats, setBackendStats] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'experiments'
  const [experiments, setExperiments] = useState([]);
  const [editingExp, setEditingExp] = useState(null);
  const [savingExp, setSavingExp] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const host = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
      const resp = await fetch(`${host}/api/admin/experiments`, { headers });
      const data = await resp.json();
      setExperiments(data.experiments || []);
    } catch (err) {
      setError(err.message || "Failed to load experiments");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const [rows, stats] = await Promise.all([fetchAdminDirectory(), fetchAdminStats()]);
      setUsers(rows);
      if (stats) setBackendStats(stats);
      if (activeTab === "experiments") {
        await loadExperiments();
      }
    } catch (err) {
      console.error("Admin fetch failed", err);
      setError(err.message || "Unable to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, activeTab, loadExperiments]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateExperiment = async () => {
    if (!editingExp) return;
    setSavingExp(true);
    try {
      const headers = await getAuthHeaders();
      const host = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
      const resp = await fetch(`${host}/api/admin/experiments/${editingExp.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(editingExp),
      });
      if (!resp.ok) throw new Error("Update failed");
      
      setExperiments(exps => exps.map(e => e.id === editingExp.id ? editingExp : e));
      setActionMsg({ type: "success", text: `Experiment "${editingExp.title}" updated successfully.` });
      setEditingExp(null);
    } catch (err) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setSavingExp(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.institute]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [users, search]);

  const filteredExperiments = useMemo(() => {
    if (!search.trim()) return experiments;
    const query = search.toLowerCase();
    return experiments.filter((exp) =>
      [exp.title, exp.id, exp.difficulty]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [experiments, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => getStatus(u.lastSeen) === "active").length;
    const newThisWeek = users.filter((u) => {
      if (!u.createdAt) return false;
      return Date.now() - new Date(u.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    return {
      total: backendStats?.total ?? total,
      active,
      newThisWeek: backendStats?.new_this_week ?? newThisWeek,
    };
  }, [users, backendStats]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center text-[#00F2FF] font-mono tracking-[0.3em] text-xs">
        {fontLinks}
        <div className="w-12 h-12 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin mb-6" />
        SYNCING ADMIN CONTROLS...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#04040a] text-[#e2e8f0]" style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
      {fontLinks}

      {/* Edit Experiment Modal */}
      <AnimatePresence>
        {editingExp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-[#0a0a1a] border border-[#00F2FF]/20 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
              style={{ clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))" }}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0d0d1f]">
                <div>
                  <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#00F2FF]">Standardization Editor</p>
                  <h3 className="text-xl font-bold">{editingExp.title}</h3>
                </div>
                <button 
                  onClick={() => setEditingExp(null)}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition"
                >✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Aim</span>
                      <textarea
                        value={editingExp.aim || ""}
                        onChange={e => setEditingExp({...editingExp, aim: e.target.value})}
                        className="w-full bg-[#050510] border border-white/10 p-3 text-sm focus:border-[#00F2FF] outline-none min-h-[100px]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Theory (HTML allowed)</span>
                      <textarea
                        value={editingExp.theory || ""}
                        onChange={e => setEditingExp({...editingExp, theory: e.target.value})}
                        className="w-full bg-[#050510] border border-white/10 p-3 text-sm font-mono focus:border-[#00F2FF] outline-none h-[400px]"
                      />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Procedure Steps (One per line)</span>
                      <textarea
                        value={Array.isArray(editingExp.procedure) ? editingExp.procedure.join("\n") : editingExp.procedure || ""}
                        onChange={e => setEditingExp({...editingExp, procedure: e.target.value.split("\n")})}
                        placeholder="1. Step one&#10;2. Step two..."
                        className="w-full bg-[#050510] border border-white/10 p-3 text-sm focus:border-[#00F2FF] outline-none h-[520px]"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-[#0d0d1f] flex justify-end gap-4">
                <button
                  onClick={() => setEditingExp(null)}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5"
                >Cancel</button>
                <button
                  onClick={handleUpdateExperiment}
                  disabled={savingExp}
                  className="px-8 py-2 text-xs font-bold uppercase tracking-widest bg-[#00F2FF] text-[#050505] hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition disabled:opacity-50"
                >
                  {savingExp ? "Syncing to Supabase..." : "Save & Sync"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top hero */}
      <div className="relative overflow-hidden border-b border-white/5" style={{ background: "radial-gradient(circle at top, rgba(0,242,255,0.18), transparent 55%)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-14 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#94a3b8]">Admin Controls</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Mission Control <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00F2FF, #00FFB2, #7000FF)" }}>Console</span>
              </h1>
              <p className="text-sm text-[#94a3b8] max-w-2xl font-mono">
                Monitor every learner, manage accounts, and track engagement — all changes sync directly to Supabase.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={loadData}
                className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-[#00F2FF]/30 text-[#00F2FF] hover:border-[#00F2FF] transition flex items-center gap-2"
              >
                <span className="text-base">↻</span> Refresh
              </button>
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
        {/* Action feedback */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`border px-4 py-3 text-sm font-mono flex items-center justify-between ${
                actionMsg.type === "success"
                  ? "border-[#22d3ee]/40 text-[#22d3ee] bg-[#22d3ee]/10"
                  : "border-[#e11d48]/40 text-[#e11d48] bg-[#e11d48]/10"
              }`}
            >
              <span>{actionMsg.text}</span>
              <button onClick={() => setActionMsg(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-4">
          <div className="flex bg-[#050510] border border-white/10 p-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition ${activeTab === "users" ? "bg-[#00F2FF] text-[#050505]" : "text-[#94a3b8] hover:text-white"}`}
            >User Roster</button>
            <button
              onClick={() => { setActiveTab("experiments"); loadExperiments(); }}
              className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition ${activeTab === "experiments" ? "bg-[#00F2FF] text-[#050505]" : "text-[#94a3b8] hover:text-white"}`}
            >Lab Experiments</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "users" ? "Search users..." : "Search experiments..."}
                className="bg-[#05050b] border border-white/10 px-4 py-2 w-72 text-sm focus:outline-none focus:border-[#00F2FF] text-[#e2e8f0]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">⌕</span>
            </div>
          </div>
        </div>

        {activeTab === "users" ? (
          <div className="overflow-x-auto border border-white/8 bg-[#05050b]/80">
            <table className="min-w-full text-left text-sm">
              <thead className="uppercase text-[11px] tracking-[0.3em] text-[#64748B] font-mono bg-[#090915]">
                <tr>
                  {["User", "Institute", "Email", "Created", "Last Seen", "Status", "Actions"].map((label) => (
                    <th key={label} className="px-5 py-4">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const status = getStatus(user.lastSeen);
                  const isBeingDeleted = deletingId === user.id;
                  return (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isBeingDeleted ? 0.4 : 1 }}
                      className="border-t border-white/5 hover:bg-white/2 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.name}</span>
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
                      <td className="px-5 py-4">
                        <button
                          disabled={isBeingDeleted}
                          onClick={() => setConfirmDelete(user)}
                          className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] font-mono border border-[#e11d48]/40 text-[#e11d48] hover:bg-[#e11d48]/10 transition"
                        >
                          {isBeingDeleted ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiments.map((exp) => (
              <div 
                key={exp.id} 
                className="bg-[#050510] border border-white/10 p-6 flex flex-col gap-4 relative"
                style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase text-[#64748B]">{exp.difficulty}</span>
                  <span className="text-[10px] font-mono uppercase text-[#00F2FF]">{exp.id}</span>
                </div>
                <h3 className="text-lg font-bold">{exp.title}</h3>
                <p className="text-xs text-[#94a3b8] line-clamp-3 leading-relaxed mb-4">{exp.aim}</p>
                <button
                  onClick={() => setEditingExp(exp)}
                  className="mt-auto px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-[#00F2FF]/30 text-[#00F2FF] hover:bg-[#00F2FF]/5 transition"
                >Edit Theory & Procedure</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
