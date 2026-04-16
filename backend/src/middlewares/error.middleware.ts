import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import DefaultError from "../errors/DefaultError";

export function errorHandler(error: FastifyError | Error, req: FastifyRequest, reply: FastifyReply)
{
    if (error instanceof DefaultError) {
        return reply.status(error.status).send({ error: error.message, status: error.status });
    }

    req.log.error(error);
    const fallback = new DefaultError();
    return reply.status(fallback.status).send({ error: fallback.message, status: fallback.status });
}
