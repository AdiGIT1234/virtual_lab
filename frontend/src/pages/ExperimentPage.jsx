import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";
import allExperiments from "../data/all_experiments.json";

export default function ExperimentPage() {
  const { experimentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("aim");
  const [preTestAnswers, setPreTestAnswers] = useState({});
  const [postTestAnswers, setPostTestAnswers] = useState({});
  const [preTestScore, setPreTestScore] = useState(null);
  const [postTestScore, setPostTestScore] = useState(null);

  useEffect(() => {
    if (!experimentId) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/experiments/${experimentId}`)
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

  const tabs = [
    { id: "aim", label: "Aim", icon: "🎯" },
    { id: "theory", label: "Theory", icon: "📘" },
    { id: "pretest", label: "Pre-Test", icon: "📝" },
    { id: "procedure", label: "Procedure", icon: "🔧" },
    { id: "simulation", label: "Simulation", icon: "▶️" },
    { id: "posttest", label: "Post-Test", icon: "✅" },
    { id: "feedback", label: "Feedback", icon: "🏆" },
  ];

  const handlePreTestSubmit = () => {
    if (!data?.pretest) return;
    let score = 0;
    data.pretest.forEach((q, idx) => {
      if (preTestAnswers[idx] === q.correct_answer_index) score++;
    });
    setPreTestScore(score);
  };

  const handlePostTestSubmit = () => {
    if (!data?.posttest) return;
    let score = 0;
    data.posttest.forEach((q, idx) => {
      if (postTestAnswers[idx] === q.correct_answer_index) score++;
    });
    setPostTestScore(score);
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
                <li key={idx} style={styles.procedureStep}>{step}</li>
              ))}
            </ol>
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
                <button style={styles.heroBtn} onClick={() => navigate("/sandbox")}>
                  Open Sandbox Simulator →
                </button>
                <button style={styles.secondaryBtn} onClick={() => navigate("/arlab?preset=blink")}>View 3D Lab Preview →</button>
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
              <button style={styles.heroBtn} onClick={() => navigate("/")}>
                ← Return to All Experiments
              </button>
            </div>
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
    background: "#000",
    color: "#fff",
    fontFamily: "'Times New Roman', Times, serif",
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
    paddingLeft: "20px",
    counterReset: "step",
  },
  procedureStep: {
    fontSize: "15px",
    color: "#ccc",
    lineHeight: "1.7",
    marginBottom: "16px",
    paddingLeft: "8px",
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
  },
  feedbackText: {
    fontSize: "18px",
    color: "#fff",
    lineHeight: "1.6",
    margin: "0 0 24px 0",
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
};
