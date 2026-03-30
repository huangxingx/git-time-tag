#!/usr/bin/env node

import { Command } from 'commander';
import { format } from 'date-fns';
import { loadConfig, saveConfig } from './config.js';
import * as git from './git.js';
import * as utils from './utils.js';
import * as prompts from './prompts.js';
import * as commands from './commands.js';
import { getBranchesWithTime, getCommitHash, fetchPrune, isBranchMerged, getMergeCommit, getShortCommitHash } from './git.js';
import { createRequire } from 'module';
import path from 'path';
import { homedir } from 'os';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('gtt')
  .description('基于时间戳的 Git 标签管理工具')
  .version(pkg.version);

// list 命令
program
  .command('list')
  .alias('ls')
  .description('显示标签列表')
  .option('-r, --remote', '显示远程标签')
  .option('-p, --pattern <pattern>', '过滤标签（支持通配符）')
  .action(async (options) => {
    try {
      if (!(await git.isRepo())) {
        utils.error('当前目录不是 Git 仓库');
        process.exit(1);
      }
      await commands.listTags(options);
    } catch (error) {
      process.exit(1);
    }
  });

// delete 命令
program
  .command('delete <tag>')
  .alias('del')
  .alias('rm')
  .description('删除标签')
  .option('-r, --remote', '同时删除远程标签')
  .option('-f, --force', '跳过确认')
  .action(async (tag, options) => {
    try {
      if (!(await git.isRepo())) {
        utils.error('当前目录不是 Git 仓库');
        process.exit(1);
      }
      await commands.deleteTag(tag, options);
    } catch (error) {
      process.exit(1);
    }
  });

// config 命令
program
  .command('config <action>')
  .description('配置管理')
  .action(async (action, options) => {
    try {
      if (!(await git.isRepo())) {
        utils.error('当前目录不是 Git 仓库');
        process.exit(1);
      }

      if (action === 'show') {
        await commands.showConfig();
      } else if (action === 'init') {
        await commands.initConfig({ scope: 'local' });
      } else {
        utils.error(`未知的配置操作：${action}`);
        console.log('可用操作：show, init');
        process.exit(1);
      }
    } catch (error) {
      process.exit(1);
    }
  });

// config init 快捷命令
program
  .command('init')
  .description('初始化配置文件')
  .option('-g, --global', '初始化全局配置（默认为局部）')
  .option('-f, --force', '覆盖已存在的配置')
  .action(async (options) => {
    try {
      const scope = options.global ? 'global' : 'local';
      await commands.initConfig({ scope, force: options.force });
    } catch (error) {
      process.exit(1);
    }
  });

