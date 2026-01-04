# GitBook OpenAPI Publishing

This document describes how to publish the OpenAPI documentation to GitBook.

## Overview

The repository includes automation to publish the OpenAPI specification (`docs/static/openapi.yml`) to GitBook using the GitBook CLI.

## Automated Publishing (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically publishes the OpenAPI documentation to GitBook when:
- Changes are pushed to the `main` or `master` branch
- The OpenAPI file (`docs/static/openapi.yml`) is modified
- The workflow is manually triggered

### Setup

To enable automated publishing, you need to configure the `GITBOOK_TOKEN` secret in your GitHub repository:

1. Generate a GitBook API token:
   - Go to [GitBook Settings](https://app.gitbook.com/settings)
   - Navigate to "Developer settings" or "API tokens"
   - Create a new API token with appropriate permissions

2. Add the token to GitHub Secrets:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GITBOOK_TOKEN`
   - Value: Your GitBook API token
   - Click "Add secret"

3. The workflow will automatically run when triggered

### Configuration

The workflow is configured with the following parameters:
- **Spec name**: `sumnersmetaverse-api`
- **Organization ID**: `lybZQFBzK6mpGxc7nYtU`
- **OpenAPI file**: `docs/static/openapi.yml`

To modify these parameters, edit the workflow file at `.github/workflows/publish-openapi.yml`.

## Manual Publishing

You can also publish the OpenAPI documentation manually using the provided script.

### Prerequisites

1. Install Node.js (version 18 or higher)
2. Install GitBook CLI globally:
   ```bash
   npm install -g @gitbook/cli
   ```
3. Set your GitBook API token as an environment variable:
   ```bash
   export GITBOOK_TOKEN=<your-api-token>
   ```

### Usage

Run the publishing script:

```bash
./scripts/publish-openapi.sh
```

The script will:
1. Verify that GitBook CLI is installed
2. Check that the `GITBOOK_TOKEN` environment variable is set
3. Confirm the OpenAPI file exists
4. Publish the documentation to GitBook

## Troubleshooting

### GitBook CLI not found

If you get an error that `gitbook` command is not found:

```bash
npm install -g @gitbook/cli
```

### GITBOOK_TOKEN not set

Ensure you've exported the token in your current shell session:

```bash
export GITBOOK_TOKEN=<your-api-token>
```

### OpenAPI file not found

Make sure you're running the script from the repository root and that the file exists at `docs/static/openapi.yml`.

## Updating the OpenAPI Specification

To update the OpenAPI documentation:

1. Edit the `docs/static/openapi.yml` file
2. Commit and push your changes
3. The GitHub Actions workflow will automatically publish the updated documentation
4. Alternatively, run the manual publishing script to publish immediately

## Support

For issues with:
- **GitBook API**: Check [GitBook Documentation](https://docs.gitbook.com/)
- **GitBook CLI**: Check [GitBook CLI Documentation](https://github.com/GitbookIO/gitbook-cli)
- **This workflow**: Open an issue in this repository
