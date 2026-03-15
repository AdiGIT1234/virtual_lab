import { createElement, useMemo } from "react";

const buildThumbUrl = (docSlug) => (docSlug ? `https://thumbs.wokwi.com/docs/parts/${docSlug}.html/thumbnail.png` : null);

const SIZE_MAP = {
  small: { width: 120, height: 95 },
  medium: { width: 200, height: 150 },
  large: { width: 360, height: 260 },
};

export default function HardwarePreview({ tag, docSlug, imageUrl, size = "medium", style }) {
  const resolvedImage = imageUrl || buildThumbUrl(docSlug);
  const scale = size === "small" ? 0.8 : size === "large" ? 1.2 : 1;
  const dims = SIZE_MAP[size] || SIZE_MAP.medium;

  const previewStyle = useMemo(() => ({
    width: dims.width,
    height: dims.height,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    background: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
    ...style,
  }), [dims.width, dims.height, style]);

  if (!tag && !resolvedImage) return null;

  return (
    <div style={previewStyle}>
      {tag
        ? createElement(tag, {
            style: {
              width: "100%",
              height: "100%",
              transform: `scale(${scale})`,
              transformOrigin: "center",
            },
          })
        : resolvedImage && (
            <img
              src={resolvedImage}
              alt="Component preview"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              loading="lazy"
            />
          )}
    </div>
  );
}
