import { simpleGit } from 'simple-git';
import chalk from 'chalk';
import { loadConfig, saveConfig } from './config.js';
import * as utils from './utils.js';
import path from 'path';
import { homedir } from 'os';

const git = simpleGit();

/**
 * list 命令 - 显示标签列表
 */
export async function listTags(options = {}) {
  try {
    const { remote = false, pattern = '' } = options;

    if (remote) {
      // 获取远程标签
      utils.info('获取远程标签列表...');
      const result = await git.raw(['ls-remote', '--tags', 'origin']);
      const tags = result
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split('refs/tags/');
          return parts[1]?.replace(/\^{}$/, '') || '';
        })
        .filter(tag => tag && (!pattern || tag.includes(pattern)));

      if (tags.length === 0) {
        utils.warn('远程仓库没有找到匹配的标签');
        return;
      }

      console.log(chalk.cyan.bold(`\n远程标签列表 (${tags.length} 个):\n`));
      tags.forEach(tag => {
        console.log(`  ${chalk.cyan(tag)}`);
      });
    } else {
      // 获取本地标签
      const result = await git.raw(['tag', '-l', pattern || '*']);
      const tags = result.split('\n').filter(tag => tag.trim());

      if (tags.length === 0) {
        utils.warn('本地仓库没有找到标签');
        return;
      }

      console.log(chalk.cyan.bold(`\n本地标签列表 (${tags.length} 个):\n`));
      tags.forEach(tag => {
        console.log(`  ${chalk.cyan(tag)}`);
      });
    }
  } catch (error) {
    utils.error(`获取标签列表失败：${error.message}`);
    throw error;
  }
}

/**
 * delete 命令 - 删除标签
 */
export async function deleteTag(tagName, options = {}) {
  try {
    const { remote = false, force = false } = options;

    if (!tagName) {
      // 交互式选择要删除的标签
      const result = await git.raw(['tag', '-l']);
      const tags = result.split('\n').filter(tag => tag.trim());

      if (tags.length === 0) {
        utils.warn('本地仓库没有找到标签');
        return;
      }

      const inquirer = await import('inquirer');
      const answer = await inquirer.default.prompt([
        {
          type: 'list',
          name: 'tag',
          message: '选择要删除的标签：',
          choices: tags.map(tag => ({ name: tag, value: tag })),
        },
      ]);
      tagName = answer.tag;
    }

    // 检查标签是否存在
    const tagExists = await git.tag(['-l', tagName]);
    if (!tagExists.trim()) {
      utils.error(`标签 "${tagName}" 不存在`);
      return;
    }

    if (!force) {
      const { promptDeleteTag } = await import('./prompts.js');
      const confirmed = await promptDeleteTag(tagName, remote);
      if (!confirmed) {
        console.log('已取消删除操作');
        return;
      }
    }

    // 删除本地标签
    await git.deleteTag(tagName);
    utils.successWithTag(`已删除本地标签 "${tagName}"`);

    // 删除远程标签
    if (remote) {
      await git.push('origin', `:refs/tags/${tagName}`);
      utils.successWithTag(`已删除远程标签 "${tagName}"`);
    }
  } catch (error) {
    utils.error(`删除标签失败：${error.message}`);
    throw error;
  }
}

/**
 * config show 命令 - 显示配置
 */
export async function showConfig() {
  try {
    const config = await loadConfig();

    console.log(chalk.cyan.bold('\n当前配置:\n'));

    console.log(`  ${chalk.yellow('tagFormat:')}      ${chalk.cyan(config.tagFormat)}`);
    console.log(`  ${chalk.yellow('datetimeFormat:')} ${chalk.cyan(config.datetimeFormat)}`);
    console.log(`  ${chalk.yellow('suffixes:')}       [${config.suffixes.map(s => chalk.green(`"${s}"`)).join(', ')}]`);

    // 显示配置文件位置
    const fs = await import('fs/promises');
    const path = await import('path');
    const { homedir } = await import('os');

    const globalConfigPath = path.join(homedir(), '.gitimetagrc');
    const localConfigPath = path.join(process.cwd(), '.gitimetagrc');

    try {
      await fs.access(globalConfigPath);
      console.log(`\n  ${chalk.gray('全局配置文件:')} ${chalk.gray.italic(globalConfigPath)}`);
    } catch {
      console.log(`\n  ${chalk.gray('全局配置文件:')} ${chalk.gray.italic('未设置')}`);
    }

    try {
      await fs.access(localConfigPath);
      console.log(`  ${chalk.gray('局部配置文件:')} ${chalk.gray.italic(localConfigPath)}`);
    } catch {
      console.log(`  ${chalk.gray('局部配置文件:')} ${chalk.gray.italic('未设置')}`);
    }

    console.log();
  } catch (error) {
    utils.error(`读取配置失败：${error.message}`);
    throw error;
  }
}

/**
 * config init 命令 - 初始化配置
 */
export async function initConfig(options = {}) {
  try {
    const { scope = 'local', force = false } = options;

    const configPath = scope === 'local'
      ? path.join(process.cwd(), '.gitimetagrc')
      : path.join(homedir(), '.gitimetagrc');

    // 检查配置文件是否已存在
    const fs = await import('fs/promises');
    const path = await import('path');
    const { homedir } = await import('os');

    try {
      await fs.access(configPath);
      if (!force) {
        const inquirer = await import('inquirer');
        const answer = await inquirer.default.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `配置文件已存在，是否覆盖？`,
            default: false,
          },
        ]);
        if (!answer.overwrite) {
          console.log('已取消初始化操作');
          return;
        }
      }
    } catch {
      // 文件不存在，继续创建
    }

    const defaultConfig = {
      tagFormat: 'v_{datetime}_{suffix}',
      datetimeFormat: 'yyyyMMddHHmm',
      suffixes: ['test', 'main'],
    };

    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    utils.successWithTag(`配置文件已创建：${configPath}`);

    console.log(chalk.gray('\n默认配置内容:\n'));
    console.log(chalk.gray(JSON.stringify(defaultConfig, null, 2)));
    console.log();
  } catch (error) {
    utils.error(`初始化配置失败：${error.message}`);
    throw error;
  }
}

/**
 * 扩展标签模板变量
 */
export function expandTagVariables(tagFormat, variables) {
  let result = tagFormat;

  // 替换标准变量
  if (variables.datetime) {
    result = result.replace('{datetime}', variables.datetime);
  }
  if (variables.suffix !== undefined) {
    result = result.replace('{suffix}', variables.suffix);
  }

  // 替换扩展变量
  if (variables.branch) {
    result = result.replace('{branch}', variables.branch);
  }
  if (variables.shortHash) {
    result = result.replace('{shortHash}', variables.shortHash);
  }

  // 清理多余的下划线
  result = result.replace(/_{2,}/g, '_').replace(/_$/, '');

  return result;
}
