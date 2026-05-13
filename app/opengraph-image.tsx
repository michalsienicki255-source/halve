import { ImageResponse } from "next/og";
import { brand } from "./config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${brand.name} — ${brand.tagline}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#07070b",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(52,211,153,0.25), transparent 50%), radial-gradient(circle at 70% 70%, rgba(167,139,250,0.3), transparent 50%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                letterSpacing: -4,
                backgroundImage: "linear-gradient(135deg, #34d399, #a78bfa)",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1,
              }}
            >
              H
            </div>
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "white",
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            {brand.name}
          </div>
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: "rgba(255,255,255,0.78)",
            letterSpacing: -1,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          {brand.tagline}
        </div>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 14,
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <span>AI receipt scan</span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
          <span>Tap to assign</span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
          <span>Magic link share</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
