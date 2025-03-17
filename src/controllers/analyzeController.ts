import { FastifyRequest, FastifyReply } from 'fastify';
import * as path from 'path';
import config from '../config';
import analyzeService from '../services/analyzeService';

export const analyzeSSQ = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(
      __dirname,
      '..',
      config.DATA_PATH,
      `${config.SSQ_FILE_PREFIX}${today}.xlsx`
    );
    const analysis = await analyzeService.analyzeLotteryData(fileName, 'SSQ');
    return reply.send({
      success: true,
      analysis: {
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
    // 使用相对路径，相对于当前文件所在目录
    const fileName = path.join(
      __dirname,
      '..',
      config.DATA_PATH,
      `${config.DLT_FILE_PREFIX}${today}.xlsx`
    );
    const analysis = await analyzeService.analyzeLotteryData(fileName, 'DLT');
    return reply.send({
      success: true,
      analysis: {
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

export const analyzeFC3D = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(
      __dirname,
      '..',
      config.DATA_PATH,
      `${config.FC3D_FILE_PREFIX}${today}.xlsx`
    );
    const analysis = await analyzeService.analyzeLotteryData(fileName, 'FC3D');
    return reply.send({
      success: true,
      analysis: {
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
