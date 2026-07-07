import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.terminal-agent');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface AppConfig {
  apiKeys?: {
    [provider: string]: string;
  };
  activeProvider?: string;
  activeVariant?: string;
}

export function getConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore errors and return empty config
  }
  return {};
}

export function saveConfig(config: AppConfig) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getApiKey(provider: string): string | undefined {
  const config = getConfig();
  return config.apiKeys?.[provider];
}

export function saveApiKey(provider: string, key: string) {
  const config = getConfig();
  if (!config.apiKeys) config.apiKeys = {};
  config.apiKeys[provider] = key;
  saveConfig(config);
}

export function getSavedProvider(): string {
  const config = getConfig();
  return config.activeProvider || 'deepseek';
}

export function saveActiveProvider(provider: string) {
  const config = getConfig();
  config.activeProvider = provider;
  saveConfig(config);
}

export function getSavedVariant(): string {
  const config = getConfig();
  return config.activeVariant || 'deepseek-chat';
}

export function saveActiveVariant(variant: string) {
  const config = getConfig();
  config.activeVariant = variant;
  saveConfig(config);
}
