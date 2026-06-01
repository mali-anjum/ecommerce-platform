const LEAD_CAPTURE_TRIGGERS =
  /\b(i want to buy|i'd like to buy|contact me|call me back|get in touch|reach out|speak to sales|talk to sales|pricing\??|price quote|get a quote|request a quote|interested in buying|ready to buy|place an order|bulk order|wholesale)\b/i;

const SKIP_PHONE = /\b(skip|no phone|none|n\/a|not applicable)\b/i;

export function isLeadCaptureTrigger(message: string): boolean {
  return LEAD_CAPTURE_TRIGGERS.test(message.trim());
}

export function extractEmail(message: string): string | null {
  const match = message.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  );
  return match?.[0].toLowerCase() ?? null;
}

export function extractPhone(message: string): string | null {
  if (SKIP_PHONE.test(message)) {
    return null;
  }

  const digits = message.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length <= 15) {
    return message.trim();
  }

  return null;
}

export function isSkipPhoneMessage(message: string): boolean {
  return SKIP_PHONE.test(message.trim());
}
