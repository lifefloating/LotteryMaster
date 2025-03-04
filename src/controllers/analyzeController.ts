import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import config from '../config';
import analyzeService from '../services/analyzeService';

export const analyzeSSQ = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(config.DATA_PATH, `ssq_data_${today}.xlsx`);
    const analysis = await analyzeService.analyzeLotteryData(fileName, 'SSQ');
    return reply.send({
      success: true,
      analysis: {
        raw: analysis.rawContent,
        structured: analysis.structured,
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
};

export const analyzeDLT = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(config.DATA_PATH, `dlt_data_${today}.xlsx`);
    const analysis = await analyzeService.analyzeLotteryData(fileName, 'DLT');
    return reply.send({
      success: true,
      analysis: {
        raw: analysis.rawContent,
        structured: analysis.structured,
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
};
