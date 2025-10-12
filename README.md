# IntelliSpec Web

This repository powers IntelliSpec’s AI-driven inspection platform: a React/TypeScript front end backed by a Fastify + MongoDB API, LangGraph workflows, and multi-tenant enterprise controls.

## Quick Start

1. Copy `env.sample` to `.env` and fill out the required values (MongoDB URI, JWT secret, OpenAI keys, API base).
2. Install dependencies with `npm install`.
3. Run the API server with `npm run api`, then start the web app with `npm start`.
4. Execute the backend smoke suite with `npm run test:api` whenever you touch API routes or middleware.

For production, use `NODE_ENV=production node api/server.js` or `pm2`, and consult the runbook for Docker and deployment details.

## Documentation

- Operations & architecture runbook: `docs/intellispec-runbook.md`
- Workspace metadata lives under `public/data/workspaces`
- API source lives under `api/`

The runbook replaces the previous collection of markdown status reports and should be treated as the canonical reference.
