#!/bin/bash
# GitBook Setup Verification Script
# This script helps verify that your GitBook publishing setup is correct
# Usage: ./scripts/verify-gitbook-setup.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from the repository root
if [ ! -f "docs/static/openapi.yml" ] || [ ! -d ".git" ]; then
    echo -e "${RED}Error: This script must be run from the meta-earth repository root directory.${NC}"
    echo ""
    echo "Please navigate to the repository first:"
    echo -e "${YELLOW}  cd /path/to/meta-earth${NC}"
    echo ""
    echo "Then run this script:"
    echo -e "${YELLOW}  ./scripts/verify-gitbook-setup.sh${NC}"
    echo ""
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  GitBook Setup Verification Script                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print check result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((CHECKS_FAILED++))
    fi
}

echo -e "${YELLOW}Checking Prerequisites...${NC}"
echo ""

# Check 1: Node.js installation
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_result 0 "Node.js is installed ($NODE_VERSION)"
else
    print_result 1 "Node.js is NOT installed (required: v18+)"
fi

# Check 2: npm installation
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_result 0 "npm is installed (v$NPM_VERSION)"
else
    print_result 1 "npm is NOT installed"
fi

# Check 3: GitBook CLI installation
if command -v gitbook &> /dev/null; then
    print_result 0 "GitBook CLI is installed"
else
    print_result 1 "GitBook CLI is NOT installed (run: npm install -g @gitbook/cli)"
fi

echo ""
echo -e "${YELLOW}Checking Configuration...${NC}"
echo ""

# Check 4: GITBOOK_TOKEN environment variable
if [ -z "$GITBOOK_TOKEN" ]; then
    print_result 1 "GITBOOK_TOKEN environment variable is NOT set"
    echo -e "   ${BLUE}ℹ${NC}  Set it with: export GITBOOK_TOKEN=<your-api-token>"
else
    TOKEN_LENGTH=${#GITBOOK_TOKEN}
    print_result 0 "GITBOOK_TOKEN is set (length: $TOKEN_LENGTH characters)"
fi

# Check 5: OpenAPI file exists
OPENAPI_FILE="docs/static/openapi.yml"
if [ -f "$OPENAPI_FILE" ]; then
    FILE_SIZE=$(du -h "$OPENAPI_FILE" | cut -f1)
    print_result 0 "OpenAPI file exists ($OPENAPI_FILE - $FILE_SIZE)"
else
    print_result 1 "OpenAPI file NOT found at $OPENAPI_FILE"
fi

# Check 6: Workflow file exists
WORKFLOW_FILE=".github/workflows/publish-openapi.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    print_result 0 "GitHub Actions workflow exists ($WORKFLOW_FILE)"
else
    print_result 1 "Workflow file NOT found at $WORKFLOW_FILE"
fi

# Check 7: Publishing script exists and is executable
PUBLISH_SCRIPT="scripts/publish-openapi.sh"
if [ -f "$PUBLISH_SCRIPT" ]; then
    if [ -x "$PUBLISH_SCRIPT" ]; then
        print_result 0 "Publishing script exists and is executable ($PUBLISH_SCRIPT)"
    else
        print_result 1 "Publishing script exists but is NOT executable (run: chmod +x $PUBLISH_SCRIPT)"
    fi
else
    print_result 1 "Publishing script NOT found at $PUBLISH_SCRIPT"
fi

echo ""
echo -e "${YELLOW}Checking Workflow Configuration...${NC}"
echo ""

# Check 8: Verify workflow configuration
if [ -f "$WORKFLOW_FILE" ]; then
    if grep -q "sumnersmetaverse-api" "$WORKFLOW_FILE"; then
        print_result 0 "Spec name 'sumnersmetaverse-api' found in workflow"
    else
        print_result 1 "Spec name NOT found in workflow"
    fi
    
    if grep -q "lybZQFBzK6mpGxc7nYtU" "$WORKFLOW_FILE"; then
        print_result 0 "Organization ID 'lybZQFBzK6mpGxc7nYtU' found in workflow"
    else
        print_result 1 "Organization ID NOT found in workflow"
    fi
    
    if grep -q "GITBOOK_TOKEN" "$WORKFLOW_FILE"; then
        print_result 0 "GITBOOK_TOKEN secret reference found in workflow"
    else
        print_result 1 "GITBOOK_TOKEN reference NOT found in workflow"
    fi
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "Summary: ${GREEN}$CHECKS_PASSED passed${NC}, ${RED}$CHECKS_FAILED failed${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. If GITBOOK_TOKEN is set locally, test with: ./scripts/publish-openapi.sh"
    echo "2. Ensure GITBOOK_TOKEN is added as a GitHub Secret"
    echo "3. Test the workflow by pushing changes to docs/static/openapi.yml"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed.${NC}"
    echo ""
    echo "Please review the failures above and:"
    echo "1. Install missing dependencies"
    echo "2. Set required environment variables"
    echo "3. Verify file paths and permissions"
    echo ""
    echo "For detailed setup instructions, see: docs/SETUP_GITBOOK.md"
    echo ""
    exit 1
fi
