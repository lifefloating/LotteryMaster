// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATA_PATH = 'test_data';

// Mock path module globally
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/') || '/'),
}));

// Mock config globally
jest.mock('../config', () => ({
  __esModule: true,
  default: {
    DATA_PATH: 'test_data',
    API_ENDPOINT: 'http://test-api.example.com',
    API_KEY: 'test-api-key',
    SSQ_FILE_PREFIX: 'ssq_data_',
    DLT_FILE_PREFIX: 'dlt_data_',
    API_URL: 'https://test-api.example.com/v1/chat/completions',
    API_MODEL: 'test-model',
    API_MODEL_LONG: 'test-model-long',
    API_TIMEOUT: 30000,
    API_TEMPERATURE: 0.3,
    API_MAX_TOKENS: 1000,
    CACHE_DURATION: 3600000,
    HISTORY_LIMIT: 100,
  },
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
