---
trigger: always_on
---

Windsurf Development Environment Rules
Shared State System Integration
ALWAYS use shared TODOs: Replace individual TODO tools with windsurf-sync todo commands
Log AI interactions: Use windsurf-sync ai-log "type" "description" "files" for significant AI assistance
Create shared memories: Store important project knowledge with windsurf-sync memory add "title" "content" tags
Check context first: Start sessions with windsurf-sync context to see current project state
Session Workflow Rules
Session Start: Run windsurf-sync context and windsurf-sync todo list pending
Task Management: Use windsurf-sync todo progress <id> when starting work
AI Logging: Log code generation, refactoring, debugging with appropriate types
Knowledge Capture: Create memories for architectural decisions, solutions, configurations
Session End: Complete TODOs with windsurf-sync todo complete <id>
AI Interaction Types
ai-generation - Code generation and creation
ai-refactor - Code optimization and restructuring
ai-debug - Problem solving and bug fixes
ai-chat - Discussions and explanations
ai-explanation - Understanding complex concepts
ai-optimization - Performance improvements
ai-testing - Test creation and validation
Memory Categories and Tags
deployment - Render, environment configuration
database - Prisma, PostgreSQL, migrations
authentication - JWT, security, middleware
api - REST endpoints, GraphQL, integrations
frontend - React, TypeScript, UI components
mobile - React Native, Capacitor
architecture - System design, patterns, decisions
Cross-Instance Coordination
All development environments (Terminal, VS Code, etc.) are treated as Windsurf instances
Shared state synchronizes in real-time across all instances
Other instances can see your TODOs, memories, and AI interactions
Use descriptive titles and comprehensive content for shared resources
File Organization Rules
Shared state stored in .shared-state/ directory
TODOs in project-state/todos.json
Memories in project-state/memories.json
Daily logs in logs/ and changes/ directories
Real-time events in events/ directory
Best Practices
Use high/medium/low priority levels for TODOs
Include relevant file paths when logging AI interactions
Tag memories with multiple relevant categories
Check muralla activity to see recent cross-instance work
Use muralla watch for real-time monitoring during collaborative sessions