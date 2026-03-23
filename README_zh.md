# gtt CLI

一个强大且灵活的命令行工具，用于创建和推送具有标准化格式的 Git 标签（Tags）。确保您的项目版本管理保持一致且自动化。

## 🚀 功能特性

- **标准化标签**：自动生成如 `v_202403211200_test` 格式的标签。
- **智能分支选择**：支持交互式搜索远程分支，显示分支更新时间，自动检测分支合并状态。
- **标签位置选择**：当分支已合并时，可选择在源分支或目标分支（使用合并提交）上创建标签。
- **标签消息**：支持创建带注释的标签（Annotated Tags），添加详细说明。
- **自定义后缀**：支持自定义后缀或无后缀模式，可选择保存到配置。
- **高度可配置**：自定义标签格式、日期时间格式以及可用的后缀选项。
- **Git 集成**：基于 `simple-git` 构建，性能稳定可靠。

## 📋 前置要求

- [Node.js](https://nodejs.org/) (推荐 v16.0.0 或更高版本)
- [Git](https://git-scm.com/) 已安装并配置在您的 Shell 环境中。

## ⚙️ 安装步骤

**方式 1：从 npm 安装**（推荐）

```bash
npm install -g @joemuhuang/gtt
```

**方式 2：从源码构建**

1. **克隆仓库**：
   ```bash
   git clone https://github.com/huangxingx/git-time-tag.git
   cd git-time-tag
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **全局链接**：
   ```bash
   npm link
   ```
   安装后，您可以在任何目录下运行 `gtt` 命令。

## 📖 使用方法

在任何 Git 仓库中运行以下命令：

```bash
gtt
```

### 交互步骤

1. **获取远程分支**：自动执行 `git fetch --prune` 获取最新远程分支并清理过期引用。
2. **选择远程分支**：通过可搜索的列表选择远程分支，显示各分支的最后更新时间。
3. **选择标签位置**（如适用）：如果所选分支已被合并到 main/master/develop，系统会提示您选择在哪里创建标签：
   - **在源分支上**（您选择的分支）
   - **在已合并的分支上**（例如 main）- 使用合并提交
4. **选择后缀**：从配置的后缀中选择，或选择：
   - 📝 **自定义** - 输入任意后缀
   - ❌ **无后缀** - 创建不带后缀的标签
5. **输入消息**：添加可选的标签注释/消息（创建注释标签）。
6. **确认推送**：确认是否要将标签推送到远程仓库 `origin`。
7. **最终审查**：创建前会显示标签名称和消息预览，供您进行最终确认。
8. **保存配置**（如适用）：如果使用了自定义后缀，可选择保存到当前项目或用户全局配置。

### 命令行选项

```bash
gtt                              # 交互式创建标签
gtt -h                           # 显示帮助信息
gtt --help                       # 显示帮助信息
gtt -m "Release version 1.0.0"   # 创建带消息的标签
gtt --message "Hotfix deploy"    # 创建带消息的标签
gtt -b main                      # 指定远程分支（自动添加 origin/前缀）
gtt -b origin/feature-x          # 指定远程分支
gtt -b origin/feature-x -m "RC1" # 指定远程分支并带消息
```

## 🛠️ 配置说明

您可以通过在 **用户主目录**（全局）或 **项目根目录**（局部）下创建 `.gitimetagrc` 文件来自定义 `gtt`。局部设置会覆盖全局设置。

### 配置文件路径

- **Windows**: `C:\Users\<您的用户名>\.gitimetagrc`
- **macOS/Linux**: `~/.gitimetagrc`
- **项目目录**: `<项目根目录>/.gitimetagrc`

### `.gitimetagrc` 示例

```json
{
  "tagFormat": "v_{datetime}_{suffix}",
  "datetimeFormat": "yyyyMMddHHmm",
  "suffixes": ["alpha", "beta", "stable"]
}
```

| 选项 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `tagFormat` | 标签的模板。支持 `{datetime}` 和 `{suffix}` 占位符。 | `v_{datetime}_{suffix}` |
| `datetimeFormat` | [date-fns](https://date-fns.org/v3.6.0/docs/format) 格式化字符串。 | `yyyyMMddHHmm` |
| `suffixes` | 后缀提示中的选项数组。 | `["test", "main"]` |

### 配置项说明

- **tagFormat**: 支持 `{datetime}` 和 `{suffix}` 两个占位符，会分别被日期时间和后缀替换。
- **datetimeFormat**: 使用 date-fns 的 format 语法，支持任意日期格式。
- **suffixes**: 数组中的每个字符串都会作为交互式选择中的一个选项。

## 📄 开源协议

[MIT](LICENSE)

## 🔗 链接

- [English Documentation](README.md) - 英文文档
- [CHANGELOG](CHANGELOG.md) - 版本历史和变更记录

## ❓ 常见问题排查

- **"Not a git repository"**：请确保您是在已初始化 Git 的目录中运行 `gtt`。
- **"Tag already exists"**：如果您尝试创建已存在的标签，Git 会报错。请使用 `git tag` 查看当前已有的标签。
- **"Permission denied" (npm link)**：在 macOS/Linux 上，您可能需要使用 `sudo npm link`。在 Windows 上，请以管理员身份运行终端。
- **"Authentication failed"**：推送标签时出现认证失败，请检查您的 Git 远程仓库凭证配置。
- **"Branch does not exist on remote"**：使用 `-b` 选项指定的远程分支不存在，请检查分支名称。
