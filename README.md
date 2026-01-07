# Assay CLI

[![npm version](https://img.shields.io/npm/v/assay-cli.svg)](https://www.npmjs.com/package/assay-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

**Assay CLI** — Search and browse your Assay document library from the terminal. An AI-powered document intelligence platform that transforms PDFs into structured, searchable knowledge.

> **Assay CLI** enables programmatic access to your document collection, making it easy to search, filter, and retrieve documents, summaries, and themes from the command line.

## Features

- 🔐 **Secure Authentication** - API keys stored in OS keychain
- 📚 **Document Management** - List, search, and retrieve documents
- 🏷️ **Theme Browsing** - Explore canonical themes and classifications
- 📊 **Multiple Output Formats** - JSON, table, or YAML
- 🔄 **Automatic Retries** - Built-in rate limit handling with exponential backoff
- ⚡ **Fast & Reliable** - Efficient API client with error handling

## Installation

### From npm (Recommended)

```bash
npm install -g assay-cli
```

### From Source

```bash
git clone https://github.com/cirruslycurious/assay-cli.git
cd assay-cli
npm install
npm run build
npm link
```

## Requirements

- Node.js 18.0.0 or higher
- An Assay account ([sign up here](https://assay.cirrusly-clever.com))

## Quick Start

1. **Install the CLI:**
   ```bash
   npm install -g assay-cli
   ```

2. **Authenticate:**
   ```bash
   assay auth login
   ```
   This opens your browser to the Assay Dashboard where you can generate an API key. Paste the key when prompted.

3. **Check your status:**
   ```bash
   assay auth status
   ```

4. **Start exploring:**
   ```bash
   # List public documents
   assay documents list

   # Search for documents
   assay documents search --query "AI safety"

   # Browse themes
   assay themes list
   ```

## Commands

### Authentication

- `assay auth login` - Authenticate and generate API key
- `assay auth status` - Show API key status and quota information
- `assay auth rotate` - Rotate API key (opens Dashboard)

### Documents

- `assay documents list` - List documents with pagination
  - `--filter <type>` - Document filter: `public` (all public docs), `personal` (your docs), or `private` (your private docs only). Default: `public`
  - `--limit <number>` - Maximum results per page (default: 20, max: 100)
  - `--cursor <cursor>` - Pagination cursor from previous response
  - `--format <format>` - Output format: `json`, `table`, or `yaml` (default: `json`)

- `assay documents get <id>` - Get document details
  - `--format <format>` - Output format: `json`, `table`, or `yaml`

- `assay documents summary <id>` - Get document summary
  - `--type <type>` - Summary type: `comprehensive`, `casual`, or `faq`. Default: `comprehensive`
  - `--format <format>` - Output format: `json`, `table`, or `yaml`

- `assay documents search` - Search documents
  - `--query <query>` - General search query (searches titles, authors, keywords, and themes)
  - `--theme <theme>` - Canonical theme ID or partial match (e.g., "Competitive Strategy" or "STRATEGY.COMPETITIVE_STRATEGY")
  - `--author <author>` - Author name
  - `--title <title>` - Document title
  - `--keywords <keywords>` - Keywords or concepts
  - `--filter <type>` - Document filter: `public`, `personal`, or `private`. Default: `public`
  - `--limit <number>` - Maximum results (default: 20, max: 100)
  - `--format <format>` - Output format: `json`, `table`, or `yaml`

### Themes

- `assay themes list` - Browse canonical themes with document counts
  - `--domain <domain>` - L0 domain ID (returns L1 themes for that domain, e.g., `ARTIFICIAL_INTELLIGENCE`)
  - `--format <format>` - Output format: `json`, `table`, or `yaml`

## Configuration

Configuration is stored in:
- **Unix/macOS:** `~/.assay/config.json`
- **Windows:** `%APPDATA%\assay\config.json`

API keys are stored securely in your OS keychain:
- **macOS:** Keychain
- **Windows:** Credential Manager
- **Linux:** Secret Service (libsecret)

If keychain is unavailable (e.g., headless Linux), you can:
- Set `ASSAY_API_KEY` environment variable
- Or use the config file with secure permissions (`chmod 600`)

## Environment Variables

- `ASSAY_API_KEY` - API key (overrides config and keychain)
- `ASSAY_BASE_URL` - Base URL for the API (default: `https://api.assay.cirrusly-clever.com`)
- `ASSAY_CONFIG_DIR` - Config directory (overrides default location)

## Output Formats

The CLI supports multiple output formats for scripting and automation:

- `json` (default) - JSON output, perfect for scripting
- `table` - Human-readable table format
- `yaml` - YAML output, alternative structured format

Set the format globally in your config or per-command with `--format`:

```bash
assay documents list --format table
assay documents search --query "AI" --format json | jq '.data[].title'
```

## Examples

### Basic Usage

```bash
# List all public documents (default)
assay documents list

# List your documents (public + private)
assay documents list --filter personal

# List only your private documents
assay documents list --filter private

# Get a specific document
assay documents get abc123def456

# Get document summary in casual format
assay documents summary abc123 --type casual
```

### Search Examples

```bash
# Search by general query
assay documents search --query "AI safety"

# Search by theme
assay documents search --theme "Competitive Strategy"

# Search by author
assay documents search --author "Dario Amodei"

# Search in your documents
assay documents search --query "machine learning" --filter personal

# Combined search
assay documents search --query "AI" --theme ARTIFICIAL_INTELLIGENCE --limit 10
```

### Theme Exploration

```bash
# List all themes with document counts
assay themes list

# List L1 themes for a specific domain
assay themes list --domain ARTIFICIAL_INTELLIGENCE

# Find documents in a specific theme
assay documents search --theme STRATEGY.COMPETITIVE_STRATEGY
```

### Scripting & Automation

```bash
# Export all your documents as JSON
assay documents list --filter personal --format json > my-docs.json

# Find documents and extract titles with jq
assay documents search --query "AI" --format json | jq '.data[].title'

# Check your quota status
assay auth status --format json | jq '.data.dailyQuota'
```

### End-to-End Workflow Example

Generate a comprehensive research report from your document library:

```bash
# 1. Find all documents in a specific theme
assay documents search --theme "Competitive Strategy" --filter public --limit 20 --format json > strategy-docs.json

# 2. Extract document IDs and fetch summaries
cat strategy-docs.json | jq -r '.data[].documentId' | while read doc_id; do
  echo "## Document: $doc_id" >> research-report.md
  assay documents summary "$doc_id" --type comprehensive --format json | jq -r '.data.summary' >> research-report.md
  echo "" >> research-report.md
done

# 3. Result: research-report.md contains all summaries in one consolidated file
```

Or create a quick reference guide for a specific topic:

```bash
# Pull top documents for AI safety theme → generate markdown report
assay documents search --theme "AI_SAFETY" --filter public --limit 10 --format json | \
  jq -r '.data[] | "## \(.title)\n**Authors:** \(.authors | join(", "))\n**Themes:** \(.themes | map(.label) | join(", "))\n"' > ai-safety-reference.md
```

## Error Handling

The CLI automatically handles common errors:

- **Rate Limiting** - Automatically retries on rate limit errors (429) with exponential backoff
- **API Key Expiration** - Shows warnings when your API key is about to expire (< 30 minutes) and errors when expired
- **Helpful Messages** - All errors include suggestions for resolution

## Troubleshooting

### "No API key found"
Run `assay auth login` to authenticate and generate an API key.

### "API key expired"
Run `assay auth login` to generate a new key. Check expiration with `assay auth status`.

### "Keychain not available"
- Set the `ASSAY_API_KEY` environment variable
- Or ensure Secret Service is installed (Linux: `sudo apt-get install libsecret-1-dev`)

### "Rate limit exceeded"
- Wait for quota reset (shown in error message)
- Check your current quota with `assay auth status`
- The CLI will automatically retry with backoff

### "Command not found: assay"
Make sure npm's global bin directory is in your PATH. Check with `npm config get prefix` and add `/bin` to your PATH.

## Documentation

- [Installation Guide](https://assay.cirrusly-clever.com/learn/cli-install)
- [Usage Guide](https://assay.cirrusly-clever.com/learn/cli-usage)
- [Assay Website](https://assay.cirrusly-clever.com)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/cirruslycurious/assay-cli/issues)
- **Website:** [assay.cirrusly-clever.com](https://assay.cirrusly-clever.com)

---

Made with ❤️ by [Cirrusly Clever](https://cirrusly.me)
