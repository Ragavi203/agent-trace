import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import SampleTraceButton from "@/components/SampleTraceButton";
import TraceSubmitForm from "@/components/TraceSubmitForm";
import DeleteRunButton from "@/components/DeleteRunButton";
import Link from "next/link";

function statusColor(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "FAILED":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "RUNNING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-zinc-100 text-zinc-800 border-zinc-200";
  }
}

export default async function Home() {
  const runs = await prisma.run.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { steps: true } },
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 bg-white">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          agent-trace
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          See exactly what your agent did — no guesswork
        </h1>
        <p className="mt-3 max-w-3xl text-base text-zinc-600">
          You send a run once. We show you the steps, the tool calls, and the
          outputs in order. Non-technical teammates can read it at a glance.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Step 1: Send</p>
            <p className="mt-1 text-zinc-600">
              Send one JSON trace to <code>/api/ingest</code>.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Step 2: Replay</p>
            <p className="mt-1 text-zinc-600">
              We line up steps and tool calls in time order.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Step 3: Explain</p>
            <p className="mt-1 text-zinc-600">
              Show anyone what happened, with inputs and outputs visible.
            </p>
          </div>
        </div>
        <div className="mt-3 text-sm">
          <Link
            href="/docs"
            className="font-semibold text-sky-700 hover:text-sky-800"
          >
            View integration snippets →
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Recent runs
              </h2>
              <p className="text-sm text-zinc-600">
                Click a run to see its full timeline and tool calls.
              </p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
              {runs.length} runs
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-zinc-900">
                      {run.name ?? "Untitled run"}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {run.framework} · {run._count.steps} steps · Started{" "}
                      {formatDistanceToNow(run.startedAt, { addSuffix: true })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {run.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusColor(
                        run.status,
                      )}`}
                    >
                      {run.status}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/runs/${run.id}`}
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                      >
                        View
                      </Link>
                      <DeleteRunButton id={run.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {runs.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
                No runs yet. Send a trace to <code>/api/ingest</code> and it will
                appear here.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">
              Get a feel in seconds
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              Click once to create a sample run and open it. You’ll see a
              time-ordered story of what an agent did and what each tool
              returned.
            </p>
            <div className="mt-3">
              <SampleTraceButton />
            </div>
          </div>
          <TraceSubmitForm />
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">
              Send your own trace (copy/paste)
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              POST this JSON to <code>/api/ingest</code>. Replace the values with
              your run data.
            </p>
            <pre className="mt-3 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800">
{`curl -X POST http://localhost:3000/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Support bot troubleshooting",
    "framework": "LANGCHAIN",
    "status": "SUCCESS",
    "tags": ["demo", "support"],
    "metadata": {"user":"demo-user"},
    "steps": [
      {
        "index": 0,
        "name": "Collect context",
        "kind": "THOUGHT",
        "input": {"message":"My deployment fails"},
        "status": "SUCCESS"
      }
    ]
  }'`}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