// 主命令（创建标签）
program
  .option('-m, --message <msg>', '添加标签消息/注释')
  .option('-b, --branch <branch>', '指定远程分支')
  .option('--dry-run', '预览模式（不实际创建标签）')
  .option('-h, --help', '显示帮助信息')
  .action(async (options) => {
    // 处理帮助
    if (options.help) {
      console.log(`
${pkg.name} v${pkg.version}

基于时间戳的 Git 标签管理工具

用法:
  $ gtt [options]
  $ gtt list [options]
  $ gtt delete <tag> [options]
  $ gtt config <action>
  $ gtt init [options]

选项:
  -m, --message <msg>   添加标签消息/注释
  -b, --branch <branch> 指定远程分支
  --dry-run             预览模式（不实际创建标签）
  -h, --help            显示帮助信息
  -V, --version         显示版本号

子命令:
  list                  显示标签列表
  delete                删除标签
  config                配置管理
  init                  初始化配置文件

示例:
  $ gtt                              # 交互式创建标签
  $ gtt -m "发布版本 1.0.0"           # 创建带消息的标签
  $ gtt -b main                      # 标记指定远程分支
  $ gtt -b origin/feature-x -m "RC1" # 标记远程分支并带消息
  $ gtt list -r                      # 显示远程标签列表
  $ gtt delete v_20240321_test -r    # 删除本地和远程标签
  $ gtt config show                  # 显示当前配置
  $ gtt init                         # 初始化局部配置
  $ gtt init -g                      # 初始化全局配置

交互流程:
  1. 获取远程分支列表 (git fetch --prune)
  2. 选择远程分支（支持搜索）
  3. 选择标签位置（如果分支已合并）
  4. 选择标签后缀（预设/自定义/无）
  5. 输入标签消息（可选）
  6. 确认推送到远程
  7. 预览并确认标签创建
  8. 保存自定义后缀到配置

配置:
  在以下位置创建 .gitimetagrc 文件：

  Windows:  C:\\Users\\<用户名>\\.gitimetagrc
  macOS:    ~/.gitimetagrc
  项目：    <项目根目录>/.gitimetagrc

  示例 .gitimetagrc:
  {
    "tagFormat": "v_{datetime}_{suffix}",
    "datetimeFormat": "yyyyMMddHHmm",
    "suffixes": ["alpha", "beta", "stable"],
    "mainBranches": ["main", "master", "develop"]
  }

  配置选项:
    - tagFormat:      标签模板，支持 {datetime}、{suffix}、{branch}、{shortHash}
    - datetimeFormat: 日期格式（date-fns 格式，默认：yyyyMMddHHmm）
    - suffixes:       标签后缀选项列表
    - mainBranches:   主分支列表（用于检测合并状态）

仓库地址:
  ${pkg.homepage}

开源协议:
  ${pkg.license}
`);
      process.exit(0);
    }

    try {
      if (!(await git.isRepo())) {
        utils.error('当前目录不是 Git 仓库');
        process.exit(1);
      }

      const config = await loadConfig();

      // 获取远程分支
      await fetchPrune();

      // 获取或选择分支
      let selectedBranch = options.branch;
      let targetBranch = null;
      let targetCommitSha = null;
      const branchesWithTime = await getBranchesWithTime();
      const remoteBranches = branchesWithTime.map(b => b.name);

      if (selectedBranch) {
        // 标准化分支名
        if (selectedBranch.startsWith('origin/')) {
          selectedBranch = selectedBranch.slice('origin/'.length);
        }
        // 验证分支存在
        if (!remoteBranches.includes(selectedBranch)) {
          utils.error(`分支 "${selectedBranch}" 在远程仓库不存在`);
          console.log('可用分支:');
          remoteBranches.forEach(b => console.log(`  - ${utils.highlightBranch(b)}`));
          process.exit(1);
        }
      } else {
        // 交互式选择分支
        if (branchesWithTime.length > 0) {
          selectedBranch = await prompts.promptBranchSelect(branchesWithTime);
        }
      }

      // 检查分支合并状态（使用配置的主分支列表）
      const mainBranches = config.mainBranches || ['main', 'master', 'develop'];
      const targetMainBranches = mainBranches.filter(b => remoteBranches.includes(b));

      const mergeChecks = await Promise.all(
        targetMainBranches
          .filter(mainBranch => selectedBranch !== mainBranch)
          .map(async (mainBranch) => ({
            branch: mainBranch,
            merged: await isBranchMerged(selectedBranch, mainBranch),
          }))
      );
      const mergedInto = mergeChecks.filter(c => c.merged).map(c => c.branch);

      if (mergedInto.length > 0) {
        console.log(`\n${utils.infoWithTag(`分支 "${utils.highlightBranch(selectedBranch)}" 已合并到：${mergedInto.map(b => utils.highlightBranch(b)).join(', ')}`)}\n`);

        targetBranch = await prompts.promptTagLocation(selectedBranch, mergedInto);

        if (targetBranch !== selectedBranch) {
          const mergeCommit = await getMergeCommit(selectedBranch, targetBranch);
          if (mergeCommit) {
            targetCommitSha = mergeCommit;
            console.log(`使用合并提交 (${targetBranch}): ${utils.highlightHash(targetCommitSha.slice(0, 7))}`);
          } else {
            targetCommitSha = await getCommitHash(`origin/${targetBranch}`);
            console.log(`使用目标分支最新提交 (${targetBranch}): ${utils.highlightHash(targetCommitSha.slice(0, 7))}`);
          }
        } else {
          targetCommitSha = await getCommitHash(`origin/${selectedBranch}`);
          console.log(`使用源分支提交 (${selectedBranch}): ${utils.highlightHash(targetCommitSha.slice(0, 7))}`);
        }
      } else {
        targetBranch = selectedBranch;
        if (selectedBranch) {
          targetCommitSha = await getCommitHash(`origin/${selectedBranch}`);
          console.log(`目标分支：${utils.highlightBranch(targetBranch)} (${utils.highlightHash(targetCommitSha.slice(0, 7))})`);
        } else {
          console.log('未选择远程分支，将标记当前 HEAD');
        }
      }

      const currentBranch = await git.getCurrentBranch();
      console.log(`当前分支：${utils.highlightBranch(currentBranch)}\n`);

      // 选择后缀
      const { finalSuffix, isCustomOrNone } = await prompts.promptSuffix(config.suffixes);

      // 输入标签消息
      let tagMessage = options.message;
      if (!tagMessage) {
        tagMessage = await prompts.promptMessage('');
      }

      // 确认推送
      const shouldPush = await prompts.promptPush();

      // 生成标签名
      const now = new Date();
      const datetimeStr = format(now, config.datetimeFormat);

      // 获取短哈希（如果模板中使用了 {shortHash}）
      const shortHash = targetCommitSha ? await getShortCommitHash(targetCommitSha) : '';

      let tagName = config.tagFormat
        .replace('{datetime}', datetimeStr)
        .replace('{suffix}', finalSuffix)
        .replace('{branch}', selectedBranch || 'HEAD')
        .replace('{shortHash}', shortHash);

      // 清理多余下划线
      if (finalSuffix === '' && tagName.includes('__')) {
        tagName = tagName.replace(/_{2,}/g, '_').replace(/_$/, '');
      }

      console.log(`\n${utils.title('生成的标签:')}`);
      console.log(`  标签名：${utils.highlightTag(tagName)}`);
      if (tagMessage) {
        console.log(`  消息：${utils.subtitle(tagMessage)}`);
      }
      console.log(`  目标：${utils.highlightBranch(targetBranch || 'HEAD')}`);
      if (shouldPush) {
        console.log(`  推送：${utils.successWithTag('是')}`);
      }

      // 预览模式
      if (options.dryRun) {
        console.log(`\n${utils.infoWithTag('预览模式 - 未实际创建标签')}`);
        process.exit(0);
      }

      // 最终确认
      const confirmed = await prompts.promptConfirmTag(tagName, tagMessage);
      if (!confirmed) {
        console.log('已取消操作');
        return;
      }

      // 创建标签
      await git.createTag(tagName, tagMessage, targetCommitSha);
      utils.successWithTag(`标签 "${tagName}" 已创建${tagMessage ? '（附带消息）' : ''}`);

      // 推送标签
      if (shouldPush) {
        if (targetBranch) {
          console.log(`推送到远程 (${targetBranch})...`);
        } else {
          console.log('推送到远程...');
        }
        await git.pushTag(tagName);
        utils.successWithTag('推送成功');
      }

      // 保存自定义后缀
      if (isCustomOrNone) {
        const shouldSave = await prompts.promptSaveConfig(finalSuffix);
        if (shouldSave) {
          const scope = await prompts.promptSaveScope();
          const newSuffixes = [...config.suffixes];

          if (finalSuffix === '' && finalSuffix === '') {
            console.log(utils.infoWithTag('"无后缀" 不会添加到后缀列表'));
          } else if (finalSuffix && !newSuffixes.includes(finalSuffix)) {
            newSuffixes.unshift(finalSuffix);
          }

          try {
            const savedPath = await saveConfig({ suffixes: newSuffixes }, scope);
            utils.successWithTag(`配置已保存到：${utils.highlightPath(savedPath)}`);
          } catch (saveError) {
            utils.errorWithTag(`保存配置失败：${saveError.message}`);
          }
        }
      }
    } catch (error) {
      if (error.message?.includes('already exists')) {
        utils.error(`标签已存在：${error.message}`);
      } else if (error.message?.includes('Authentication')) {
        utils.error(`认证失败：${error.message}`);
      } else {
        utils.error(`操作失败：${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
