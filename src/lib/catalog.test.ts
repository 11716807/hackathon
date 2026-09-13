import { describe, expect, it } from "vitest";
import { ALBUMS, goldenPath, requireAlbum } from "./catalog";

describe("catalog", () => {
  it("ships two industries with the same five-slot gate", () => {
    expect(ALBUMS).toHaveLength(2);
    for (const album of ALBUMS) {
      expect(album.slots.map((slot) => slot.id)).toEqual([
        "jig",
        "label",
        "guard",
        "hopper",
        "first_piece",
      ]);
      expect(goldenPath(album, "label")).toContain(album.id);
    }
  });

  it("throws on an unknown album", () => {
    expect(() => requireAlbum("missing")).toThrow(/Unknown album/);
  });
});
