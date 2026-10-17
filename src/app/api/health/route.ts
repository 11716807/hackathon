import { NextResponse } from "next/server";
import {
  documentAiEnabled,
  documentAiLocation,
  documentAiProcessorId,
  getDocumentAiClient,
  processorResourceName,
} from "@/lib/documentai";
import { firestoreEnabled, getFirestore } from "@/lib/firestore";
import { bucketName, getStorage, storageEnabled } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  let firestore: "off" | "ok" | "error" = "off";
  if (firestoreEnabled()) {
    try {
      const db = getFirestore();
      if (db) {
        await db.collection("lines").limit(1).get();
        firestore = "ok";
      }
    } catch {
      firestore = "error";
    }
  }

  let storage: "off" | "ok" | "error" = "off";
  if (storageEnabled()) {
    try {
      const client = getStorage();
      if (client) {
        const [exists] = await client.bucket(bucketName()).exists();
        storage = exists ? "ok" : "error";
      }
    } catch {
      storage = "error";
    }
  }

  let documentai: "off" | "ok" | "error" = "off";
  if (documentAiEnabled()) {
    try {
      const api = getDocumentAiClient();
      if (api) {
        await api.getProcessor({ name: processorResourceName() });
        documentai = "ok";
      }
    } catch {
      documentai = "error";
    }
  }

  return NextResponse.json({
    ok: true,
    service: "golden-frame",
    gemini: Boolean(process.env.GEMINI_API_KEY),
    firestore,
    storage,
    documentai,
    bucket: storageEnabled() ? bucketName() : null,
    documentAiProcessor: documentAiEnabled() ? documentAiProcessorId() : null,
    documentAiLocation: documentAiEnabled() ? documentAiLocation() : null,
    project: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null,
  });
}
