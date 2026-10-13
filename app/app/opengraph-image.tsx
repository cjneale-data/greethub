import { ImageResponse } from "next/og";

/**
 * Default share image for every page (Growth). Type only, brand colors, no people and no AI art, so it is safe
 * to show anywhere. Replace with a product-in-hand photo once docs/cmo/templates.md section 3 art is approved.
 */
export const alt = "GreetHub: cards and picture books that sound like you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "#FBF6EE",
          color: "#2B1E18",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 700 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: "#EE5A36", marginRight: 18 }} />
          GreetHub
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 76, fontWeight: 700, lineHeight: 1.1, maxWidth: 960 }}>
          Cards and picture books that sound like you.
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 34, color: "#6B5A50" }}>
          Drawn from your story. Printed and mailed for you.
        </div>
      </div>
    ),
    size,
  );
}
