import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Generate a QR code data URL for a given URL.
 *
 * The `qrcode` package returns a data URI string like:
 *   data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...
 *
 * We strip the prefix and return just the base64 string so the UI can render it
 * as an <img src="data:image/png;base64,..."> without triggering another fetch.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  const size = Number(searchParams.get("size") ?? "300");

  if (!url) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    // Return the base64 portion so the client can use it directly as a data URL
    const base64 = dataUrl.replace(/^data:image\/png;base64/, "");

    return new NextResponse(base64, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[TUMA] QR code generation failed:", error);
    return new NextResponse("QR code generation failed", { status: 500 });
  }
}