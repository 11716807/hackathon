import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadGoldenDataUrl, svgBufferToPngDataUrl } from "./goldens";

describe("golden frames for Gemini", () => {
  it("converts SVG album art to a PNG data URL", async () => {
    const svg = await readFile(
      path.join(process.cwd(), "public/goldens/line3-a17/label.svg"),
    );
    const dataUrl = await svgBufferToPngDataUrl(svg);
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(80);
  });

  it("loads a slot golden as PNG, never SVG", async () => {
    const dataUrl = await loadGoldenDataUrl("line3-a17", "label");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
