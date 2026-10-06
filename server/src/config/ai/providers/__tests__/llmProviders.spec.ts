const createCompletion = jest.fn();
const openAiConstructor = jest.fn();

jest.mock("openai", () =>
  jest.fn().mockImplementation((options: unknown) => {
    openAiConstructor(options);
    return { chat: { completions: { create: (...args: unknown[]) => createCompletion(...args) } } };
  })
);

import type { LlmCompletionRequest } from "../types";

const request: LlmCompletionRequest = {
  messages: [
    { role: "system", content: "You are a shop assistant." },
    { role: "user", content: "Find a laptop" },
    { role: "assistant", content: "Sure" },
    { role: "user", content: "Under $1000" },
  ],
};

// Each provider caches its client at module level, so load a fresh copy per test.
function load<T>(path: string): T {
  let mod: T | undefined;
  jest.isolateModules(() => {
    mod = require(path) as T;
  });
  return mod as T;
}

describe("LLM providers", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    createCompletion.mockReset();
    openAiConstructor.mockReset();
    process.env = { ...originalEnv };
    for (const key of ["OPENAI_API_KEY", "OPENAI_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL", "LLAMA_BASE_URL", "LLAMA_API_KEY", "LLAMA_MODEL"]) {
      Reflect.deleteProperty(process.env, key);
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("openaiProvider", () => {
    type Mod = typeof import("../openaiProvider");

    it("reports configuration from OPENAI_API_KEY", () => {
      const { openaiProvider } = load<Mod>("../openaiProvider");
      expect(openaiProvider.isConfigured()).toBe(false);
      process.env.OPENAI_API_KEY = "  ";
      expect(openaiProvider.isConfigured()).toBe(false);
      process.env.OPENAI_API_KEY = "key";
      expect(openaiProvider.isConfigured()).toBe(true);
    });

    it("throws a clear error when the key is missing", async () => {
      const { openaiProvider } = load<Mod>("../openaiProvider");
      await expect(openaiProvider.completeChat(request)).rejects.toThrow("OPENAI_API_KEY is not configured.");
      expect(createCompletion).not.toHaveBeenCalled();
    });

    it("sends model, messages and defaults; trims the reply", async () => {
      process.env.OPENAI_API_KEY = "key";
      process.env.OPENAI_MODEL = "gpt-test";
      createCompletion.mockResolvedValue({ choices: [{ message: { content: "  Here you go  " } }] });
      const { openaiProvider } = load<Mod>("../openaiProvider");

      await expect(openaiProvider.completeChat(request)).resolves.toBe("Here you go");
      expect(createCompletion).toHaveBeenCalledWith({
        model: "gpt-test",
        messages: request.messages,
        temperature: 0.3,
        max_tokens: 800,
      });
    });

    it("falls back to a safe message on an empty reply and reuses the client", async () => {
      process.env.OPENAI_API_KEY = "key";
      createCompletion.mockResolvedValue({ choices: [] });
      const { openaiProvider } = load<Mod>("../openaiProvider");
      await expect(openaiProvider.completeChat({ ...request, temperature: 0, maxTokens: 10 })).resolves.toBe(
        "I could not generate a response."
      );
      await openaiProvider.completeChat(request);
      expect(openAiConstructor).toHaveBeenCalledTimes(1);
      expect(createCompletion.mock.calls[0][0]).toMatchObject({ temperature: 0, max_tokens: 10, model: "gpt-4o-mini" });
    });
  });

  describe("llamaProvider", () => {
    type Mod = typeof import("../llamaProvider");

    it("defaults to local Ollama and strips a trailing slash from LLAMA_BASE_URL", async () => {
      createCompletion.mockResolvedValue({ choices: [{ message: { content: "ok" } }] });
      let { llamaProvider } = load<Mod>("../llamaProvider");
      await llamaProvider.completeChat(request);
      expect(openAiConstructor).toHaveBeenLastCalledWith({ apiKey: "ollama", baseURL: "http://127.0.0.1:11434/v1" });
      expect(createCompletion.mock.calls[0][0].model).toBe("llama3.2");

      process.env.LLAMA_BASE_URL = "http://llm.internal:8080/v1/";
      process.env.LLAMA_API_KEY = "k";
      ({ llamaProvider } = load<Mod>("../llamaProvider"));
      await llamaProvider.completeChat(request);
      expect(openAiConstructor).toHaveBeenLastCalledWith({ apiKey: "k", baseURL: "http://llm.internal:8080/v1" });
      expect(llamaProvider.isConfigured()).toBe(true);
    });
  });

  describe("geminiProvider", () => {
    type Mod = typeof import("../geminiProvider");

    function mockFetch(response: Response) {
      const fetchMock = jest.fn().mockResolvedValue(response);
      global.fetch = fetchMock as unknown as typeof fetch;
      return fetchMock;
    }

    it("throws when GEMINI_API_KEY is missing", async () => {
      const { geminiProvider } = load<Mod>("../geminiProvider");
      expect(geminiProvider.isConfigured()).toBe(false);
      await expect(geminiProvider.completeChat(request)).rejects.toThrow("GEMINI_API_KEY is not configured.");
    });

    it("maps roles, sends the key in a header (not the URL) and joins parts", async () => {
      process.env.GEMINI_API_KEY = "gem-key";
      const fetchMock = mockFetch(
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hello " }, { text: "there " }] } }] }), {
          status: 200,
        })
      );
      const { geminiProvider } = load<Mod>("../geminiProvider");

      await expect(geminiProvider.completeChat(request)).resolves.toBe("Hello there");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent");
      expect(url).not.toContain("gem-key");
      expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("gem-key");

      const body = JSON.parse(String(init.body));
      expect(body.systemInstruction).toEqual({ parts: [{ text: "You are a shop assistant." }] });
      expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
      expect(body.generationConfig).toEqual({ temperature: 0.3, maxOutputTokens: 800 });
    });

    it("omits systemInstruction when there is no system message", async () => {
      process.env.GEMINI_API_KEY = "gem-key";
      const fetchMock = mockFetch(new Response(JSON.stringify({}), { status: 200 }));
      const { geminiProvider } = load<Mod>("../geminiProvider");
      await expect(
        geminiProvider.completeChat({ messages: [{ role: "user", content: "hi" }] })
      ).resolves.toBe("I could not generate a response.");
      expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)).systemInstruction).toBeUndefined();
    });

    it("throws a truncated error on a non-2xx response", async () => {
      process.env.GEMINI_API_KEY = "gem-key";
      mockFetch(new Response("x".repeat(500), { status: 429 }));
      const { geminiProvider } = load<Mod>("../geminiProvider");
      await expect(geminiProvider.completeChat(request)).rejects.toThrow(/^Gemini API error \(429\): x{200}$/);
    });
  });
});
