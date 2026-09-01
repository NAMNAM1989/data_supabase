import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "NAM NAM DATA",
    timestamp: new Date().toISOString(),
  });
}
