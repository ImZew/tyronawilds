import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "TYRONAWILDS™ // PIERDE EL MAPA — Expediciones en Sierra Nevada, Parque Tayrona & Caribe";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          padding: "56px 64px",
          border: "2px solid rgba(244, 240, 234, 0.2)",
          color: "#F4F0EA",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top HUD Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            borderBottom: "1px solid rgba(244, 240, 234, 0.2)",
            paddingBottom: "20px",
            fontSize: 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#E63000", fontWeight: 900 }}>●</span>
            <span>TYRONAWILDS™ // SANTA MARTA D.T.C.H., COLOMBIA</span>
          </div>
          <div style={{ color: "#E63000", fontWeight: 700 }}>
            11°14&apos;27&quot;N 74°11&apos;56&quot;W · 0m – 5.775m MSNM
          </div>
        </div>

        {/* Center Monumental Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: "0.26em",
              color: "#E63000",
              textTransform: "uppercase",
              marginBottom: "12px",
              fontWeight: 700,
            }}
          >
            SIERRA NEVADA · CIUDAD PERDIDA (TEYUNA) · PARQUE TAYRONA · MINCA
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "#F4F0EA",
              textTransform: "uppercase",
            }}
          >
            PIERDE
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "#E63000",
              textTransform: "uppercase",
              paddingLeft: "90px",
            }}
          >
            EL MAPA
          </div>
        </div>

        {/* Bottom HUD Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            borderTop: "1px solid rgba(244, 240, 234, 0.2)",
            paddingTop: "20px",
            fontSize: 18,
            letterSpacing: "0.18em",
            color: "rgba(244, 240, 234, 0.8)",
          }}
        >
          <div>EXPEDICIONES DE CONSERVACIÓN Y ALTA MONTAÑA</div>
          <div
            style={{
              backgroundColor: "#E63000",
              color: "#F4F0EA",
              padding: "8px 20px",
              fontWeight: 800,
            }}
          >
            BAQUIANO AI · CUPO GARANTIZADO
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
