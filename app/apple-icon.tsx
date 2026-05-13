import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#07070b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "radial-gradient(circle at center, rgba(167,139,250,0.25), rgba(7,7,11,1) 70%)",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: -6,
            backgroundImage: "linear-gradient(135deg, #34d399, #a78bfa)",
            backgroundClip: "text",
            color: "transparent",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          H
        </div>
      </div>
    ),
    { ...size },
  );
}
