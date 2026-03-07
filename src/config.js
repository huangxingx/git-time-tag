import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

const DEFAULT_CONFIG = {
  tagFormat: 'v_{datetime}_{suffix}',
  datetimeFormat: 'yyyyMMddHHmm',
  suffixes: ['test', 'main'],
};

const CONFIG_FILENAME = '.dotagrc';

export async function loadConfig() {
  const localConfigPath = path.join(process.cwd(), CONFIG_FILENAME);
  const globalConfigPath = path.join(homedir(), CONFIG_FILENAME);

  let config = { ...DEFAULT_CONFIG };

  // Try loading global config
  try {
    const globalData = await fs.readFile(globalConfigPath, 'utf-8');
    config = { ...config, ...JSON.parse(globalData) };
  } catch (e) {
    // Ignore if not found
  }

  // Try loading local config (overrides global)
  try {
    const localData = await fs.readFile(localConfigPath, 'utf-8');
    config = { ...config, ...JSON.parse(localData) };
  } catch (e) {
    // Ignore if not found
  }

  return config;
}
