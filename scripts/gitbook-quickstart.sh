#!/bin/bash
# GitBook Quick Start Guide
# Interactive script to help set up GitBook publishing
# Usage: ./scripts/gitbook-quickstart.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if running from the repository root
if [ ! -f "docs/static/openapi.yml" ] || [ ! -d ".git" ]; then
    echo -e "${RED}Error: This script must be run from the meta-earth repository root directory.${NC}"
    echo ""
    echo "Please navigate to the repository first:"
    echo -e "${YELLOW}  cd /path/to/meta-earth${NC}"
    echo ""
    echo "Then run this script:"
    echo -e "${YELLOW}  ./scripts/gitbook-quickstart.sh${NC}"
    echo ""
    exit 1
fi

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       GitBook OpenAPI Publishing Setup            ║${NC}"
echo -e "${BLUE}║              Quick Start Guide                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}This script will guide you through the 3 steps to set up${NC}"
echo -e "${CYAN}GitBook OpenAPI publishing for the meta-earth project.${NC}"
echo ""
echo -e "${YELLOW}Press Enter to continue...${NC}"
read

# Step 1: Generate GitBook API Token
clear
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ Step 1/3: Generate GitBook API Token              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "You need to generate an API token from GitBook."
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "1. Open this URL in your browser:"
echo -e "   ${CYAN}https://app.gitbook.com/settings${NC}"
echo ""
echo "2. Navigate to 'Developer settings' or 'API tokens'"
echo ""
echo "3. Click 'Create new token'"
echo ""
echo "4. Set a name (e.g., 'GitHub Actions - meta-earth')"
echo ""
echo "5. Ensure these permissions are granted:"
echo "   - Write access to OpenAPI specs"
echo "   - Access to organization: lybZQFBzK6mpGxc7nYtU"
echo ""
echo "6. Click 'Create' or 'Generate'"
echo ""
echo "7. Copy the token immediately (you won't see it again!)"
echo "   It should start with: gb_live_..."
echo ""
echo -e "${YELLOW}Have you generated the token? (y/n)${NC}"
read -r STEP1_DONE

if [[ "$STEP1_DONE" != "y" ]]; then
    echo -e "${RED}Please generate the token first before continuing.${NC}"
    echo "Run this script again when you're ready."
    exit 0
fi

# Step 2: Add Token to GitHub Secrets
clear
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ Step 2/3: Add Token to GitHub Secrets             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Now you need to add the token as a GitHub repository secret."
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "1. Open this URL in your browser:"
echo -e "   ${CYAN}https://github.com/SumnersMetaverse/meta-earth/settings/secrets/actions${NC}"
echo ""
echo "2. Click 'New repository secret'"
echo ""
echo "3. Enter the following details:"
echo -e "   Name: ${YELLOW}GITBOOK_TOKEN${NC} (exactly as shown)"
echo "   Value: Paste your GitBook API token from Step 1"
echo ""
echo "4. Click 'Add secret'"
echo ""
echo "5. Verify that 'GITBOOK_TOKEN' appears in the secrets list"
echo ""
echo -e "${YELLOW}Have you added the secret to GitHub? (y/n)${NC}"
read -r STEP2_DONE

if [[ "$STEP2_DONE" != "y" ]]; then
    echo -e "${RED}Please add the secret to GitHub before continuing.${NC}"
    echo "Run this script again when you're ready."
    exit 0
fi

# Step 3: Test the Setup
clear
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ Step 3/3: Test the Setup                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Great! Now let's test that everything works."
echo ""
echo -e "${YELLOW}Choose a testing method:${NC}"
echo ""
echo "1. Test via GitHub Actions (Recommended)"
echo "   - Manually trigger the workflow in GitHub"
echo "   - Best for verifying the full automated setup"
echo ""
echo "2. Test locally with script"
echo "   - Requires GitBook CLI installed"
echo "   - Good for quick local verification"
echo ""
echo "3. Skip testing for now"
echo ""
echo -e "${YELLOW}Enter your choice (1, 2, or 3):${NC}"
read -r TEST_CHOICE

case $TEST_CHOICE in
    1)
        clear
        echo -e "${CYAN}Testing via GitHub Actions...${NC}"
        echo ""
        echo -e "${YELLOW}Instructions:${NC}"
        echo "1. Open this URL:"
        echo -e "   ${CYAN}https://github.com/SumnersMetaverse/meta-earth/actions/workflows/publish-openapi.yml${NC}"
        echo ""
        echo "2. Click 'Run workflow' button (on the right)"
        echo ""
        echo "3. Select branch: main or master"
        echo ""
        echo "4. Click 'Run workflow'"
        echo ""
        echo "5. Wait for the workflow to complete"
        echo ""
        echo "6. Check the logs for any errors"
        echo ""
        echo -e "${GREEN}If successful, your OpenAPI spec is now published to GitBook!${NC}"
        ;;
    2)
        clear
        echo -e "${CYAN}Testing locally...${NC}"
        echo ""
        echo "First, let's check if you have the prerequisites:"
        echo ""
        
        # Run verification script
        if [ -f "scripts/verify-gitbook-setup.sh" ]; then
            ./scripts/verify-gitbook-setup.sh
        else
            echo -e "${RED}Verification script not found.${NC}"
        fi
        
        echo ""
        echo "To publish locally:"
        echo "1. Export your GitBook token:"
        echo -e "   ${YELLOW}export GITBOOK_TOKEN=<your-token>${NC}"
        echo ""
        echo "2. Run the publishing script:"
        echo -e "   ${YELLOW}./scripts/publish-openapi.sh${NC}"
        ;;
    3)
        echo ""
        echo -e "${YELLOW}Skipping testing.${NC}"
        echo "You can test later using the GitHub Actions workflow."
        ;;
    *)
        echo ""
        echo -e "${RED}Invalid choice.${NC}"
        ;;
esac

# Final summary
clear
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Setup Complete! 🎉                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Summary of what was set up:${NC}"
echo ""
echo -e "✓ GitBook API token generated"
echo -e "✓ GITBOOK_TOKEN secret added to GitHub"
echo -e "✓ Ready to test and use"
echo ""
echo -e "${YELLOW}What happens next:${NC}"
echo ""
echo "• Automatic Publishing:"
echo "  When you push changes to docs/static/openapi.yml on main/master,"
echo "  GitHub Actions will automatically publish to GitBook"
echo ""
echo "• Manual Publishing:"
echo "  Run: ./scripts/publish-openapi.sh (with GITBOOK_TOKEN exported)"
echo ""
echo "• Your OpenAPI spec will be available at:"
echo "  Organization: lybZQFBzK6mpGxc7nYtU"
echo "  Spec: sumnersmetaverse-api"
echo ""
echo -e "${YELLOW}Useful Resources:${NC}"
echo "• Detailed setup guide: docs/SETUP_GITBOOK.md"
echo "• Verify setup: ./scripts/verify-gitbook-setup.sh"
echo "• Usage and troubleshooting: docs/GITBOOK_PUBLISHING.md"
echo ""
echo -e "${GREEN}Thank you for using the GitBook setup guide!${NC}"
echo ""
