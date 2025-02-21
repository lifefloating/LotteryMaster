import dotenv from 'dotenv';
import path from 'path';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

import scraper from './services/scraper';
import analyzeService from './services/analyze';

dotenv.config();

// eslint-disable-next-line no-console
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  SSQ_URL: process.env.SSQ_URL,
  DLT_URL: process.env.DLT_URL,
  DATA_PATH: process.env.DATA_PATH,
});

const DATA_PATH = process.env.DATA_PATH ?? 'lottery_data';
const PORT = parseInt(process.env.PORT || '3008', 10);
const HOST = '0.0.0.0';

const app = Fastify({
  logger: true,
});

// Define route handlers
app.get('/api/health', async () => {
  return { success: true, message: 'Welcome to the lottery API' };
});

app.get('/api/scrape/ssq', async () => {
  const data = await scraper.scrapeSSQ();
  return { success: true, data };
});

app.get('/api/scrape/dlt', async () => {
  const data = await scraper.scrapeDLT();
  return { success: true, data };
});

app.get('/api/analyze/ssq', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `ssq_data_${today}.xlsx`);
  const analysis = await analyzeService.analyzeLotteryData(fileName);
  return { success: true, analysis };
});

app.get('/api/analyze/dlt', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = path.join(DATA_PATH, `dlt_data_${today}.xlsx`);
  const analysis = await analyzeService.analyzeLotteryData(fileName);
  return { success: true, analysis };
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
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- GET /api/scrape/ssq');
    console.log('- GET /api/scrape/dlt');
    console.log('- GET /api/analyze/ssq');
    console.log('- GET /api/analyze/dlt');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
