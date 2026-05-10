import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";
import allExperiments from "../data/all_experiments.json";
import { EXPERIMENT_PRESETS } from "../constants/experimentPresets";
import { API_BASE_URL } from "../lib/api";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";

export default function ExperimentPage() {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  const { saveQuizAttempt, markExperimentComplete } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("aim");
  const [preTestAnswers, setPreTestAnswers] = useState({});
  const [postTestAnswers, setPostTestAnswers] = useState({});
  const [preTestScore, setPreTestScore] = useState(null);
  const [postTestScore, setPostTestScore] = useState(null);

  const [fbRating,    setFbRating]    = useState(0);
  const [fbMessage,   setFbMessage]   = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSubmitted,  setFbSubmitted]  = useState(false);
  const [fbError,     setFbError]     = useState("");
  const [codeCopied,  setCodeCopied]  = useState(false);

  const startTimeRef = useRef(Date.now());

  const handleFeedbackSubmit = useCallback(async () => {
    if (!fbMessage.trim()) { setFbError("Please write a message before submitting."); return; }
    setFbSubmitting(true);
    setFbError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const resp = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ experiment_id: experimentId, rating: fbRating || null, message: fbMessage.trim() }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setFbSubmitted(true);
    } catch (e) {
      setFbError(e.message || "Failed to submit feedback.");
    } finally {
      setFbSubmitting(false);
    }
  }, [fbMessage, fbRating, experimentId]);

  useEffect(() => {
    if (!experimentId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/experiments/${experimentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Experiment not found");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend fetch failed, falling back to local static JSON data:", err.message);
        const localData = allExperiments[experimentId];
        setData(localData || null);
        setLoading(false);
      });
  }, [experimentId]);

  const solutionCode = EXPERIMENT_PRESETS[experimentId]?.solutionCode || null;
  const pretestTotal = data?.pretest?.length ?? 10;
  const codeUnlocked = preTestScore !== null && preTestScore >= pretestTotal;

  const tabs = [
    { id: "aim", label: "Aim", icon: "🎯" },
    { id: "theory", label: "Theory", icon: "📘" },
    { id: "pretest", label: "Pre-Test", icon: "📝" },
    { id: "procedure", label: "Procedure", icon: "🔧" },
    { id: "code", label: "Code", icon: codeUnlocked ? "🔓" : "🔒" },
    { id: "simulation", label: "Simulation", icon: "▶️" },
    { id: "posttest", label: "Post-Test", icon: "✅" },
    { id: "feedback", label: "Feedback", icon: "🏆" },
  ];

  const handlePreTestSubmit = () => {
    if (!data?.pretest) return;
    let score = 0;
    const answers = data.pretest.map((q, idx) => {
      const ans = preTestAnswers[idx] ?? -1;
      if (ans === q.correct_answer_index) score++;
      return ans;
    });
    setPreTestScore(score);
    saveQuizAttempt?.({
      experimentId,
      quizType: "pretest",
      answers,
      score,
      total: data.pretest.length,
    }).catch(() => {}); // non-blocking, guests can still use without saving
  };

  const handlePostTestSubmit = () => {
    if (!data?.posttest) return;
    let score = 0;
    const answers = data.posttest.map((q, idx) => {
      const ans = postTestAnswers[idx] ?? -1;
      if (ans === q.correct_answer_index) score++;
      return ans;
    });
    setPostTestScore(score);
    const timeMs = Date.now() - startTimeRef.current;
    saveQuizAttempt?.({
      experimentId,
      quizType: "posttest",
      answers,
      score,
      total: data.posttest.length,
    }).catch(() => {});
    // Mark experiment complete when posttest is submitted
    markExperimentComplete?.({
      experimentId,
      title: data.title || experimentId,
      pretestScore: preTestScore,
      posttestScore: score,
      timeSpentMs: timeMs,
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p style={{ color: "#00ffcc", marginTop: "20px" }}>Loading Experiment...</p>
      </div>
    );
  }

  // If experiment not found in backend, show placeholder
  const experimentTitle = data?.title || experimentId.replace(/_/g, " ").replace(/exp\d+\s*/, "");
  const experimentAim = data?.aim || "This experiment content is being prepared. Check back soon!";
  const experimentObjective = data?.objective || "";
  const experimentTheory = data?.theory || "<p>Theory content will be available soon.</p>";
  const experimentProcedure = data?.procedure || ["Follow the instructor's guidance to complete this experiment."];
  const experimentPretest = data?.pretest || [];
  const experimentPosttest = data?.posttest || [];
  const experimentFeedback = data?.feedback || "Well done! You have completed this experiment.";

  return (
    <div style={styles.page}>
      {/* LEFT SIDEBAR - Tabs */}
      <div style={styles.sidebar}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ← Back to Labs
        </button>

        <div style={styles.expTitle}>{experimentTitle}</div>
        {data?.difficulty && (
          <div style={styles.diffBadge}>{data.difficulty}</div>
        )}

        <div style={styles.tabList}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={activeTab === tab.id ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainContent}>
        {/* AIM */}
        {activeTab === "aim" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>🎯 Aim</h2>
            <div style={styles.aimBox}>
              <p style={styles.aimText}>{experimentAim}</p>
            </div>
            {experimentObjective && (
              <>
                <h3 style={styles.subTitle}>Objective</h3>
                <p style={styles.bodyText}>{experimentObjective}</p>
              </>
            )}
            <button style={styles.nextBtn} onClick={() => setActiveTab("theory")}>
              Continue to Theory →
            </button>
          </div>
        )}

        {/* THEORY */}
        {activeTab === "theory" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>📘 Theory</h2>
            <div style={styles.theoryBox} dangerouslySetInnerHTML={{ __html: experimentTheory }} />
            <button style={styles.nextBtn} onClick={() => setActiveTab("pretest")}>
              Continue to Pre-Test →
            </button>
          </div>
        )}

        {/* PRETEST */}
        {activeTab === "pretest" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>📝 Pre-Lab Assessment</h2>
            {experimentPretest.length === 0 ? (
              <p style={styles.bodyText}>No pre-test questions available for this experiment yet.</p>
            ) : (
              <>
                {experimentPretest.map((q, idx) => (
                  <div key={idx} style={styles.questionBlock}>
                    <p style={styles.questionText}><b>Q{idx + 1}.</b> {q.question}</p>
                    {q.options.map((opt, oIdx) => (
                      <label key={oIdx} style={styles.optionLabel}>
                        <input
                          type="radio"
                          name={`pretest-${idx}`}
                          checked={preTestAnswers[idx] === oIdx}
                          onChange={() => setPreTestAnswers({ ...preTestAnswers, [idx]: oIdx })}
                          disabled={preTestScore !== null}
                        />
                        <span style={{ marginLeft: "10px" }}>{opt}</span>
                      </label>
                    ))}
                    {preTestScore !== null && (
                      <div style={preTestAnswers[idx] === q.correct_answer_index ? styles.correctFb : styles.wrongFb}>
                        {preTestAnswers[idx] === q.correct_answer_index ? "✅ Correct!" : "❌ Incorrect."} {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                {preTestScore === null ? (
                  <button style={styles.submitBtn} onClick={handlePreTestSubmit}>Submit Answers</button>
                ) : (
                  <div style={styles.scoreBox}>Score: {preTestScore} / {experimentPretest.length}</div>
                )}
              </>
            )}
            <button style={styles.nextBtn} onClick={() => setActiveTab("procedure")}>
              Continue to Procedure →
            </button>
          </div>
        )}

        {/* PROCEDURE */}
        {activeTab === "procedure" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>🔧 Procedure</h2>
            <ol style={styles.procedureList}>
              {experimentProcedure.map((step, idx) => (
                <li key={idx} style={styles.procedureStep}>
                  <div style={styles.stepNumber}>{idx + 1}</div>
                  {step}
                </li>
              ))}
            </ol>
            <button style={styles.nextBtn} onClick={() => setActiveTab("code")}>
              Continue to Code →
            </button>
          </div>
        )}

        {/* CODE — locked until perfect pre-test */}
        {activeTab === "code" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>
              {codeUnlocked ? "🔓 Solution Code" : "🔒 Solution Code"}
            </h2>

            {!codeUnlocked ? (
              /* ── LOCKED STATE ── */
              <div style={styles.codeLockBox}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
                <h3 style={{ color: "#00F2FF", marginBottom: 8, fontSize: 18 }}>
                  Code is Locked
                </h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.7, maxWidth: 440, textAlign: "center" }}>
                  {preTestScore === null
                    ? "Complete the Pre-Test first to attempt unlocking."
                    : `You scored ${preTestScore}/${pretestTotal}. Score ${pretestTotal}/${pretestTotal} on the Pre-Test to unlock the full solution.`}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, alignItems: "center" }}>
                  <div style={styles.hintCallout}>
                    <span style={{ fontSize: 20 }}>💬</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#00F2FF", marginBottom: 4 }}>
                        Ask Embedex for hints
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>
                        The chatbot knows this experiment's code and will guide you step by step — try asking
                        <em style={{ color: "#e2e8f0" }}> "What register do I set first?"</em>
                      </div>
                    </div>
                  </div>

                  <button
                    style={styles.heroBtn}
                    onClick={() => setActiveTab("pretest")}
                  >
                    {preTestScore === null ? "Take Pre-Test →" : "Retake Pre-Test →"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── UNLOCKED STATE ── */
              <div>
                <div style={styles.unlockBanner}>
                  🎉 Perfect score! You've unlocked the solution code.
                </div>
                <div style={styles.codeToolbar}>
                  <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
                    {experimentId}.c
                  </span>
                  <button
                    style={{ ...styles.copyBtn, color: codeCopied ? "#22c55e" : "#00F2FF" }}
                    onClick={() => {
                      navigator.clipboard.writeText(solutionCode || "");
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                  >
                    {codeCopied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre style={styles.codeBlock}><code>{solutionCode}</code></pre>

                <button
                  style={{ ...styles.heroBtn, marginTop: 16 }}
                  onClick={() => navigate(`/sandbox?experiment=${experimentId}&unlock=1`)}
                >
                  Load into Sandbox →
                </button>
              </div>
            )}

            <button style={styles.nextBtn} onClick={() => setActiveTab("simulation")}>
              Continue to Simulation →
            </button>
          </div>
        )}

        {/* SIMULATION */}
        {activeTab === "simulation" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>▶️ Simulation</h2>
            <div style={styles.simPlaceholder}>
              <p style={{ fontSize: "48px", margin: "0" }}>⬡</p>
              <p style={styles.bodyText}>
                The interactive ATmega328P simulator will be embedded here.
              </p>
              <div style={styles.simCtas}>
                <button style={styles.heroBtn} onClick={() => navigate(`/sandbox?experiment=${experimentId}`)}>
                  Open Sandbox Simulator →
                </button>
                <button style={styles.secondaryBtn} onClick={() => navigate(`/arlab?preset=blink&experiment=${experimentId}`)}>View 3D Lab Preview →</button>
              </div>
            </div>
            <button style={styles.nextBtn} onClick={() => setActiveTab("posttest")}>
              Continue to Post-Test →
            </button>
          </div>
        )}

        {/* POSTTEST */}
        {activeTab === "posttest" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>✅ Post-Lab Assessment</h2>
            {experimentPosttest.length === 0 ? (
              <p style={styles.bodyText}>No post-test questions available for this experiment yet.</p>
            ) : (
              <>
                {experimentPosttest.map((q, idx) => (
                  <div key={idx} style={styles.questionBlock}>
                    <p style={styles.questionText}><b>Q{idx + 1}.</b> {q.question}</p>
                    {q.options.map((opt, oIdx) => (
                      <label key={oIdx} style={styles.optionLabel}>
                        <input
                          type="radio"
                          name={`posttest-${idx}`}
                          checked={postTestAnswers[idx] === oIdx}
                          onChange={() => setPostTestAnswers({ ...postTestAnswers, [idx]: oIdx })}
                          disabled={postTestScore !== null}
                        />
                        <span style={{ marginLeft: "10px" }}>{opt}</span>
                      </label>
                    ))}
                    {postTestScore !== null && (
                      <div style={postTestAnswers[idx] === q.correct_answer_index ? styles.correctFb : styles.wrongFb}>
                        {postTestAnswers[idx] === q.correct_answer_index ? "✅ Correct!" : "❌ Incorrect."} {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                {postTestScore === null ? (
                  <button style={styles.submitBtn} onClick={handlePostTestSubmit}>Submit Answers</button>
                ) : (
                  <div style={styles.scoreBox}>Score: {postTestScore} / {experimentPosttest.length}</div>
                )}
              </>
            )}
            <button style={styles.nextBtn} onClick={() => setActiveTab("feedback")}>
              Continue to Feedback →
            </button>
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === "feedback" && (
          <div style={styles.contentCard}>
            <h2 style={styles.contentTitle}>🏆 Feedback</h2>
            <div style={styles.feedbackBox}>
              <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🎉</p>
              <p style={styles.feedbackText}>{experimentFeedback}</p>
            </div>

            {/* Feedback submission form */}
            <div style={styles.fbForm}>
              <p style={styles.fbFormTitle}>Share your thoughts</p>
              {fbSubmitted ? (
                <div style={styles.fbSuccess}>
                  ✓ Thanks for your feedback! It helps us improve the lab.
                </div>
              ) : (
                <>
                  {/* Star rating */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setFbRating(fbRating === n ? 0 : n)}
                        style={{
                          fontSize: 28,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: n <= fbRating ? "#f5c518" : "#374151",
                          transition: "color 0.1s",
                          padding: 0,
                          lineHeight: 1,
                        }}
                        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      >★</button>
                    ))}
                    {fbRating > 0 && (
                      <span style={{ fontSize: 12, color: "#6b7280", alignSelf: "center", marginLeft: 6 }}>
                        {["", "Poor", "Fair", "Good", "Great", "Excellent"][fbRating]}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={fbMessage}
                    onChange={e => setFbMessage(e.target.value)}
                    placeholder="What did you find helpful? What could be improved?"
                    rows={4}
                    style={styles.fbTextarea}
                    maxLength={1000}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{fbMessage.length}/1000</span>
                    {fbError && <span style={{ fontSize: 12, color: "#ef4444" }}>{fbError}</span>}
                  </div>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={fbSubmitting}
                    style={{ ...styles.heroBtn, marginTop: 14, opacity: fbSubmitting ? 0.6 : 1 }}
                  >
                    {fbSubmitting ? "Submitting…" : "Submit Feedback"}
                  </button>
                </>
              )}
            </div>

            <button style={{ ...styles.heroBtn, background: "#1e293b", marginTop: 16 }} onClick={() => navigate("/")}>
              ← Return to All Experiments
            </button>
          </div>
        )}
      </div>

      {/* RAG Chatbot Integration */}
      <ChatbotWidget context="theory" />
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#050505",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  loadingPage: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#000",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #222",
    borderTop: "3px solid #00ffcc",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  /* SIDEBAR */
  sidebar: {
    width: "260px",
    flexShrink: 0,
    background: "#0a0a0a",
    borderRight: "1px solid #1a1a1a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  backBtn: {
    background: "none",
    border: "1px solid #333",
    color: "#888",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "left",
    transition: "all 0.2s",
  },
  expTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#00ffcc",
    marginBottom: "8px",
    lineHeight: "1.3",
  },
  diffBadge: {
    display: "inline-block",
    background: "#002211",
    color: "#00ffcc",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "24px",
    alignSelf: "flex-start",
  },
  tabList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "none",
    border: "none",
    borderRadius: "8px",
    color: "#888",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    transition: "all 0.2s",
  },
  tabActive: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "#002211",
    border: "1px solid #00ffcc33",
    borderRadius: "8px",
    color: "#00ffcc",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "left",
    transition: "all 0.2s",
  },
  tabIcon: {
    fontSize: "16px",
    width: "22px",
    textAlign: "center",
  },

  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    padding: "40px 60px",
    overflowY: "auto",
    maxWidth: "900px",
  },
  contentCard: {
    animation: "fadeIn 0.3s ease",
  },
  contentTitle: {
    fontSize: "28px",
    fontWeight: "800",
    margin: "0 0 24px 0",
  },
  subTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#aaa",
    margin: "30px 0 12px 0",
  },
  bodyText: {
    fontSize: "15px",
    color: "#ccc",
    lineHeight: "1.7",
  },

  /* AIM */
  aimBox: {
    background: "linear-gradient(135deg, #001a11, #002211)",
    border: "1px solid #00ffcc33",
    borderRadius: "12px",
    padding: "24px 28px",
    marginBottom: "20px",
  },
  aimText: {
    fontSize: "18px",
    color: "#fff",
    lineHeight: "1.6",
    margin: 0,
  },

  /* THEORY */
  theoryBox: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "28px",
    fontSize: "15px",
    color: "#ddd",
    lineHeight: "1.8",
    marginBottom: "20px",
  },

  /* QUIZZES */
  questionBlock: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "16px",
  },
  questionText: {
    fontSize: "15px",
    margin: "0 0 14px 0",
    color: "#fff",
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    marginBottom: "6px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#ccc",
    transition: "background 0.15s",
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #00ff88, #00ccaa)",
    color: "#000",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
    marginTop: "10px",
  },
  scoreBox: {
    background: "#002211",
    color: "#00ffcc",
    padding: "14px",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "18px",
    marginTop: "10px",
  },
  correctFb: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#00ffcc",
    background: "#002211",
    padding: "10px 14px",
    borderRadius: "6px",
    borderLeft: "3px solid #00ffcc",
  },
  wrongFb: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#ff6666",
    background: "#220000",
    padding: "10px 14px",
    borderRadius: "6px",
    borderLeft: "3px solid #ff6666",
  },

  /* PROCEDURE */
  procedureList: {
    paddingLeft: "0",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    listStyleType: "none",
    counterReset: "step-counter",
  },
  procedureStep: {
    position: "relative",
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: "1.8",
    padding: "16px 20px 16px 20px",
    background: "#0d0d15",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
    transition: "all 0.2s ease",
    cursor: "default",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "12px",
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    background: "#00ffcc22",
    color: "#00ffcc",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
    border: "1px solid #00ffcc44",
    marginTop: "2px",
  },

  /* SIMULATION */
  simPlaceholder: {
    background: "#0a0a0a",
    border: "2px dashed #222",
    borderRadius: "16px",
    padding: "60px 40px",
    textAlign: "center",
    marginBottom: "20px",
  },
  simCtas: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "320px",
    margin: "0 auto",
  },

  /* FEEDBACK */
  feedbackBox: {
    background: "linear-gradient(135deg, #001a11, #002211)",
    border: "1px solid #00ffcc33",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    marginBottom: "28px",
  },
  feedbackText: {
    fontSize: "18px",
    color: "#fff",
    lineHeight: "1.6",
    margin: "0 0 8px 0",
  },
  fbForm: {
    background: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: "14px",
    padding: "28px",
  },
  fbFormTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#e6edf3",
    marginBottom: "16px",
    letterSpacing: "0.02em",
  },
  fbTextarea: {
    width: "100%",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    color: "#e6edf3",
    fontSize: "14px",
    lineHeight: "1.6",
    padding: "12px 14px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  fbSuccess: {
    padding: "16px 20px",
    background: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.3)",
    borderRadius: "10px",
    color: "#4ade80",
    fontSize: "14px",
    fontWeight: 600,
  },

  /* COMMON */
  nextBtn: {
    display: "inline-block",
    marginTop: "24px",
    padding: "12px 24px",
    background: "none",
    border: "1px solid #333",
    color: "#00ffcc",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  heroBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #00ff88, #00ccaa)",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(0,255,136,0.3)",
  },
  secondaryBtn: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "1px solid #00ffcc55",
    background: "transparent",
    color: "#00ffcc",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  /* CODE TAB */
  codeLockBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 24px",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    marginBottom: "24px",
  },
  hintCallout: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    background: "rgba(0,242,255,0.06)",
    border: "1px solid rgba(0,242,255,0.2)",
    borderRadius: "12px",
    padding: "16px 20px",
    maxWidth: 440,
    marginBottom: 4,
    textAlign: "left",
  },
  unlockBanner: {
    background: "linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,204,170,0.08))",
    border: "1px solid rgba(0,255,136,0.3)",
    borderRadius: "10px",
    padding: "12px 20px",
    color: "#00ff88",
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 16,
  },
  codeToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0d1117",
    borderRadius: "8px 8px 0 0",
    padding: "8px 14px",
    borderBottom: "1px solid #21262d",
  },
  copyBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
    transition: "color 0.2s",
  },
  codeBlock: {
    background: "#0d1117",
    borderRadius: "0 0 8px 8px",
    padding: "20px",
    overflowX: "auto",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    lineHeight: 1.7,
    color: "#e6edf3",
    margin: 0,
    whiteSpace: "pre",
    border: "1px solid #21262d",
    borderTop: "none",
  },
};
