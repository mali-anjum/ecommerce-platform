/**
 * Product domain helpers (parsing, listings, detail, categories).
 * Controllers stay thin; mutations (create/update/upload) remain in the controller
 * where they are tightly coupled to multer and request bodies.
 */
export * from "./parsing";
export * from "./adminList";
export * from "./detail";
export * from "./clientListing";
export * from "./categories";
