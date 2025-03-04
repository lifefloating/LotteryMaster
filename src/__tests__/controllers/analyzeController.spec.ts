import { FastifyRequest, FastifyReply } from 'fastify';
import { analyzeSSQ, analyzeDLT } from '../../controllers/analyzeController';
import analyzeService from '../../services/analyzeService';
import * as path from 'path';
import config from '../../config';

// Mock dependencies
jest.mock('../../services/analyzeService');
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  default: {
    join: jest.fn((...args) => args.join('/')),
  },
}));
jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    DATA_PATH: 'test_data',
    SSQ_FILE_PREFIX: 'ssq_data_',
    DLT_FILE_PREFIX: 'dlt_data_',
  },
}));

describe('Analyze Controller', () => {
  const mockAnalysisResult = {
    rawContent: 'Test raw content',
    structured: {
      frequencyAnalysis: { frontZone: [], backZone: [] },
      hotColdAnalysis: {
        frontZone: { hotNumbers: [], coldNumbers: [], risingNumbers: [] },
        backZone: { hotNumbers: [], coldNumbers: [], risingNumbers: [] },
      },
      missingAnalysis: {
        frontZone: { maxMissingNumber: 0, missingTrend: '', warnings: [] },
        backZone: { missingStatus: '', warnings: [] },
      },
      trendAnalysis: { frontZoneFeatures: [], backZoneFeatures: [], keyTurningPoints: [] },
      oddEvenAnalysis: { frontZoneRatio: '', backZoneRatio: '', recommendedRatio: '' },
      recommendations: [],
      riskWarnings: [],
    },
  };

  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let today: string;
  let expectedSsqFilePath: string;
  let expectedDltFilePath: string;
  let originalDate: DateConstructor;

  beforeAll(() => {
    // Save original Date constructor
    originalDate = global.Date;

    // Mock Date constructor
    const fixedDate = new Date('2024-03-04T12:00:00Z');
    global.Date = class extends Date {
      constructor() {
        super();
        return fixedDate;
      }

      static now(): number {
        return fixedDate.getTime();
      }
    } as DateConstructor;
  });

  afterAll(() => {
    // Restore original Date constructor
    global.Date = originalDate;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Fixed date for testing
    today = '2024-03-04';
    expectedSsqFilePath = `test_data/ssq_data_${today}.xlsx`;
    expectedDltFilePath = `test_data/dlt_data_${today}.xlsx`;

    // Mock request
    mockRequest = {
      query: {},
    } as FastifyRequest;

    // Mock reply
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      log: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    } as unknown as FastifyReply;

    // Mock analyzeService
    (analyzeService.analyzeLotteryData as jest.Mock).mockResolvedValue(mockAnalysisResult);
  });

  describe('analyzeSSQ', () => {
    it('should analyze SSQ data and return results', async () => {
      await analyzeSSQ(mockRequest, mockReply);

      // Verify the service was called with correct arguments
      expect(path.join).toHaveBeenCalledWith(config.DATA_PATH, `ssq_data_${today}.xlsx`);
      expect(analyzeService.analyzeLotteryData).toHaveBeenCalledWith(expectedSsqFilePath, 'SSQ');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        analysis: {
          raw: mockAnalysisResult.rawContent,
          structured: mockAnalysisResult.structured,
        },
      });
    });
  });

  describe('analyzeDLT', () => {
    it('should analyze DLT data and return results', async () => {
      await analyzeDLT(mockRequest, mockReply);

      // Verify the service was called with correct arguments
      expect(path.join).toHaveBeenCalledWith(config.DATA_PATH, `dlt_data_${today}.xlsx`);
      expect(analyzeService.analyzeLotteryData).toHaveBeenCalledWith(expectedDltFilePath, 'DLT');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        analysis: {
          raw: mockAnalysisResult.rawContent,
          structured: mockAnalysisResult.structured,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Analysis failed');
      (analyzeService.analyzeLotteryData as jest.Mock).mockRejectedValue(error);

      await analyzeDLT(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Analysis failed',
        },
      });
    });
  });
});
