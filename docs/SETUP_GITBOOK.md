# GitBook Setup Guide - Step by Step

This guide will walk you through the complete setup process for GitBook OpenAPI publishing.

## Step 1: Generate a GitBook API Token

1. **Visit GitBook Settings**
   - Go to https://app.gitbook.com/settings
   - Log in with your GitBook account if you haven't already

2. **Navigate to API Tokens**
   - In the left sidebar, look for "Developer settings" or "API tokens"
   - Click on it to access the API token management page

3. **Create a New API Token**
   - Click "Create new token" or similar button
   - Give it a descriptive name (e.g., "GitHub Actions - meta-earth")
   - Select appropriate permissions:
     - **Required**: Write access to OpenAPI specs
     - **Required**: Access to organization `lybZQFBzK6mpGxc7nYtU`
   - Click "Create" or "Generate"

4. **Copy the Token**
   - ⚠️ **IMPORTANT**: Copy the token immediately and store it securely
   - You won't be able to see it again after you leave this page
   - The token should look something like: `gb_live_xxxxxxxxxxxxxxxxxxxxx`

## Step 2: Add Token to GitHub Repository Secrets

1. **Navigate to Repository Settings**
   - Go to https://github.com/SumnersMetaverse/meta-earth
   - Click on "Settings" tab (requires admin access)

2. **Access Secrets Section**
   - In the left sidebar, expand "Secrets and variables"
   - Click on "Actions"

3. **Add New Secret**
   - Click "New repository secret" button
   - **Name**: `GITBOOK_TOKEN` (must be exactly this name)
   - **Value**: Paste the GitBook API token you copied in Step 1
   - Click "Add secret"

4. **Verify Secret Added**
   - You should see `GITBOOK_TOKEN` listed in the secrets
   - The value will be hidden for security

## Step 3: Test the Setup

### Option A: Trigger Workflow Manually (Recommended for First Test)

1. **Go to Actions Tab**
   - Visit https://github.com/SumnersMetaverse/meta-earth/actions
   - Find the "Publish OpenAPI to GitBook" workflow

2. **Run Workflow**
   - Click on the workflow name
   - Click "Run workflow" button (top right)
   - Select branch: `main` or `master`
   - Click "Run workflow"

3. **Monitor Execution**
   - Watch the workflow run in real-time
   - Check for any errors in the logs
   - Success: OpenAPI spec published to GitBook!

### Option B: Test with Manual Script (Local Testing)

1. **Export the Token Locally**
   ```bash
   export GITBOOK_TOKEN=<your-gitbook-api-token>
   ```

2. **Run the Publishing Script**
   ```bash
   ./scripts/publish-openapi.sh
   ```

3. **Verify Output**
   - Script should show success message
   - Check GitBook to confirm the spec is published

### Option C: Automatic Trigger (After Initial Test)

1. **Make a Small Change**
   - Edit `docs/static/openapi.yml`
   - Add a comment or minor update

2. **Commit and Push to main/master**
   ```bash
   git add docs/static/openapi.yml
   git commit -m "Update OpenAPI spec"
   git push origin main
   ```

3. **Workflow Runs Automatically**
   - GitHub Actions will automatically trigger
   - OpenAPI spec will be published to GitBook

## Verification

After setup is complete, verify:

1. ✅ GitBook API token is generated
2. ✅ `GITBOOK_TOKEN` secret exists in GitHub repository
3. ✅ Workflow runs successfully (check Actions tab)
4. ✅ OpenAPI spec is visible in GitBook at:
   - Organization: `lybZQFBzK6mpGxc7nYtU`
   - Spec: `sumnersmetaverse-api`

## Troubleshooting

### "Error: Missing API token"
- Verify secret name is exactly `GITBOOK_TOKEN`
- Check that secret is set in the repository (not organization level)

### "Error: Unauthorized"
- Verify the GitBook token has correct permissions
- Regenerate token if it has expired

### "Error: Organization not found"
- Confirm you have access to organization `lybZQFBzK6mpGxc7nYtU`
- Check organization ID is correct in workflow

### "Error: Spec not found"
- Spec will be created automatically on first publish
- Verify spec name `sumnersmetaverse-api` is correct

## Next Steps After Setup

Once setup is complete:

1. **Automatic Publishing**: Any changes to `docs/static/openapi.yml` on main/master will automatically publish to GitBook
2. **Manual Publishing**: Run `./scripts/publish-openapi.sh` anytime with `GITBOOK_TOKEN` exported
3. **Documentation**: Share the GitBook link with your team

## Security Notes

- 🔒 Never commit the `GITBOOK_TOKEN` to the repository
- 🔒 Use GitHub Secrets to store sensitive tokens
- 🔒 Rotate tokens periodically for security
- 🔒 Grant minimum required permissions to tokens

## Support

For additional help:
- GitBook API Documentation: https://docs.gitbook.com/
- GitHub Actions Documentation: https://docs.github.com/en/actions
- Repository Issues: https://github.com/SumnersMetaverse/meta-earth/issues
