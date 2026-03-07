# dotag CLI

一个强大且灵活的命令行工具，用于创建和推送具有标准化格式的 Git 标签（Tags）。确保您的项目版本管理保持一致且自动化。

## 🚀 功能特性

- **标准化标签**：自动生成如 `v_202403211200_test` 格式的标签。
- **交互式工作流**：提示选择标签后缀并确认是否推送。
- **高度可配置**：自定义标签格式、日期时间格式以及可用的后缀选项。
- **Git 集成**：基于 `simple-git` 构建，性能稳定可靠。

## 📋 前置要求

- [Node.js](https://nodejs.org/) (推荐 v16.0.0 或更高版本)
- 已安装 [Git](https://git-scm.com/) 并已配置在您的 Shell 环境中。

## ⚙️ 安装步骤

1. **克隆仓库**：
   ```bash
   git clone <repository-url>
   cd git-tool
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **全局链接** (可选，但推荐)：
   ```bash
   npm link
   ```
   安装后，您可以在任何目录下运行 `dotag` 命令。

## 📖 使用方法

在任何 Git 仓库中运行以下命令：

```bash
dotag
```

### 交互步骤

1. **选择后缀**：选择一个后缀（例如：`test` 或 `main`）。
2. **确认推送**：确认是否要将标签推送到远程仓库 `origin`。
3. **最终审查**：创建前会显示标签名称预览，供您进行最终确认。

## 🛠️ 配置说明

您可以通过在 **用户主目录**（全局）或 **项目根目录**（局部）下创建 `.dotagrc` 文件来自定义 `dotag`。局部设置会覆盖全局设置。

### 配置文件路径

- **Windows**: `C:\Users\<您的用户名>\.dotagrc`
- **macOS/Linux**: `~/.dotagrc`
- **项目目录**: `<项目根目录>/.dotagrc`

### `.dotagrc` 示例

```json
{
  "tagFormat": "v_{datetime}_{suffix}",
  "datetimeFormat": "yyyyMMddHHmm",
  "suffixes": ["alpha", "beta", "stable"]
}
```

| 选项 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `tagFormat` | 标签的模板。 | `v_{datetime}_{suffix}` |
| `datetimeFormat` | [date-fns](https://date-fns.org/v3.6.0/docs/format) 格式化字符串。 | `yyyyMMddHHmm` |
| `suffixes` | 后缀提示中的选项数组。 | `["test", "main"]` |

## ❓ 常见问题排查

- **"Not a git repository"**：请确保您是在已初始化 Git 的目录中运行 `dotag`。
- **"Tag already exists"**：如果您尝试创建已存在的标签，Git 会报错。请使用 `git tag` 查看当前已有的标签。
- **"Permission denied" (npm link)**：在 macOS/Linux 上，您可能需要使用 `sudo npm link`。在 Windows 上，请以管理员身份运行终端。

## 📄 开源协议

[ISC](LICENSE)
