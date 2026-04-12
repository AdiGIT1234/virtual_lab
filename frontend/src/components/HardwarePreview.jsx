import { useMemo } from "react";
import { NativeComponents } from "./NativePreviews";

const SIZE_MAP = {
  small: { width: 120, height: 95 },
  medium: { width: 200, height: 150 },
  large: { width: 360, height: 260 },
};

export default function HardwarePreview({ tag, imageUrl, size = "medium", style }) {
  // If we have an exact imageUrl, we can still use it (though we plan to not use it much).
  const resolvedImage = imageUrl;
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

  // Determine if we have a native component mapped for this tag
  const NativeSvgCmp = tag ? (NativeComponents[tag] || NativeComponents["generic"]) : null;

  return (
    <div style={previewStyle}>
      {resolvedImage ? (
        <img
          src={resolvedImage}
          alt="Component preview"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="lazy"
        />
      ) : (
        NativeSvgCmp && (
          <NativeSvgCmp
            style={{
              width: "100%",
              height: "100%",
              transform: `scale(${scale})`,
              transformOrigin: "center",
            }}
          />
        )
      )}
    </div>
  );
}
