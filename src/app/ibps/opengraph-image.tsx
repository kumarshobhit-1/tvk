import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e3a8a 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            TVK
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "#cbd5e1" }}>
              The Victory Key
            </div>
            <div style={{ fontSize: 18, color: "#93c5fd" }}>IBPS SO IT Officer 2026</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 900 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            IBPS SO IT Officer 2026
          </div>
          <div style={{ fontSize: 28, color: "#dbeafe", lineHeight: 1.4 }}>
            Notification, exam pattern, syllabus, salary and selection process
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            "301 vacancies",
            "PK in Prelims",
            "225-mark Main",
            "Main : Interview 80:20",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "12px 18px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: 20,
                color: "#e2e8f0",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
