# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm link           # Link globally to use `git-timetag` command
git-timetag        # Run the CLI tool
git-timetag -m "message"  # Create tag with message
npm test           # Run tests with Vitest
```

## Architecture

**Entry point**: `src/index.js` - Commander-based CLI with interactive inquirer prompts

**Modules**:
- `src/config.js` - Loads `.gitimetagrc` config from project root (overrides) and home directory (defaults), with validation and sanitization
- `src/git.js` - simple-git wrappers for branch/tag/push operations with enhanced error handling (supports annotated tags)
- `test/*.test.js` - Vitest unit tests (15 tests covering config and git modules)

**Test**: `vitest` configured in `vitest.config.js`

**Tag format**: `v_{datetime}_{suffix}` where datetime uses date-fns formatting (default: `yyyyMMddHHmm`)

**Config options** (in `.gitimetagrc`):
- `tagFormat` - Tag template with `{datetime}` and `{suffix}` placeholders
- `datetimeFormat` - date-fns format string
- `suffixes` - Array of suffix options for interactive prompt

## Workflow

1. Validates git repository
2. Prompts for suffix (from config)
3. Prompts for tag message (optional, can use `-m` flag)
4. Prompts for push confirmation
5. Shows generated tag name and message for final confirmation
6. Creates tag locally (annotated if message provided), optionally pushes to origin
