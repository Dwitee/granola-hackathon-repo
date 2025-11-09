import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export const runtime = "nodejs"; // ensure Node.js runtime, not edge

// Required env vars (set locally in .env.local and later in Vercel)
const projectId = process.env.GCP_PROJECT_ID!;
const bucketName = process.env.GCS_BUCKET_NAME!;
const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY; // JSON string

if (!projectId || !bucketName || !serviceAccountKey) {
  console.warn(
    "[upload] Missing GCP_PROJECT_ID / GCS_BUCKET_NAME / GCP_SERVICE_ACCOUNT_KEY env vars."
  );
}

const storage =
  projectId && bucketName && serviceAccountKey
    ? new Storage({
        projectId,
        credentials: JSON.parse(serviceAccountKey),
      })
    : null;

export async function POST(req: NextRequest) {
  try {
    if (!storage) {
      return NextResponse.json(
        { error: "Storage not configured on server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const blob = file as File;
    const bytes = await blob.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = blob.name.replace(/\s+/g, "_");
    const destination = `transcripts/${Date.now()}-${safeName}`;

    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(destination);

    await gcsFile.save(buffer, {
      contentType: blob.type || "application/octet-stream",
      resumable: false,
    });

    console.log("[upload] Uploaded", destination);

    return NextResponse.json({
      ok: true,
      path: `gs://${bucketName}/${destination}`,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Upload failed." },
      { status: 500 }
    );
  }
}