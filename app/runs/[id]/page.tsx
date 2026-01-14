import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";

function badgeColor(status: string) {
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

function parseMaybeJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function Pill({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
      <span className="font-medium text-zinc-700">{label}:</span> {value}
    </span>
  );
}

export default async function RunDetail({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);

  if (!id) {
    notFound();
  }

  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      steps: { orderBy: { index: "asc" }, include: { toolCalls: true } },
    },
  });

  if (!run) {
    notFound();
  }

  const parsedMetadata = parseMaybeJson(run.metadata);
  const totalToolCalls = run.steps.reduce(
    (sum, step) => sum + step.toolCalls.length,
    0,
  );
  const toolStats = run.steps.reduce<Record<string, { count: number; success: number; failed: number; totalDuration: number; samples: number }>>(
    (acc, step) => {
      step.toolCalls.forEach((tool) => {
        const current = acc[tool.name] ?? {
          count: 0,
          success: 0,
          failed: 0,
          totalDuration: 0,
          samples: 0,
        };
        current.count += 1;
        current.success += tool.status === "SUCCESS" ? 1 : 0;
        current.failed += tool.status === "FAILED" ? 1 : 0;
        const dur =
          tool.startedAt && tool.endedAt
            ? differenceInSeconds(tool.endedAt, tool.startedAt)
            : null;
        if (dur !== null) {
          current.totalDuration += dur;
          current.samples += 1;
        }
        acc[tool.name] = current;
      });
      return acc;
    },
    {},
  );
  const toolSuccesses = run.steps.reduce(
    (sum, step) =>
      sum + step.toolCalls.filter((t) => t.status === "SUCCESS").length,
    0,
  );
  const toolFailures = run.steps.reduce(
    (sum, step) =>
      sum + step.toolCalls.filter((t) => t.status === "FAILED").length,
    0,
  );
  const toolSuccessRate =
    totalToolCalls === 0
      ? null
      : Math.round((toolSuccesses / totalToolCalls) * 100);
  const runDurationSeconds =
    run.startedAt && run.endedAt
      ? differenceInSeconds(run.endedAt, run.startedAt)
      : null;
  const stepDurations = new Map(
    run.steps.map((step) => {
      if (!step.startedAt || !step.endedAt) return [step.id, null];
      return [step.id, differenceInSeconds(step.endedAt, step.startedAt)];
    }),
  );
  const toolDurations = new Map(
    run.steps.flatMap((step) =>
      step.toolCalls.map((tool) => {
        if (!tool.startedAt || !tool.endedAt) return [tool.id, null];
        return [tool.id, differenceInSeconds(tool.endedAt, tool.startedAt)];
      }),
    ),
  );

  const toolDurationValues = Array.from(toolDurations.values()).filter(
    (v): v is number => v !== null,
  );
  const latencyBuckets = [
    { label: "<1s", max: 1 },
    { label: "1-3s", max: 3 },
    { label: "3-10s", max: 10 },
    { label: "10s+", max: Infinity },
  ];
  const latencyCounts = latencyBuckets.map(({ label, max }, idx) => {
    const min = idx === 0 ? 0 : latencyBuckets[idx - 1].max;
    const count = toolDurationValues.filter(
      (v) => v > min && v <= max,
    ).length;
    return { label, count };
  });
  const maxBucket = Math.max(
    1,
    ...latencyCounts.map((b) => b.count),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 bg-white">
      <Link
        href="/"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Back to runs
      </Link>

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-zinc-500">Run ID: {run.id}</p>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {run.name ?? "Untitled run"}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-2 py-1 text-xs font-semibold ${badgeColor(
                  run.status,
                )}`}
              >
                {run.status}
              </span>
              <Pill label="Framework" value={run.framework} />
              <Pill label="Steps" value={run.steps.length} />
              <Pill
                label="Started"
                value={formatDistanceToNow(run.startedAt, { addSuffix: true })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
        </div>
        {parsedMetadata && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Metadata
            </p>
            <pre className="mt-2 overflow-auto text-sm text-zinc-800">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Run duration
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {runDurationSeconds !== null
                ? `${runDurationSeconds}s`
                : "n/a"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tool calls
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {totalToolCalls}
            </p>
            <p className="text-xs text-zinc-600">
              Success {toolSuccesses} · Failed {toolFailures}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tool success rate
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {toolSuccessRate !== null ? `${toolSuccessRate}%` : "n/a"}
            </p>
          </div>
        </div>
        {toolDurationValues.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">Tool latency</p>
            <p className="text-xs text-zinc-600">
              Count of tool calls falling into each duration bucket.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {latencyCounts.map((bucket) => (
                <div
                  key={bucket.label}
                  className="rounded border border-zinc-200 bg-zinc-50 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {bucket.label}
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{
                        width: `${(bucket.count / maxBucket) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-700">{bucket.count} calls</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {Object.keys(toolStats).length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">
              Per-tool breakdown
            </p>
            <p className="text-xs text-zinc-600">
              Calls, success/failure, and average duration (s) when timestamps are present.
            </p>
            <div className="mt-3 space-y-2">
              {Object.entries(toolStats).map(([name, stats]) => {
                const avg =
                  stats.samples > 0
                    ? Math.round((stats.totalDuration / stats.samples) * 10) / 10
                    : null;
                return (
                  <div
                    key={name}
                    className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800"
                  >
                    <div className="font-semibold text-zinc-900 truncate">{name}</div>
                    <div className="text-xs text-zinc-700">
                      Calls: <span className="font-semibold">{stats.count}</span>
                    </div>
                    <div className="text-xs text-zinc-700">
                      Success {stats.success} · Fail {stats.failed}
                    </div>
                    <div className="text-xs text-zinc-700">
                      Avg {avg !== null ? `${avg}s` : "n/a"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">How to read this page</p>
          <p className="mt-1">
            Each step shows what the agent thought or did. Tool calls list the
            exact inputs and outputs. Use this to spot where things broke or
            confirm what worked.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-zinc-900">
              Step-by-step replay
            </h2>
            <p className="text-sm text-zinc-600">
              Timeline with tool calls, inputs, outputs, and errors, in order.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {run.steps.map((step) => (
            <div
              key={step.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-zinc-500">Step {step.index + 1}</p>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {step.name ?? "Untitled step"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {step.kind && <Pill label="Kind" value={step.kind} />}
                    <Pill label="Status" value={step.status} />
                    {step.startedAt && (
                      <Pill
                        label="Started"
                        value={formatDistanceToNow(step.startedAt, {
                          addSuffix: true,
                        })}
                      />
                    )}
                  </div>
                  {stepDurations.get(step.id) !== null && (
                    <Pill
                      label="Duration"
                      value={`${stepDurations.get(step.id)}s`}
                    />
                  )}
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${badgeColor(
                    step.status,
                  )}`}
                >
                  {step.status}
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {step.input && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      What the agent received
                    </p>
                    <pre className="mt-2 max-h-48 overflow-auto text-sm text-zinc-800">
                      {JSON.stringify(parseMaybeJson(step.input), null, 2)}
                    </pre>
                  </div>
                )}
                {(step.output || step.error) && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      What the agent produced
                    </p>
                    <pre className="mt-2 max-h-48 overflow-auto text-sm text-zinc-800">
                      {JSON.stringify(
                        parseMaybeJson(step.output) ?? step.error,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                )}
              </div>

              {step.toolCalls.length > 0 && (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Tool calls (inputs → outputs)
                  </p>
                  <div className="mt-2 space-y-2">
                    {step.toolCalls.map((tool) => (
                      <div
                        key={tool.id}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              {tool.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {tool.startedAt
                                ? formatDistanceToNow(tool.startedAt, {
                                    addSuffix: true,
                                  })
                                : "n/a"}
                            </p>
                          </div>
                          {toolDurations.get(tool.id) !== null && (
                            <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">
                              {toolDurations.get(tool.id)}s
                            </span>
                          )}
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${badgeColor(
                              tool.status,
                            )}`}
                          >
                            {tool.status}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          {tool.input && (
                            <div className="rounded border border-zinc-200 bg-white p-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                Sent to tool
                              </p>
                              <pre className="mt-1 max-h-40 overflow-auto text-xs text-zinc-800">
                                {JSON.stringify(parseMaybeJson(tool.input), null, 2)}
                              </pre>
                            </div>
                          )}
                          {(tool.output || tool.error) && (
                            <div className="rounded border border-zinc-200 bg-white p-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                Tool response
                              </p>
                              <pre className="mt-1 max-h-40 overflow-auto text-xs text-zinc-800">
                                {JSON.stringify(
                                  parseMaybeJson(tool.output) ?? tool.error,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {run.steps.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              No steps recorded yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
