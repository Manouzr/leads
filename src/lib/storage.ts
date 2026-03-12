import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

export function readJson<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    writeJson(filename, defaultValue);
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

export function writeJson<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = getFilePath(filename);
  // Write to a temp file first, then rename (atomic write)
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}
