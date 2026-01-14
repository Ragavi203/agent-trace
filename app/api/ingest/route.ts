import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runPayloadSchema } from "@/lib/trace";

const serialize = (value: unknown) =>
  value === undefined ? undefined : JSON.stringify(value);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = runPayloadSchema.parse(body);

    const run = await prisma.run.create({
      data: {
        name: payload.name,
        framework: payload.framework,
        status: payload.status,
        startedAt: payload.startedAt ?? new Date(),
        endedAt: payload.endedAt,
        metadata: serialize(payload.metadata),
        tags: payload.tags
          ? {
              create: payload.tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
        steps:
          payload.steps.length > 0
            ? {
                create: payload.steps.map((step) => ({
                  index: step.index,
                  name: step.name,
                  kind: step.kind,
                  input: serialize(step.input),
                  output: serialize(step.output),
                  error: step.error,
                  status: step.status ?? "PENDING",
                  startedAt: step.startedAt ?? new Date(),
                  endedAt: step.endedAt,
                  toolCalls: step.toolCalls
                    ? {
                        create: step.toolCalls.map((toolCall) => ({
                          name: toolCall.name,
                          input: serialize(toolCall.input),
                          output: serialize(toolCall.output),
                          error: toolCall.error,
                          status: toolCall.status ?? "RUNNING",
                          startedAt: toolCall.startedAt ?? new Date(),
                          endedAt: toolCall.endedAt,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
      },
      include: {
        steps: { include: { toolCalls: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ id: run.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Ingest error", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
