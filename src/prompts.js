import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocomplete);

/**
 * 交互式提示模块
 * 包含所有用户输入相关的提示逻辑
 */

/**
 * 分支选择提示（带搜索）
 */
export async function promptBranchSelect(branchesWithTime) {
  const branchChoices = branchesWithTime.map(b => ({
    name: `${b.name} (${b.timeInfo})`,
    value: b.name,
  }));

  const branchAnswer = await inquirer.prompt([
    {
      type: 'autocomplete',
      name: 'branch',
      message: '选择要标记的远程分支：',
      source: async (answersSoFar, input) => {
        if (!input) return branchChoices;
        const lowerInput = input.toLowerCase();
        return branchChoices.filter(c => c.value.toLowerCase().includes(lowerInput));
      },
    },
  ]);
  return branchAnswer.branch;
}

/**
 * 标签位置选择提示（当分支已合并时）
 */
export async function promptTagLocation(selectedBranch, mergedInto) {
  const targetAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'targetBranch',
      message: '您想在哪里创建标签？',
      choices: [
        { name: `在源分支上 (${selectedBranch})`, value: selectedBranch },
        ...mergedInto.map(b => ({ name: `在合并分支上 (${b})`, value: b })),
      ],
      default: mergedInto[0],
    },
  ]);
  return targetAnswer.targetBranch;
}

/**
 * 标签后缀选择提示
 */
export async function promptSuffix(configSuffixes) {
  const suffixChoices = [
    ...configSuffixes,
    new inquirer.Separator('---'),
    { name: '📝 自定义 (Custom)', value: '__custom__' },
    { name: '❌ 无后缀 (None)', value: '__none__' },
  ];

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'suffix',
      message: '选择标签后缀：',
      choices: suffixChoices,
      default: configSuffixes[0],
    },
    {
      type: 'input',
      name: 'customSuffix',
      message: '输入自定义后缀：',
      when: (answers) => answers.suffix === '__custom__',
      validate: (input) => {
        if (!input.trim()) {
          return '后缀不能为空';
        }
        return true;
      },
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

  return { finalSuffix, isCustomOrNone };
}

/**
 * 标签消息输入提示
 */
export async function promptMessage(defaultMessage = '') {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'message',
      message: '输入标签消息/注释（可选）：',
      default: defaultMessage,
    },
  ]);
  return answer.message;
}

/**
 * 推送确认提示
 */
export async function promptPush() {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'push',
      message: '推送到远程仓库？',
      default: true,
    },
  ]);
  return answer.push;
}

/**
 * 标签创建最终确认提示
 */
export async function promptConfirmTag(tagName, tagMessage) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message: `创建标签 "${tagName}"${tagMessage ? `，消息为 "${tagMessage}"` : ''}？`,
      default: true,
    },
  ]);
  return answer.ok;
}

/**
 * 保存配置确认提示
 */
export async function promptSaveConfig(suffix) {
  const saveAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'saveConfig',
      message: `是否将 "${suffix || '(无)'}" 添加到后缀列表？`,
      default: true,
    },
  ]);
  return saveAnswer.saveConfig;
}

/**
 * 保存范围选择提示
 */
export async function promptSaveScope() {
  const scopeAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: '保存到：',
      choices: [
        { name: '📁 当前项目 (Project only)', value: 'local' },
        { name: '🏠 用户全局 (Global for user)', value: 'global' },
      ],
      default: 'local',
    },
  ]);
  return scopeAnswer.scope;
}

/**
 * 删除标签确认提示
 */
export async function promptDeleteTag(tagName, isRemote = false) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `确定要删除标签 "${tagName}"${isRemote ? '（包括远程）' : ''}？此操作不可逆！`,
      default: false,
    },
  ]);
  return answer.confirm;
}

/**
 * 选择要删除的标签提示
 */
export async function promptSelectTagToDelete(tags) {
  if (tags.length === 0) {
    return null;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'tag',
      message: '选择要删除的标签：',
      choices: tags.map(tag => ({
        name: tag,
        value: tag,
      })),
    },
  ]);
  return answer.tag;
}
