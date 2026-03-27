import { useCircuitStore } from "../../state/useCircuitStore";

export default function PropertyInspector({ selectedId, onClose }) {
  const components = useCircuitStore((state) => state.components);
  const component = components.find((c) => c.id === selectedId);

  if (!component) return null;

  return (
    <div style={{
      position: "absolute",
      right: "20px",
      top: "80px",
      width: "280px",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderRadius: "12px",
      border: "1px solid #e0e0e0",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      padding: "20px",
      zIndex: 1000,
      fontFamily: "Inter, sans-serif",
      color: "#333"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{component.type} Properties</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#999" }}>×</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Object ID</label>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>{component.id}</div>
        </div>

        {component.type === "RESISTOR" && (
          <div>
            <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Resistance (Ω)</label>
            <input 
              type="number" 
              defaultValue={component.resistance || 330} 
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
        )}

        {component.type === "LED" && (
          <div>
            <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>LED Color</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["red", "green", "blue", "yellow"].map((color) => (
                <div 
                  key={color} 
                  style={{ 
                    width: "24px", 
                    height: "24px", 
                    borderRadius: "50%", 
                    backgroundColor: color, 
                    cursor: "pointer",
                    border: component.metadata?.color === color ? "2px solid #333" : "1px solid #ddd"
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
          <button style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007AFF",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer"
          }}>
            Open Code Editor
          </button>
        </div>
      </div>
    </div>
  );
}
