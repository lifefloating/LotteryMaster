import dotenv from 'dotenv';
import path from 'path';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import config from './config'; // Import config

import scraper from './services/scraper';
import analyzeService from './services/analyze';
import longFileAnalyzeService from './services/longFileAnalyze';

dotenv.config();

console.log('Environment variables loaded:', {
  PORT: config.PORT,
  SSQ_URL: config.SSQ_URL,
  DLT_URL: config.DLT_URL,
  DATA_PATH: config.DATA_PATH,
});

const DATA_PATH = config.DATA_PATH;
const PORT = config.PORT;
const HOST = '0.0.0.0';

const app = Fastify({
  logger: true,
});

// Define route handlers
app.get('/api/health', async () => {
  return { success: true, message: 'Welcome to the lottery API' };
});

app.get('/api/scrape/ssq', async () => {
  const result = await scraper.scrapeSSQ();
  return {
    success: result.success,
    message: result.message,
    isNewFile: result.isNewFile,
  };
});

app.get('/api/scrape/dlt', async () => {
  const result = await scraper.scrapeDLT();
  return {
    success: result.success,
    message: result.message,
    isNewFile: result.isNewFile,
  };
});

app.get('/api/analyze/ssq', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `ssq_data_${today}.xlsx`);
  const analysis = await analyzeService.analyzeLotteryData(fileName);
  return {
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  };
});

app.get('/api/analyze/dlt', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `dlt_data_${today}.xlsx`);
  const analysis = await analyzeService.analyzeLotteryData(fileName);
  return {
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  };
});

app.get('/api/analyze/ssq/long', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `ssq_data_${today}.xlsx`);
  const analysis = await longFileAnalyzeService.analyzeLotteryData(fileName);
  return {
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  };
});

app.get('/api/analyze/dlt/long', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `dlt_data_${today}.xlsx`);
  const analysis = await longFileAnalyzeService.analyzeLotteryData(fileName);
  return {
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  };
});

// Add global uncaught exception handlers
process.on('uncaughtException', (error: Error) => {
  app.log.error('Uncaught Exception:');
  app.log.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  app.log.error('Unhandled Promise Rejection:');
  app.log.error(reason);
  process.exit(1);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  app.log.info(`${signal} received. Starting graceful shutdown...`);
  try {
    await app.close();
    app.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    app.log.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Enhance error handler with more detailed error response
app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
  app.log.error(error);
  const statusCode = 'statusCode' in error ? (error as any).statusCode : 500;
  reply.status(statusCode).send({
    success: false,
    error: {
      message: error.message,
      code: statusCode,
      path: request.url,
    },
  });
});

// Start the server
const start = async (): Promise<void> => {
  try {
    // Register CORS plugin
    await app.register(cors, {
      origin: config.CORS_ORIGINS, // Use origins from config
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    });

    await app.listen({ port: PORT, host: HOST });
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- GET /api/scrape/ssq');
    console.log('- GET /api/scrape/dlt');
    console.log('- GET /api/analyze/ssq');
    console.log('- GET /api/analyze/dlt');
    console.log('- GET /api/analyze/ssq/qwen');
    console.log('- GET /api/analyze/dlt/qwen');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
