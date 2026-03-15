import { useMemo, useState } from "react";
import HardwarePreview from "./HardwarePreview";

const STATUS_LABELS = {
  simulated: "Simulated",
  visual: "Visual placeholder",
  tool: "Lab tool",
};

const STATUS_STYLES = {
  simulated: { color: "#22c55e", border: "rgba(34,197,94,0.4)", bg: "rgba(34,197,94,0.1)" },
  visual: { color: "#facc15", border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.08)" },
  tool: { color: "#3b82f6", border: "rgba(59,130,246,0.4)", bg: "rgba(59,130,246,0.08)" },
};

export default function ComponentCatalogPanel({ categories = [], onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return categories;
    return categories
      .map((category) => {
        const items = category.components.filter((component) => {
          const haystack = `${component.label} ${component.description || ""}`.toLowerCase();
          return haystack.includes(normalized);
        });
        return { ...category, components: items };
      })
      .filter((category) => category.components.length > 0);
  }, [categories, normalized]);

  const hasResults = filtered.some((category) => category.components.length > 0);

  const handleAdd = (component) => {
    if (!component?.workspaceType || !onAdd) return;
    onAdd(component.workspaceType, component);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Component Library</div>
            <div style={styles.subtitle}>Browse every supported module, including visual placeholders.</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
        </div>

        <div style={styles.controls}>
          <input
            style={styles.search}
            type="search"
            placeholder="Search components"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={styles.legend}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <span key={key} style={{ ...styles.legendBadge, color: STATUS_STYLES[key].color, borderColor: STATUS_STYLES[key].border, background: STATUS_STYLES[key].bg }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={styles.content}>
          {hasResults ? (
            filtered.map((category) => (
              <section key={category.id} style={styles.categorySection}>
                <div style={styles.categoryHeader}>
                  <div style={styles.categoryTitle}>{category.title}</div>
                  <p style={styles.categoryDesc}>{category.description}</p>
                </div>
                <div style={styles.cardGrid}>
                  {category.components.map((component) => {
                    const statusStyle = STATUS_STYLES[component.status] || STATUS_STYLES.visual;
                    const disableAdd = component.status === "tool" || !component.workspaceType;
                    const buttonLabel = component.status === "simulated" ? "Add to workspace" : component.status === "visual" ? "Add placeholder" : "Already available";
                    return (
                      <div key={component.id} style={styles.card}>
                        <HardwarePreview tag={component.wokwiTag} docSlug={component.docSlug} imageUrl={component.imageUrl} size="small" style={styles.cardPreview} />
                        <div style={styles.cardTop}>
                          <span style={styles.cardIcon}>{component.icon || "MOD"}</span>
                          <span style={{ ...styles.statusBadge, color: statusStyle.color, borderColor: statusStyle.border, background: statusStyle.bg }}>
                            {STATUS_LABELS[component.status] || "Visual"}
                          </span>
                        </div>
                        <div style={styles.cardLabel}>{component.label}</div>
                        {component.description && <p style={styles.cardDesc}>{component.description}</p>}
                        <button
                          style={disableAdd ? styles.cardButtonDisabled : styles.cardButton}
                          disabled={disableAdd}
                          onClick={() => handleAdd(component)}
                        >
                          {buttonLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div style={styles.emptyState}>No components match "{query}".</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  panel: {
    width: "min(1200px, 100%)",
    maxHeight: "90vh",
    background: "var(--surface-1, #111)",
    borderRadius: 20,
    border: "1px solid var(--border, #333)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 28px",
    borderBottom: "1px solid var(--border, #333)",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  subtitle: {
    fontSize: 13,
    color: "var(--text-secondary, #bbb)",
    marginTop: 4,
  },
  closeBtn: {
    border: "1px solid var(--border, #333)",
    borderRadius: 999,
    padding: "6px 16px",
    background: "transparent",
    color: "var(--text-primary, #f5f5f5)",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    padding: "16px 28px",
    borderBottom: "1px solid var(--border, #333)",
    flexWrap: "wrap",
  },
  search: {
    flex: "1 0 260px",
    borderRadius: 999,
    border: "1px solid var(--border, #333)",
    padding: "10px 16px",
    background: "var(--surface-0, #000)",
    color: "var(--text-primary, #f5f5f5)",
  },
  legend: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  legendBadge: {
    border: "1px solid",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 11,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  content: {
    padding: "20px 28px",
    overflowY: "auto",
    flex: 1,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  categoryDesc: {
    fontSize: 12,
    color: "var(--text-muted, #888)",
    margin: "4px 0 0 0",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 14,
  },
  card: {
    border: "1px solid var(--border, #2a2a2a)",
    borderRadius: 16,
    padding: 16,
    background: "var(--surface-0, #050505)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 210,
  },
  cardPreview: {
    width: "100%",
    height: 120,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.2em",
  },
  statusBadge: {
    border: "1px solid",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 700,
  },
  cardDesc: {
    fontSize: 12,
    color: "var(--text-secondary, #bcbcbc)",
    lineHeight: 1.5,
    margin: 0,
    flex: 1,
  },
  cardButton: {
    marginTop: "auto",
    borderRadius: 10,
    border: "none",
    padding: "8px 12px",
    background: "var(--accent, #00d8b4)",
    color: "#000",
    fontWeight: 600,
    cursor: "pointer",
  },
  cardButtonDisabled: {
    marginTop: "auto",
    borderRadius: 10,
    border: "1px solid var(--border, #333)",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text-muted, #777)",
    cursor: "not-allowed",
  },
  emptyState: {
    textAlign: "center",
    color: "var(--text-muted, #888)",
    padding: 60,
    fontSize: 14,
  },
};
