import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

const DEFAULT_CONFIG = {
  tagFormat: 'v_{datetime}_{suffix}',
  datetimeFormat: 'yyyyMMddHHmm',
  suffixes: ['test', 'main'],
  mainBranches: ['main', 'master', 'develop'],
};

const CONFIG_FILENAME = '.gitimetagrc';

const VALID_CONFIG_KEYS = ['tagFormat', 'datetimeFormat', 'suffixes', 'mainBranches'];

function validateConfig(config) {
  const errors = [];

  // Validate suffixes
  if (!Array.isArray(config.suffixes) || config.suffixes.length === 0) {
    errors.push('suffixes 必须是非空数组');
  } else if (!config.suffixes.every(s => typeof s === 'string')) {
    errors.push('suffixes 必须是字符串数组');
  }

  // Validate tagFormat
  if (typeof config.tagFormat !== 'string') {
    errors.push('tagFormat 必须是字符串');
  } else if (!config.tagFormat.includes('{suffix}')) {
    errors.push('tagFormat 必须包含 {suffix} 占位符');
  }

  // Validate datetimeFormat
  if (typeof config.datetimeFormat !== 'string') {
    errors.push('datetimeFormat 必须是字符串');
  }

  // Validate mainBranches
  if (config.mainBranches !== undefined) {
    if (!Array.isArray(config.mainBranches) || config.mainBranches.length === 0) {
      errors.push('mainBranches 必须是非空数组');
    } else if (!config.mainBranches.every(b => typeof b === 'string')) {
      errors.push('mainBranches 必须是字符串数组');
    }
  }

  if (errors.length > 0) {
    throw new Error(`配置无效：${errors.join('; ')}`);
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

export async function saveConfig(updates, scope = 'local') {
  const configPath = scope === 'local'
    ? path.join(process.cwd(), CONFIG_FILENAME)
    : path.join(homedir(), CONFIG_FILENAME);

  let existingConfig = {};

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    existingConfig = JSON.parse(data);
  } catch (e) {
    if (e.code !== 'ENOENT' && !(e instanceof SyntaxError)) {
      throw e;
    }
  }

  const mergedConfig = { ...existingConfig, ...updates };
  const fullConfig = { ...DEFAULT_CONFIG, ...mergedConfig };
  validateConfig(fullConfig);

  await fs.writeFile(configPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');

  return configPath;
}
