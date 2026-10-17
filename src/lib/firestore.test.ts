import { describe, expect, it } from "vitest";
import { firestoreEnabled } from "./firestore";

describe("firestore config", () => {
  it("reports disabled without a GCP project id", () => {
    const prev = process.env.GCP_PROJECT_ID;
    const prevG = process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    expect(firestoreEnabled()).toBe(false);
    if (prev) process.env.GCP_PROJECT_ID = prev;
    if (prevG) process.env.GOOGLE_CLOUD_PROJECT = prevG;
  });
});
