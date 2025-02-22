import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: number;
  SSQ_URL: string;
  DLT_URL: string;
  DATA_PATH: string;
  API_KEY: string;
  API_URL: string;
  API_TIMEOUT: number;
  API_TEMPERATURE: number;
  API_MAX_TOKENS: number;
  RECENT_DATA_COUNT: number;
  SSQ_FILE_PREFIX: string;
  DLT_FILE_PREFIX: string;
}

const config: Config = {
  PORT: parseInt(process.env.PORT || '3008', 10),
  SSQ_URL: process.env.SSQ_URL as string,
  DLT_URL: process.env.DLT_URL as string,
  DATA_PATH: process.env.DATA_PATH ?? 'lottery_data',
  API_KEY: process.env.API_KEY as string,
  API_URL: process.env.API_URL as string,
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '120000', 10),
  API_TEMPERATURE: parseFloat(process.env.API_TEMPERATURE || '0.7'),
  API_MAX_TOKENS: parseInt(process.env.API_MAX_TOKENS || '2000', 10),
  RECENT_DATA_COUNT: parseInt(process.env.RECENT_DATA_COUNT || '50', 10),
  SSQ_FILE_PREFIX: process.env.SSQ_FILE_PREFIX || 'ssq_data_',
  DLT_FILE_PREFIX: process.env.DLT_FILE_PREFIX || 'dlt_data_',
};

export default config;
