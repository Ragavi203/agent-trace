"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function TraceSubmitForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const [text, setText] = useState<string>(exampleTrace);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    setRunUrl(null);

    try {
      const parsed = JSON.parse(text);
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to ingest trace.");
      }

      const data = await res.json();
      const id = data?.id as string | undefined;

      setStatus("success");
      setMessage(
        id
          ? "Trace recorded. Open the run below."
          : "Trace recorded. Refresh the runs list.",
      );
      if (id) setRunUrl(`/runs/${id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Please provide valid JSON and try again.";
      setStatus("error");
      setMessage(msg);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">
            Paste a trace JSON
          </h3>
          <p className="text-sm text-zinc-600">
            JSON only (not shell/python snippets). We’ll ingest it and link you
            to the run instantly.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setText(exampleTrace)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setText(langchainTrace)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            LangChain
          </button>
          <button
            type="button"
            onClick={() => setText(langgraphTrace)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            LangGraph
          </button>
          <button
            type="button"
            onClick={() => setText(crewaiTrace)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            CrewAI
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        aria-label="Trace JSON"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending..." : "Ingest trace"}
        </button>
        {runUrl && (
          <a
            href={runUrl}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View run →
          </a>
        )}
        {status === "success" && !runUrl && (
          <span className="text-sm font-semibold text-emerald-700">
            Trace recorded. Refresh the runs list.
          </span>
        )}
        {status === "error" && (
          <span className="text-sm font-semibold text-rose-600">{message}</span>
        )}
      </div>
      {status === "idle" || status === "success" ? (
        <p className="text-xs text-zinc-600">
          Works with LangChain, LangGraph, and CrewAI. Keep the structure: runs →
          steps → toolCalls.
        </p>
      ) : (
        <p className="text-xs text-zinc-600">{message}</p>
      )}
    </form>
  );
}

const exampleTrace = `{
  "name": "Quick demo run",
  "framework": "LANGCHAIN",
  "status": "SUCCESS",
  "tags": ["demo", "ui"],
  "metadata": {"user": "product-walkthrough"},
  "steps": [
    {
      "index": 0,
      "name": "Plan",
      "kind": "THOUGHT",
      "input": {"question": "How do I reset my password?"},
      "output": {"plan": "Check help docs, then respond"},
      "status": "SUCCESS"
    },
    {
      "index": 1,
      "name": "Fetch help article",
      "kind": "TOOL",
      "status": "SUCCESS",
      "toolCalls": [
        {
          "name": "help.search",
          "input": {"query": "reset password"},
          "output": {"url": "https://example.com/reset-password"},
          "status": "SUCCESS"
        }
      ]
    },
    {
      "index": 2,
      "name": "Draft reply",
      "kind": "OBSERVATION",
      "status": "SUCCESS",
      "output": {
        "reply": "Visit https://example.com/reset-password and click 'Reset'."
      }
    }
  ]
}`;

const langchainTrace = `{
  "name": "LangChain support flow",
  "framework": "LANGCHAIN",
  "status": "SUCCESS",
  "tags": ["langchain", "demo"],
  "steps": [
    {
      "index": 0,
      "name": "Plan",
      "kind": "THOUGHT",
      "input": {"customer": "alice", "issue": "checkout failed"},
      "status": "SUCCESS"
    },
    {
      "index": 1,
      "name": "Call payments tool",
      "kind": "TOOL",
      "status": "SUCCESS",
      "toolCalls": [
        {
          "name": "payments.lookup",
          "input": {"order_id": "ord_123"},
          "output": {"status": "declined", "reason": "3DS_REQUIRED"},
          "status": "SUCCESS"
        }
      ]
    }
  ]
}`;

const langgraphTrace = `{
  "name": "LangGraph node trace",
  "framework": "LANGGRAPH",
  "status": "SUCCESS",
  "tags": ["langgraph", "demo"],
  "steps": [
    {
      "index": 0,
      "name": "start",
      "kind": "ACTION",
      "input": {"question": "why slow?"},
      "status": "SUCCESS"
    },
    {
      "index": 1,
      "name": "fetch_metrics",
      "kind": "TOOL",
      "status": "SUCCESS",
      "toolCalls": [
        {
          "name": "metrics.get",
          "input": {"service": "api"},
          "output": {"p95_ms": 820},
          "status": "SUCCESS"
        }
      ]
    }
  ]
}`;

const crewaiTrace = `{
  "name": "CrewAI email helper",
  "framework": "CREWAI",
  "status": "SUCCESS",
  "tags": ["crewai", "demo"],
  "steps": [
    {
      "index": 0,
      "name": "Plan",
      "kind": "ACTION",
      "input": {"task": "draft apology email"},
      "status": "SUCCESS"
    },
    {
      "index": 1,
      "name": "Search context",
      "kind": "TOOL",
      "status": "SUCCESS",
      "toolCalls": [
        {
          "name": "search",
          "input": {"q": "service outage status"},
          "output": {"title": "incident resolved", "time": "14:05Z"},
          "status": "SUCCESS"
        }
      ]
    }
  ]
}`;
