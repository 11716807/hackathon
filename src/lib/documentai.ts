import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { parseDataUrl } from "./storage";

let client: DocumentProcessorServiceClient | null | undefined;

export function documentAiEnabled(): boolean {
  return Boolean(process.env.DOCUMENT_AI_PROCESSOR && projectId());
}

function projectId(): string {
  return (
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ""
  );
}

export function documentAiLocation(): string {
  return process.env.DOCUMENT_AI_LOCATION || "us";
}

export function documentAiProcessorId(): string {
  return process.env.DOCUMENT_AI_PROCESSOR || "";
}

/** Full resource name: projects/.../locations/.../processors/... */
export function processorResourceName(): string {
  const id = documentAiProcessorId();
  if (id.startsWith("projects/")) return id;
  return `projects/${projectId()}/locations/${documentAiLocation()}/processors/${id}`;
}

export function getDocumentAiClient(): DocumentProcessorServiceClient | null {
  if (client !== undefined) return client;
  if (!documentAiEnabled()) {
    client = null;
    return client;
  }
  const location = documentAiLocation();
  client = new DocumentProcessorServiceClient({
    apiEndpoint: `${location}-documentai.googleapis.com`,
    projectId: projectId() || undefined,
  });
  return client;
}

export function textFromDocument(document: {
  text?: string | null;
} | null | undefined): string {
  return (document?.text ?? "").replace(/\s+/g, " ").trim();
}

/**
 * OCR a single label image. Returns empty string when Document AI is off.
 * Throws on API errors so callers can fall back to Gemini text.
 */
export async function ocrLabelText(dataUrl: string): Promise<string> {
  if (!documentAiEnabled()) return "";
  const api = getDocumentAiClient();
  if (!api) return "";

  const { buffer, contentType } = parseDataUrl(dataUrl);
  const mimeType =
    contentType.startsWith("image/") || contentType === "application/pdf"
      ? contentType
      : "image/jpeg";

  const [result] = await api.processDocument({
    name: processorResourceName(),
    rawDocument: {
      content: buffer.toString("base64"),
      mimeType,
    },
  });

  return textFromDocument(result.document);
}
