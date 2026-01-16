import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

// Define the interface for Cloudflare Env if not already global
interface CloudflareEnv {
  DB: D1Database
}

let prisma: PrismaClient | undefined

export function getPrisma(d1: D1Database) {
  if (prisma) return prisma

  const adapter = new PrismaD1(d1)
  prisma = new PrismaClient({ adapter })
  return prisma
}
