# Context - SmartMarkt SaaS Refactoring

## Active Tracks
- **E2E Testing Track**: Not yet started.
- **Implementation Track**: Currently planning and initializing.

## System Environment
- **Workspace URI**: `/Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application`
- **Database**: SQLite (`backend/database.sqlite`)
- **Backend Tech**: Node.js, Express, Knex, TypeScript
- **Frontend Tech**: React, Tailwind CSS, Vite, TypeScript

## Key Constraints
- SQLite database must be completely wiped and reconstructed with new schema.
- Data isolation: Owner A cannot see Owner B's store data.
- Atomic signup transaction: User (owner), Organization, and first Store must be created atomically.
- Pure orchestrator role: Delegate all exploration, coding, and verification to subagents.

## Code Layout
- Frontend: `frontend/`
- Backend: `backend/`
- Agent metadata: `.agents/`
