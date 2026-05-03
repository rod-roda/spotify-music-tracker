import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../../middlewares/error.middleware';
import DefaultError from '../../errors/DefaultError';
import BadGateway from '../../errors/BadGateway';
import Unauthorized from '../../errors/Unauthorized';

const makeReply = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
});

const makeReq = () => ({
    log: { error: vi.fn() },
});

describe('errorHandler', () => {
    it('handles DefaultError with its status and message', () => {
        const reply = makeReply();
        const req = makeReq();
        errorHandler(new DefaultError('Something went wrong', 500), req as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(500);
        expect(reply.send).toHaveBeenCalledWith({ error: 'Something went wrong', status: 500 });
    });

    it('handles BadGateway (DefaultError subclass) with status 502', () => {
        const reply = makeReply();
        errorHandler(new BadGateway(), makeReq() as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(502);
        expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ status: 502 }));
    });

    it('handles Unauthorized with status 401', () => {
        const reply = makeReply();
        errorHandler(new Unauthorized(), makeReq() as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(401);
    });

    it('handles FastifyError with .validation property as 400', () => {
        const reply = makeReply();
        const req = makeReq();
        const validationError = Object.assign(new Error('Validation failed'), {
            validation: [{ message: 'field required' }],
            statusCode: 400,
        });

        errorHandler(validationError as any, req as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Erro de validação', status: 400 })
        );
    });

    it('handles generic FastifyError with .statusCode', () => {
        const reply = makeReply();
        const fastifyError = Object.assign(new Error('Not found'), { statusCode: 404 });

        errorHandler(fastifyError as any, makeReq() as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(404);
    });

    it('falls back to 500 and logs unhandled generic Error', () => {
        const reply = makeReply();
        const req = makeReq();
        errorHandler(new Error('Unexpected crash'), req as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(500);
        expect(req.log.error).toHaveBeenCalled();
    });
});
