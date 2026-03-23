#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';
import { format } from 'date-fns';
import { loadConfig, saveConfig } from './config.js';
import * as git from './git.js';
import { getBranchesWithTime, getCommitHash, fetchPrune, isBranchMerged, getMergeCommit } from './git.js';
import { createRequire } from 'module';

inquirer.registerPrompt('autocomplete', autocomplete);

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('gtt')
  .description('Git tag CLI tool with timestamp-based tagging')
  .version(pkg.version)
  .option('-m, --message <msg>', 'Add a message/comment to the tag (creates annotated tag)')
  .option('-b, --branch <branch>', 'Specify remote branch to tag (e.g., main or origin/main)')
  .option('-h, --help', 'Display help information')
  .action(async (options) => {
    // Handle help command
    if (options.help) {
      console.log(`
${pkg.name} v${pkg.version}

A powerful CLI tool to create and push Git tags with a standardized format.

USAGE:
  $ gtt [options]

OPTIONS:
  -m, --message <msg>   Add a message/comment to the tag (creates annotated tag)
  -b, --branch <branch> Specify remote branch to tag (e.g., main or origin/main)
  -h, --help            Display help information
  -V, --version         Output the version number

EXAMPLES:
  $ gtt                              # Interactive tag creation
  $ gtt -m "Release version 1.0.0"   # Create tag with message
  $ gtt -b main                      # Tag specific remote branch
  $ gtt -b origin/feature-x -m "RC1" # Tag remote branch with message

INTERACTIVE FLOW:
  1. Fetch remote branches (git fetch --prune)
  2. Select remote branch (with search functionality)
  3. Choose tag location (if branch is merged)
  4. Select tag suffix (or custom/none)
  5. Enter tag message (optional)
  6. Confirm push to remote
  7. Review and confirm tag creation
  8. Save custom suffix to config (if applicable)

CONFIGURATION:
  Create a .gitimetagrc file in your home directory or project root:

  Windows:  C:\\Users\\<YourUsername>\\.gitimetagrc
  macOS:    ~/.gitimetagrc
  Project:  <project-root>/.gitimetagrc

  Example .gitimetagrc:
  {
    "tagFormat": "v_{datetime}_{suffix}",
    "datetimeFormat": "yyyyMMddHHmm",
    "suffixes": ["alpha", "beta", "stable"]
  }

  Configuration Options:
    - tagFormat:      Tag template with {datetime} and {suffix} placeholders
    - datetimeFormat: date-fns format string (default: yyyyMMddHHmm)
    - suffixes:       Array of suffix options for interactive prompt

REPOSITORY:
  ${pkg.homepage}

LICENSE:
  ${pkg.license}
`);
      process.exit(0);
    }

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
      const branchesWithTime = await getBranchesWithTime();
      const remoteBranches = branchesWithTime.map(b => b.name);

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
        // Interactive branch selection with search
        if (branchesWithTime.length > 0) {
          const branchChoices = branchesWithTime.map(b => ({
            name: `${b.name} (${b.timeInfo})`,
            value: b.name,
          }));

          const branchAnswer = await inquirer.prompt([
            {
              type: 'autocomplete',
              name: 'branch',
              message: 'Select remote branch to tag:',
              source: async (answersSoFar, input) => {
                if (!input) return branchChoices;
                const lowerInput = input.toLowerCase();
                return branchChoices.filter(c => c.value.toLowerCase().includes(lowerInput));
              },
            },
          ]);
          selectedBranch = branchAnswer.branch;
        }
      }

      // Check if the selected branch has been merged into main branches
      const mainBranches = ['main', 'master', 'develop'].filter(b => remoteBranches.includes(b));

      const mergeChecks = await Promise.all(
        mainBranches
          .filter(mainBranch => selectedBranch !== mainBranch)
          .map(async (mainBranch) => ({
            branch: mainBranch,
            merged: await isBranchMerged(selectedBranch, mainBranch),
          }))
      );
      const mergedInto = mergeChecks.filter(c => c.merged).map(c => c.branch);

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

      const suffixChoices = [
        ...config.suffixes,
        new inquirer.Separator('---'),
        { name: '📝 自定义 (Custom)', value: '__custom__' },
        { name: '❌ 无后缀 (None)', value: '__none__' },
      ];

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'suffix',
          message: 'Select tag suffix:',
          choices: suffixChoices,
          default: config.suffixes[0],
        },
        {
          type: 'input',
          name: 'customSuffix',
          message: 'Enter custom suffix:',
          when: (answers) => answers.suffix === '__custom__',
          validate: (input) => {
            if (!input.trim()) {
              return 'Suffix cannot be empty';
            }
            return true;
          },
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

      let finalSuffix;
      let isCustomOrNone = false;
      if (answers.suffix === '__custom__') {
        finalSuffix = answers.customSuffix.trim();
        isCustomOrNone = true;
      } else if (answers.suffix === '__none__') {
        finalSuffix = '';
        isCustomOrNone = true;
      } else {
        finalSuffix = answers.suffix;
      }

      const now = new Date();
      const datetimeStr = format(now, config.datetimeFormat);

      let tagName = config.tagFormat
        .replace('{datetime}', datetimeStr)
        .replace('{suffix}', finalSuffix);

      // 如果后缀为空且 tagFormat 包含下划线，清理多余下划线
      if (finalSuffix === '' && tagName.includes('__')) {
        tagName = tagName.replace(/_{2,}/g, '_').replace(/_$/, '');
      }

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

      if (isCustomOrNone) {
        const saveAnswers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'saveConfig',
            message: `Do you want to save "${finalSuffix || '(none)'}" to suffixes list?`,
            default: true,
          },
        ]);

        if (saveAnswers.saveConfig) {
          const scopeAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'scope',
              message: 'Save to:',
              choices: [
                { name: '📁 当前项目 (Project only)', value: 'local' },
                { name: '🏠 用户全局 (Global for user)', value: 'global' },
              ],
              default: 'local',
            },
          ]);

          const newSuffixes = [...config.suffixes];
          if (answers.suffix === '__none__') {
            console.log('ℹ️  "None" suffix will not be added to the list (it means no suffix).');
          } else if (finalSuffix && !newSuffixes.includes(finalSuffix)) {
            newSuffixes.unshift(finalSuffix);
          }

          try {
            const savedPath = await saveConfig({ suffixes: newSuffixes }, scopeAnswer.scope);
            console.log(`✅ Configuration saved to: ${savedPath}`);
          } catch (saveError) {
            console.error(`❌ Failed to save config: ${saveError.message}`);
          }
        }
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
