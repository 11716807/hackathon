import { describe, expect, it } from "vitest";
import { ALBUMS } from "./catalog";
import { cloneLine, newSlot, resolveAlbums } from "./lines";

describe("custom lines", () => {
  it("adds a packing line with copied frame labels", () => {
    const line = cloneLine({
      name: "Line 4",
      sku: "A18",
      templateId: "line3-a17",
    });
    const packaging = ALBUMS.find((album) => album.id === "line3-a17");
    expect(line.lineName).toBe("Line 4");
    expect(line.slots.map((slot) => slot.titleEn)).toEqual(
      packaging?.slots.map((slot) => slot.titleEn),
    );
    expect(resolveAlbums([line]).some((album) => album.id === line.id)).toBe(
      true,
    );
  });

  it("starts an empty line with one named frame", () => {
    const line = cloneLine({ name: "Line 5", sku: "B1" });
    expect(line.slots).toHaveLength(1);
    expect(line.slots[0].titleEn).toBe("Frame 1");
  });

  it("creates extra frames with custom labels", () => {
    const slot = newSlot("Hopper lid");
    expect(slot.titleEn).toBe("Hopper lid");
    expect(slot.id.startsWith("slot-")).toBe(true);
  });
});
