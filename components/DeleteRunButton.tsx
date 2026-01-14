"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteRunButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Delete this run? This cannot be undone.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await fetch(`/api/runs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete run. Please try again.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
