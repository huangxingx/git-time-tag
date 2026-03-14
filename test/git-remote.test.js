import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('simple-git');

import { simpleGit } from 'simple-git';
import { fetchPrune } from '../src/git.js';

describe('getRemoteBranches', () => {
  let mockGit;
  let git;

  beforeEach(async () => {
    vi.resetModules();

    mockGit = {
      getBranches: vi.fn(),
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  it('returns list of remote branches', async () => {
    const mockBranches = [
      { name: 'origin/main' },
      { name: 'origin/feature-x' },
      { name: 'origin/develop' }
    ];
    mockGit.getBranches.mockResolvedValue(mockBranches);

    const result = await git.getRemoteBranches();
    expect(result).toEqual(['origin/main', 'origin/feature-x', 'origin/develop']);
  });

  it('handles empty remote branches', async () => {
    mockGit.getBranches.mockResolvedValue([]);
    const result = await git.getRemoteBranches();
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
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  it('creates tag at specific commit when provided', async () => {
    mockGit.addTag.mockResolvedValue();

    await git.createTag('v_202603141200_test', 'Release message', 'abc123');

    expect(mockGit.addTag).toHaveBeenCalledWith(
      'v_202603141200_test',
      {
        annotated: true,
        message: 'Release message',
        object: 'abc123'
      }
    );
  });

  it('creates lightweight tag when no message provided', async () => {
    mockGit.addTag.mockResolvedValue();

    await git.createTag('v_202603141200_test', null, 'abc123');

    expect(mockGit.addTag).toHaveBeenCalledWith(
      'v_202603141200_test',
      { object: 'abc123' }
    );
  });
});
