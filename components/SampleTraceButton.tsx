"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function SampleTraceButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSend() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samplePayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send sample trace");
      }

      const data = await res.json();
      setStatus("success");
      setMessage("Sample trace recorded. Refresh the runs list to view it.");
      // Encourage viewing the specific run if we have the id.
      if (data?.id) {
        setMessage(
          `Sample trace recorded. Open it here: /runs/${data.id} (or refresh the runs list).`,
        );
      }
    } catch (err: unknown) {
      setStatus("error");
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessage(message);
    }
  }

  const buttonText =
    status === "loading"
      ? "Sending..."
      : status === "success"
        ? "Sent!"
        : "Send sample trace";

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSend}
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        type="button"
      >
        {buttonText}
      </button>
      <p className="text-xs text-zinc-600">
        Instantly creates a demo run so you can explore the timeline and tool
        calls without wiring your own agent.
      </p>
      {message && (
        <p
          className={`text-xs ${
            status === "error" ? "text-rose-600" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const samplePayload = {
  name: "Sample: Help a customer with a billing error",
  framework: "LANGCHAIN",
  status: "SUCCESS",
  tags: ["sample", "support", "billing"],
  metadata: {
    user: "demo-user",
    channel: "chat",
  },
  steps: [
    {
      index: 0,
      name: "Understand the problem",
      kind: "THOUGHT",
      input: { customer_message: "My invoice is double-charged." },
      output: { plan: "Check invoice, fetch billing record, draft reply." },
      status: "SUCCESS",
    },
    {
      index: 1,
      name: "Fetch billing record",
      kind: "TOOL",
      status: "SUCCESS",
      toolCalls: [
        {
          name: "billing.lookup",
          input: { invoice_id: "INV-1001" },
          output: { amount: 120, currency: "USD", status: "paid" },
          status: "SUCCESS",
        },
        {
          name: "billing.check_duplicates",
          input: { invoice_id: "INV-1001" },
          output: { duplicates: ["INV-1001-dup"] },
          status: "SUCCESS",
        },
      ],
    },
    {
      index: 2,
      name: "Prepare response",
      kind: "OBSERVATION",
      status: "SUCCESS",
      output: {
        reply:
          "We found a duplicate charge on INV-1001. We have voided the duplicate and initiated a refund. You will see the correction in 3-5 business days.",
      },
    },
  ],
};
