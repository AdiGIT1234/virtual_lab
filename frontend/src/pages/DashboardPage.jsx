/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ─── helpers ─────────────────────────────────────────────── */
function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "—";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function ScoreBadge({ score, total, label }) {
  if (score == null) return <span className="text-[#475569] font-mono text-xs">—</span>;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const color = pct >= 70 ? "#22d3ee" : pct >= 40 ? "#f5c518" : "#e11d48";
  return (
    <span className="font-mono text-xs" style={{ color }}>
      {score}{total != null ? `/${total}` : ""} <span style={{ color: "#475569", fontSize: 10 }}>({pct}%)</span>
    </span>
  );
}

function StatusPill({ completed }) {
  return completed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest font-mono border border-[#22d3ee]/40 text-[#22d3ee] bg-[#22d3ee]/8">
      <span className="w-1 h-1 rounded-full bg-[#22d3ee]" />Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest font-mono border border-[#f5c518]/40 text-[#f5c518] bg-[#f5c518]/8">
      <span className="w-1 h-1 rounded-full bg-[#f5c518]" />In Progress
    </span>
  );
}

/* ─── animated counter ────────────────────────────────────── */
function StatCounter({ value, suffix = "", duration = 1200 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="text-[#00F2FF] text-3xl font-black tracking-tighter" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {count}{suffix && <span className="text-lg ml-0.5 text-[#00F2FF]/70">{suffix}</span>}
    </span>
  );
}

/* ─── saved experiment card (overview / saved tab) ───────── */
function SavedExperimentCard({ experiment, onDelete, onResume }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative group border border-white/6 overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowDelete(false); }}
      style={{
        background: isHovered
          ? "linear-gradient(135deg, rgba(0,242,255,0.04) 0%, rgba(112,0,255,0.02) 100%)"
          : "rgba(255,255,255,0.015)",
        borderColor: isHovered ? "rgba(0,242,255,0.15)" : "rgba(255,255,255,0.06)",
        clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[#E2E8F0] text-sm font-bold tracking-tight truncate">{experiment.title}</h3>
            <p className="text-[10px] text-[#475569] font-mono tracking-wider mt-0.5">
              {experiment.experiment_id} · {formatTimeAgo(experiment.updated_at || experiment.created_at)}
            </p>
          </div>
          <StatusPill completed={experiment.completed} />
        </div>

        {/* Score row */}
        {(experiment.pretest_score != null || experiment.posttest_score != null) && (
          <div className="flex gap-4 mb-3 py-2 px-3 bg-black/30 border border-white/4 text-[10px]">
            <span className="text-[#475569] uppercase tracking-widest">Pre</span>
            <ScoreBadge score={experiment.pretest_score} />
            <span className="text-[#475569]">·</span>
            <span className="text-[#475569] uppercase tracking-widest">Post</span>
            <ScoreBadge score={experiment.posttest_score} />
            {experiment.time_spent_ms && (
              <>
                <span className="text-[#475569]">·</span>
                <span className="text-[#475569] font-mono">{formatDuration(experiment.time_spent_ms)}</span>
              </>
            )}
          </div>
        )}

        {/* Code preview */}
        <div className="bg-black/40 border border-white/4 p-3 mb-4 font-mono text-[10px] text-[#64748B] leading-relaxed max-h-14 overflow-hidden relative">
          <pre className="whitespace-pre-wrap">{experiment.code?.slice(0, 120) || "// No code saved"}...</pre>
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onResume(experiment)}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer border-0 text-[#050505] transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #00F2FF, #00FFB2)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
          >Resume →</button>
          <button
            onClick={() => setShowDelete(true)}
            className="py-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer border border-white/10 bg-transparent text-[#64748B] hover:border-[#ff3366]/30 hover:text-[#ff3366] transition-all"
            style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
          >✕</button>
        </div>

        <AnimatePresence>
          {showDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/6 flex items-center gap-2"
            >
              <span className="text-[10px] text-[#ff3366] font-mono tracking-wider flex-1">Delete this experiment?</span>
              <button onClick={() => onDelete(experiment.id)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] cursor-pointer hover:bg-[#ff3366]/20 transition-all">Yes</button>
              <button onClick={() => setShowDelete(false)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-[#94A3B8] cursor-pointer hover:bg-white/10 transition-all">No</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── progress row (progress tab) ────────────────────────── */
function ProgressRow({ exp, onResume, rank }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="border-t border-white/5 hover:bg-white/2 transition"
    >
      <td className="px-5 py-3">
        <div>
          <p className="text-[#E2E8F0] text-sm font-semibold truncate max-w-[200px]">{exp.title || exp.experiment_id}</p>
          <p className="text-[10px] text-[#475569] font-mono mt-0.5">{exp.experiment_id}</p>
        </div>
      </td>
      <td className="px-5 py-3"><StatusPill completed={exp.completed} /></td>
      <td className="px-5 py-3"><ScoreBadge score={exp.pretest_score} /></td>
      <td className="px-5 py-3"><ScoreBadge score={exp.posttest_score} /></td>
      <td className="px-5 py-3 font-mono text-xs text-[#94A3B8]">{formatDuration(exp.time_spent_ms)}</td>
      <td className="px-5 py-3 font-mono text-xs text-[#475569]">
        {exp.updated_at ? new Date(exp.updated_at).toLocaleDateString() : "—"}
      </td>
      <td className="px-5 py-3">
        <button
          onClick={() => onResume(exp)}
          className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[#00F2FF]/30 text-[#00F2FF] hover:bg-[#00F2FF]/8 transition font-mono"
        >
          {exp.completed ? "Review" : "Resume"} →
        </button>
      </td>
    </motion.tr>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    loading: authLoading,
    logout,
    getSavedExperiments,
    deleteSavedExperiment,
    getQuizHistory,
  } = useAuth();

  const [savedExperiments, setSavedExperiments]   = useState([]);
  const [quizHistory,      setQuizHistory]         = useState([]);
  const [loadingExps,      setLoadingExps]         = useState(true);
  const [loadingQuiz,      setLoadingQuiz]         = useState(true);
  const [activeTab,        setActiveTab]           = useState("overview");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingExps(true);
    getSavedExperiments()
      .then(data => setSavedExperiments(data || []))
      .catch(() => {})
      .finally(() => setLoadingExps(false));

    setLoadingQuiz(true);
    getQuizHistory()
      .then(data => setQuizHistory(data || []))
      .catch(() => {})
      .finally(() => setLoadingQuiz(false));
  }, [isAuthenticated, getSavedExperiments, getQuizHistory]);

  const handleDelete = async (id) => {
    try {
      await deleteSavedExperiment(id);
      setSavedExperiments(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  const handleResume = (experiment) => {
    navigate(`/experiment/${experiment.experiment_id}`, { state: { code: experiment.code } });
  };

  /* ── derived stats ── */
  const stats = useMemo(() => {
    const completed  = savedExperiments.filter(e => e.completed).length;
    const withPost   = savedExperiments.filter(e => e.posttest_score != null);
    const avgPost    = withPost.length
      ? Math.round(withPost.reduce((s, e) => s + e.posttest_score, 0) / withPost.length)
      : null;
    const withPre    = savedExperiments.filter(e => e.pretest_score != null);
    const avgPre     = withPre.length
      ? Math.round(withPre.reduce((s, e) => s + e.pretest_score, 0) / withPre.length)
      : null;
    return { total: savedExperiments.length, completed, avgPost, avgPre };
  }, [savedExperiments]);

  const displayName     = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const displayInstitute = profile?.institute || user?.user_metadata?.institute || "";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#00F2FF] font-mono text-sm tracking-wider">
          <span className="inline-block w-5 h-5 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
          LOADING DASHBOARD...
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const tabs = [
    { id: "overview",  label: "Overview" },
    { id: "progress",  label: `Progress (${savedExperiments.length})` },
    { id: "saved",     label: `Saved (${savedExperiments.length})` },
    { id: "profile",   label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#E2E8F0]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Nav ── */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-white/4" style={{ background: "rgba(5,5,5,0.95)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-3 cursor-pointer bg-transparent border-0">
          <span className="text-[#00F2FF] text-xl">⬡</span>
          <span className="font-bold text-sm tracking-tight text-[#E2E8F0]">Embedex <span className="text-[#00F2FF]">Virtual Lab</span></span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/sandbox")} className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider uppercase cursor-pointer border-0 text-[#050505]"
            style={{ background: "linear-gradient(135deg, #00F2FF, #00FFB2)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
            Open Sandbox →
          </button>
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider uppercase cursor-pointer border border-white/20 text-[#E2E8F0] hover:text-[#00F2FF] hover:border-[#00F2FF] transition"
              style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              Admin Controls
            </button>
          )}
          <div className="flex items-center gap-2.5 px-3 py-1.5 border border-white/8 bg-white/3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#050505] text-xs font-black" style={{ background: "linear-gradient(135deg, #00F2FF, #7000FF)" }}>
              {displayName[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#E2E8F0] hidden md:block">{displayName}</span>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="text-[#64748B] text-xs font-mono tracking-wider hover:text-[#ff3366] transition-colors cursor-pointer bg-transparent border-0 uppercase">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-12">

        {/* ── Welcome ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2 text-[10px] tracking-[0.2em] font-mono text-[#64748B] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_8px_#00F2FF]" />
            <span>Dashboard — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-[-0.03em] mb-2">
            Welcome back,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #00F2FF, #00FFB2, #7000FF)" }}>
              {displayName}
            </span>{" "}👋
          </h1>
          {displayInstitute && <p className="text-[#64748B] text-sm font-mono tracking-wider">{displayInstitute}</p>}
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { value: stats.total,     label: "Experiments Started", icon: "🧪" },
            { value: stats.completed, label: "Completed",           icon: "✅" },
            { value: stats.avgPre  ?? 0, label: "Avg Pre-score",   icon: "📋", dim: stats.avgPre == null },
            { value: stats.avgPost ?? 0, label: "Avg Post-score",  icon: "🏆", dim: stats.avgPost == null },
          ].map((s, i) => (
            <div key={i} className="relative border border-white/6 bg-white/[0.015] p-5 overflow-hidden"
              style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
              <div className="absolute top-0 right-0 w-4 h-4">
                <div className="absolute top-0 right-0 w-px h-4 bg-[#00F2FF]/30" />
                <div className="absolute top-0 right-0 h-px w-4 bg-[#00F2FF]/30" />
              </div>
              <div className="text-xl mb-2">{s.icon}</div>
              {s.dim
                ? <span className="text-[#475569] text-2xl font-black font-mono">—</span>
                : <StatCounter value={s.value} />
              }
              <p className="text-[10px] text-[#475569] font-mono font-bold tracking-[0.15em] uppercase mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mb-8 border-b border-white/6 pb-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] cursor-pointer bg-transparent border-0 transition-all duration-300 ${
                activeTab === tab.id ? "text-[#00F2FF]" : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "linear-gradient(to right, #00F2FF, #7000FF)" }} />
              )}
            </button>
          ))}
        </div>

        {/* ════════ TAB: OVERVIEW ════════ */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {[
                { title: "Launch Sandbox",    desc: "Free-form AVR/ESP32 development environment", icon: "⚙️", color: "#00F2FF", action: () => navigate("/sandbox") },
                { title: "Start Experiment",  desc: "Choose from guided guided experiments",         icon: "🔬", color: "#7000FF", action: () => navigate("/") },
                { title: "Hardware Library",  desc: "Register reference and timing diagrams",         icon: "📖", color: "#00FFB2", action: () => navigate("/reference") },
              ].map((card, i) => (
                <motion.button key={i} onClick={card.action}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="group text-left p-6 border border-white/6 bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-300 cursor-pointer focus:outline-none"
                  style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
                  <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">{card.icon}</div>
                  <h3 className="text-[#E2E8F0] text-sm font-bold tracking-tight mb-1">{card.title}</h3>
                  <p className="text-[#64748B] text-xs">{card.desc}</p>
                  <div className="mt-3 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: card.color }}>Open →</div>
                </motion.button>
              ))}
            </div>

            {/* Recent work */}
            {savedExperiments.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#94A3B8] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7000FF] shadow-[0_0_6px_#7000FF]" />
                  Recent Work
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedExperiments.slice(0, 3).map(exp => (
                    <SavedExperimentCard key={exp.id} experiment={exp} onDelete={handleDelete} onResume={handleResume} />
                  ))}
                </div>
                {savedExperiments.length > 3 && (
                  <button onClick={() => setActiveTab("progress")} className="mt-4 text-xs text-[#00F2FF] font-mono tracking-wider hover:underline cursor-pointer bg-transparent border-0">
                    View full progress history →
                  </button>
                )}
              </div>
            )}

            {savedExperiments.length === 0 && !loadingExps && (
              <div className="text-center py-16 border border-white/4 bg-white/[0.01]"
                style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
                <div className="text-4xl mb-4">🧪</div>
                <p className="text-[#64748B] text-sm mb-4">No experiments yet — start one to track your progress</p>
                <button onClick={() => navigate("/")} className="px-6 py-2.5 text-xs font-bold tracking-wider uppercase cursor-pointer border-0 text-[#050505]"
                  style={{ background: "linear-gradient(135deg, #00F2FF, #00FFB2)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
                  Browse Experiments →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════ TAB: PROGRESS ════════ */}
        {activeTab === "progress" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            {/* Summary cards */}
            {savedExperiments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  { label: "Started",         value: stats.total,                  color: "#00F2FF" },
                  { label: "Completed",        value: stats.completed,              color: "#22d3ee" },
                  { label: "In Progress",      value: stats.total - stats.completed, color: "#f5c518" },
                  { label: "Completion Rate",  value: stats.total > 0 ? `${Math.round(stats.completed / stats.total * 100)}%` : "—", color: "#00FFB2", raw: true },
                ].map((s, i) => (
                  <div key={i} className="border border-white/6 bg-white/[0.015] px-4 py-3"
                    style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#475569] mb-1">{s.label}</p>
                    <p className="text-xl font-black font-mono" style={{ color: s.color }}>
                      {s.raw ? s.value : s.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {loadingExps ? (
              <div className="flex items-center gap-3 py-12 justify-center text-[#00F2FF] font-mono text-sm">
                <span className="inline-block w-4 h-4 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
                Loading progress…
              </div>
            ) : savedExperiments.length === 0 ? (
              <div className="text-center py-16 border border-white/4">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-[#64748B] text-sm">No progress recorded yet. Complete an experiment to see your scores here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/8 bg-[#05050b]/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="uppercase text-[10px] tracking-[0.25em] text-[#64748B] font-mono bg-[#090915]">
                    <tr>
                      {["Experiment", "Status", "Pre-test", "Post-test", "Time Spent", "Last Active", ""].map(h => (
                        <th key={h} className="px-5 py-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedExperiments.map((exp, i) => (
                      <ProgressRow key={exp.id} exp={exp} onResume={handleResume} rank={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quiz attempt history */}
            {quizHistory.length > 0 && (
              <div className="mt-10">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#94A3B8] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] shadow-[0_0_6px_#00FFB2]" />
                  Quiz Attempt History
                </h2>
                <div className="overflow-x-auto border border-white/8 bg-[#05050b]/80">
                  <table className="min-w-full text-left text-sm">
                    <thead className="uppercase text-[10px] tracking-[0.25em] text-[#64748B] font-mono bg-[#090915]">
                      <tr>
                        {["Experiment", "Quiz", "Score", "Result", "Date"].map(h => (
                          <th key={h} className="px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quizHistory.slice(0, 30).map((row, i) => {
                        const pct = row.total > 0 ? Math.round(row.score / row.total * 100) : 0;
                        return (
                          <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className="border-t border-white/5 hover:bg-white/2 transition">
                            <td className="px-5 py-2.5 font-mono text-xs text-[#00F2FF]">{row.experiment_id}</td>
                            <td className="px-5 py-2.5">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                                row.quiz_type === "pretest"
                                  ? "border-[#f5c518]/40 text-[#f5c518] bg-[#f5c518]/8"
                                  : "border-[#22d3ee]/40 text-[#22d3ee] bg-[#22d3ee]/8"
                              }`}>{row.quiz_type}</span>
                            </td>
                            <td className="px-5 py-2.5">
                              <span className="font-mono text-sm font-bold" style={{ color: pct >= 70 ? "#22d3ee" : pct >= 40 ? "#f5c518" : "#e11d48" }}>
                                {row.score}/{row.total}
                              </span>
                              <span className="text-[#475569] text-xs ml-1">({pct}%)</span>
                            </td>
                            <td className="px-5 py-2.5">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                                row.passed
                                  ? "border-[#22d3ee]/40 text-[#22d3ee] bg-[#22d3ee]/8"
                                  : "border-[#e11d48]/40 text-[#e11d48] bg-[#e11d48]/8"
                              }`}>{row.passed ? "Passed" : "Failed"}</span>
                            </td>
                            <td className="px-5 py-2.5 font-mono text-xs text-[#475569]">
                              {new Date(row.created_at).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {quizHistory.length > 30 && (
                    <p className="px-5 py-3 text-[10px] text-[#475569] font-mono border-t border-white/5">
                      Showing 30 of {quizHistory.length} attempts
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════ TAB: SAVED ════════ */}
        {activeTab === "saved" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {loadingExps ? (
              <div className="flex items-center gap-3 py-12 justify-center text-[#00F2FF] font-mono text-sm">
                <span className="inline-block w-4 h-4 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
                Loading experiments...
              </div>
            ) : savedExperiments.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📂</div>
                <p className="text-[#64748B] text-sm">No saved experiments yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {savedExperiments.map(exp => (
                    <SavedExperimentCard key={exp.id} experiment={exp} onDelete={handleDelete} onResume={handleResume} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════ TAB: PROFILE ════════ */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-lg">
            <div className="border border-white/6 bg-white/[0.015] p-8"
              style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-[#050505] text-2xl font-black shadow-[0_0_30px_rgba(0,242,255,0.2)]"
                  style={{ background: "linear-gradient(135deg, #00F2FF, #7000FF)" }}>
                  {displayName[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{displayName}</h2>
                  <p className="text-[#64748B] text-xs font-mono tracking-wider">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Name",                value: displayName },
                  { label: "Email",               value: user?.email },
                  { label: "Institute",            value: displayInstitute || "Not set" },
                  { label: "Member Since",         value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                  { label: "Experiments Started",  value: stats.total },
                  { label: "Experiments Completed",value: stats.completed },
                  { label: "Avg Post-test Score",  value: stats.avgPost != null ? stats.avgPost : "—" },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="text-[10px] uppercase text-[#475569] tracking-[0.2em] font-mono font-bold block mb-1">{field.label}</label>
                    <p className="text-[#E2E8F0] text-sm">{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/6">
                <button onClick={() => { logout(); navigate("/"); }}
                  className="w-full py-3 text-xs font-bold uppercase tracking-[0.2em] cursor-pointer border border-[#ff3366]/20 bg-[#ff3366]/5 text-[#ff3366] hover:bg-[#ff3366]/10 hover:border-[#ff3366]/40 transition-all"
                  style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`.font-mono { font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace !important; }`}</style>
    </div>
  );
}
