import React, { useState, useEffect } from "react";

const GuidedLabSidebar = ({ experimentId, apiBaseUrl = "http://127.0.0.1:8000" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("theory");
  const [preTestAnswers, setPreTestAnswers] = useState({});
  const [postTestAnswers, setPostTestAnswers] = useState({});
  const [preTestScore, setPreTestScore] = useState(null);
  const [postTestScore, setPostTestScore] = useState(null);

  useEffect(() => {
    if (!experimentId) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/api/experiments/${experimentId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setPreTestAnswers({});
        setPostTestAnswers({});
        setPreTestScore(null);
        setPostTestScore(null);
        setActiveTab("theory");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [experimentId, apiBaseUrl]);

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={{ color: "#00ffcc" }}>Loading Lab Content...</h3>
      </div>
    );
  }

  if (!data) return null;

  const handlePreTestSubmit = () => {
    let score = 0;
    data.pretest.forEach((q, idx) => {
      if (preTestAnswers[idx] === q.correct_answer_index) score++;
    });
    setPreTestScore(score);
  };

  const handlePostTestSubmit = () => {
    let score = 0;
    data.posttest.forEach((q, idx) => {
      if (postTestAnswers[idx] === q.correct_answer_index) score++;
    });
    setPostTestScore(score);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{data.title}</h2>
      <div style={styles.badge}>{data.difficulty}</div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button style={activeTab === "theory" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("theory")}>Theory</button>
        <button style={activeTab === "pretest" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("pretest")}>Pre-Test</button>
        <button style={activeTab === "procedure" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("procedure")}>Procedure</button>
        <button style={activeTab === "posttest" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("posttest")}>Post-Test</button>
      </div>

      <div style={styles.contentArea}>
        {/* Theory Tab */}
        {activeTab === "theory" && (
          <div className="theory-content">
            <h4 style={styles.sectionTitle}>Aim</h4>
            <p style={styles.text}>{data.aim}</p>
            <h4 style={styles.sectionTitle}>Objective</h4>
            <p style={styles.text}>{data.objective}</p>
            <h4 style={styles.sectionTitle}>Theory</h4>
            <div style={styles.text} dangerouslySetInnerHTML={{ __html: data.theory }} />
          </div>
        )}

        {/* Pre-Test Tab */}
        {activeTab === "pretest" && (
          <div>
            <h4 style={styles.sectionTitle}>Pre-Lab Assessment</h4>
            {data.pretest.map((q, idx) => (
              <div key={idx} style={styles.questionBlock}>
                <p style={styles.questionText}><b>Q{idx + 1}:</b> {q.question}</p>
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} style={styles.optionLabel}>
                    <input 
                      type="radio" 
                      name={`pretest-${idx}`} 
                      checked={preTestAnswers[idx] === oIdx}
                      onChange={() => setPreTestAnswers({...preTestAnswers, [idx]: oIdx})}
                      disabled={preTestScore !== null}
                    />
                    <span style={{ marginLeft: '8px' }}>{opt}</span>
                  </label>
                ))}
                {preTestScore !== null && (
                  <div style={preTestAnswers[idx] === q.correct_answer_index ? styles.correctFeedback : styles.wrongFeedback}>
                    {preTestAnswers[idx] === q.correct_answer_index ? "✅ Correct!" : "❌ Incorrect."} {q.explanation}
                  </div>
                )}
              </div>
            ))}
            {preTestScore === null ? (
              <button style={styles.submitBtn} onClick={handlePreTestSubmit}>Submit Answers</button>
            ) : (
              <div style={styles.scoreBoard}>
                Score: {preTestScore} / {data.pretest.length}
              </div>
            )}
          </div>
        )}

        {/* Procedure Tab */}
        {activeTab === "procedure" && (
          <div>
            <h4 style={styles.sectionTitle}>Implementation Steps</h4>
            <ul style={{ paddingLeft: "20px" }}>
              {data.procedure.map((step, idx) => (
                <li key={idx} style={{...styles.text, marginBottom: "12px"}}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Post-Test Tab */}
        {activeTab === "posttest" && (
          <div>
            <h4 style={styles.sectionTitle}>Post-Lab Assessment</h4>
            {data.posttest.map((q, idx) => (
              <div key={idx} style={styles.questionBlock}>
                <p style={styles.questionText}><b>Q{idx + 1}:</b> {q.question}</p>
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} style={styles.optionLabel}>
                    <input 
                      type="radio" 
                      name={`posttest-${idx}`} 
                      checked={postTestAnswers[idx] === oIdx}
                      onChange={() => setPostTestAnswers({...postTestAnswers, [idx]: oIdx})}
                      disabled={postTestScore !== null}
                    />
                    <span style={{ marginLeft: '8px' }}>{opt}</span>
                  </label>
                ))}
                {postTestScore !== null && (
                  <div style={postTestAnswers[idx] === q.correct_answer_index ? styles.correctFeedback : styles.wrongFeedback}>
                    {postTestAnswers[idx] === q.correct_answer_index ? "✅ Correct!" : "❌ Incorrect."} {q.explanation}
                  </div>
                )}
              </div>
            ))}
            {postTestScore === null ? (
              <button style={styles.submitBtn} onClick={handlePostTestSubmit}>Submit Answers</button>
            ) : (
              <div style={styles.scoreBoard}>
                Score: {postTestScore} / {data.posttest.length}
                {postTestScore === data.posttest.length && (
                   <div style={styles.feedbackFinal}>{data.feedback}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "400px",
    background: "#0d0d0d",
    borderRight: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    height: "100%",
    padding: "20px",
    boxSizing: "border-box",
    overflowY: "auto",
    transition: "margin-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  title: { margin: "0 0 10px 0", color: "#00ffcc", fontSize: "20px" },
  badge: { display: "inline-block", background: "#005544", color: "#00ffcc", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", marginBottom: "20px" },
  tabContainer: { display: "flex", width: "100%", borderBottom: "1px solid #333", marginBottom: "15px" },
  tab: { flex: 1, padding: "8px 0", background: "none", border: "none", color: "#888", cursor: "pointer", borderBottom: "2px solid transparent", fontSize: "12px", fontWeight: "bold" },
  activeTab: { flex: 1, padding: "8px 0", background: "none", border: "none", color: "#00ffcc", cursor: "pointer", borderBottom: "2px solid #00ffcc", fontSize: "12px", fontWeight: "bold" },
  contentArea: { flex: 1, paddingRight: "10px" },
  sectionTitle: { color: "#aaa", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #222", paddingBottom: "5px", marginBottom: "15px", marginTop: "20px" },
  text: { color: "#ddd", fontSize: "14px", lineHeight: "1.6" },
  questionBlock: { background: "#151515", padding: "15px", borderRadius: "8px", marginBottom: "15px" },
  questionText: { margin: "0 0 10px 0", fontSize: "14px", color: "#fff" },
  optionLabel: { display: "block", marginBottom: "8px", cursor: "pointer", fontSize: "13px", color: "#ccc" },
  submitBtn: { width: "100%", background: "#00ffcc", color: "#000", border: "none", padding: "10px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" },
  scoreBoard: { background: "#003322", color: "#00ffcc", padding: "10px", borderRadius: "5px", textAlign: "center", fontWeight: "bold", marginTop: "10px", fontSize: "16px" },
  correctFeedback: { marginTop: "10px", fontSize: "12px", color: "#00ffcc", background: "#003322", padding: "8px", borderRadius: "4px" },
  wrongFeedback: { marginTop: "10px", fontSize: "12px", color: "#ff6666", background: "#330000", padding: "8px", borderRadius: "4px" },
  feedbackFinal: { marginTop: "15px", color: "#fff", background: "linear-gradient(45deg, #005544, #003322)", padding: "10px", borderRadius: "5px", fontSize: "14px" }
};

export default GuidedLabSidebar;
