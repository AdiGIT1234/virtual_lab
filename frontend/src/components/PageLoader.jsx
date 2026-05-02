export default function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "var(--surface-0, #050505)",
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: "3px solid rgba(0,242,255,0.15)",
        borderTop: "3px solid var(--accent, #00f2ff)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
