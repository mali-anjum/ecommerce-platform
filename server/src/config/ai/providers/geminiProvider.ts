import type { LlmChatMessage, LlmCompletionRequest, LlmProvider } from "./types";

const DEFAULT_MODEL = "gemini-2.0-flash";

function buildGeminiContents(messages: LlmChatMessage[]) {
  const systemParts = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content);
  const systemInstruction =
    systemParts.length > 0 ? { parts: [{ text: systemParts.join("\n\n") }] } : undefined;

  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  return { systemInstruction, contents };
}

export const geminiProvider: LlmProvider = {
  id: "gemini",

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  },

  getModel(): string {
    return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  },

  async completeChat(request: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const model = geminiProvider.getModel();
    const { systemInstruction, contents } = buildGeminiContents(request.messages);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction,
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.3,
          maxOutputTokens: request.maxTokens ?? 800,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    return text || "I could not generate a response.";
  },
};
