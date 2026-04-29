/**
 * Order domain: queries, fulfillment after payment, and write helpers.
 * Prefer plain functions over a god-class — easier to test and tree-shake.
 */
export * from "./query";
export * from "./fulfillment";
export * from "./write";
