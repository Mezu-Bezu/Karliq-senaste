import { ImageResponse } from "next/og";

export const alt = "Karliq, webbstudio i Jönköpings län";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "54px 62px",
        overflow: "hidden",
        background: "#fbf7fe",
        color: "#0f081d",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -460,
          right: -70,
          width: 780,
          height: 780,
          display: "flex",
          border: "38px solid #8b5cf6",
          borderRadius: "50%",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 23, fontWeight: 700, letterSpacing: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="45" height="34" viewBox="0 0 150 108" fill="#8b5cf6">
            <path d="M 28 8 C 32 8 32 14 27 28 L 13 62 C 8 72 2 88 0 100 L 26 100 C 33 88 38 72 44 56 C 40 42 33 24 28 8 Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M 22 52 C 34 32 54 8 82 8 C 112 8 136 28 136 56 C 136 84 112 102 82 102 C 64 102 48 92 36 78 C 42 80 50 81 60 80 C 74 78 88 68 98 54 C 105 43 103 28 88 22 C 72 16 52 28 38 48 C 30 58 26 66 22 72 C 19 68 20 58 22 52 Z M 82 22 C 94 22 104 32 99 47 C 93 60 78 72 62 72 C 52 72 46 68 46 62 C 46 54 60 34 74 25 C 77 23 80 22 82 22 Z" />
            <path d="M 52 64 C 60 54 68 48 74 46 C 70 54 64 66 58 76 C 54 82 50 88 48 94 C 58 92 72 84 88 78 C 104 72 122 72 136 82 C 144 88 148 94 148 98 C 142 102 128 102 114 96 C 96 88 80 84 66 84 C 56 84 50 88 46 94 C 42 88 46 74 52 64 Z" />
          </svg>
          <span>KARLIQ</span>
        </div>
        <span style={{ color: "#6d28d9" }}>DIGITAL STUDIO / JÖNKÖPINGS LÄN</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 70 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 105, lineHeight: 0.83, letterSpacing: "-8px", fontWeight: 500 }}>
          <span>Starka idéer.</span>
          <span style={{ color: "#6d28d9" }}>Satta i rörelse.</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid rgba(109,40,217,.18)", paddingTop: 18, fontSize: 19 }}>
        <span>DESIGN / MOTION / AUTOMATION / DEVELOPMENT</span>
        <span style={{ color: "#6d28d9" }}>KARLIQ.ME</span>
      </div>
    </div>,
    size,
  );
}
