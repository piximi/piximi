/* SHA-256 over the sorted lines, as hex. */
export const hashLines = async (lines: string[]): Promise<string> => {
  const data = new TextEncoder().encode([...lines].sort().join("\n"));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/*
 * Identifies a training or validation set by what is in it and how it is
 * labeled, so a later run can tell whether the data changed. Every backend
 * computes the same value for the same set.
 */
export const fingerprintItems = (
  items: Array<{ id: string; categoryId: string }>,
): Promise<string> =>
  hashLines(items.map((item) => `${item.id}:${item.categoryId}`));

/* Identifies a target's set of categories, for the same purpose. */
export const hashCategorySet = (categoryIds: string[]): Promise<string> =>
  hashLines(categoryIds);
