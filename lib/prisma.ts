import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Parse DATABASE_URL: "file:./dev.db" → resolve absolute path
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db"
  const relativePath = dbUrl.startsWith("file:")
    ? dbUrl.slice("file:".length)
    : dbUrl
  const dbPath = path.resolve(process.cwd(), relativePath)

  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
