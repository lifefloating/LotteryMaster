import axios from 'axios';
import * as XLSX from 'xlsx';
import analyzeService from '../../services/analyzeService';
import { getDefaultStandardLotteryResult, getDefaultFC3DResult } from '../../constants/dafaultResults';

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
      isAxiosError: <T = any, D = any>(
        payload: any
      ): payload is import('axios').AxiosError<T, D> => {
        // Check if the payload has the shape of an Axios error
        return payload && payload.response !== undefined;
      },
    },
    post: mockPost,
    isAxiosError: <T = any, D = any>(payload: any): payload is import('axios').AxiosError<T, D> => {
      // Check if the payload has the shape of an Axios error
      return payload && payload.response !== undefined;
    },
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
jest.mock('../../constants/dafaultResults');

describe('AnalyzeService', () => {
  const mockExcelData = [
    {
      期号: '2024001',
      红球号码: '01, 02, 03, 04, 05, 06',
      蓝球号码: '07',
    },
  ];

  const mockFC3DExcelData = [
    {
      期号: '2024001',
      号码: '1, 2, 3',
    },
  ];

  const mockStandardApiResponse = {
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

  const mockFC3DApiResponse = {
    data: {
      choices: [
        {
          message: {
            content: '```json\n{"frequencyAnalysis":{"hundredsPlace":[],"tensPlace":[],"onesPlace":[]}}\n```',
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
    (axios.post as jest.Mock).mockResolvedValue(mockStandardApiResponse);
    
    // Reset the cache for each test
    (analyzeService as any).cache = new Map();
    
    // Setup default result mocks
    (getDefaultStandardLotteryResult as jest.Mock).mockReturnValue({
      frequencyAnalysis: { frontZone: [], backZone: [] },
      // ... other standard lottery properties
    });
    
    (getDefaultFC3DResult as jest.Mock).mockReturnValue({
      frequencyAnalysis: { 
        hundredsPlace: [], 
        tensPlace: [], 
        onesPlace: [],
        sumValue: { mostFrequent: [], distribution: '' }
      },
      // ... other FC3D properties
    });
  });

  describe('analyzeLotteryData', () => {
    it('should analyze standard lottery data successfully', async () => {
      const result = await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');

      expect(XLSX.readFile).toHaveBeenCalledWith('test.xlsx');
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalled();
      expect(result).toHaveProperty('structured');
      expect(result.structured).toHaveProperty('frequencyAnalysis');
    });

    it('should analyze FC3D lottery data successfully', async () => {
      // Set up mock for FC3D data
      (XLSX.utils as any).sheet_to_json = jest.fn().mockReturnValue(mockFC3DExcelData);
      (axios.post as jest.Mock).mockResolvedValue(mockFC3DApiResponse);

      const result = await analyzeService.analyzeLotteryData('fc3d_test.xlsx', 'FC3D');

      expect(XLSX.readFile).toHaveBeenCalledWith('fc3d_test.xlsx');
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalled();
      
      // Verify that the correct prompt and system prompt were used
      const axiosCallArgs = (axios.post as jest.Mock).mock.calls[0][1];
      expect(axiosCallArgs.messages[0].content).toContain('福彩3D');
      
      expect(result).toHaveProperty('structured');
      expect(result.structured).toHaveProperty('frequencyAnalysis');
    });

    it('should use the correct default result structure for FC3D', async () => {
      // Create a mock invalid response to trigger default result
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: 'Invalid JSON',
              },
            },
          ],
        },
      });

      await analyzeService.analyzeLotteryData('fc3d_test.xlsx', 'FC3D');
      
      // Verify that getDefaultFC3DResult was called
      expect(getDefaultFC3DResult).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();
      (analyzeService as any).cache = new Map();

      const networkError = new Error('Network error');
      // 使用 mockImplementationOnce 确保错误被抛出
      (axios.post as jest.Mock).mockImplementationOnce(() => {
        throw networkError;
      });

      try {
        await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
        // 如果没有抛出错误，测试应该失败
        expect('No error thrown').toBe('Error should have been thrown');
      } catch (error) {
        expect(error).toBe(networkError);
      }
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

      await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
      
      // Verify that getDefaultStandardLotteryResult was called
      expect(getDefaultStandardLotteryResult).toHaveBeenCalled();
    });

    it('should build the correct prompt for standard lottery analysis', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      // Mock the API response
      (axios.post as jest.Mock).mockImplementation((url, data) => {
        // Check that the system prompt contains the expected content
        expect(data.messages[0].content).toContain('双色球');
        expect(data.messages[0].content).not.toContain('福彩3D');
        
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

      await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
      
      // Verify that axios.post was called
      expect(axios.post).toHaveBeenCalled();
    });

    it('should build the correct prompt for FC3D analysis', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      // Mock the API response
      (axios.post as jest.Mock).mockImplementation((url, data) => {
        // Check that the system prompt contains the expected content
        expect(data.messages[0].content).toContain('福彩3D');
        expect(data.messages[0].content).not.toContain('双色球');
        
        return Promise.resolve({
          data: {
            choices: [
              {
                message: {
                  content: '```json\n{"frequencyAnalysis":{"hundredsPlace":[],"tensPlace":[],"onesPlace":[]}}\n```',
                },
              },
            ],
          },
        });
      });

      await analyzeService.analyzeLotteryData('fc3d_test.xlsx', 'FC3D');
      
      // Verify that axios.post was called
      expect(axios.post).toHaveBeenCalled();
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
          expect(data).not.toHaveProperty('stream');

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
          expect(data).not.toHaveProperty('stream');

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

    it('should handle Axios errors with detailed error information', async () => {
      jest.clearAllMocks();
      (analyzeService as any).cache = new Map();

      // Create a mock Axios error with response data
      const axiosError = new Error('API Error') as any;
      axiosError.response = {
        status: 400,
        data: { error: { message: 'Invalid parameter' } },
      };

      // Mock axios.isAxiosError to return true for our error
      const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockImplementation(() => true);

      (axios.post as jest.Mock).mockImplementationOnce(() => {
        throw axiosError;
      });

      try {
        await analyzeService.analyzeLotteryData('test.xlsx', 'SSQ');
        // 如果没有抛出错误，测试应该失败
        expect('No error thrown').toBe('Error should have been thrown');
      } catch (error) {
        expect(error).toBe(axiosError);
        expect(isAxiosErrorSpy).toHaveBeenCalled();
      } finally {
        // Restore the original spy
        isAxiosErrorSpy.mockRestore();
      }
    });
  });
});
