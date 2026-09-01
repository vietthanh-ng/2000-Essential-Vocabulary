import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "user-config.json");

interface UserConfig {
  geminiApiKey?: string;
  geminiApiKeys?: string[];
  defaultVoice?: string;
  dailyGoal?: number;
  speechRate?: number;
}

export function getUserConfig(): UserConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading user config:", e);
  }
  return {};
}

export function saveUserConfig(newConfig: Partial<UserConfig>): UserConfig {
  const current = getUserConfig();
  const updated: UserConfig = { ...current, ...newConfig };

  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
    if (updated.geminiApiKey) {
      process.env.GEMINI_API_KEY = updated.geminiApiKey;
    }
  } catch (e) {
    console.error("Error saving user config:", e);
  }

  return updated;
}
