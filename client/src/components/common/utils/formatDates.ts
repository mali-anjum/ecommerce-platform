const LOCALE = "en-US";

/** Order/event status: `PENDING_PAYMENT` → `Pending Payment` */
export function formatOrderStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Compact datetime for timelines and recent activity (no year). */
export function formatTimelineDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Admin tables: date + time with year. */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Estimated delivery ETA: `Mon, Jun 1` */
export function formatEstimatedDeliveryDate(
  value: string | null,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
