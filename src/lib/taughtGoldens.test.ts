import { describe, expect, it } from "vitest";
import { albumIsTaught, pickGolden } from "./taughtGoldens";

describe("taught goldens", () => {
  it("prefers a real JPEG over a drawing", () => {
    expect(
      pickGolden("data:image/jpeg;base64,abc", "data:image/png;base64,zzz"),
    ).toBe("data:image/jpeg;base64,abc");
  });

  it("ignores SVG client goldens", () => {
    expect(pickGolden("data:image/svg+xml;base64,abc", "data:image/png;base64,zzz")).toBe(
      "data:image/png;base64,zzz",
    );
  });

  it("knows when all five slots are taught", () => {
    const slots = ["jig", "label", "guard", "hopper", "first_piece"] as const;
    expect(albumIsTaught({ jig: "x" }, [...slots])).toBe(false);
    expect(
      albumIsTaught(
        {
          jig: "1",
          label: "2",
          guard: "3",
          hopper: "4",
          first_piece: "5",
        },
        [...slots],
      ),
    ).toBe(true);
  });
});
