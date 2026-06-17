import fs from "fs";
import os from "os";
import path from "path";
import {
  getLlmProviderId,
  resetLlmProviderCache,
} from "../llmConfig";

describe("getLlmProviderId", () => {
  let tempDir: string;
  let configPath: string;
  const previousEnv = process.env.FEATURE_FLAGS_CONFIG_PATH;

  beforeEach(() => {
    resetLlmProviderCache();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-config-"));
    configPath = path.join(tempDir, "feature-flags.config.json");
    process.env.FEATURE_FLAGS_CONFIG_PATH = configPath;
  });

  afterEach(() => {
    resetLlmProviderCache();
    if (previousEnv === undefined) {
      delete process.env.FEATURE_FLAGS_CONFIG_PATH;
    } else {
      process.env.FEATURE_FLAGS_CONFIG_PATH = previousEnv;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeConfig(ai: { llmProvider?: string }) {
    fs.writeFileSync(
      configPath,
      JSON.stringify({ ai, flags: {} }),
      "utf-8",
    );
    resetLlmProviderCache();
  }

  it("defaults to openai when ai.llmProvider is missing", () => {
    writeConfig({});
    expect(getLlmProviderId()).toBe("openai");
  });

  it("reads gemini from config", () => {
    writeConfig({ llmProvider: "gemini" });
    expect(getLlmProviderId()).toBe("gemini");
  });

  it("reads llama case-insensitively", () => {
    writeConfig({ llmProvider: "LLAMA" });
    expect(getLlmProviderId()).toBe("llama");
  });

  it("falls back to openai for unknown provider values", () => {
    writeConfig({ llmProvider: "anthropic" });
    expect(getLlmProviderId()).toBe("openai");
  });
});
