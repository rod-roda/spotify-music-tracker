import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { requireEnv } from './env'

const adapter = new PrismaPg({ connectionString: requireEnv('DATABASE_URL') })

export const prisma = new PrismaClient({ adapter });
