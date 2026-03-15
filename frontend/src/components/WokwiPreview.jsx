import { createElement, useMemo } from "react";

const buildThumbUrl = (docSlug) => (docSlug ? `https://thumbs.wokwi.com/docs/parts/${docSlug}.html/thumbnail.png` : null);

export default function WokwiPreview({
  tag,
  docSlug,
  imageUrl,
  size = "medium",
  style,
}) {
  const resolvedImage = imageUrl || buildThumbUrl(docSlug);
  const scale = size === "small" ? 0.8 : size === "large" ? 1.2 : 1;

  const previewStyle = useMemo(() => ({
    width: size === "small" ? 100 : size === "large" ? 200 : 150,
    height: size === "small" ? 90 : size === "large" ? 180 : 130,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    background: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
    ...style,
  }), [size, style]);

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
              alt="Wokwi component preview"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              loading="lazy"
            />
          )}
    </div>
  );
}
