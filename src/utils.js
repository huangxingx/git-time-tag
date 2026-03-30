import chalk from 'chalk';

/**
 * 彩色输出工具函数
 */

// 成功消息
export function success(message) {
  console.log(chalk.green(`✓ ${message}`));
}

// 错误消息
export function error(message) {
  console.error(chalk.red(`✗ ${message}`));
}

// 警告消息
export function warn(message) {
  console.log(chalk.yellow(`⚠ ${message}`));
}

// 信息消息
export function info(message) {
  console.log(chalk.blue(`ℹ ${message}`));
}

// 标签名高亮
export function highlightTag(tagName) {
  return chalk.cyan.bold(tagName);
}

// 分支名高亮
export function highlightBranch(branchName) {
  return chalk.yellow.bold(branchName);
}

// 提交哈希高亮
export function highlightHash(hash) {
  return chalk.gray(hash);
}

// 命令高亮
export function highlightCommand(cmd) {
  return chalk.white.bold(cmd);
}

// 路径高亮
export function highlightPath(path) {
  return chalk.gray.italic(path);
}

// 标题样式
export function title(text) {
  return chalk.bold.cyan(text);
}

// 副标题样式
export function subtitle(text) {
  return chalk.gray(text);
}

// 成功带标签
export function successWithTag(message) {
  return chalk.green(`✅ ${message}`);
}

// 错误带标签
export function errorWithTag(message) {
  return chalk.red(`❌ ${message}`);
}

// 信息带标签
export function infoWithTag(message) {
  return chalk.blue(`ℹ️  ${message}`);
}
