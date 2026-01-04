# Getting Started with GitBook Setup

If you're having trouble running the setup scripts, follow these steps carefully:

## 1. Open Your Terminal

Open your terminal application:
- **Windows**: Git Bash, PowerShell, or Command Prompt
- **macOS**: Terminal
- **Linux**: Terminal or your preferred shell

## 2. Navigate to the Repository

First, you need to be in the repository directory. The scripts won't work from your home directory or any other location.

### If you haven't cloned the repository yet:

```bash
# Clone the repository
git clone https://github.com/SumnersMetaverse/meta-earth.git

# Navigate into it
cd meta-earth

# Checkout the branch with GitBook setup
git checkout copilot/install-gitbook-cli
```

### If you already have the repository cloned:

```bash
# Navigate to your repository directory
# Replace /path/to with your actual path
cd /path/to/meta-earth

# Pull the latest changes
git fetch origin
git checkout copilot/install-gitbook-cli
git pull origin copilot/install-gitbook-cli
```

## 3. Verify You're in the Right Place

Before running the scripts, verify you're in the correct directory:

```bash
# Check your current directory
pwd

# This should show something like:
# /Users/yourname/meta-earth
# or C:/Users/yourname/meta-earth
# NOT just /Users/yourname or ~

# Verify the scripts exist
ls scripts/gitbook-quickstart.sh

# If you see "No such file or directory", you're in the wrong directory
```

## 4. Run the Setup Script

Now you can run the interactive setup script:

```bash
./scripts/gitbook-quickstart.sh
```

## Common Mistakes

### ❌ Running from home directory
```bash
drews@Miagojr MINGW64 ~
$ ./scripts/gitbook-quickstart.sh
bash: ./scripts/gitbook-quickstart.sh: No such file or directory
```

**Problem**: You're in your home directory (`~`), not the repository.

**Solution**: Use `cd` to navigate to the repository first (see step 2 above).

### ❌ Wrong path separators (Windows)
```bash
# Don't use backslashes
cd C:\Users\yourname\meta-earth  # ❌

# Use forward slashes
cd C:/Users/yourname/meta-earth  # ✓
```

### ❌ Repository not cloned or branch not checked out
```bash
$ cd meta-earth
bash: cd: meta-earth: No such file or directory
```

**Problem**: Repository not cloned yet.

**Solution**: Clone it first (see step 2 above).

## 5. After Successfully Running the Script

Once you're in the correct directory and run `./scripts/gitbook-quickstart.sh`, the script will:
1. Guide you through generating a GitBook API token
2. Show you how to add it to GitHub Secrets
3. Help you test the setup

## Need More Help?

- **Detailed Setup Guide**: See [SETUP_GITBOOK.md](SETUP_GITBOOK.md)
- **Troubleshooting**: See [GITBOOK_PUBLISHING.md](GITBOOK_PUBLISHING.md)
- **Discord Support**: Join our [Discord](http://discord.gg/ME) community

## Quick Reference

```bash
# All commands assume you're in the repository root directory

# Interactive setup (recommended)
./scripts/gitbook-quickstart.sh

# Verify your setup
./scripts/verify-gitbook-setup.sh

# Publish manually (after setup)
export GITBOOK_TOKEN=your-token-here
./scripts/publish-openapi.sh
```
