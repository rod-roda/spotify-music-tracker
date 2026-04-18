import Redis from "ioredis";
import { requireEnv } from "./env";

export const redis = new Redis(requireEnv('REDIS_URL'));