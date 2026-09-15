import { describe, expect, it } from "vitest";
import { t } from "./i18n";

describe("i18n", () => {
  it("keeps industrial verbs in both languages", () => {
    expect(t("en", "notClear")).toBe("Not clear to run");
    expect(t("hi", "hold")).toBe("होल्ड");
    expect(t("en", "startCheck")).toMatch(/changeover/i);
    expect(t("en", "faqThemeQ")).toMatch(/manufacturing/i);
  });
});
