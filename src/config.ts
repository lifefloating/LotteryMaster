import { config } from 'dotenv';

config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
  SSQ_BASE_URL: string;
  DLT_BASE_URL: string;
  HISTORY_LIMIT: number;
  DATA_PATH: string;
  API_KEY: string;
  API_MODEL: string;
  API_URL: string;
  API_TIMEOUT: number;
  API_TEMPERATURE: number;
  API_MAX_TOKENS: number;
  RECENT_DATA_COUNT: number;
  SSQ_FILE_PREFIX: string;
  DLT_FILE_PREFIX: string;
  CACHE_DURATION: number;
  CORS_ORIGINS: string[];
}

const configDefault: Config = {
  PORT: parseInt(process.env.PORT ?? '3008', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  SSQ_BASE_URL: process.env.SSQ_BASE_URL as string,
  DLT_BASE_URL: process.env.DLT_BASE_URL as string,
  HISTORY_LIMIT: parseInt(process.env.HISTORY_LIMIT ?? '10000', 10),
  DATA_PATH: process.env.DATA_PATH ?? 'lottery_data',
  API_KEY: process.env.API_KEY as string,
  API_MODEL: process.env.API_MODEL as string,
  API_URL: process.env.API_URL as string,
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT ?? '30000', 10),
  API_TEMPERATURE: parseFloat(process.env.API_TEMPERATURE ?? '0.3'),
  API_MAX_TOKENS: parseInt(process.env.API_MAX_TOKENS ?? '1000', 10),
  RECENT_DATA_COUNT: parseInt(process.env.RECENT_DATA_COUNT ?? '20', 10),
  SSQ_FILE_PREFIX: process.env.SSQ_FILE_PREFIX ?? 'ssq_data_',
  DLT_FILE_PREFIX: process.env.DLT_FILE_PREFIX ?? 'dlt_data_',
  CACHE_DURATION: parseInt(process.env.CACHE_DURATION ?? '3600000', 10),
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
};

export default configDefault;
