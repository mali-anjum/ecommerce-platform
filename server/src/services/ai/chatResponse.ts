import type { AssistantChatResult, ClassifiedIntent } from "./types";

/** API payload exposed to clients (single intent model). */
export type PublicAssistantChatPayload = Omit<
  AssistantChatResult,
  "intent"
> & {
  classifiedIntent: ClassifiedIntent;
};

export function toPublicChatPayload(
  result: AssistantChatResult,
): PublicAssistantChatPayload {
  const { intent: _legacy, ...rest } = result;
  return {
    ...rest,
    classifiedIntent: result.classifiedIntent,
  };
}

/** Whether analytics/logs should treat intent as product search. */
export function isProductSearchIntent(intent: string): boolean {
  return intent === "PRODUCT_SEARCH" || intent === "product_recommendation";
}
