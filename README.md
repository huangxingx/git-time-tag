# gtt CLI

A powerful and flexible CLI tool to create and push Git tags with a standardized format. Ensure your project versioning is consistent and automated.

## 🚀 Features

- **Standardized Tagging**: Automatically generates tags like `v_202403211200_test`.
- **Smart Branch Selection**: Interactive search for remote branches with last update time display, automatic merge detection.
- **Tag Location Choice**: When branch is merged, choose to create tag on source branch or target branch (using merge commit).
- **Tag Messages**: Support for annotated tags with comments/messages.
- **Custom Suffixes**: Support for custom suffix or no-suffix mode, with option to save to configuration.
- **Highly Configurable**: Customize tag formats, datetime formats, and available suffixes.
- **Git Integration**: Built on top of `simple-git` for reliable performance.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- [Git](https://git-scm.com/) installed and configured in your shell.

## ⚙️ Installation

**Option 1: Install from npm** (Recommended)

```bash
npm install -g @joemuhuang/gtt
```

**Option 2: Build from source**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/huangxingx/git-time-tag.git
   cd git-time-tag
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Link globally**:
   ```bash
   npm link
   ```
   Now you can run `gtt` from any directory.

## 📖 Usage

Run the command in any Git repository:

```bash
gtt
```

### Interactive Flow

1. **Fetch Remote Branches**: Automatically runs `git fetch --prune` to get latest remote branches and clean up stale references.
2. **Select Remote Branch**: Choose from available remote branches with search functionality, displaying last update time for each branch.
3. **Choose Tag Location** (if applicable): If the selected branch has been merged into main/master/develop, you'll be prompted to choose where to create the tag:
   - **On the source branch** (the branch you selected)
   - **On the merged branch** (e.g., main) - uses the merge commit
4. **Select Suffix**: Choose from configured suffixes, or select:
   - 📝 **Custom** - Enter any custom suffix
   - ❌ **None** - Create tag without suffix
5. **Enter Message**: Add an optional comment/message for the tag (creates annotated tag).
6. **Push Confirmation**: Confirm if you want to push the tag to `origin`.
7. **Final Review**: A preview of the tag name and message is shown for final confirmation.
8. **Save Configuration** (if applicable): If custom suffix was used, choose to save to local project or global user configuration.

### Command Line Options

```bash
gtt                              # Interactive tag creation
gtt -h                           # Display help information
gtt --help                       # Display help information
gtt -m "Release version 1.0.0"   # Create tag with message
gtt --message "Hotfix deploy"    # Create tag with message
gtt -b main                      # Specify remote branch (automatically adds origin/ prefix)
gtt -b origin/feature-x          # Specify remote branch
gtt -b origin/feature-x -m "RC1" # Tag remote branch with message
```

## 🛠️ Configuration

You can customize `gtt` by creating a `.gitimetagrc` file in your **home directory** (global) or **project root** (local). Local settings override global ones.

### Configuration File Locations

- **Windows**: `C:\Users\<YourUsername>\.gitimetagrc`
- **macOS/Linux**: `~/.gitimetagrc`
- **Project**: `<project-root>/.gitimetagrc`

### Example `.gitimetagrc`

```json
{
  "tagFormat": "v_{datetime}_{suffix}",
  "datetimeFormat": "yyyyMMddHHmm",
  "suffixes": ["alpha", "beta", "stable"]
}
```

| Option | Description | Default |
| :--- | :--- | :--- |
| `tagFormat` | The template for the tag. Supports `{datetime}` and `{suffix}` placeholders. | `v_{datetime}_{suffix}` |
| `datetimeFormat` | [date-fns](https://date-fns.org/v3.6.0/docs/format) format string. | `yyyyMMddHHmm` |
| `suffixes` | An array of options for the suffix prompt. | `["test", "main"]` |

### Configuration Options Details

- **tagFormat**: Supports two placeholders: `{datetime}` and `{suffix}`, which will be replaced with datetime string and suffix respectively.
- **datetimeFormat**: Uses date-fns format syntax, supports any date format pattern.
- **suffixes**: Each string in the array becomes an option in the interactive selection.

## 📄 License

[MIT](LICENSE)

## 🔗 Links

- [中文文档](README_zh.md) - Chinese documentation
- [CHANGELOG](CHANGELOG.md) - Version history and changes

## ❓ Troubleshooting

- **"Not a git repository"**: Ensure you are running `gtt` inside a directory initialized with Git.
- **"Tag already exists"**: Git will throw an error if you try to create a tag that already exists. Check your current tags with `git tag`.
- **"Permission denied" (npm link)**: On macOS/Linux, you might need `sudo npm link`. On Windows, run your terminal as Administrator.
- **"Authentication failed"**: Authentication error when pushing tag, please check your Git remote repository credentials.
- **"Branch does not exist on remote"**: The remote branch specified with `-b` option does not exist, please check the branch name.
