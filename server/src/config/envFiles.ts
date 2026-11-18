import fs from "fs";
import path from "path";
import dotenv from "dotenv";

export function getCandidateEnvFiles(nodeEnv = process.env.NODE_ENV): string[] {
  const runtimeEnv = nodeEnv ?? "development";

  if (runtimeEnv === "production") return [".env.production", ".env"];
  if (runtimeEnv === "test") return [".env.test", ".env"];
  return [".env.local", ".env"];
}

export function loadEnvFiles(baseDir = process.cwd()): void {
  for (const file of getCandidateEnvFiles()) {
    const envPath = path.resolve(baseDir, file);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false, quiet: true });
    }
  }
}
