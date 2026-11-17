"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 0%, #0d1d3a 0%, #04070f 55%)",
          color: "#e7eefa",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
        }}
      >
        <title>Something went wrong · TUMA</title>
        <main
          style={{
            width: "100%",
            maxWidth: "480px",
            textAlign: "center",
            border: "1px solid rgba(125,165,255,0.16)",
            borderRadius: "20px",
            background: "rgba(10,19,38,0.9)",
            padding: "40px 28px",
            boxShadow: "0 40px 120px -50px rgba(0,0,0,0.9)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #2e7cff, #12b8d8)",
              color: "#04070f",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            T
          </div>

          <h1
            style={{
              margin: "24px 0 0",
              fontSize: "28px",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            Something went wrong.
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#8fa3c8",
            }}
          >
            TUMA hit an unexpected error while loading. Your data is safe. Try
            again or return to the homepage.
          </p>

          {error.digest ? (
            <p
              style={{
                margin: "16px 0 0",
                fontSize: "11px",
                color: "#6d7fa3",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}

          <div
            style={{
              marginTop: "28px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "999px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error must stay self-contained without the app router */}
            <a
              href="/"
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "999px",
                border: "1px solid rgba(125,165,255,0.2)",
                color: "#e7eefa",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to homepage
            </a>
          </div>

          <p style={{ margin: "24px 0 0", fontSize: "11.5px", color: "#6d7fa3" }}>
            support@tuma.africa
          </p>
        </main>
      </body>
    </html>
  );
}
