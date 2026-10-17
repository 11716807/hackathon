import { describe, expect, it } from "vitest";
import {
  documentAiEnabled,
  processorResourceName,
  textFromDocument,
} from "./documentai";

describe("documentai helpers", () => {
  it("normalizes OCR whitespace", () => {
    expect(textFromDocument({ text: "  A-17\nBLUE  " })).toBe("A-17 BLUE");
    expect(textFromDocument(null)).toBe("");
  });

  it("builds processor resource names", () => {
    const prevP = process.env.GCP_PROJECT_ID;
    const prevId = process.env.DOCUMENT_AI_PROCESSOR;
    const prevLoc = process.env.DOCUMENT_AI_LOCATION;
    process.env.GCP_PROJECT_ID = "demo-project";
    process.env.DOCUMENT_AI_PROCESSOR = "abc123";
    process.env.DOCUMENT_AI_LOCATION = "us";
    expect(processorResourceName()).toBe(
      "projects/demo-project/locations/us/processors/abc123",
    );
    process.env.DOCUMENT_AI_PROCESSOR =
      "projects/demo-project/locations/us/processors/full";
    expect(processorResourceName()).toBe(
      "projects/demo-project/locations/us/processors/full",
    );
    if (prevP) process.env.GCP_PROJECT_ID = prevP;
    else delete process.env.GCP_PROJECT_ID;
    if (prevId) process.env.DOCUMENT_AI_PROCESSOR = prevId;
    else delete process.env.DOCUMENT_AI_PROCESSOR;
    if (prevLoc) process.env.DOCUMENT_AI_LOCATION = prevLoc;
    else delete process.env.DOCUMENT_AI_LOCATION;
  });

  it("reports disabled without processor id", () => {
    const prev = process.env.DOCUMENT_AI_PROCESSOR;
    delete process.env.DOCUMENT_AI_PROCESSOR;
    expect(documentAiEnabled()).toBe(false);
    if (prev) process.env.DOCUMENT_AI_PROCESSOR = prev;
  });
});
