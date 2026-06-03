import fs from "fs";
import {
  isFeatureEnabled,
  isModuleEnabled,
  resetFeatureFlagsCache,
  resolveFeatureFlagsConfigPath,
} from "../index";

describe("featureFlags", () => {
  let configPath: string;

  beforeEach(() => {
    resetFeatureFlagsCache();
    configPath = resolveFeatureFlagsConfigPath();
  });

  it("loads bundled or synced config", () => {
    expect(fs.existsSync(configPath)).toBe(true);
    expect(isModuleEnabled("ai")).toBe(true);
    expect(isFeatureEnabled("ai.chat")).toBe(true);
  });

  it("blocks child flags when module master is off", () => {
    const original = fs.readFileSync(configPath, "utf-8");
    try {
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          flags: {
            "ai.enabled": false,
            "ai.chat": true,
          },
        }),
        "utf-8",
      );
      resetFeatureFlagsCache();
      expect(isModuleEnabled("ai")).toBe(false);
      expect(isFeatureEnabled("ai.chat")).toBe(false);
    } finally {
      fs.writeFileSync(configPath, original, "utf-8");
      resetFeatureFlagsCache();
    }
  });

  it("returns false for keys not in SERVER_FLAG_DEFAULTS (client-only flags)", () => {
    expect(isFeatureEnabled("ai.assistant.widget")).toBe(false);
  });

  it("uses SERVER_FLAG_DEFAULTS for flags omitted from config file", () => {
    const original = fs.readFileSync(configPath, "utf-8");
    try {
      fs.writeFileSync(
        configPath,
        JSON.stringify({ flags: { "ai.enabled": true } }),
        "utf-8",
      );
      resetFeatureFlagsCache();
      expect(isFeatureEnabled("ai.chat")).toBe(true);
    } finally {
      fs.writeFileSync(configPath, original, "utf-8");
      resetFeatureFlagsCache();
    }
  });
});
