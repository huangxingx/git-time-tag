import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

const DEFAULT_CONFIG = {
  tagFormat: 'v_{datetime}_{suffix}',
  datetimeFormat: 'yyyyMMddHHmm',
  suffixes: ['test', 'main'],
};

const CONFIG_FILENAME = '.gitimetagrc';

const VALID_CONFIG_KEYS = ['tagFormat', 'datetimeFormat', 'suffixes'];

function validateConfig(config) {
  const errors = [];

  // Validate suffixes
  if (!Array.isArray(config.suffixes) || config.suffixes.length === 0) {
    errors.push('suffixes must be a non-empty array');
  } else if (!config.suffixes.every(s => typeof s === 'string')) {
    errors.push('suffixes must be an array of strings');
  }

  // Validate tagFormat
  if (typeof config.tagFormat !== 'string') {
    errors.push('tagFormat must be a string');
  } else if (!config.tagFormat.includes('{suffix}')) {
    errors.push('tagFormat must include {suffix} placeholder');
  }

  // Validate datetimeFormat
  if (typeof config.datetimeFormat !== 'string') {
    errors.push('datetimeFormat must be a string');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid config: ${errors.join('; ')}`);
  }

  return config;
}

function sanitizeConfig(parsed) {
  const safeConfig = {};
  for (const key of VALID_CONFIG_KEYS) {
    if (key in parsed) {
      safeConfig[key] = parsed[key];
    }
  }
  return safeConfig;
}

export async function loadConfig() {
  const localConfigPath = path.join(process.cwd(), CONFIG_FILENAME);
  const globalConfigPath = path.join(homedir(), CONFIG_FILENAME);

  let config = { ...DEFAULT_CONFIG };

  // Try loading global config
  try {
    const globalData = await fs.readFile(globalConfigPath, 'utf-8');
    const parsed = JSON.parse(globalData);
    config = { ...config, ...sanitizeConfig(parsed) };
  } catch (e) {
    // Ignore if not found or invalid
    if (e.code !== 'ENOENT' && !(e instanceof SyntaxError)) {
      console.warn(`Warning: Could not read global config: ${e.message}`);
    }
  }

  // Try loading local config (overrides global)
  try {
    const localData = await fs.readFile(localConfigPath, 'utf-8');
    const parsed = JSON.parse(localData);
    config = { ...config, ...sanitizeConfig(parsed) };
  } catch (e) {
    // Ignore if not found or invalid
    if (e.code !== 'ENOENT' && !(e instanceof SyntaxError)) {
      console.warn(`Warning: Could not read local config: ${e.message}`);
    }
  }

  return validateConfig(config);
}
