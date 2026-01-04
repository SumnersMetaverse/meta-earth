#!/bin/bash
# Script to publish OpenAPI documentation to GitBook
# Usage: ./scripts/publish-openapi.sh
#
# Prerequisites:
# 1. Install GitBook CLI: npm install -g @gitbook/cli
# 2. Set GITBOOK_TOKEN environment variable with your API token
#
# Example:
#   export GITBOOK_TOKEN=your-api-token-here
#   ./scripts/publish-openapi.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
OPENAPI_FILE="docs/static/openapi.yml"
SPEC_NAME="sumnersmetaverse-api"
ORGANIZATION_ID="lybZQFBzK6mpGxc7nYtU"

echo -e "${GREEN}GitBook OpenAPI Publisher${NC}"
echo "======================================"

# Check if GitBook CLI is installed
if ! command -v gitbook &> /dev/null; then
    echo -e "${RED}Error: GitBook CLI is not installed${NC}"
    echo "Please install it with: npm install -g @gitbook/cli"
    exit 1
fi

# Check if GITBOOK_TOKEN is set
if [ -z "$GITBOOK_TOKEN" ]; then
    echo -e "${RED}Error: GITBOOK_TOKEN environment variable is not set${NC}"
    echo "Please set it with: export GITBOOK_TOKEN=<your-api-token>"
    exit 1
fi

# Check if OpenAPI file exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo -e "${RED}Error: OpenAPI file not found at $OPENAPI_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Publishing OpenAPI documentation to GitBook...${NC}"
echo "  Spec: $SPEC_NAME"
echo "  Organization: $ORGANIZATION_ID"
echo "  File: $OPENAPI_FILE"
echo ""

# Publish to GitBook
gitbook openapi publish --spec "$SPEC_NAME" --organization "$ORGANIZATION_ID" "$OPENAPI_FILE"

echo ""
echo -e "${GREEN}✓ Successfully published OpenAPI documentation to GitBook${NC}"
