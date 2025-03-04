import { FastifyRequest, FastifyReply } from 'fastify';
import { getTrendChart, getFrequencyChart } from '../../controllers/chartController';
import chartService from '../../services/chartService';
import path from 'path';

// Mock dependencies
jest.mock('../../services/chartService');
jest.mock('path', () => ({
  __esModule: true,
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

interface ChartQuerystring {
  type: 'ssq' | 'dlt';
  periodCount?: string;
  zoneType?: 'red' | 'blue';
  includeChartData?: string;
}

type TestRequest = FastifyRequest<{
  Querystring: ChartQuerystring;
}>;

describe('Chart Controller', () => {
  const mockTrendData = {
    chartData: {
      labels: ['1', '2', '3'],
      datasets: [{ data: [1, 2, 3] }],
    },
    statistics: {
      hotNumbers: [1, 2, 3],
      coldNumbers: [4, 5, 6],
    },
  };

  let mockRequest: TestRequest;
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
      query: {
        type: 'ssq',
        zoneType: 'red',
      },
      log: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    } as unknown as TestRequest;

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

    // Mock chartService
    (chartService.generateNumberTrend as jest.Mock).mockResolvedValue(mockTrendData);
    (chartService.generateFrequencyChart as jest.Mock).mockResolvedValue(mockTrendData);
  });

  describe('getTrendChart', () => {
    it('should return trend chart data with default parameters', async () => {
      await getTrendChart(mockRequest, mockReply);

      // Verify the service was called
      expect(path.join).toHaveBeenCalled();
      expect(chartService.generateNumberTrend).toHaveBeenCalledWith(
        expectedSsqFilePath,
        'SSQ',
        100,
        'red'
      );
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockTrendData,
      });
    });

    it('should exclude chart data when includeChartData is false', async () => {
      mockRequest.query.includeChartData = 'false';

      await getTrendChart(mockRequest, mockReply);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { chartData, ...rest } = mockTrendData;

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: rest,
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (chartService.generateNumberTrend as jest.Mock).mockRejectedValue(error);

      await getTrendChart(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Service error',
        },
      });
    });
  });

  describe('getFrequencyChart', () => {
    it('should return frequency chart data with custom parameters', async () => {
      const request = {
        query: {
          type: 'dlt',
          periodCount: '50',
          zoneType: 'blue',
        },
      } as TestRequest;

      await getFrequencyChart(request, mockReply);

      // Verify the service was called
      expect(path.join).toHaveBeenCalled();
      expect(chartService.generateFrequencyChart).toHaveBeenCalledWith(
        expectedDltFilePath,
        'DLT',
        50,
        'blue'
      );
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockTrendData,
      });
    });

    it('should exclude chart data when includeChartData is false', async () => {
      const request = {
        query: {
          type: 'ssq',
          includeChartData: 'false',
        },
      } as TestRequest;

      await getFrequencyChart(request, mockReply);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { chartData, ...rest } = mockTrendData;

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Chart data excluded as requested' },
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (chartService.generateFrequencyChart as jest.Mock).mockRejectedValue(error);

      await getFrequencyChart(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Service error',
        },
      });
    });
  });
});
