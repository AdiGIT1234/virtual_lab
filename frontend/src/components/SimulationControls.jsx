import React, { useEffect } from "react";

const SimulationControls = ({
  totalSteps,
  currentStep,
  onStepChange,
  isPlaying,
  setIsPlaying,
}) => {
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        onStepChange((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // 500ms per step
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps, onStepChange, setIsPlaying]);

  const handleSliderChange = (e) => {
    onStepChange(Number(e.target.value));
  };

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <button onClick={() => onStepChange(0)} disabled={currentStep === 0}>
          ⏮
        </button>
        <button
          onClick={() => onStepChange((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
        >
          ◀
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => onStepChange((p) => Math.min(totalSteps - 1, p + 1))}
          disabled={currentStep >= totalSteps - 1}
        >
          ▶
        </button>
        <button
          onClick={() => onStepChange(totalSteps - 1)}
          disabled={currentStep >= totalSteps - 1}
        >
          ⏭
        </button>
      </div>

      <div style={styles.row}>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={handleSliderChange}
          style={styles.slider}
        />
        <span style={styles.stepLabel}>
          Step: {currentStep} / {Math.max(0, totalSteps - 1)}
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "1rem",
    background: "#1e1e1e",
    borderRadius: "8px",
    marginTop: "1rem",
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    border: "1px solid #333",
  },
  row: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    flex: 1,
    accentColor: "#007bff",
  },
  stepLabel: {
    fontFamily: "monospace",
    fontSize: "0.9rem",
    minWidth: "100px",
    textAlign: "right",
  },
};

export default SimulationControls;
