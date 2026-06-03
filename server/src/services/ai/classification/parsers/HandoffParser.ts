const HUMAN_HANDOFF_TRIGGERS =
  /\b(talk to agent|speak to agent|human agent|real person|live agent|customer service agent|connect me to support|transfer to human|speak to someone|talk to someone|human support|live support|real support|agent please|need an agent)\b/i;

export function isHumanHandoffTrigger(message: string): boolean {
  return HUMAN_HANDOFF_TRIGGERS.test(message.trim());
}

export const REPEATED_FAILURE_THRESHOLD = 3;

export function isAssistantFailureReply(reply: string): boolean {
  const normalized = reply.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("i could not generate a response") ||
    normalized.includes("assistant is not configured") ||
    normalized.includes("please try again later")
  );
}
