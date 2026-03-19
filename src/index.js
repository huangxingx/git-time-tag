#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { format } from 'date-fns';
import { loadConfig } from './config.js';
import * as git from './git.js';
import { getRemoteBranches, getCommitHash, fetchPrune, isBranchMerged, getMergeCommit } from './git.js';

const program = new Command();

program
  .name('gtt')
  .description('Git tag CLI tool with timestamp-based tagging')
  .version('1.0.0')
  .option('-m, --message <msg>', 'Add a message/comment to the tag (creates annotated tag)')
  .option('-b, --branch <branch>', 'Specify remote branch to tag (e.g., main or origin/main)')
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
      let selectedBranch = options.branch;
      let targetBranch = null;
      let targetCommitSha = null;
      const remoteBranches = await getRemoteBranches();

      if (selectedBranch) {
        // Normalize input: accept "origin/main" or "main"
        if (selectedBranch.startsWith('origin/')) {
          selectedBranch = selectedBranch.slice('origin/'.length);
        }
        // Validate branch exists
        if (!remoteBranches.includes(selectedBranch)) {
          console.error(`Error: Branch "${selectedBranch}" does not exist on remote.`);
          console.error('Available branches:');
          remoteBranches.forEach(b => console.error(`  - ${b}`));
          process.exit(1);
        }
      } else {
        // Interactive branch selection
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
          selectedBranch = branchAnswer.branch;
        }
      }

      // Check if the selected branch has been merged into main branches
      const mainBranches = ['main', 'master', 'develop'].filter(b => remoteBranches.includes(b));
      let mergedInto = [];
      
      for (const mainBranch of mainBranches) {
        if (selectedBranch !== mainBranch && await isBranchMerged(selectedBranch, mainBranch)) {
          mergedInto.push(mainBranch);
        }
      }

      if (mergedInto.length > 0) {
        console.log(`\nℹ️  Branch "${selectedBranch}" has been merged into: ${mergedInto.join(', ')}`);
        
        const targetAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'targetBranch',
            message: 'Where do you want to create the tag?',
            choices: [
              { name: `On the source branch (${selectedBranch})`, value: selectedBranch },
              ...mergedInto.map(b => ({ name: `On the merged branch (${b})`, value: b })),
            ],
            default: mergedInto[0],
          },
        ]);
        
        targetBranch = targetAnswer.targetBranch;
        
        if (targetBranch !== selectedBranch) {
          // Try to find the merge commit
          const mergeCommit = await getMergeCommit(selectedBranch, targetBranch);
          if (mergeCommit) {
            targetCommitSha = mergeCommit;
            console.log(`Using merge commit on ${targetBranch}: ${targetCommitSha.slice(0, 7)}`);
          } else {
            // Fallback to the latest commit on target branch
            targetCommitSha = await getCommitHash(`origin/${targetBranch}`);
            console.log(`Using latest commit on ${targetBranch}: ${targetCommitSha.slice(0, 7)}`);
          }
        } else {
          targetCommitSha = await getCommitHash(`origin/${selectedBranch}`);
          console.log(`Using commit on ${selectedBranch}: ${targetCommitSha.slice(0, 7)}`);
        }
      } else {
        targetBranch = selectedBranch;
        if (selectedBranch) {
          targetCommitSha = await getCommitHash(`origin/${selectedBranch}`);
          console.log(`Targeting branch: ${targetBranch} (${targetCommitSha.slice(0, 7)})`);
        } else {
          console.log('No remote branch selected; tagging current HEAD.');
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
