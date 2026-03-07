import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { homedir } from 'os';
import path from 'path';

vi.mock('fs/promises');
vi.mock('os');
vi.mock('path');

describe('config', () => {
  let loadConfig;

  beforeEach(async () => {
    vi.resetModules();
    const config = await import('../src/config.js');
    loadConfig = config.loadConfig;
  });

  it('should return default config when no config files exist', async () => {
    const mockReadFile = vi.fn().mockRejectedValue({ code: 'ENOENT' });
    fs.readFile = mockReadFile;

    const config = await loadConfig();

    expect(config).toEqual({
      tagFormat: 'v_{datetime}_{suffix}',
      datetimeFormat: 'yyyyMMddHHmm',
      suffixes: ['test', 'main'],
    });
  });

  it('should merge global and local config, with local taking precedence', async () => {
    const mockReadFile = vi.fn()
      .mockResolvedValueOnce(JSON.stringify({ suffixes: ['global'] }))
      .mockResolvedValueOnce(JSON.stringify({ suffixes: ['local'] }));
    fs.readFile = mockReadFile;

    const config = await loadConfig();

    expect(config.suffixes).toEqual(['local']);
  });

  it('should sanitize unknown config keys', async () => {
    const mockReadFile = vi.fn().mockResolvedValue(
      JSON.stringify({ unknownKey: 'value', suffixes: ['test'] })
    );
    fs.readFile = mockReadFile;

    const config = await loadConfig();

    expect(config.unknownKey).toBeUndefined();
    expect(config.suffixes).toEqual(['test']);
  });

  it('should reject empty suffixes array', async () => {
    const mockReadFile = vi.fn().mockResolvedValue(JSON.stringify({ suffixes: [] }));
    fs.readFile = mockReadFile;

    await expect(loadConfig()).rejects.toThrow('suffixes must be a non-empty array');
  });

  it('should reject tagFormat without {suffix} placeholder', async () => {
    const mockReadFile = vi.fn().mockResolvedValue(JSON.stringify({ tagFormat: 'invalid' }));
    fs.readFile = mockReadFile;

    await expect(loadConfig()).rejects.toThrow('tagFormat must include {suffix} placeholder');
  });
});
