# gtt CLI

A powerful and flexible CLI tool to create and push Git tags with a standardized format. Ensure your project versioning is consistent and automated.

## 🚀 Features

- **Standardized Tagging**: Automatically generates tags like `v_202403211200_test`.
- **Interactive Workflow**: Prompts for tag suffix, message, and push confirmation.
- **Tag Messages**: Support for annotated tags with comments/messages.
- **Highly Configurable**: Customize tag formats, datetime formats, and available suffixes.
- **Git Integration**: Built on top of `simple-git` for reliable performance.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- [Git](https://git-scm.com/) installed and configured in your shell.

## ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:huangxingx/git-time-tag.git
   cd git-time-tag
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Link globally** (Optional but recommended):
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

1. **Select Remote Branch**: Choose from available remote branches (or use `-b` option)
2. **Select Suffix**: Choose a suffix (e.g., `test` or `main`)
3. **Enter Message**: Add an optional comment/message for the tag
4. **Push Confirmation**: Confirm if you want to push the tag to `origin`
5. **Final Review**: A preview of the tag name and message is shown for final confirmation

### Command Line Options

```bash
gtt -m "Release version 1.0.0"    # Create tag with message
gtt --message "Hotfix deploy"     # Create tag with message
gtt -b origin/main                # Tag specific remote branch
gtt -b origin/feature-x -m "RC1"  # Tag remote branch with message
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
| `tagFormat` | The template for the tag. | `v_{datetime}_{suffix}` |
| `datetimeFormat` | [date-fns](https://date-fns.org/v3.6.0/docs/format) format string. | `yyyyMMddHHmm` |
| `suffixes` | An array of options for the suffix prompt. | `["test", "main"]` |

## ❓ Troubleshooting

- **"Not a git repository"**: Ensure you are running `gtt` inside a directory initialized with Git.
- **"Tag already exists"**: Git will throw an error if you try to create a tag that already exists. Check your current tags with `git tag`.
- **"Permission denied" (npm link)**: On macOS/Linux, you might need `sudo npm link`. On Windows, run your terminal as Administrator.

## 📄 License

[ISC](LICENSE)
