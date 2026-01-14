import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const run = await prisma.run.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      steps: {
        orderBy: { index: "asc" },
        include: { toolCalls: true },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.run.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Delete run error", error);
    return NextResponse.json({ error: "Failed to delete run" }, { status: 500 });
  }
}
