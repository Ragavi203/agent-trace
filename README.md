# agent-trace — Open Source Agent Debugger

See exactly what your agent did. Ingest any agent trace (LangChain, LangGraph, CrewAI, or custom JSON), then replay it step-by-step with tool inputs/outputs, errors, durations, and per-tool analytics.

## What it does
- Ingest JSON traces via API or the UI.
- List runs; view a run as a timeline of steps and tool calls.
- Inspect inputs, outputs, and errors for every step and tool invocation.
- Analytics: run/step/tool durations, tool latency buckets, per-tool success/fail and average durations.
- Manage runs (delete) and browse built-in docs/snippets for integrations.

## Quick start (local)
```bash
npm install
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
npm run db:push
npm run db:seed   # optional demo data
npm run dev
# open http://localhost:3000
```

## Ingest API
- Endpoint: `POST /api/ingest`
- Payload shape (minimal):
```json
{
  "name": "My run",
  "framework": "LANGCHAIN",
  "status": "SUCCESS",
  "tags": ["demo"],
  "metadata": {"user": "alice"},
  "steps": [
    {
      "index": 0,
      "name": "Plan",
      "kind": "THOUGHT",
      "input": {"question": "Hello?"},
      "status": "SUCCESS",
      "toolCalls": [
        {
          "name": "search",
          "input": {"q": "hi"},
          "output": {"answer": "hello"},
          "status": "SUCCESS"
        }
      ]
    }
  ]
}
```
- Optional for richer analytics: add `startedAt`/`endedAt` to runs, steps, and toolCalls (ISO timestamps) to see durations and latency buckets.

## UI flows
- Home: send a sample trace, paste your JSON, or use presets (LangChain/LangGraph/CrewAI). Recent runs show View/Delete actions.
- Run detail: timeline of steps and tool calls with inputs/outputs/errors, per-step/tool durations, tool latency histogram, per-tool success/fail and averages.
- Docs: integration snippets for LangChain (JS), LangGraph (JS), CrewAI (Python) at `/docs`.

## Integration snippets (see `/docs` in the app)
- LangChain (JS): serialize your chain/agent steps + tool calls and POST to `/api/ingest`.
- LangGraph (JS): map node events to steps with toolCalls, then POST.
- CrewAI (Python): build the same payload and `requests.post` it.

## Scripts
- `npm run dev` — start dev server
- `npm run lint` — lint
- `npm run db:push` — sync Prisma schema to SQLite
- `npm run db:seed` — load demo data

## Tech
- Next.js (App Router), Tailwind
- Prisma + SQLite (swap to Postgres by updating `DATABASE_URL` and schema)
- Zod validation on ingest

## Notes
- No AI dependency: the app only renders and analyzes the traces you send.
- Delete runs from the UI to keep the list clean.
