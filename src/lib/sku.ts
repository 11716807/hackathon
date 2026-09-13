const SKU_PATTERN = /\b[A-Z]{1,4}-?\d{2,6}[A-Z]?\b/g;

export function normalizeSku(value: string): string {
  return value.toUpperCase().replace(/[\s_]+/g, "").replace(/-+/g, "-");
}

export function extractSkuTokens(text: string): string[] {
  const upper = text.toUpperCase();
  const matches = upper.match(SKU_PATTERN) ?? [];
  const compact = new Set<string>();
  for (const match of matches) {
    compact.add(match.replace(/-+/g, "-"));
    compact.add(match.replace(/-/g, ""));
  }
  return [...compact];
}

export function skuMatchesWorkOrder(
  workOrderSku: string,
  extractedText: string,
): boolean {
  if (!extractedText.trim()) return false;
  const expected = normalizeSku(workOrderSku);
  const expectedBare = expected.replace(/-/g, "");
  const haystack = normalizeSku(extractedText);
  if (haystack.includes(expected) || haystack.includes(expectedBare)) {
    return true;
  }
  const tokens = extractSkuTokens(extractedText);
  return tokens.some(
    (token) =>
      token === expected ||
      token.replace(/-/g, "") === expectedBare,
  );
}

export function primaryExtractedSku(extractedText: string): string | undefined {
  const tokens = extractSkuTokens(extractedText);
  return tokens.find((token) => token.includes("-")) ?? tokens[0];
}
