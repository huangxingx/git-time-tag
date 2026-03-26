import { simpleGit } from 'simple-git';

const git = simpleGit();

const LOADING_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

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

export async function getBranchesWithTime() {
  try {
    // Get remote branches with their latest commit date using for-each-ref
    const result = await git.raw([
      'for-each-ref',
      '--sort=-committerdate',
      '--format=%(refname:short) %(creatordate:relative)',
      'refs/remotes/origin/'
    ]);

    const lines = result.trim().split('\n').filter(line => line && !line.includes('->') && !line.startsWith('origin '));

    return lines.map(line => {
      const parts = line.split(' ');
      const name = parts[0].replace('origin/', '');
      const timeInfo = parts.slice(1).join(' ');
      return { name, timeInfo };
    });
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
  let loadingIndex = 0;
  let loadingInterval = null;

  const startLoading = () => {
    process.stdout.write('Fetching from remote... ');
    loadingInterval = setInterval(() => {
      process.stdout.write(`\rFetching from remote... ${LOADING_CHARS[loadingIndex]} `);
      loadingIndex = (loadingIndex + 1) % LOADING_CHARS.length;
    }, 80);
  };

  const stopLoading = () => {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      process.stdout.write('\rFetching from remote... done\n');
    }
  };

  try {
    startLoading();
    await git.fetch(['--prune']);
    stopLoading();
  } catch (e) {
    stopLoading();
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
