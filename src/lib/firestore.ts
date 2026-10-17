import { Firestore } from "@google-cloud/firestore";
import type { StoredLine } from "./lines";
import type { AuditEntry, SlotId } from "./types";

const LINES = "lines";
const AUDIT = "audit";
const GOLDENS = "goldens";
const AUDIT_LIMIT = 40;

export interface StoredGoldenFrame {
  path: string;
  url: string;
  updatedAt: string;
}

export interface StoredGoldenAlbum {
  albumId: string;
  frames: Partial<Record<SlotId, StoredGoldenFrame>>;
  updatedAt: string;
}

let db: Firestore | null | undefined;

export function firestoreEnabled(): boolean {
  return Boolean(process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT);
}

function projectId(): string {
  return (
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ""
  );
}

export function getFirestore(): Firestore | null {
  if (db !== undefined) return db;
  if (!firestoreEnabled()) {
    db = null;
    return db;
  }
  db = new Firestore({
    projectId: projectId(),
    ignoreUndefinedProperties: true,
  });
  return db;
}

export async function listLines(): Promise<StoredLine[]> {
  const firestore = getFirestore();
  if (!firestore) return [];
  const snap = await firestore.collection(LINES).get();
  return snap.docs.map((doc) => doc.data() as StoredLine);
}

export async function upsertLine(line: StoredLine): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) {
    throw new Error("Firestore is not configured (set GCP_PROJECT_ID)");
  }
  await firestore.collection(LINES).doc(line.id).set(line, { merge: true });
}

export async function upsertLines(lines: StoredLine[]): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) {
    throw new Error("Firestore is not configured (set GCP_PROJECT_ID)");
  }
  const batch = firestore.batch();
  for (const line of lines) {
    batch.set(firestore.collection(LINES).doc(line.id), line, { merge: true });
  }
  await batch.commit();
}

export async function deleteLine(lineId: string): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) return;
  await firestore.collection(LINES).doc(lineId).delete();
}

export async function listAudit(limit = AUDIT_LIMIT): Promise<AuditEntry[]> {
  const firestore = getFirestore();
  if (!firestore) return [];
  const snap = await firestore
    .collection(AUDIT)
    .orderBy("at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => doc.data() as AuditEntry);
}

export async function appendAudit(entry: AuditEntry): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) {
    throw new Error("Firestore is not configured (set GCP_PROJECT_ID)");
  }
  await firestore.collection(AUDIT).doc(entry.id).set(entry);
}

export async function getGoldenAlbum(
  albumId: string,
): Promise<StoredGoldenAlbum | null> {
  const firestore = getFirestore();
  if (!firestore) return null;
  const doc = await firestore.collection(GOLDENS).doc(albumId).get();
  return doc.exists ? (doc.data() as StoredGoldenAlbum) : null;
}

export async function listGoldenAlbums(): Promise<StoredGoldenAlbum[]> {
  const firestore = getFirestore();
  if (!firestore) return [];
  const snap = await firestore.collection(GOLDENS).get();
  return snap.docs.map((doc) => doc.data() as StoredGoldenAlbum);
}

export async function upsertGoldenAlbum(
  album: StoredGoldenAlbum,
): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) {
    throw new Error("Firestore is not configured (set GCP_PROJECT_ID)");
  }
  await firestore.collection(GOLDENS).doc(album.albumId).set(album, {
    merge: true,
  });
}

export async function deleteGoldenAlbum(albumId: string): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) return;
  await firestore.collection(GOLDENS).doc(albumId).delete();
}
