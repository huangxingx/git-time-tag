import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('simple-git');

import { simpleGit } from 'simple-git';

describe('git', () => {
  let mockGit;
  let git;

  beforeEach(async () => {
    vi.resetModules();

    mockGit = {
      status: vi.fn(),
      addTag: vi.fn(),
      raw: vi.fn(),
      push: vi.fn(),
      checkIsRepo: vi.fn(),
    };

    simpleGit.mockReturnValue(mockGit);

    git = await import('../src/git.js');
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockGit.status.mockResolvedValue({ current: 'main', detached: false });

      const branch = await git.getCurrentBranch();

      expect(branch).toBe('main');
    });

    it('should handle detached HEAD state', async () => {
      mockGit.status.mockResolvedValue({ current: null, detached: true });

      const branch = await git.getCurrentBranch();

      expect(branch).toBe('(detached HEAD)');
    });

    it('should return unknown on error', async () => {
      mockGit.status.mockRejectedValue(new Error('Git error'));

      const branch = await git.getCurrentBranch();

      expect(branch).toBe('unknown');
    });
  });

  describe('createTag', () => {
    it('should create tag successfully', async () => {
      mockGit.addTag.mockResolvedValue();

      await expect(git.createTag('v1.0.0')).resolves.toBeUndefined();
    });

    it('should create annotated tag with message', async () => {
      mockGit.raw.mockResolvedValue();

      await expect(git.createTag('v1.0.0', 'Release message')).resolves.toBeUndefined();
      expect(mockGit.raw).toHaveBeenCalledWith(['tag', '-a', 'v1.0.0', '-m', 'Release message']);
    });

    it('should throw specific error when tag already exists', async () => {
      mockGit.addTag.mockRejectedValue(new Error('tag already exists'));

      await expect(git.createTag('v1.0.0')).rejects.toThrow('already exists');
    });
  });

  describe('pushTag', () => {
    it('should push tag successfully', async () => {
      mockGit.push.mockResolvedValue();

      await expect(git.pushTag('v1.0.0')).resolves.toBeUndefined();
    });

    it('should throw specific error on authentication failure', async () => {
      mockGit.push.mockRejectedValue(new Error('Authentication failed'));

      await expect(git.pushTag('v1.0.0')).rejects.toThrow('Authentication failed');
    });
  });

  describe('isRepo', () => {
    it('should return true for git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true);

      const isRepo = await git.isRepo();

      expect(isRepo).toBe(true);
    });

    it('should return false for non-git repository', async () => {
      mockGit.checkIsRepo.mockRejectedValue(new Error('Not a repo'));

      const isRepo = await git.isRepo();

      expect(isRepo).toBe(false);
    });
  });

  describe('isBranchMerged', () => {
    it('returns true when branch is merged', async () => {
      mockGit.raw.mockResolvedValue('  origin/main\n  origin/feature-x\n');

      const result = await git.isBranchMerged('feature-x', 'main');

      expect(result).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', '-r', '--merged', 'origin/main']);
    });

    it('returns false when branch is not merged', async () => {
      mockGit.raw.mockResolvedValue('  origin/main\n  origin/develop\n');

      const result = await git.isBranchMerged('feature-x', 'main');

      expect(result).toBe(false);
    });

    it('handles current branch marker with * prefix', async () => {
      mockGit.raw.mockResolvedValue('* origin/main\n  origin/develop\n');

      const result = await git.isBranchMerged('main', 'main');

      expect(result).toBe(true);
    });

    it('handles empty output', async () => {
      mockGit.raw.mockResolvedValue('');

      const result = await git.isBranchMerged('feature-x', 'main');

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      const result = await git.isBranchMerged('feature-x', 'main');

      expect(result).toBe(false);
    });
  });

  describe('getMergeCommit', () => {
    it('returns merge commit SHA when found', async () => {
      mockGit.raw.mockResolvedValueOnce('abc123def456\n');

      const result = await git.getMergeCommit('feature-x', 'main');

      expect(result).toBe('abc123def456');
    });

    it('tries multiple patterns when first pattern returns empty', async () => {
      mockGit.raw
        .mockResolvedValueOnce('') // First pattern: Merge.*feature-x
        .mockResolvedValueOnce('def789abc123\n'); // Second pattern: Merge branch.*feature-x

      const result = await git.getMergeCommit('feature-x', 'main');

      expect(result).toBe('def789abc123');
    });

    it('returns null when no merge commit found with any pattern', async () => {
      mockGit.raw
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('');

      const result = await git.getMergeCommit('feature-x', 'main');

      expect(result).toBe(null);
    });

    it('returns null on error', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      const result = await git.getMergeCommit('feature-x', 'main');

      expect(result).toBe(null);
    });

    it('uses merge-base as fallback when grep patterns fail', async () => {
      mockGit.raw
        .mockResolvedValueOnce('') // All grep patterns return empty
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('mergebase123\n') // merge-base succeeds
        .mockResolvedValueOnce('commit^@\n'); // rev-parse confirms it's a merge

      const result = await git.getMergeCommit('feature-x', 'main');

      expect(result).toBe('mergebase123');
    });
  });
});
