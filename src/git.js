import { simpleGit } from 'simple-git';

const git = simpleGit();

export async function getCurrentBranch() {
  try {
    const status = await git.status();
    if (status.detached) {
      return '(detached HEAD)';
    }
    return status.current || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

export async function createTag(tagName, message, commitSha) {
  try {
    // NOTE: simple-git addTag() does not reliably support tagging an arbitrary object/sha.
    // Use raw `git tag` args so the tag always points to the intended commit.
    if (message) {
      const args = ['tag', '-a', tagName, '-m', message];
      if (commitSha) args.push(commitSha);
      await git.raw(args);
      return;
    }

    if (commitSha) {
      await git.raw(['tag', tagName, commitSha]);
      return;
    }

    await git.addTag(tagName);
  } catch (e) {
    if (e.message?.includes('already exists')) {
      throw new Error(`Tag "${tagName}" already exists`);
    }
    throw e;
  }
}

export async function pushTag(tagName) {
  try {
    await git.push('origin', tagName);
  } catch (e) {
    if (e.message?.includes('Authentication failed') || e.message?.includes('permission denied')) {
      throw new Error('Authentication failed. Please check your Git credentials.');
    }
    throw e;
  }
}

export async function isRepo() {
  try {
    return await git.checkIsRepo();
  } catch (e) {
    return false;
  }
}

export async function getRemoteBranches() {
  try {
    const branches = await git.branch(['-r']);
    return branches.all
      .filter(branch => branch.startsWith('origin/'))
      .map(branch => branch.replace('origin/', ''));
  } catch (e) {
    throw new Error(`Failed to get remote branches: ${e.message}`);
  }
}

export async function getCommitHash(branchName) {
  try {
    const sha = await git.revparse([branchName]);
    return sha.trim();
  } catch (e) {
    if (e.message?.includes('fatal: ambiguous argument')) {
      throw new Error(`Branch "${branchName}" does not exist`);
    }
    throw new Error(`Failed to get commit hash for "${branchName}": ${e.message}`);
  }
}

export async function fetchPrune() {
  try {
    await git.fetch(['--prune']);
  } catch (e) {
    throw new Error(`Failed to fetch from remote: ${e.message}`);
  }
}

export async function isBranchMerged(sourceBranch, targetBranch) {
  try {
    // Check if sourceBranch is merged into targetBranch
    const result = await git.raw(['branch', '-r', '--merged', `origin/${targetBranch}`]);
    const mergedBranches = result
      .split('\n')
      .map(b => b.trim().replace(/^\*\s*/, '').replace('origin/', ''))
      .filter(b => b); // Remove empty lines
    return mergedBranches.includes(sourceBranch);
  } catch (e) {
    return false;
  }
}

export async function getMergeCommit(sourceBranch, targetBranch) {
  try {
    // Find the merge commit where sourceBranch was merged into targetBranch
    // Try multiple patterns to match different merge commit message formats
    const patterns = [
      `Merge.*${sourceBranch}`,
      `Merge branch.*${sourceBranch}`,
      `Merge ${sourceBranch} into`,
    ];

    for (const pattern of patterns) {
      const result = await git.raw([
        'log',
        `origin/${targetBranch}`,
        '--merges',
        '--first-parent',
        '--grep', pattern,
        '-1',
        '--format=%H'
      ]);
      const sha = result.trim();
      if (sha) {
        return sha;
      }
    }

    // Fallback: try to find merge commit using merge-base
    const mergeBaseResult = await git.raw(['merge-base', `origin/${targetBranch}`, `origin/${sourceBranch}`]);
    const mergeBase = mergeBaseResult.trim();
    if (mergeBase) {
      // Verify this is actually a merge commit
      const commitType = await git.raw(['rev-parse', `${mergeBase}^@`]);
      if (commitType) {
        return mergeBase;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}
