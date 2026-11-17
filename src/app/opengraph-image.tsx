import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = "TUMA — Your Business. Your Orders. Your Growth.";
export const size = {
  width: 1200,
  height: 630,
};
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
          justifyContent: "space-between",
          background: "#04070f",
          padding: "64px 72px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-180px",
            left: "180px",
            width: "820px",
            height: "620px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(46,124,255,0.42) 0%, rgba(46,124,255,0) 66%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-220px",
            right: "-80px",
            width: "620px",
            height: "520px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(56,224,255,0.24) 0%, rgba(56,224,255,0) 68%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2e7cff 0%, #12b8d8 100%)",
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#ffffff",
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              TUMA
            </span>
            <span
              style={{
                color: "#7d93bb",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Business, in one place
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              borderRadius: "9999px",
              border: "1px solid rgba(125,165,255,0.22)",
              background: "rgba(255,255,255,0.04)",
              color: "#8fbbff",
              fontSize: "18px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#38e0ff",
                display: "flex",
              }}
            />
            {siteConfig.tagline}
          </div>

          <div
            style={{
              color: "#f2f7ff",
              fontSize: "76px",
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 1.04,
              display: "flex",
              flexDirection: "column",
              maxWidth: "960px",
            }}
          >
            <span>Run your business</span>
            <span>
              with{" "}
              <span
                style={{
                  color: "#38e0ff",
                  display: "flex",
                }}
              >
                total clarity.
              </span>
            </span>
          </div>

          <div
            style={{
              color: "#8fa3c8",
              fontSize: "22px",
              lineHeight: 1.5,
              maxWidth: "760px",
              display: "flex",
            }}
          >
            Orders, inventory, invoicing, mobile money and AI insights — one calm
            workspace for African businesses.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(125,165,255,0.14)",
            paddingTop: "24px",
            color: "#7d93bb",
            fontSize: "18px",
          }}
        >
          <span>tuma.africa</span>
          <span>Built in Cameroon · For Africa</span>
        </div>
      </div>
    ),
    size,
  );
}
