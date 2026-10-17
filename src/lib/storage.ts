import { Storage } from "@google-cloud/storage";

let storage: Storage | null | undefined;

export function storageEnabled(): boolean {
  return Boolean(process.env.GCS_BUCKET);
}

export function bucketName(): string {
  return process.env.GCS_BUCKET || "";
}

function projectId(): string {
  return (
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ""
  );
}

export function getStorage(): Storage | null {
  if (storage !== undefined) return storage;
  if (!storageEnabled()) {
    storage = null;
    return storage;
  }
  storage = new Storage({
    projectId: projectId() || undefined,
  });
  return storage;
}

export function parseDataUrl(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
  ext: string;
} {
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Expected a base64 data URL");
  }
  const contentType = match[1] || "image/jpeg";
  const buffer = Buffer.from(match[2], "base64");
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
  return { buffer, contentType, ext };
}

export function goldenObjectPath(
  albumId: string,
  slotId: string,
  ext: string,
): string {
  return `goldens/${albumId}/${slotId}.${ext}`;
}

export function captureObjectPath(
  albumId: string,
  batchId: string,
  slotId: string,
  ext: string,
): string {
  return `captures/${albumId}/${batchId}/${slotId}.${ext}`;
}

export function publicMediaUrl(objectPath: string): string {
  return `/api/media?path=${encodeURIComponent(objectPath)}`;
}

export async function uploadBuffer(input: {
  objectPath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ path: string; url: string }> {
  const client = getStorage();
  const name = bucketName();
  if (!client || !name) {
    throw new Error("GCS is not configured (set GCS_BUCKET)");
  }
  const file = client.bucket(name).file(input.objectPath);
  await file.save(input.buffer, {
    contentType: input.contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=3600",
    },
  });
  return {
    path: input.objectPath,
    url: publicMediaUrl(input.objectPath),
  };
}

export async function downloadObject(
  objectPath: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const client = getStorage();
  const name = bucketName();
  if (!client || !name) {
    throw new Error("GCS is not configured (set GCS_BUCKET)");
  }
  if (
    !objectPath.startsWith("goldens/") &&
    !objectPath.startsWith("captures/")
  ) {
    throw new Error("Invalid object path");
  }
  const file = client.bucket(name).file(objectPath);
  const [buffer] = await file.download();
  const [metadata] = await file.getMetadata();
  return {
    buffer,
    contentType: metadata.contentType || "image/jpeg",
  };
}

export async function deletePrefix(prefix: string): Promise<void> {
  const client = getStorage();
  const name = bucketName();
  if (!client || !name) return;
  await client.bucket(name).deleteFiles({ prefix, force: true });
}

/** Turn a data URL or /api/media?path=… reference into a Gemini-ready data URL. */
export async function resolveToDataUrl(
  value?: string | null,
): Promise<string | undefined> {
  if (!value) return undefined;
  if (value.startsWith("data:")) return value;
  let objectPath: string | null = null;
  if (value.startsWith("/api/media?")) {
    objectPath = new URL(value, "http://local").searchParams.get("path");
  } else if (
    value.startsWith("goldens/") ||
    value.startsWith("captures/")
  ) {
    objectPath = value;
  }
  if (!objectPath) return undefined;
  const { buffer, contentType } = await downloadObject(objectPath);
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
