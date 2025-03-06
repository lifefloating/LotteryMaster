import axios from 'axios';
import * as XLSX from 'xlsx';
import analyzeService from '../../services/analyzeService';

// Mock dependencies
jest.mock('axios', () => {
  const mockPost = jest.fn().mockResolvedValue({
    data: {
      choices: [
        {
          message: {
            content: '```json\n{"frequencyAnalysis":{"frontZone":[],"backZone":[]}}\n```',
          },
        },
      ],
    },
  });
  mockPost.mockRejectedValueOnce = jest.fn();
  return {
    default: {
      post: mockPost,
      isAxiosError: jest.fn().mockImplementation(() => false),
    },
    post: mockPost,
    isAxiosError: jest.fn().mockImplementation(() => false),
  };
});
jest.mock('xlsx');
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));
jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    DATA_PATH: 'test_data',
    API_KEY: 'test-api-key',
    API_URL: 'https://test-api.example.com/v1/chat/completions',
    API_MODEL: 'test-model',
    API_TIMEOUT: 30000,
    API_TEMPERATURE: 0.3,
    API_MAX_TOKENS: 1000,
    API_TOP_P: 0.6,
    API_PRESENCE_PENALTY: 0.95,
    CACHE_DURATION: 3600000,
    RECENT_DATA_COUNT: 20,
  },
}));

describe('AnalyzeService', () => {
  const mockExcelData = [
    {
      期号: '2024001',
      红球号码: '01, 02, 03, 04, 05, 06',
      蓝球号码: '07',
    },
  ];

  const mockApiResponse = {
    data: {
      choices: [
        {
          message: {
            content: '```json\n{"frequencyAnalysis":{"frontZone":[],"backZone":[]}}\n```',
          },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock XLSX functions
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
    };
    (XLSX as any).readFile = jest.fn().mockReturnValue(mockWorkbook);
    (XLSX.utils as any).sheet_to_json = jest.fn().mockReturnValue(mockExcelData);
    // Mock axios.post to return test response
    (axios.post as jest.Mock).mockResolvedValue(mockApiResponse);
  });

  describe('analyzeLotteryData', () => {
    it('should analyze lottery data successfully', async () => {
      const result = await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');

      expect(XLSX.readFile).toHaveBeenCalledWith('test.xlsx');
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalled();
      expect(result).toHaveProperty('rawContent');
      expect(result).toHaveProperty('structured');
      expect(result.structured).toHaveProperty('frequencyAnalysis');
    });

    it('should handle API errors gracefully', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      // 使用不同的方式模拟错误
      (axios.post as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const result = await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');

      expect(result).toHaveProperty('structured');
      expect(result.structured).toHaveProperty('frequencyAnalysis');
      expect(result.structured.frequencyAnalysis).toEqual({ frontZone: [], backZone: [] });
    });

    it('should handle invalid API responses', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content:
                  '```json\n{"frequencyAnalysis":{"frontZone":[],"backZone":[]},"hotColdAnalysis":{"frontZone":{"hotNumbers":[],"coldNumbers":[],"risingNumbers":[]},"backZone":{"hotNumbers":[],"coldNumbers":[],"risingNumbers":[]}},"missingAnalysis":{"frontZone":{"maxMissingNumber":0,"missingTrend":"","warnings":[]},"backZone":{"missingStatus":"","warnings":[]}},"trendAnalysis":{"frontZoneFeatures":[],"backZoneFeatures":[],"keyTurningPoints":[]},"oddEvenAnalysis":{"frontZoneRatio":"","backZoneRatio":"","recommendedRatio":""},"recommendations":[],"topRecommendation":{"frontZone":[],"backZone":[]},"riskWarnings":[]}\n```',
              },
            },
          ],
        },
      });

      const result = await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
      expect(result).toHaveProperty('structured');
      expect(result.structured).toHaveProperty('frequencyAnalysis');
    });

    it('should handle JSON parsing errors in API response', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: '{invalid json}',
              },
            },
          ],
        },
      });

      const result = await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
      expect(result).toHaveProperty('structured');
    });

    it('should build the correct prompt for analysis', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: '```json\n{"frequencyAnalysis":{"frontZone":[],"backZone":[]}}\n```',
              },
            },
          ],
        },
      });

      await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
    });

    it('should include all parameters for non-deepseek-r1 models', async () => {
      // Replace require with import
      const analyzeService = (await import('../../services/analyzeService')).default;

      const originalPost = axios.post;

      try {
        // 替换 axios.post
        axios.post = jest.fn().mockImplementation((url, data) => {
          expect(data).toHaveProperty('model');
          expect(data).toHaveProperty('messages');
          expect(data).toHaveProperty('temperature');
          expect(data).toHaveProperty('max_tokens');
          expect(data).toHaveProperty('top_p');
          expect(data).toHaveProperty('presence_penalty');

          return Promise.resolve({
            data: {
              choices: [
                {
                  message: {
                    content: '```json\n{"frequencyAnalysis":{"frontZone":[],"backZone":[]}}\n```',
                  },
                },
              ],
            },
          });
        });

        // 设置非 deepseek-r1 模型
        (analyzeService as any).API_MODEL = 'qwen-long';
        (analyzeService as any).cache = new Map();

        await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
      } finally {
        axios.post = originalPost;
      }
    });

    it('should only include max_tokens parameter for deepseek-r1 model', async () => {
      // Replace require with import
      const analyzeService = (await import('../../services/analyzeService')).default;

      const originalPost = axios.post;

      try {
        axios.post = jest.fn().mockImplementation((url, data) => {
          expect(data).toHaveProperty('model');
          expect(data).toHaveProperty('messages');
          expect(data).toHaveProperty('max_tokens');
          expect(data).not.toHaveProperty('temperature');
          expect(data).not.toHaveProperty('top_p');
          expect(data).not.toHaveProperty('presence_penalty');

          return Promise.resolve({
            data: {
              choices: [
                {
                  message: {
                    content: '```json\n{"frequencyAnalysis":{"frontZone":[],"backZone":[]}}\n```',
                  },
                },
              ],
            },
          });
        });

        (analyzeService as any).API_MODEL = 'deepseek-r1';
        (analyzeService as any).cache = new Map();

        await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
      } finally {
        axios.post = originalPost;
      }
    });
  });
});
