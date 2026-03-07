# dotag CLI

A simple CLI tool to create and push Git tags with a standardized format.

## Installation

1. Clone or download this repository.
2. Ensure you have [Node.js](https://nodejs.org/) installed.
3. Install dependencies:
   ```bash
   npm install
   ```
4. (Optional) Link the command globally:
   ```bash
   npm link
   ```

## Usage

Run the command in any Git repository:
```bash
dotag
```

### Options

The tool will prompt you for:
1. **Suffix**: Choose between `test` and `main`.
2. **Push**: Confirm if you want to push the tag to the remote `origin`.

### Configuration

You can customize the tag format by creating a `.dotagrc` file in your home directory (global) or project root (local).

**Example `.dotagrc`:**
```json
{
  "tagFormat": "v_{datetime}_{suffix}",
  "datetimeFormat": "yyyyMMddHHmm"
}
```

- `{datetime}`: Replaced by the current date/time formatted according to `datetimeFormat`.
- `{suffix}`: Replaced by your choice (`test` or `main`).
- `datetimeFormat`: Supports [date-fns](https://date-fns.org/v3.6.0/docs/format) formatting strings.

## License

ISC
