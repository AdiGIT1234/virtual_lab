import WokwiPreview from "./WokwiPreview";

export default function ComponentPlaceholder({ label, status = "visual", description, category, wokwiTag, docSlug, imageUrl }) {
  const statusText = status === "simulated" ? "Simulation ready" : status === "tool" ? "Built-in tool" : "Visual placeholder";
  const palette = status === "simulated"
    ? { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.5)", text: "#22c55e" }
    : status === "tool"
      ? { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#3b82f6" }
      : { bg: "rgba(250,204,21,0.2)", border: "rgba(250,204,21,0.45)", text: "#facc15" };

  return (
    <div style={styles.shell}>
      {(wokwiTag || imageUrl || docSlug) && (
        <WokwiPreview tag={wokwiTag} docSlug={docSlug} imageUrl={imageUrl} size="medium" style={styles.preview} />
      )}
      <div style={styles.title}>{label || "Component"}</div>
      {category && <div style={styles.category}>{category}</div>}
      <div style={{ ...styles.badge, background: palette.bg, borderColor: palette.border, color: palette.text }}>
        {statusText}
      </div>
    </div>
  );
}

const styles = {
  shell: {
    minWidth: 180,
    minHeight: 160,
    borderRadius: 12,
    border: "1px dashed var(--border, #333)",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "var(--text-primary, #f7f7f7)",
    fontFamily: "monospace",
  },
  preview: {
    width: "100%",
    height: 120,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  category: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "var(--text-muted, #999)",
    letterSpacing: "0.1em",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    border: "1px solid",
    padding: "2px 10px",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
};
