import Link from "next/link";

const codeBlock = (content: string) => (
  <pre className="mt-2 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800">
    {content}
  </pre>
);

export default function DocsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 bg-white">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          agent-trace · Integration snippets
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">
          Send traces from your agents
        </h1>
        <p className="max-w-3xl text-sm text-zinc-600">
          These snippets push a structured run with steps and tool calls to
          <code className="mx-1 rounded bg-zinc-100 px-1">/api/ingest</code>.
          Adapt the payload to your agent chain and tool outputs.
        </p>
        <Link
          href="/"
          className="text-sm font-semibold text-sky-700 hover:text-sky-800"
        >
          ← Back to app
        </Link>
      </header>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Payload shape</h2>
        <p className="text-sm text-zinc-700">
          Core fields: <code>name</code>, <code>framework</code>,{" "}
          <code>status</code>, <code>tags</code>, <code>metadata</code>, and an
          ordered array of <code>steps</code>. Each step can include{" "}
          <code>toolCalls</code> with inputs/outputs/errors and timestamps.
        </p>
        {codeBlock(`{
  "name": "Checkout investigation",
  "framework": "LANGCHAIN",
  "status": "SUCCESS",
  "tags": ["prod", "checkout"],
  "metadata": {"ticket_id": "TCK-123"},
  "steps": [
    {
      "index": 0,
      "name": "Understand issue",
      "kind": "THOUGHT",
      "input": {"customer": "alice", "message": "payment failed"},
      "status": "SUCCESS"
    },
    {
      "index": 1,
      "name": "Call payments API",
      "kind": "TOOL",
      "status": "SUCCESS",
      "toolCalls": [
        {
          "name": "payments.lookup",
          "input": {"order": "ord_123"},
          "output": {"status": "declined", "reason": "3DS_REQUIRED"},
          "status": "SUCCESS"
        }
      ]
    }
  ]
}`)}
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">LangChain (JS)</h2>
        <p className="text-sm text-zinc-700">
          Wrap your chain/agent run and serialize the trace you collect into this
          payload. Use <code>fetch</code> to POST to the ingest endpoint.
        </p>
        {codeBlock(`import fetch from "node-fetch";

async function sendTrace(run) {
  const payload = {
    name: run.name ?? "LangChain run",
    framework: "LANGCHAIN",
    status: run.error ? "FAILED" : "SUCCESS",
    tags: ["langchain"],
    steps: run.steps.map((step, index) => ({
      index,
      name: step.name,
      kind: step.type, // THOUGHT | TOOL | OBSERVATION
      input: step.input,
      output: step.output,
      error: step.error,
      status: step.error ? "FAILED" : "SUCCESS",
      toolCalls: (step.toolCalls ?? []).map((t) => ({
        name: t.name,
        input: t.args,
        output: t.result,
        error: t.error,
        status: t.error ? "FAILED" : "SUCCESS",
      })),
    })),
  };

  await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}`)}
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">LangGraph (JS)</h2>
        <p className="text-sm text-zinc-700">
          Capture node events; each node invocation becomes a step with tool
          calls if applicable.
        </p>
        {codeBlock(`async function sendGraphTrace(graphRun) {
  const steps = graphRun.events.map((event, index) => ({
    index,
    name: event.node,
    kind: event.kind ?? "ACTION",
    input: event.input,
    output: event.output,
    status: event.error ? "FAILED" : "SUCCESS",
    toolCalls: (event.tools ?? []).map((t) => ({
      name: t.name,
      input: t.args,
      output: t.result,
      error: t.error,
      status: t.error ? "FAILED" : "SUCCESS",
    })),
  }));

  const payload = {
    name: graphRun.name ?? "LangGraph run",
    framework: "LANGGRAPH",
    status: steps.some((s) => s.status === "FAILED") ? "FAILED" : "SUCCESS",
    tags: ["langgraph"],
    steps,
  };

  await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}`)}
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">CrewAI (Python)</h2>
        <p className="text-sm text-zinc-700">
          Serialize your crew run outputs and post the trace. Use requests in
          Python; structure matches the ingest schema.
        </p>
        {codeBlock(`import requests

def send_crew_trace(run):
    steps = []
    for i, step in enumerate(run["steps"]):
        steps.append({
            "index": i,
            "name": step.get("name"),
            "kind": step.get("type", "ACTION"),
            "input": step.get("input"),
            "output": step.get("output"),
            "error": step.get("error"),
            "status": "FAILED" if step.get("error") else "SUCCESS",
            "toolCalls": [
                {
                    "name": t.get("name"),
                    "input": t.get("args"),
                    "output": t.get("result"),
                    "error": t.get("error"),
                    "status": "FAILED" if t.get("error") else "SUCCESS",
                }
                for t in step.get("toolCalls", [])
            ],
        })

    payload = {
        "name": run.get("name", "CrewAI run"),
        "framework": "CREWAI",
        "status": "FAILED" if any(s["status"] == "FAILED" for s in steps) else "SUCCESS",
        "tags": ["crewai"],
        "steps": steps,
    }

    requests.post(
        "http://localhost:3000/api/ingest",
        json=payload,
        timeout=10,
    )`)}
      </section>
    </main>
  );
}
