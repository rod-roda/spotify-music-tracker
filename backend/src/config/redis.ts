import Redis from "ioredis";
import { requireEnv } from "./env";

export const redis = new Redis(requireEnv('REDIS_URL'));
redis.on('error', (err) => process.stderr.write(`[redis] Connection error: ${err.message}\n`));