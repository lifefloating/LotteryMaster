import { FastifyRequest, FastifyReply } from 'fastify';
import { analyzeSSQ, analyzeDLT, analyzeFC3D } from '../../controllers/analyzeController';
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
    FC3D_FILE_PREFIX: 'fc3d_data_',
  },
}));

describe('Analyze Controller', () => {
  const mockStandardAnalysisResult = {
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
      topRecommendation: { frontZone: [], backZone: [], rationale: '' },
      riskWarnings: [],
    },
  };

  const mockFC3DAnalysisResult = {
    structured: {
      frequencyAnalysis: {
        hundredsPlace: [],
        tensPlace: [],
        onesPlace: [],
        sumValue: { mostFrequent: [], distribution: '' },
      },
      hotColdAnalysis: {
        hundredsPlace: { hotNumbers: [], coldNumbers: [] },
        tensPlace: { hotNumbers: [], coldNumbers: [] },
        onesPlace: { hotNumbers: [], coldNumbers: [] },
      },
      missingAnalysis: {
        hundredsPlace: { maxMissingNumber: 0, missingTrend: '' },
        tensPlace: { maxMissingNumber: 0, missingTrend: '' },
        onesPlace: { maxMissingNumber: 0, missingTrend: '' },
      },
      spanAnalysis: { currentSpan: 0, spanTrend: '', recommendedSpan: [] },
      oddEvenAnalysis: { currentRatio: '', ratioTrend: '', recommendedRatio: '' },
      groupAnalysis: {
        groupDistribution: { group6: '', group3: '', groupTrend: '' },
        currentPattern: '',
      },
      recommendations: [],
      topRecommendation: {
        directSelection: [],
        groupSelection: { type: '', numbers: [] },
        rationale: '',
      },
      riskWarnings: [],
    },
  };

  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let today: string;
  let expectedSsqFilePath: string;
  let expectedDltFilePath: string;
  let expectedFC3DFilePath: string;
  let originalDate: DateConstructor;
  // Mock __dirname for controllers
  const mockControllersDir = '/Users/gehonglu/remote-code/LotteryMaster/src/controllers';

  beforeAll(() => {
    // Save original Date constructor
    originalDate = global.Date;
  });

  afterAll(() => {
    // Restore original Date constructor
    global.Date = originalDate;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Get current date in YYYY-MM-DD format
    today = new Date().toISOString().slice(0, 10);
    expectedSsqFilePath = `${mockControllersDir}/../test_data/ssq_data_${today}.xlsx`;
    expectedDltFilePath = `${mockControllersDir}/../test_data/dlt_data_${today}.xlsx`;
    expectedFC3DFilePath = `${mockControllersDir}/../test_data/fc3d_data_${today}.xlsx`;

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
    (analyzeService.analyzeLotteryData as jest.Mock).mockResolvedValue(mockStandardAnalysisResult);
  });

  describe('analyzeSSQ', () => {
    it('should analyze SSQ data and return results', async () => {
      await analyzeSSQ(mockRequest, mockReply);

      // Verify the service was called with correct arguments
      expect(path.join).toHaveBeenCalledWith(
        mockControllersDir,
        '..',
        config.DATA_PATH,
        `${config.SSQ_FILE_PREFIX}${today}.xlsx`
      );
      expect(analyzeService.analyzeLotteryData).toHaveBeenCalledWith(expectedSsqFilePath, 'SSQ');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        analysis: {
          structured: mockStandardAnalysisResult.structured,
        },
      });
    });
  });

  describe('analyzeDLT', () => {
    it('should analyze DLT data and return results', async () => {
      await analyzeDLT(mockRequest, mockReply);

      // Verify the service was called with correct arguments
      expect(path.join).toHaveBeenCalledWith(
        mockControllersDir,
        '..',
        config.DATA_PATH,
        `${config.DLT_FILE_PREFIX}${today}.xlsx`
      );
      expect(analyzeService.analyzeLotteryData).toHaveBeenCalledWith(expectedDltFilePath, 'DLT');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        analysis: {
          structured: mockStandardAnalysisResult.structured,
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

  describe('analyzeFC3D', () => {
    it('should analyze FC3D data and return results', async () => {
      // Set up mock to return FC3D specific result
      (analyzeService.analyzeLotteryData as jest.Mock).mockResolvedValue(mockFC3DAnalysisResult);

      await analyzeFC3D(mockRequest, mockReply);

      // Verify the service was called with correct arguments
      expect(path.join).toHaveBeenCalledWith(
        mockControllersDir,
        '..',
        config.DATA_PATH,
        `${config.FC3D_FILE_PREFIX}${today}.xlsx`
      );
      expect(analyzeService.analyzeLotteryData).toHaveBeenCalledWith(expectedFC3DFilePath, 'FC3D');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        analysis: {
          structured: mockFC3DAnalysisResult.structured,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('FC3D analysis failed');
      (analyzeService.analyzeLotteryData as jest.Mock).mockRejectedValue(error);

      await analyzeFC3D(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'FC3D analysis failed',
        },
      });
    });
  });
});
