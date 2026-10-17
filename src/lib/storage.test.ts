import { describe, expect, it } from "vitest";
import { goldenObjectPath, parseDataUrl, storageEnabled } from "./storage";

describe("storage helpers", () => {
  it("parses a tiny PNG data URL", () => {
    const tiny =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const parsed = parseDataUrl(tiny);
    expect(parsed.contentType).toBe("image/png");
    expect(parsed.ext).toBe("png");
    expect(parsed.buffer.length).toBeGreaterThan(0);
  });

  it("builds golden object paths", () => {
    expect(goldenObjectPath("line-1", "label", "jpg")).toBe(
      "goldens/line-1/label.jpg",
    );
  });

  it("reports disabled without GCS_BUCKET", () => {
    const prev = process.env.GCS_BUCKET;
    delete process.env.GCS_BUCKET;
    expect(storageEnabled()).toBe(false);
    if (prev) process.env.GCS_BUCKET = prev;
  });
});
