#!/bin/bash

echo "🔧 Setting up Muralla Local Shared State..."

# Create alias for easy access
ALIAS_LINE='alias muralla-sync="node $(pwd)/.shared-state/local-sync.js"'

# Add to shell profile if not already there
for profile in ~/.bashrc ~/.zshrc ~/.bash_profile; do
    if [[ -f "$profile" ]] && ! grep -q "muralla-sync" "$profile"; then
        echo "$ALIAS_LINE" >> "$profile"
        echo "✅ Added alias to $profile"
    fi
done

# Make scripts executable
chmod +x .shared-state/local-sync.js

# Initialize the system
node .shared-state/local-sync.js change "setup" "Initialized Muralla Local Shared State system"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Usage examples:"
echo "  muralla-sync status                    # Check all sessions and servers"
echo "  muralla-sync log 'pnpm start' 'Started backend'"
echo "  muralla-sync change 'code-edit' 'Fixed task assignees' tasks.service.ts"
echo "  muralla-sync server backend running 3000"
echo ""
echo "💡 Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
