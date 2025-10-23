```markdown
# demo

This repository contains a minimal demo app so the cursor.dev agent can connect and index the project.

What this repo contains
- index.js — minimal Node entrypoint
- package.json — minimal Node manifest
- .env.example — example environment variables
- .gitignore — keep secrets & node_modules out of git

How to run locally (optional)
1. Clone: git clone https://github.com/chas-cp/demo.git
2. Install Node dependencies (if you add any): npm install
3. Set env var and run:
   - Unix/macOS: EXAMPLE_VAR=hello node index.js
   - Windows (PowerShell): $env:EXAMPLE_VAR='hello'; node index.js

Notes for cursor.dev
- After you add these files, cursor.dev should be able to connect and index the repo.
- Add real project code and dependency manifests as needed for your actual app.
```
