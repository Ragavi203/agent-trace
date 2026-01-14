import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const datasourceUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: datasourceUrl },
    },
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
