import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('CLI --branch option', () => {
  it('accepts --branch option', () => {
    const stdout = execSync('node src/index.js --help', { encoding: 'utf8', timeout: 5000 });
    expect(stdout).toContain('-b, --branch <branch>');
  });
});
