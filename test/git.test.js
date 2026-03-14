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
      mockGit.addTag.mockResolvedValue();

      await expect(git.createTag('v1.0.0', 'Release message')).resolves.toBeUndefined();
      expect(mockGit.addTag).toHaveBeenCalledWith('v1.0.0', {
        annotated: true,
        message: 'Release message'
      });
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
});
