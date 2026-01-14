import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const framework = searchParams.get("framework") ?? undefined;

  const runs = await prisma.run.findMany({
    where: {
      AND: [
        status ? { status } : {},
        framework ? { framework } : {},
        q
          ? {
              OR: [
                { id: { contains: q } },
                { name: { contains: q, mode: "insensitive" } },
                {
                  tags: {
                    some: {
                      tag: { name: { contains: q, mode: "insensitive" } },
                    },
                  },
                },
              ],
            }
          : {},
      ],
    },
    orderBy: { startedAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { steps: true } },
    },
  });

  return NextResponse.json(runs);
}
