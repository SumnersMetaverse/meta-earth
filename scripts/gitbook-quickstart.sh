#!/usr/bin/env bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  GitBook CLI Quickstart Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js is installed: $NODE_VERSION"

# Check Node.js version compatibility
NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
NODE_COMPATIBLE=true
if [ "$NODE_MAJOR_VERSION" -ge 16 ]; then
    echo -e "${YELLOW}⚠${NC}  Warning: Node.js $NODE_VERSION detected."
    echo -e "   GitBook CLI has known compatibility issues with Node.js v16+."
    echo -e "   The CLI will be installed, but full functionality may be limited."
    NODE_COMPATIBLE=false
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    echo "npm should come with Node.js. Please reinstall Node.js."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓${NC} npm is installed: v$NPM_VERSION"
echo ""

# Check if gitbook-cli is already installed
if command -v gitbook &> /dev/null; then
    echo -e "${GREEN}✓${NC} GitBook CLI is already installed"
    
    # Try to get version, but handle the graceful-fs error
    set +e
    GITBOOK_VERSION=$(gitbook --version 2>&1 | head -n 1)
    GITBOOK_EXIT=$?
    set -e
    
    if [ $GITBOOK_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓${NC} GitBook version: $GITBOOK_VERSION"
    else
        echo -e "${YELLOW}⚠${NC}  GitBook CLI is installed but has compatibility issues."
        echo -e "   Applying workaround..."
        
        # Apply the graceful-fs fix
        if [ -d "/usr/local/lib/node_modules/gitbook-cli" ]; then
            cd /usr/local/lib/node_modules/gitbook-cli && npm install graceful-fs@latest --save 2>&1 | grep -v "npm warn" | grep -v "deprecated" || true
        elif [ -d "$HOME/.npm-global/lib/node_modules/gitbook-cli" ]; then
            cd "$HOME/.npm-global/lib/node_modules/gitbook-cli" && npm install graceful-fs@latest --save 2>&1 | grep -v "npm warn" | grep -v "deprecated" || true
        elif [ -d "$HOME/.nvm/versions/node/$(node --version)/lib/node_modules/gitbook-cli" ]; then
            cd "$HOME/.nvm/versions/node/$(node --version)/lib/node_modules/gitbook-cli" && npm install graceful-fs@latest --save 2>&1 | grep -v "npm warn" | grep -v "deprecated" || true
        fi
        
        echo -e "${GREEN}✓${NC} Workaround applied"
    fi
else
    echo "Installing GitBook CLI globally..."
    echo -e "${YELLOW}This may take a few minutes...${NC}"
    
    if npm install -g gitbook-cli 2>&1 | grep -E "(added|changed|removed|audited)" | tail -5; then
        echo -e "${GREEN}✓${NC} GitBook CLI installed successfully!"
        
        # Apply graceful-fs fix for Node.js 16+
        if [ "$NODE_MAJOR_VERSION" -ge 16 ]; then
            echo -e "${BLUE}Applying Node.js compatibility fix...${NC}"
            
            # Find gitbook-cli installation directory
            GITBOOK_CLI_DIR=""
            if [ -d "/usr/local/lib/node_modules/gitbook-cli" ]; then
                GITBOOK_CLI_DIR="/usr/local/lib/node_modules/gitbook-cli"
            elif [ -d "$HOME/.npm-global/lib/node_modules/gitbook-cli" ]; then
                GITBOOK_CLI_DIR="$HOME/.npm-global/lib/node_modules/gitbook-cli"
            elif [ -d "$HOME/.nvm/versions/node/$(node --version)/lib/node_modules/gitbook-cli" ]; then
                GITBOOK_CLI_DIR="$HOME/.nvm/versions/node/$(node --version)/lib/node_modules/gitbook-cli"
            fi
            
            if [ -n "$GITBOOK_CLI_DIR" ]; then
                (cd "$GITBOOK_CLI_DIR" && npm install graceful-fs@latest --save 2>&1 | grep -v "npm warn" | grep -v "deprecated") || true
                echo -e "${GREEN}✓${NC} Compatibility fix applied"
            fi
        fi
        
        # Verify installation
        if command -v gitbook &> /dev/null; then
            echo -e "${GREEN}✓${NC} GitBook CLI is ready to use"
        fi
    else
        echo -e "${RED}Error: Failed to install GitBook CLI${NC}"
        echo "You may need to run this script with sudo or check your npm permissions."
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""

if [ "$NODE_COMPATIBLE" = true ]; then
    echo "GitBook CLI is ready to use. You can now:"
    echo "  • Initialize a new book: gitbook init"
    echo "  • Serve your book locally: gitbook serve"
    echo "  • Build your book: gitbook build"
    echo ""
    echo "For GitBook CLI documentation, visit:"
    echo "https://github.com/GitbookIO/gitbook-cli"
else
    echo -e "${YELLOW}Important Compatibility Notice:${NC}"
    echo ""
    echo "GitBook CLI has been installed, but it has known issues with Node.js v16+."
    echo "Some commands may not work properly with your current Node.js version."
    echo ""
    echo -e "${BLUE}Recommended Solutions:${NC}"
    echo "  1. Use Node Version Manager (nvm) to switch to Node.js 10.x-14.x:"
    echo "     nvm install 14"
    echo "     nvm use 14"
    echo "     gitbook init"
    echo ""
    echo "  2. Use the modern GitBook platform (recommended):"
    echo "     https://www.gitbook.com/"
    echo ""
    echo "  3. Use alternative documentation tools:"
    echo "     - VuePress: https://vuepress.vuejs.org/"
    echo "     - Docusaurus: https://docusaurus.io/"
    echo "     - MkDocs: https://www.mkdocs.org/"
fi

echo ""
