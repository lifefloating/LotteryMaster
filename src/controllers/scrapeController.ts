import { FastifyRequest, FastifyReply } from 'fastify';
import scraper from '../services/scrapeService';

export const scrapeSSQ = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  const result = await scraper.scrapeSSQ();
  return reply.send({
    success: result.success,
    message: result.message,
    isNewFile: result.isNewFile,
  });
};

export const scrapeDLT = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  const result = await scraper.scrapeDLT();
  return reply.send({
    success: result.success,
    message: result.message,
    isNewFile: result.isNewFile,
  });
};

export const scrapeFC3D = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  const result = await scraper.scrapeFC3D();
  return reply.send({
    success: result.success,
    message: result.message,
    isNewFile: result.isNewFile,
  });
};
