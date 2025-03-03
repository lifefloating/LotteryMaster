import { FastifyRequest, FastifyReply } from 'fastify';

export const healthCheck = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  return reply.send({ success: true, message: 'Welcome to the lottery API' });
};
