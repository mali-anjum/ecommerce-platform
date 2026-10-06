import {
  formatDateTime,
  formatEstimatedDeliveryDate,
  formatOrderStatus,
  formatTimelineDate,
} from "../formatDates";

describe("formatDates", () => {
  it("humanizes order statuses", () => {
    expect(formatOrderStatus("PENDING_PAYMENT")).toBe("Pending Payment");
    expect(formatOrderStatus("DELIVERED")).toBe("Delivered");
    expect(formatOrderStatus("")).toBe("");
  });

  it("returns empty strings for invalid timestamps instead of 'Invalid Date'", () => {
    expect(formatTimelineDate("nope")).toBe("");
    expect(formatDateTime("nope")).toBe("");
    expect(formatEstimatedDeliveryDate("nope")).toBeNull();
    expect(formatEstimatedDeliveryDate(null)).toBeNull();
  });

  it("formats valid timestamps in en-US", () => {
    const iso = "2026-06-01T12:00:00Z";
    expect(formatDateTime(iso)).toContain("2026");
    expect(formatTimelineDate(iso)).not.toContain("2026");
    expect(formatTimelineDate(iso)).toMatch(/Jun/);
    expect(formatEstimatedDeliveryDate(iso)).toMatch(/^[A-Z][a-z]{2}, Jun \d{1,2}$/);
  });
});
