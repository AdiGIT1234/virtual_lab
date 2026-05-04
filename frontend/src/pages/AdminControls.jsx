import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";

const API_BASE = API_BASE_URL;

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
  active:  "text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/40",
  idle:    "text-[#f5c518] bg-[#f5c518]/10 border border-[#f5c518]/40",
  dormant: "text-[#e11d48] bg-[#e11d48]/10 border border-[#e11d48]/30",
};

function getStatus(lastSeen) {
  if (!lastSeen) return "dormant";
  const days = (Date.now() - new Date(lastSeen).getTime()) / 86_400_000;
  if (days <= 3)  return "active";
  if (days <= 14) return "idle";
  return "dormant";
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session) throw new Error("Session expired");
  return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
}

async function apiFetch(path) {
  const headers = await getAuthHeaders();
  const resp = await fetch(`${API_BASE}${path}`, { headers });
  if (!resp.ok) throw new Error(await resp.text() || `HTTP ${resp.status}`);
  return resp.json();
}

export default function AdminControls() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();

  const [users,       setUsers]       = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [backendStats,setBackendStats]= useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("users");

  const [editingExp,  setEditingExp]  = useState(null);
  const [savingExp,   setSavingExp]   = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null); // user to delete
  const [deletingId,    setDeletingId]    = useState(null);

  const [actionMsg, setActionMsg] = useState(null);

  // ── Redirect non-admins ────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/dashboard", { replace: true });
  }, [authLoading, isAdmin, navigate]);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    const [payload, stats] = await Promise.all([
      apiFetch("/api/admin/users"),
      apiFetch("/api/admin/stats"),
    ]);
    setUsers((payload.users || []).map(row => ({
      id:        row.id,
      name:      row.name || row.user?.email?.split("@")[0] || "—",
      email:     row.user?.email || row.email || "—",
      institute: row.institute || "—",
      createdAt: row.user?.created_at || row.created_at,
      lastSeen:  row.user?.last_sign_in_at || row.updated_at,
    })));
    setBackendStats(stats);
  }, []);

  const loadExperiments = useCallback(async () => {
    const data = await apiFetch("/api/admin/experiments");
    setExperiments(data.experiments || []);
  }, []);

  const loadActivity = useCallback(async () => {
    const data = await apiFetch("/api/admin/activity");
    setActivity(data.activity || []);
  }, []);

  const loadAll = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      await loadUsers();
      await loadExperiments();
      await loadActivity();
    } catch (err) {
      console.error("Admin fetch failed:", err);
      setError(err.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadUsers, loadExperiments, loadActivity]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       backendStats?.total        ?? users.length,
    active:      backendStats?.active_72h   ?? users.filter(u => getStatus(u.lastSeen) === "active").length,
    newThisWeek: backendStats?.new_this_week ?? users.filter(u => u.createdAt && Date.now() - new Date(u.createdAt).getTime() <= 7 * 86_400_000).length,
    expsSaved:   activity.length,
  }), [users, backendStats, activity]);

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/admin/users/${confirmDelete.id}`, {
        method: "DELETE", headers,
      });
      if (!resp.ok) throw new Error(await resp.text() || "Delete failed");
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
      setActionMsg({ type: "success", text: `User "${confirmDelete.name}" deleted.` });
    } catch (err) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }, [confirmDelete]);

  // ── Update experiment ──────────────────────────────────────────────────────
  const handleUpdateExperiment = useCallback(async () => {
    if (!editingExp) return;
    setSavingExp(true);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/admin/experiments/${editingExp.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify(editingExp),
      });
      if (!resp.ok) throw new Error(await resp.text() || "Update failed");
      setExperiments(exps => exps.map(e => e.id === editingExp.id ? editingExp : e));
      setActionMsg({ type: "success", text: `"${editingExp.title}" saved to Supabase.` });
      setEditingExp(null);
    } catch (err) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setSavingExp(false);
    }
  }, [editingExp]);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return search ? users.filter(u =>
      [u.name, u.email, u.institute].some(f => f?.toLowerCase().includes(q))
    ) : users;
  }, [users, search]);

  const filteredExps = useMemo(() => {
    const q = search.toLowerCase();
    return search ? experiments.filter(e =>
      [e.title, e.id, e.difficulty].some(f => f?.toLowerCase().includes(q))
    ) : experiments;
  }, [experiments, search]);

  const filteredActivity = useMemo(() => {
    const q = search.toLowerCase();
    return search ? activity.filter(a =>
      [a.experiment_id, a.title, a.profile?.name, a.profile?.institute].some(f => f?.toLowerCase().includes(q))
    ) : activity;
  }, [activity, search]);

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

      {/* ── Delete confirmation modal ────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a1a] border border-[#e11d48]/40 w-full max-w-md p-8 flex flex-col gap-6"
            >
              <div>
                <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#e11d48] mb-2">Destructive Action</p>
                <h3 className="text-xl font-bold">Delete Account?</h3>
              </div>
              <p className="text-sm text-[#94a3b8]">
                This permanently deletes <span className="text-white font-semibold">{confirmDelete.name}</span> ({confirmDelete.email}) from Supabase Auth and all associated data. This cannot be undone.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5"
                >Cancel</button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={!!deletingId}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-[#e11d48] text-white hover:bg-[#be123c] disabled:opacity-50"
                >{deletingId ? "Deleting…" : "Delete Permanently"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Experiment editor modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {editingExp && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="bg-[#0a0a1a] border border-[#00F2FF]/20 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
              style={{ clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))" }}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0d0d1f]">
                <div>
                  <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#00F2FF]">Experiment Editor · {editingExp.id}</p>
                  <h3 className="text-xl font-bold">{editingExp.title}</h3>
                </div>
                <button onClick={() => setEditingExp(null)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Meta row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Title", field: "title", type: "text" },
                    { label: "Difficulty", field: "difficulty", type: "select", options: ["Beginner","Intermediate","Advanced"] },
                    { label: "Objective (one line)", field: "objective", type: "text" },
                  ].map(({ label, field, type, options }) => (
                    <label key={field} className="block">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">{label}</span>
                      {type === "select" ? (
                        <select
                          value={editingExp[field] || ""}
                          onChange={e => setEditingExp({ ...editingExp, [field]: e.target.value })}
                          className="w-full bg-[#050510] border border-white/10 p-2 text-sm focus:border-[#00F2FF] outline-none text-[#e2e8f0]"
                        >
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editingExp[field] || ""}
                          onChange={e => setEditingExp({ ...editingExp, [field]: e.target.value })}
                          className="w-full bg-[#050510] border border-white/10 p-2 text-sm focus:border-[#00F2FF] outline-none"
                        />
                      )}
                    </label>
                  ))}
                </div>

                {/* Aim */}
                <label className="block">
                  <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Aim</span>
                  <textarea
                    value={editingExp.aim || ""}
                    onChange={e => setEditingExp({ ...editingExp, aim: e.target.value })}
                    className="w-full bg-[#050510] border border-white/10 p-3 text-sm focus:border-[#00F2FF] outline-none min-h-[80px]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-6">
                  {/* Theory */}
                  <label className="block">
                    <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Theory (HTML allowed)</span>
                    <textarea
                      value={editingExp.theory || ""}
                      onChange={e => setEditingExp({ ...editingExp, theory: e.target.value })}
                      className="w-full bg-[#050510] border border-white/10 p-3 text-sm font-mono focus:border-[#00F2FF] outline-none h-[340px]"
                    />
                  </label>

                  {/* Procedure */}
                  <label className="block">
                    <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Procedure Steps (one per line)</span>
                    <textarea
                      value={Array.isArray(editingExp.procedure) ? editingExp.procedure.join("\n") : editingExp.procedure || ""}
                      onChange={e => setEditingExp({ ...editingExp, procedure: e.target.value.split("\n") })}
                      className="w-full bg-[#050510] border border-white/10 p-3 text-sm focus:border-[#00F2FF] outline-none h-[340px]"
                    />
                  </label>
                </div>

                {/* Pretest/posttest JSON editor */}
                {["pretest", "posttest"].map(key => (
                  <label key={key} className="block">
                    <span className="text-xs uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">
                      {key === "pretest" ? "Pre-test" : "Post-test"} Questions (JSON array)
                    </span>
                    <textarea
                      value={editingExp[key] ? JSON.stringify(editingExp[key], null, 2) : ""}
                      onChange={e => {
                        try { setEditingExp({ ...editingExp, [key]: JSON.parse(e.target.value) }); }
                        catch { /* allow partial edits */ }
                      }}
                      className="w-full bg-[#050510] border border-white/10 p-3 text-xs font-mono focus:border-[#00F2FF] outline-none h-[160px]"
                    />
                  </label>
                ))}
              </div>

              <div className="p-6 border-t border-white/10 bg-[#0d0d1f] flex justify-end gap-4">
                <button onClick={() => setEditingExp(null)} className="px-6 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5">Cancel</button>
                <button
                  onClick={handleUpdateExperiment}
                  disabled={savingExp}
                  className="px-8 py-2 text-xs font-bold uppercase tracking-widest bg-[#00F2FF] text-[#050505] hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] disabled:opacity-50"
                >{savingExp ? "Saving…" : "Save & Sync"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5" style={{ background: "radial-gradient(circle at top, rgba(0,242,255,0.18), transparent 55%)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-14 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#94a3b8]">Admin Controls</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Mission Control <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00F2FF, #00FFB2, #7000FF)" }}>Console</span>
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={loadAll} className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-[#00F2FF]/30 text-[#00F2FF] hover:border-[#00F2FF] flex items-center gap-2">
                <span className="text-base">↻</span> Refresh
              </button>
              <button onClick={() => navigate("/dashboard")} className="px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-white/20 hover:border-white/50">
                Dashboard
              </button>
              <button onClick={() => navigate("/sandbox")} className="px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#050505]" style={{ background: "linear-gradient(135deg, #00F2FF, #00FFB2)" }}>
                Launch Sandbox
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Accounts", value: stats.total,       icon: "⬢" },
              { label: "Active (72h)",   value: stats.active,      icon: "⚡" },
              { label: "New (7d)",       value: stats.newThisWeek, icon: "★" },
              { label: "Saves / Runs",   value: stats.expsSaved,   icon: "🧪" },
            ].map(item => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                className="border border-white/6 bg-white/2 px-5 py-4 relative overflow-hidden"
                style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))" }}
              >
                <div className="absolute top-0 right-0 w-5 h-5">
                  <div className="absolute top-0 right-0 w-px h-5 bg-[#00F2FF]/30" />
                  <div className="absolute top-0 right-0 h-px w-5 bg-[#00F2FF]/30" />
                </div>
                <p className="text-[10px] font-mono tracking-[0.2em] text-[#64748B] uppercase mb-2">{item.label}</p>
                <div className="text-3xl font-black tracking-tight">{item.value ?? "—"}</div>
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
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
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

        {error && (
          <div className="border border-[#e11d48]/40 text-[#e11d48] bg-[#e11d48]/10 px-4 py-3 text-sm font-mono">
            {error} — <button onClick={loadAll} className="underline">retry</button>
          </div>
        )}

        {/* Tab bar + search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-4">
          <div className="flex bg-[#050510] border border-white/10 p-1 overflow-x-auto">
            {[
              { id: "users",       label: "User Roster" },
              { id: "experiments", label: "Lab Experiments" },
              { id: "activity",    label: "User Activity" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap transition ${
                  activeTab === tab.id ? "bg-[#00F2FF] text-[#050505]" : "text-[#94a3b8] hover:text-white"
                }`}
              >{tab.label}</button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}…`}
              className="bg-[#05050b] border border-white/10 px-4 py-2 w-72 text-sm focus:outline-none focus:border-[#00F2FF] text-[#e2e8f0]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">⌕</span>
          </div>
        </div>

        {/* ── Users tab ─────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="overflow-x-auto border border-white/8 bg-[#05050b]/80">
            <table className="min-w-full text-left text-sm">
              <thead className="uppercase text-[11px] tracking-[0.3em] text-[#64748B] font-mono bg-[#090915]">
                <tr>
                  {["User", "Institute", "Email", "Created", "Last Seen", "Status", "Actions"].map(label => (
                    <th key={label} className="px-5 py-4">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const status = getStatus(user.lastSeen);
                  return (
                    <motion.tr key={user.id} layout initial={{ opacity: 0 }} animate={{ opacity: deletingId === user.id ? 0.4 : 1 }}
                      className="border-t border-white/5 hover:bg-white/2 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.name}</span>
                          <span className="text-xs text-[#94a3b8] font-mono">{user.id.slice(0, 8)}···</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#cbd5f5]">{user.institute}</td>
                      <td className="px-5 py-4">{user.email}</td>
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
                          disabled={deletingId === user.id}
                          onClick={() => setConfirmDelete(user)}
                          className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] font-mono border border-[#e11d48]/40 text-[#e11d48] hover:bg-[#e11d48]/10 transition disabled:opacity-40"
                        >
                          {deletingId === user.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-[#94a3b8] font-mono text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Experiments tab ────────────────────────────────────────────── */}
        {activeTab === "experiments" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExps.map(exp => (
              <div key={exp.id} className="bg-[#050510] border border-white/10 p-6 flex flex-col gap-4 relative"
                style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase text-[#64748B]">{exp.difficulty}</span>
                  <span className="text-[10px] font-mono uppercase text-[#00F2FF]">{exp.id}</span>
                </div>
                <h3 className="text-base font-bold leading-snug">{exp.title}</h3>
                <p className="text-xs text-[#94a3b8] line-clamp-3 leading-relaxed">{exp.aim}</p>
                <div className="flex gap-2 mt-auto text-[10px] font-mono text-[#64748B]">
                  <span>{Array.isArray(exp.pretest)  ? `${exp.pretest.length} pre-Q`  : "no pre-Q"}</span>
                  <span>·</span>
                  <span>{Array.isArray(exp.posttest) ? `${exp.posttest.length} post-Q` : "no post-Q"}</span>
                  <span>·</span>
                  <span>{Array.isArray(exp.procedure) ? `${exp.procedure.length} steps` : "no steps"}</span>
                </div>
                <button onClick={() => setEditingExp(exp)}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-[#00F2FF]/30 text-[#00F2FF] hover:bg-[#00F2FF]/5 transition"
                >Edit</button>
              </div>
            ))}
            {filteredExps.length === 0 && (
              <p className="col-span-3 text-center text-[#94a3b8] font-mono text-sm py-10">No experiments found</p>
            )}
          </div>
        )}

        {/* ── Activity tab ───────────────────────────────────────────────── */}
        {activeTab === "activity" && (
          <div className="overflow-x-auto border border-white/8 bg-[#05050b]/80">
            <table className="min-w-full text-left text-sm">
              <thead className="uppercase text-[11px] tracking-[0.3em] text-[#64748B] font-mono bg-[#090915]">
                <tr>
                  {["User", "Institute", "Experiment", "Last Run"].map(label => (
                    <th key={label} className="px-5 py-4">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredActivity.map((row, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/2 transition">
                    <td className="px-5 py-3 font-semibold">{row.profile?.name || row.user_id?.slice(0, 8) + "···"}</td>
                    <td className="px-5 py-3 text-[#cbd5f5]">{row.profile?.institute || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-[#00F2FF] font-mono text-xs mr-2">{row.experiment_id}</span>
                      <span className="text-[#94a3b8]">{row.title}</span>
                    </td>
                    <td className="px-5 py-3 text-[#94a3b8] font-mono text-xs">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {filteredActivity.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-[#94a3b8] font-mono text-sm">No activity recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
