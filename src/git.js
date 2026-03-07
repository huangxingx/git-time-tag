import { simpleGit } from 'simple-git';

const git = simpleGit();

export async function getCurrentBranch() {
  const status = await git.status();
  return status.current;
}

export async function createTag(tagName) {
  await git.addTag(tagName);
}

export async function pushTag(tagName) {
  await git.push('origin', tagName);
}

export async function isRepo() {
  try {
    return await git.checkIsRepo();
  } catch (e) {
    return false;
  }
}
