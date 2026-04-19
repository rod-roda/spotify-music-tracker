import { requireEnv } from "./config/env";
import { buildApp } from "./app";
import { redis } from "./config/redis";
import { prisma } from "./config/prisma";

const app = buildApp();
const PORT = Number(requireEnv("PORT")) || 3333;

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});

let isShuttingDown = false;

async function shutdown(signal: string)
{
    if(isShuttingDown) return;
    isShuttingDown = true;

    app.log.info(`Recebido ${signal}, encerrando...`);

    try {
        await app.close();
        app.log.info('Servidor encerrado com sucesso');
        await redis.quit();
        app.log.info('Redis encerrado com sucesso');
        await prisma.$disconnect();
        app.log.info('Prisma encerrado com sucesso');
        process.exit(0);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);