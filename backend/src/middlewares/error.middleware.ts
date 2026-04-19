import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import DefaultError from "../errors/DefaultError";

export function errorHandler(error: FastifyError | Error, req: FastifyRequest, reply: FastifyReply)
{
    if (error instanceof DefaultError) {
        return reply.status(error.status).send({ error: error.message, status: error.status });
    }

    if ((error as FastifyError).validation) {
        return reply.status(400).send({ error: "Validation Error", status: 400, details: (error as FastifyError).validation });
    }

    if ((error as FastifyError).statusCode) {
        return reply.status((error as FastifyError).statusCode!).send({
            error: error.message,
            status: (error as FastifyError).statusCode
        });
    }

    req.log.error(error);
    const fallback = new DefaultError();
    return reply.status(fallback.status).send({ error: fallback.message, status: fallback.status });
}
