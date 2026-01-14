import { PrismaClient } from "@prisma/client";

const datasourceUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const prisma = new PrismaClient({
  datasources: {
    db: { url: datasourceUrl },
  },
});

async function main() {
  // Reset sample data for repeatable seeds in dev.
  await prisma.runTag.deleteMany();
  await prisma.toolCall.deleteMany();
  await prisma.step.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.run.deleteMany();

  const now = Date.now();

  await prisma.run.create({
    data: {
      name: "Support bot troubleshooting",
    framework: "LANGGRAPH",
    status: "SUCCESS",
      startedAt: new Date(now - 5 * 60 * 1000),
      endedAt: new Date(now - 4 * 60 * 1000 + 30 * 1000),
    metadata: JSON.stringify({
      user: "demo-user",
      sessionId: "demo-session-1",
    }),
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: "demo" },
                create: { name: "demo" },
              },
            },
          },
          {
            tag: {
              connectOrCreate: {
                where: { name: "support" },
                create: { name: "support" },
              },
            },
          },
        ],
      },
      steps: {
        create: [
          {
            index: 0,
            name: "Collect context",
            kind: "THOUGHT",
            input: JSON.stringify({
              user_message: "My deployment is failing with 502",
            }),
            output: JSON.stringify({
              summary: "Need system status and last deployment logs.",
            }),
            status: "SUCCESS",
            startedAt: new Date(now - 5 * 60 * 1000),
            endedAt: new Date(now - 4.8 * 60 * 1000),
          },
          {
            index: 1,
            name: "Check status page",
            kind: "TOOL",
            status: "SUCCESS",
            startedAt: new Date(now - 4.8 * 60 * 1000),
            endedAt: new Date(now - 4.5 * 60 * 1000),
            toolCalls: {
              create: [
                {
                  name: "status_api.get",
                  input: JSON.stringify({ service: "api" }),
                  output: JSON.stringify({ status: "operational" }),
                  status: "SUCCESS",
                  startedAt: new Date(now - 4.8 * 60 * 1000),
                  endedAt: new Date(now - 4.7 * 60 * 1000),
                },
                {
                  name: "logs.fetch",
                  input: JSON.stringify({ tail: 50, service: "api" }),
                  output: JSON.stringify({
                    errors: ["upstream 502 from edge"],
                    rate: 0.12,
                  }),
                  status: "SUCCESS",
                  startedAt: new Date(now - 4.7 * 60 * 1000),
                  endedAt: new Date(now - 4.5 * 60 * 1000),
                },
              ],
            },
          },
          {
            index: 2,
            name: "Draft response",
            kind: "OBSERVATION",
            status: "SUCCESS",
            startedAt: new Date(now - 4.5 * 60 * 1000),
            endedAt: new Date(now - 4 * 60 * 1000 + 30 * 1000),
            output: JSON.stringify({
              reply:
                "We saw 502s from the edge. System is operational; re-deployed API to clean bad pods. Please retry now.",
            }),
          },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
