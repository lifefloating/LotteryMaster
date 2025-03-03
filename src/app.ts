import path from 'path';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import config from './config'; // Import config already initializes dotenv
import * as XLSX from 'xlsx';

import scraper from './services/scraperService';
import analyzeService from './services/analyzeService';
import chartService from './services/chartService';

console.log('Environment variables loaded:', {
  PORT: config.PORT,
  SSQ_BASE_URL: config.SSQ_BASE_URL,
  DLT_BASE_URL: config.DLT_BASE_URL,
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
  const analysis = await analyzeService.analyzeLotteryData(fileName, 'SSQ');
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
  const analysis = await analyzeService.analyzeLotteryData(fileName, 'DLT');
  return {
    success: true,
    analysis: {
      raw: analysis.rawContent,
      structured: analysis.structured,
    },
  };
});

// Chart trend analysis endpoints
app.get<{
  Querystring: {
    type: 'ssq' | 'dlt';
    periodCount?: string;
    zoneType?: 'red' | 'blue';
    includeChartData?: string;
  };
}>('/api/chart/trend', async (request, reply) => {
  try {
    const {
      type,
      periodCount = '100',
      zoneType = 'red',
      includeChartData = 'true',
    } = request.query;
    const lotteryType = type.toUpperCase() as 'SSQ' | 'DLT';
    const periods = parseInt(periodCount, 10);

    if (isNaN(periods) || periods <= 0) {
      return reply.status(400).send({
        success: false,
        error: 'Period count must be a positive number',
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(DATA_PATH, `${type}_data_${today}.xlsx`);

    const result = await chartService.generateNumberTrend(fileName, lotteryType, periods, zoneType);

    // 如果不需要chartData，则从响应中移除
    if (includeChartData === 'false') {
      const resultCopy = { ...result };
      if ('chartData' in resultCopy) {
        delete resultCopy.chartData;
      }
      return {
        success: true,
        data: resultCopy,
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
});

// Number frequency chart endpoint
app.get<{
  Querystring: {
    type: 'ssq' | 'dlt';
    periodCount?: string;
    zoneType?: 'red' | 'blue';
    includeChartData?: string;
  };
}>('/api/chart/frequency', async (request, reply) => {
  try {
    const {
      type,
      periodCount = '100',
      zoneType = 'red',
      includeChartData = 'true',
    } = request.query;
    const lotteryType = type.toUpperCase() as 'SSQ' | 'DLT';
    const periods = parseInt(periodCount, 10);

    if (isNaN(periods) || periods <= 0) {
      return reply.status(400).send({
        success: false,
        error: 'Period count must be a positive number',
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(DATA_PATH, `${type}_data_${today}.xlsx`);

    // Only generate chart data if needed
    if (includeChartData === 'false') {
      // For frequency chart, we don't have a separate statistics object
      // So we'll return an empty result if chart data is not needed
      return {
        success: true,
        data: { message: 'Chart data excluded as requested' },
      };
    }

    const chartData = await chartService.generateFrequencyChart(
      fileName,
      lotteryType,
      periods,
      zoneType
    );

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
});

// Add a temporary test route to examine Excel file structure
app.get('/api/test/excel', async (request, reply) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(DATA_PATH, `dlt_data_${today}.xlsx`);

    // Read Excel file
    const workbook = XLSX.readFile(fileName);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    // Get first 5 rows for inspection
    const sampleData = rawData.slice(0, 5);

    return {
      success: true,
      data: {
        sampleRows: sampleData,
        columnNames: sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      },
    };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
});

// Add a temporary test route to examine SSQ Excel file structure
app.get('/api/test/excel/ssq', async (request, reply) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(DATA_PATH, `ssq_data_${today}.xlsx`);

    // Read Excel file
    const workbook = XLSX.readFile(fileName);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    // Get first 5 rows for inspection
    const sampleData = rawData.slice(0, 5);

    return {
      success: true,
      data: {
        sampleRows: sampleData,
        columnNames: sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      },
    };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        message: (error as Error).message,
      },
    });
  }
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
    console.log('- GET /api/analyze/ssq/long');
    console.log('- GET /api/analyze/dlt/long');
    console.log(
      '- GET /api/chart/trend?type=[ssq|dlt]&periodCount=[30|50|100]&zoneType=[red|blue]'
    );
    console.log(
      '- GET /api/chart/frequency?type=[ssq|dlt]&periodCount=[30|50|100]&zoneType=[red|blue]'
    );
    console.log('- GET /api/test/excel');
    console.log('- GET /api/test/excel/ssq');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
