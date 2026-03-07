#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { format } from 'date-fns';
import { loadConfig } from './config.js';
import * as git from './git.js';

const program = new Command();

program
  .name('dotag')
  .description('Git tag CLI tool')
  .version('1.0.0')
  .action(async () => {
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
          choices: ['test', 'main'],
          default: 'test',
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

      console.log(`\nGenerated tag: ${tagName}`);

      const confirmTag = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ok',
          message: `Create tag "${tagName}"?`,
          default: true,
        },
      ]);

      if (!confirmTag.ok) {
        console.log('Aborted.');
        return;
      }

      await git.createTag(tagName);
      console.log(`Tag "${tagName}" created.`);

      if (answers.push) {
        console.log('Pushing to remote...');
        await git.pushTag(tagName);
        console.log('Pushed successfully.');
      }
    } catch (error) {
      console.error(`\nError: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
