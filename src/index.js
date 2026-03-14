#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { format } from 'date-fns';
import { loadConfig } from './config.js';
import * as git from './git.js';
import { getRemoteBranches, getCommitHash, fetchPrune } from './git.js';

const program = new Command();

program
  .name('gtt')
  .description('Git tag CLI tool with timestamp-based tagging')
  .version('1.0.0')
  .option('-m, --message <msg>', 'Add a message/comment to the tag (creates annotated tag)')
  .option('-b, --branch <branch>', 'Specify remote branch to tag (e.g., origin/main)')
  .action(async (options) => {
    try {
      if (!(await git.isRepo())) {
        console.error('Error: Not a git repository.');
        process.exit(1);
      }

      const config = await loadConfig();

      // Fetch latest remote branches
      await fetchPrune();

      // Get remote branch from option or prompt
      let targetBranch = options.branch;
      let targetCommitSha = null;

      if (targetBranch) {
        // Validate branch exists
        const remoteBranches = await getRemoteBranches();
        if (!remoteBranches.includes(targetBranch)) {
          console.error(`Error: Branch "${targetBranch}" does not exist on remote.`);
          console.error('Available branches:');
          remoteBranches.forEach(b => console.error(`  - ${b}`));
          process.exit(1);
        }
        targetCommitSha = await getCommitHash(targetBranch);
        console.log(`Targeting branch: ${targetBranch} (${targetCommitSha.slice(0, 7)})`);
      } else {
        // Interactive branch selection
        const remoteBranches = await getRemoteBranches();
        if (remoteBranches.length > 0) {
          const branchAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'branch',
              message: 'Select remote branch to tag:',
              choices: remoteBranches,
              default: remoteBranches[0],
            },
          ]);
          targetBranch = branchAnswer.branch;
          targetCommitSha = await getCommitHash(targetBranch);
          console.log(`Targeting branch: ${targetBranch} (${targetCommitSha.slice(0, 7)})`);
        }
      }

      const currentBranch = await git.getCurrentBranch();

      console.log(`Current branch: ${currentBranch}`);

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'suffix',
          message: 'Select tag suffix:',
          choices: config.suffixes,
          default: config.suffixes[0],
        },
        {
          type: 'input',
          name: 'message',
          message: 'Enter tag message/comment (optional):',
          default: options.message || '',
          when: !options.message,
        },
        {
          type: 'confirm',
          name: 'push',
          message: 'Push to remote?',
          default: true,
        },
      ]);

      const now = new Date();
      const datetimeStr = format(now, config.datetimeFormat);

      let tagName = config.tagFormat
        .replace('{datetime}', datetimeStr)
        .replace('{suffix}', answers.suffix);

      const tagMessage = options.message || answers.message;

      console.log(`\nGenerated tag: ${tagName}`);
      if (tagMessage) {
        console.log(`Tag message: ${tagMessage}`);
      }

      const confirmTag = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ok',
          message: `Create tag "${tagName}"${tagMessage ? ` with message "${tagMessage}"` : ''}?`,
          default: true,
        },
      ]);

      if (!confirmTag.ok) {
        console.log('Aborted.');
        return;
      }

      await git.createTag(tagName, tagMessage, targetCommitSha);
      console.log(`Tag "${tagName}" created${tagMessage ? ' (annotated)' : ''}.`);

      if (answers.push) {
        if (targetBranch) {
          console.log(`Pushing to remote (from ${targetBranch})...`);
        } else {
          console.log('Pushing to remote...');
        }
        await git.pushTag(tagName);
        console.log('Pushed successfully.');
      }
    } catch (error) {
      if (error.message?.includes('Validation')) {
        console.error(`\nError: ${error.message}`);
      } else if (error.message?.includes('already exists')) {
        console.error(`\nError: ${error.message}`);
      } else if (error.message?.includes('Authentication')) {
        console.error(`\nError: ${error.message}`);
      } else {
        console.error(`\nError: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
