import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || "avatar.png";
    
    // Read the body directly as a blob
    const blob = await request.blob();

    // Upload to Vercel Blob using the provided token
    const result = await put(`avatars/${Date.now()}-${filename}`, blob, {
      access: "public",
      token: "vercel_blob_rw_5M1W9NLYPbw340qD_hzgMyWVuxM2sZrg8y03EtTVGN9Br5b",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
