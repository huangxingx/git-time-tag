import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('simple-git');

import { simpleGit } from 'simple-git';
import { fetchPrune } from '../src/git.js';

describe('getBranchesWithTime', () => {
  let mockGit;
  let git;

  beforeEach(async () => {
    vi.resetModules();

    mockGit = {
      raw: vi.fn(),
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  it('returns list of remote branches with time info', async () => {
    mockGit.raw.mockResolvedValue(
      'origin/main 2 days ago\norigin/feature-x 1 hour ago\norigin/develop 3 weeks ago'
    );

    const result = await git.getBranchesWithTime();
    expect(result).toEqual([
      { name: 'main', timeInfo: '2 days ago' },
      { name: 'feature-x', timeInfo: '1 hour ago' },
      { name: 'develop', timeInfo: '3 weeks ago' },
    ]);
  });

  it('handles empty remote branches', async () => {
    mockGit.raw.mockResolvedValue('');
    const result = await git.getBranchesWithTime();
    expect(result).toEqual([]);
  });
});

describe('getCommitHash', () => {
  let mockGit;
  let git;

  beforeEach(async () => {
    vi.resetModules();

    mockGit = {
      revparse: vi.fn(),
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  it('returns commit SHA for valid branch', async () => {
    mockGit.revparse.mockResolvedValue('abc123def456');

    const result = await git.getCommitHash('origin/main');
    expect(result).toBe('abc123def456');
    expect(mockGit.revparse).toHaveBeenCalledWith(['origin/main']);
  });

  it('throws error for non-existent branch', async () => {
    mockGit.revparse.mockRejectedValue(
      new Error('fatal: ambiguous argument')
    );

    await expect(git.getCommitHash('origin/nonexistent'))
      .rejects
      .toThrow('Branch "origin/nonexistent" does not exist');
  });
});

describe('fetchPrune', () => {
  let mockGit;
  let git;

  beforeEach(async () => {
    vi.resetModules();

    mockGit = {
      fetch: vi.fn(),
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  it('executes git fetch --prune', async () => {
    mockGit.fetch.mockResolvedValue();

    await git.fetchPrune();
    expect(mockGit.fetch).toHaveBeenCalledWith(['--prune']);
  });

  it('throws error on fetch failure', async () => {
    mockGit.fetch.mockRejectedValue(
      new Error('fatal: Could not read from remote')
    );

    await expect(git.fetchPrune()).rejects.toThrow('Failed to fetch from remote');
  });
});

describe('createTag with commit', () => {
  let mockGit;
  let git;

  beforeEach(async () => {
    vi.resetModules();

    mockGit = {
      addTag: vi.fn(),
      raw: vi.fn(),
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  it('creates tag at specific commit when provided', async () => {
    mockGit.raw.mockResolvedValue();

    await git.createTag('v_202603141200_test', 'Release message', 'abc123');

    expect(mockGit.raw).toHaveBeenCalledWith([
      'tag',
      '-a',
      'v_202603141200_test',
      '-m',
      'Release message',
      'abc123',
    ]);
  });

  it('creates lightweight tag when no message provided', async () => {
    mockGit.raw.mockResolvedValue();

    await git.createTag('v_202603141200_test', null, 'abc123');

    expect(mockGit.raw).toHaveBeenCalledWith(['tag', 'v_202603141200_test', 'abc123']);
  });
});
