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
    const options = {};

    if (commitSha) {
      options.object = commitSha;
    }

    if (message) {
      options.annotated = true;
      options.message = message;
      await git.addTag(tagName, options);
    } else {
      if (commitSha) {
        await git.addTag(tagName, options);
      } else {
        await git.addTag(tagName);
      }
    }
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
