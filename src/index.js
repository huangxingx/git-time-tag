#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { format } from 'date-fns';
import { loadConfig } from './config.js';
import * as git from './git.js';

const program = new Command();

program
  .name('gtt')
  .description('Git tag CLI tool with timestamp-based tagging')
  .version('1.0.0')
  .option('-m, --message <msg>', 'Add a message/comment to the tag (creates annotated tag)')
  .action(async (options) => {
    try {
      if (!(await git.isRepo())) {
        console.error('Error: Not a git repository.');
        process.exit(1);
      }

      const config = await loadConfig();
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

      await git.createTag(tagName, tagMessage);
      console.log(`Tag "${tagName}" created${tagMessage ? ' (annotated)' : ''}.`);

      if (answers.push) {
        console.log('Pushing to remote...');
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
