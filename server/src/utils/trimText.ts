/** Trims string input; other values pass through unchanged (undefined keeps "no update" semantics). */
export const trimText = <T>(value: T): T | string =>
  typeof value === "string" ? value.trim() : value;
