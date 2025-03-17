import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import config from './config';
import logger from './utils/logger';

// Import controllers
import * as healthController from './controllers/healthController';
import * as scrapeController from './controllers/scrapeController';
import * as analyzeController from './controllers/analyzeController';
import * as chartController from './controllers/chartController';

logger.info('Environment variables loaded:', {
  PORT: config.PORT,
  SSQ_BASE_URL: config.SSQ_BASE_URL,
  DLT_BASE_URL: config.DLT_BASE_URL,
  FC3D_BASE_URL: config.FC3D_BASE_URL,
  DATA_PATH: config.DATA_PATH,
  CORS_ORIGINS: config.CORS_ORIGINS,
});

const PORT = config.PORT;
const HOST = '0.0.0.0';

const app = Fastify({
  logger: true,
});

// Enable CORS
app.register(cors, {
  origin: config.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});

// Register static file service
app.register(fastifyStatic, {
  root: path.join(__dirname, '../api'),
  prefix: '/api/',
  decorateReply: false,
});

// Define route handlers
app.get('/api/health', healthController.healthCheck);

app.get('/api/scrape/ssq', scrapeController.scrapeSSQ);
app.get('/api/scrape/dlt', scrapeController.scrapeDLT);
app.get('/api/scrape/fc3d', scrapeController.scrapeFC3D);

app.get('/api/analyze/ssq', analyzeController.analyzeSSQ);
app.get('/api/analyze/dlt', analyzeController.analyzeDLT);
app.get('/api/analyze/fc3d', analyzeController.analyzeFC3D);

// Chart routes
app.get<{
  Querystring: {
    type: 'ssq' | 'dlt';
    periodCount?: string;
    zoneType?: 'red' | 'blue';
    includeChartData?: string;
  };
}>('/api/chart/trend', chartController.getTrendChart);

app.get<{
  Querystring: {
    type: 'ssq' | 'dlt';
    periodCount?: string;
    zoneType?: 'red' | 'blue';
    includeChartData?: string;
  };
}>('/api/chart/frequency', chartController.getFrequencyChart);

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
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await app.close();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Register shutdown handlers
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
    logger.info(`Server is running on port ${PORT}`);
    logger.info('Available API endpoints:');
    logger.info('Health Check:');
    logger.info('  - GET /api/health');
    logger.info('Scraping:');
    logger.info('  - GET /api/scrape/ssq');
    logger.info('  - GET /api/scrape/dlt');
    logger.info('  - GET /api/scrape/fc3d');
    logger.info('Analysis:');
    logger.info('  - GET /api/analyze/ssq');
    logger.info('  - GET /api/analyze/dlt');
    logger.info('  - GET /api/analyze/fc3d');
    logger.info('Charts:');
    logger.info(
      '  - GET /api/chart/trend?type=ssq|dlt&periodCount=100&zoneType=red|blue&includeChartData=true|false'
    );
    logger.info(
      '  - GET /api/chart/frequency?type=ssq|dlt&periodCount=100&zoneType=red|blue&includeChartData=true|false'
    );
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
};

start();
