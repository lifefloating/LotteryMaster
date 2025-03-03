import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import config from '../config';
import analyzeService from '../services/analyzeService';

const DATA_PATH = config.DATA_PATH;

export const analyzeSSQ = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `ssq_data_${today}.xlsx`);
  const analysis = await analyzeService.analyzeLotteryData(fileName, 'SSQ');
  return reply.send({
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  });
};

export const analyzeDLT = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `dlt_data_${today}.xlsx`);
  const analysis = await analyzeService.analyzeLotteryData(fileName, 'DLT');
  return reply.send({
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  });
};
