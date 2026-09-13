import { describe, expect, it } from "vitest";
import { normalizeExtractions, parseDataUrl } from "./gemini";

describe("gemini helpers", () => {
  it("parses a jpeg data URL", () => {
    const parsed = parseDataUrl("data:image/jpeg;base64,abc");
    expect(parsed.mimeType).toBe("image/jpeg");
    expect(parsed.data).toBe("abc");
  });

  it("drops unknown slots and clamps confidence", () => {
    const rows = normalizeExtractions({
      slots: [
        {
          slotId: "label",
          extractedText: "A-22",
          flags: ["label_present", "not_a_flag"],
          visualSummary: "x",
          confidence: 4,
        },
        { slotId: "unknown", extractedText: "x" },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].flags).toEqual(["label_present"]);
    expect(rows[0].confidence).toBe(1);
  });
});
