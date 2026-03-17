/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   ANIMATED STAT COUNTER
   ═══════════════════════════════════════════════════════════ */
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
    <span ref={ref} className="text-[#00F2FF] text-3xl font-black tracking-tighter" style={{ fontFamily: "'Cyber Alert Numbers', 'JetBrains Mono', monospace" }}>
      {count}
      {suffix && <span className="text-lg ml-0.5 text-[#00F2FF]/70" style={{ fontFamily: "'Heat Robox', sans-serif" }}>{suffix}</span>}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAVED EXPERIMENT CARD
   ═══════════════════════════════════════════════════════════ */
function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SavedExperimentCard({ experiment, onDelete, onResume }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const timeLabel = formatTimeAgo(experiment.updated_at || experiment.created_at);

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
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[#E2E8F0] text-sm font-bold tracking-tight truncate">
              {experiment.title}
            </h3>
            <p className="text-[10px] text-[#475569] font-mono tracking-wider mt-1">
              {experiment.experiment_id} · {timeLabel}
            </p>
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_6px_#00F2FF]" />
            <span className="text-[9px] text-[#00F2FF] font-mono font-bold uppercase tracking-widest">
              Saved
            </span>
          </div>
        </div>

        {/* Code preview */}
        <div className="bg-black/40 border border-white/4 p-3 mb-4 font-mono text-[10px] text-[#64748B] leading-relaxed max-h-16 overflow-hidden relative">
          <pre className="whitespace-pre-wrap">{experiment.code?.slice(0, 150) || "// No code saved"}...</pre>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-black/80 to-transparent" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onResume(experiment)}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer border-0 text-[#050505] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            style={{
              background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            Resume →
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="py-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer border border-white/10 bg-transparent text-[#64748B] hover:border-[#ff3366]/30 hover:text-[#ff3366] transition-all duration-300"
            style={{
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            ✕
          </button>
        </div>

        {/* Delete confirmation */}
        <AnimatePresence>
          {showDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/6 flex items-center gap-2"
            >
              <span className="text-[10px] text-[#ff3366] font-mono tracking-wider flex-1">Delete this experiment?</span>
              <button
                onClick={() => onDelete(experiment.id)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] cursor-pointer hover:bg-[#ff3366]/20 transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-[#94A3B8] cursor-pointer hover:bg-white/10 transition-all"
              >
                No
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
    loading: authLoading,
    logout,
    getSavedExperiments,
    deleteSavedExperiment,
  } = useAuth();

  const [savedExperiments, setSavedExperiments] = useState([]);
  const [loadingExperiments, setLoadingExperiments] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  /* ── Redirect if not logged in ── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* ── Load saved experiments ── */
  useEffect(() => {
    if (isAuthenticated) {
      loadExperiments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadExperiments = async () => {
    setLoadingExperiments(true);
    try {
      const data = await getSavedExperiments();
      setSavedExperiments(data);
    } catch (err) {
      console.error("Failed to load experiments:", err);
    }
    setLoadingExperiments(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSavedExperiment(id);
      setSavedExperiments((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleResume = (experiment) => {
    // Navigate to sandbox or experiment with pre-loaded code
    navigate(`/experiment/${experiment.experiment_id}`, {
      state: { code: experiment.code },
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ── Derived stats ── */
  const stats = {
    experimentsRun: savedExperiments.length,
    totalLines: savedExperiments.reduce((sum, e) => sum + (e.code?.split("\n").length || 0), 0),
    lastActive: savedExperiments[0]
      ? new Date(savedExperiments[0].updated_at || savedExperiments[0].created_at).toLocaleDateString()
      : "—",
  };

  // Get display name
  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const displayInstitute =
    profile?.institute || user?.user_metadata?.institute || "";

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

  return (
    <div className="min-h-screen bg-[#050505] text-[#E2E8F0]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ════════════════ TOP NAV ════════════════ */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-white/4" style={{ background: "rgba(5,5,5,0.95)", backdropFilter: "blur(20px)" }}>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer bg-transparent border-0"
        >
          <span className="text-[#00F2FF] text-xl">⬡</span>
          <span className="font-bold text-sm tracking-tight text-[#E2E8F0]">
            ATmega328P <span className="text-[#00F2FF]">Virtual Lab</span>
          </span>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/sandbox")}
            className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider uppercase cursor-pointer border-0"
            style={{
              background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
              color: "#050505",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            Open Sandbox →
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 border border-white/8 bg-white/3">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#00F2FF] to-[#7000FF] flex items-center justify-center text-[#050505] text-xs font-black">
              {displayName[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#E2E8F0] hidden md:block">{displayName}</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-[#64748B] text-xs font-mono tracking-wider hover:text-[#ff3366] transition-colors cursor-pointer bg-transparent border-0 uppercase"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-12">

        {/* ── Welcome Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-2 text-[10px] tracking-[0.2em] font-mono text-[#64748B] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_8px_#00F2FF]" />
            <span>Dashboard — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-black tracking-[-0.03em] mb-2"
            style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif" }}
          >
            Welcome back,{" "}
            <span className="bg-linear-to-r from-[#00F2FF] via-[#00FFB2] to-[#7000FF] bg-clip-text text-transparent">
              {displayName}
            </span>
            {" "}👋
          </h1>
          {displayInstitute && (
            <p className="text-[#64748B] text-sm font-mono tracking-wider">{displayInstitute}</p>
          )}
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {[
            { value: stats.experimentsRun, suffix: "", label: "Experiments Saved", icon: "🧪" },
            { value: stats.totalLines, suffix: "", label: "Lines of Code", icon: "📝" },
            { value: 15, suffix: "", label: "Labs Available", icon: "🔬" },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative border border-white/6 bg-white/1.5 p-6 overflow-hidden"
              style={{
                clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
              }}
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-4 h-4">
                <div className="absolute top-0 right-0 w-px h-4 bg-[#00F2FF]/30" />
                <div className="absolute top-0 right-0 h-px w-4 bg-[#00F2FF]/30" />
              </div>
              <div className="text-2xl mb-3">{stat.icon}</div>
              <StatCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-[10px] text-[#475569] font-mono font-bold tracking-[0.15em] uppercase mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1 mb-8 border-b border-white/6 pb-0">
          {[
            { id: "overview", label: "Overview" },
            { id: "saved", label: `Saved (${savedExperiments.length})` },
            { id: "profile", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] cursor-pointer bg-transparent border-0 transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-[#00F2FF]"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-[#00F2FF] to-[#7000FF]"
                />
              )}
            </button>
          ))}
        </div>

        {/* ════════ TAB: OVERVIEW ════════ */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {[
                {
                  title: "Launch Sandbox",
                  desc: "Open the free-form AVR development environment",
                  icon: "⚙️",
                  color: "#00F2FF",
                  action: () => navigate("/sandbox"),
                },
                {
                  title: "Start Experiment",
                  desc: "Choose from 15 guided experiments",
                  icon: "🔬",
                  color: "#7000FF",
                  action: () => navigate("/"),
                },
                {
                  title: "Hardware Library",
                  desc: "Browse ATmega328P register reference",
                  icon: "📖",
                  color: "#00FFB2",
                  action: () => navigate("/reference"),
                },
              ].map((card, i) => (
                <motion.button
                  key={i}
                  onClick={card.action}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="group text-left p-6 border border-white/6 bg-white/1.5 hover:bg-white/3 transition-all duration-300 cursor-pointer focus:outline-none"
                  style={{
                    clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                  }}
                >
                  <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">{card.icon}</div>
                  <h3 className="text-[#E2E8F0] text-sm font-bold tracking-tight mb-1">{card.title}</h3>
                  <p className="text-[#64748B] text-xs">{card.desc}</p>
                  <div
                    className="mt-3 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ color: card.color }}
                  >
                    Open →
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Recent Experiment */}
            {savedExperiments.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#94A3B8] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7000FF] shadow-[0_0_6px_#7000FF]" />
                  Recent Work
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedExperiments.slice(0, 3).map((exp) => (
                    <SavedExperimentCard
                      key={exp.id}
                      experiment={exp}
                      onDelete={handleDelete}
                      onResume={handleResume}
                    />
                  ))}
                </div>
                {savedExperiments.length > 3 && (
                  <button
                    onClick={() => setActiveTab("saved")}
                    className="mt-4 text-xs text-[#00F2FF] font-mono tracking-wider hover:underline cursor-pointer bg-transparent border-0"
                  >
                    View all {savedExperiments.length} saved experiments →
                  </button>
                )}
              </div>
            )}

            {savedExperiments.length === 0 && !loadingExperiments && (
              <div className="text-center py-16 border border-white/4 bg-white/1" style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
                <div className="text-4xl mb-4">🧪</div>
                <p className="text-[#64748B] text-sm mb-4">No saved experiments yet</p>
                <button
                  onClick={() => navigate("/sandbox")}
                  className="px-6 py-2.5 text-xs font-bold tracking-wider uppercase cursor-pointer border-0"
                  style={{
                    background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
                    color: "#050505",
                    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                >
                  Start your first experiment →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════ TAB: SAVED EXPERIMENTS ════════ */}
        {activeTab === "saved" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {loadingExperiments ? (
              <div className="flex items-center gap-3 py-12 justify-center text-[#00F2FF] font-mono text-sm">
                <span className="inline-block w-4 h-4 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
                Loading experiments...
              </div>
            ) : savedExperiments.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📂</div>
                <p className="text-[#64748B] text-sm">No saved experiments. Start coding and save your work!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {savedExperiments.map((exp) => (
                    <SavedExperimentCard
                      key={exp.id}
                      experiment={exp}
                      onDelete={handleDelete}
                      onResume={handleResume}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════ TAB: PROFILE ════════ */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg"
          >
            <div
              className="border border-white/6 bg-white/1.5 p-8"
              style={{
                clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
              }}
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/6">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#00F2FF] to-[#7000FF] flex items-center justify-center text-[#050505] text-2xl font-black shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                  {displayName[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{displayName}</h2>
                  <p className="text-[#64748B] text-xs font-mono tracking-wider">{user?.email}</p>
                </div>
              </div>

              {/* Profile details */}
              <div className="space-y-5">
                {[
                  { label: "Name", value: displayName },
                  { label: "Email", value: user?.email },
                  { label: "Institute", value: displayInstitute || "Not set" },
                  { label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                  { label: "Experiments Saved", value: savedExperiments.length },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="text-[10px] uppercase text-[#475569] tracking-[0.2em] font-mono font-bold block mb-1">{field.label}</label>
                    <p className="text-[#E2E8F0] text-sm">{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/6">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 text-xs font-bold uppercase tracking-[0.2em] cursor-pointer border border-[#ff3366]/20 bg-[#ff3366]/5 text-[#ff3366] hover:bg-[#ff3366]/10 hover:border-[#ff3366]/40 transition-all duration-300"
                  style={{
                    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Inline CSS */}
      <style>{`
        .font-mono {
          font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace !important;
        }
      `}</style>
    </div>
  );
}
