import HardwarePreview from "./HardwarePreview";

export default function McuPreviewPanel({ mcu }) {
  if (!mcu) return null;

  const specs = mcu.features || [];
  const docUrl = mcu.docSlug ? `https://docs.wokwi.com/parts/${mcu.docSlug}` : null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.previewShell}>
        <HardwarePreview tag={mcu.wokwiTag} docSlug={mcu.docSlug} size="large" style={{ width: "100%" }} />
      </div>
      <div style={styles.specBlock} data-chip-node="interactive">
        <div style={styles.specHeader}>{mcu.name}</div>
        <div style={styles.specSub}>{mcu.package}</div>
        <ul style={styles.specList}>
          {specs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {docUrl && (
          <a href={docUrl} target="_blank" rel="noreferrer" style={styles.docLink}>
            View reference ↗
          </a>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: 560,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px dashed rgba(255,255,255,0.15)",
    background: "rgba(10,10,10,0.5)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  previewShell: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  specBlock: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 12,
    fontFamily: "monospace",
  },
  specHeader: {
    fontSize: 16,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--text-primary, #fff)",
  },
  specSub: {
    fontSize: 12,
    color: "var(--text-muted, #aaa)",
    marginBottom: 8,
  },
  specList: {
    margin: 0,
    paddingLeft: 16,
    color: "var(--text-secondary, #c9c9c9)",
    fontSize: 12,
    display: "grid",
    gap: 2,
  },
  docLink: {
    display: "inline-flex",
    marginTop: 10,
    fontSize: 12,
    color: "var(--accent, #00d8b4)",
    textDecoration: "none",
  },
};
