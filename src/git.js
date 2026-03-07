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

export async function createTag(tagName, message) {
  try {
    if (message) {
      await git.addAnnotatedTag(tagName, message);
    } else {
      await git.addTag(tagName);
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
