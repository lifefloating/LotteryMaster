import { config } from 'dotenv';

config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
  SSQ_BASE_URL: string;
  DLT_BASE_URL: string;
  FC3D_BASE_URL: string;
  HISTORY_LIMIT: number;
  DATA_PATH: string;
  API_PROVIDER: 'qwen' | 'deepseek' | 'claude';
  API_KEY: string;
  API_MODEL: string;
  API_URL: string;
  API_TIMEOUT: number;
  API_TEMPERATURE: number;
  API_MAX_TOKENS: number;
  API_TOP_P: number;
  API_PRESENCE_PENALTY: number;
  CLAUDE_API_KEY: string;
  CLAUDE_MODEL: string;
  CLAUDE_API_URL: string;
  CLAUDE_TEMPERATURE: number;
  CLAUDE_MAX_TOKENS: number;
  CLAUDE_TIMEOUT: number;
  RECENT_DATA_COUNT: number;
  SSQ_FILE_PREFIX: string;
  DLT_FILE_PREFIX: string;
  FC3D_FILE_PREFIX: string;
  CACHE_DURATION: number;
  CORS_ORIGINS: string[];
}

const configDefault: Config = {
  PORT: parseInt(process.env.PORT ?? '3008', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  SSQ_BASE_URL: process.env.SSQ_BASE_URL as string,
  DLT_BASE_URL: process.env.DLT_BASE_URL as string,
  FC3D_BASE_URL: process.env.FC3D_BASE_URL as string,
  HISTORY_LIMIT: parseInt(process.env.HISTORY_LIMIT ?? '10000', 10),
  DATA_PATH: process.env.DATA_PATH ?? 'lottery_data',
  API_PROVIDER: (process.env.API_PROVIDER ?? 'qwen') as 'qwen' | 'deepseek' | 'claude',
  API_KEY: process.env.API_KEY as string,
  API_MODEL: process.env.API_MODEL as string,
  API_URL: process.env.API_URL as string,
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT ?? '30000', 10),
  API_TEMPERATURE: parseFloat(process.env.API_TEMPERATURE ?? '0.3'),
  API_MAX_TOKENS: parseInt(process.env.API_MAX_TOKENS ?? '1000', 10),
  API_TOP_P: parseFloat(process.env.API_TOP_P ?? '0.6'),
  API_PRESENCE_PENALTY: parseFloat(process.env.API_PRESENCE_PENALTY ?? '0.95'),
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY as string,
  CLAUDE_MODEL: process.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-20241022',
  CLAUDE_API_URL: process.env.CLAUDE_API_URL ?? 'https://api.anthropic.com/v1/messages',
  CLAUDE_TEMPERATURE: parseFloat(process.env.CLAUDE_TEMPERATURE ?? '0.5'),
  CLAUDE_MAX_TOKENS: parseInt(process.env.CLAUDE_MAX_TOKENS ?? '4096', 10),
  CLAUDE_TIMEOUT: parseInt(process.env.CLAUDE_TIMEOUT ?? '120000', 10),
  RECENT_DATA_COUNT: parseInt(process.env.RECENT_DATA_COUNT ?? '20', 10),
  SSQ_FILE_PREFIX: process.env.SSQ_FILE_PREFIX ?? 'ssq_data_',
  DLT_FILE_PREFIX: process.env.DLT_FILE_PREFIX ?? 'dlt_data_',
  FC3D_FILE_PREFIX: process.env.FC3D_FILE_PREFIX ?? 'fc3d_data_',
  CACHE_DURATION: parseInt(process.env.CACHE_DURATION ?? '3600000', 10),
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
};

export default configDefault;
