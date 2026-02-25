import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function resolveEnvPath(): string | null {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.resourcesPath || "", ".env"),
    path.join(process.resourcesPath || "", "app.asar", ".env"),
    path.join(path.dirname(process.execPath), ".env"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

const envPath = resolveEnvPath();
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

