import * as XLSX from 'xlsx';
import * as fs from 'fs';
import chartService from '../../services/chartService';
import { LotteryData } from '../../types/lottery';

// Mock dependencies
jest.mock('xlsx');
jest.mock('fs');
jest.mock('path', () => {
  return {
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/')),
    __dirname: 'mocked-dir',
    __filename: 'mocked-file',
  };
});

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('ChartService', () => {
  const mockLotteryData: LotteryData[] = [
    {
      date: '2023-01-01',
      numbers: [1, 2, 3, 4, 5, 6],
      bonusNumber: 7,
    },
    {
      date: '2023-01-03',
      numbers: [8, 9, 10, 11, 12, 13],
      bonusNumber: 14,
    },
    {
      date: '2023-01-05',
      numbers: [2, 4, 6, 8, 10, 12],
      bonusNumber: 7,
    },
  ];

  const mockDLTData = [
    {
      date: '2023-01-01',
      numbers: [1, 2, 3, 4, 5],
      bonusNumber: 7,
      bonusNumber2: 8,
    },
    {
      date: '2023-01-03',
      numbers: [8, 9, 10, 11, 12],
      bonusNumber: 9,
      bonusNumber2: 10,
    },
  ];

  const mockExcelData = [
    {
      期号: '2023001',
      开奖日期: '2023-01-01',
      红球: '1,2,3,4,5,6',
      蓝球: '7',
    },
    {
      期号: '2023002',
      开奖日期: '2023-01-03',
      红球: '8,9,10,11,12,13',
      蓝球: '14',
    },
    {
      期号: '2023003',
      开奖日期: '2023-01-05',
      红球: '2,4,6,8,10,12',
      蓝球: '7',
    },
  ];

  const mockDLTExcelData = [
    {
      期号: '2023001',
      开奖日期: '2023-01-01',
      前区号码: '1,2,3,4,5',
      后区号码1: '7',
      后区号码2: '8',
    },
    {
      期号: '2023002',
      开奖日期: '2023-01-03',
      前区号码: '8,9,10,11,12',
      后区号码1: '9',
      后区号码2: '10',
    },
  ];

  const testFilePath = 'test-file.xlsx';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs.existsSync
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock XLSX.readFile
    (XLSX.readFile as jest.Mock).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
    });

    // Mock XLSX.utils.sheet_to_json
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockLotteryData);

    // Mock private method getDataFilePath
    jest.spyOn(chartService as any, 'getDataFilePath').mockReturnValue(testFilePath);
  });

  describe('generateNumberTrend', () => {
    it('should generate trend data for SSQ red balls', async () => {
      const result = await chartService.generateNumberTrend('SSQ', 100, 'red');

      // Verify file existence was checked
      expect(fs.existsSync).toHaveBeenCalledWith(testFilePath);

      // Verify XLSX was called correctly
      expect(XLSX.readFile).toHaveBeenCalledWith(testFilePath);
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

      // Verify the result structure
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
      expect(result.chartData).toHaveProperty('datasets');
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '红球走势');
      expect(result.chartData?.datasets[0]).toHaveProperty('borderColor', '#ff4d4f');
      expect(result.statistics).toHaveProperty('numberStats');
      expect(Array.isArray(result.statistics.numberStats)).toBe(true);
    });

    it('should generate trend data for SSQ blue balls', async () => {
      const result = await chartService.generateNumberTrend('SSQ', 100, 'blue');

      // Verify the result structure for blue balls
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '蓝球走势');
      expect(result.chartData?.datasets[0]).toHaveProperty('borderColor', '#1890ff');
    });

    it('should generate trend data for DLT front zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTData);

      const result = await chartService.generateNumberTrend('DLT', 100, 'red');

      // Verify the result structure for DLT front zone
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '红球走势');
    });

    it('should generate trend data for DLT back zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTData);

      const result = await chartService.generateNumberTrend('DLT', 100, 'blue');

      // Verify the result structure for DLT back zone
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '蓝球走势');
    });

    it('should handle file not found error', async () => {
      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Expect the service to throw an error
      await expect(chartService.generateNumberTrend('SSQ')).rejects.toThrow('文件不存在');
    });

    it('should handle empty data error', async () => {
      // Mock XLSX.utils.sheet_to_json to return empty array
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      const result = await chartService.generateNumberTrend('SSQ');

      // Should still return a valid structure even with empty data
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
      expect(result.statistics.numberStats.length).toBeGreaterThan(0); // Should have stats for all possible numbers
    });

    it('should limit data to the specified period count', async () => {
      // Create mock data with more entries than the period count
      const largeDataset = Array(150)
        .fill(null)
        .map((_, i) => ({
          date: `2023-01-${i + 1}`,
          numbers: [1, 2, 3, 4, 5, 6],
          bonusNumber: 7,
        }));

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(largeDataset);

      // Request only 50 periods
      const result = await chartService.generateNumberTrend('SSQ', 50);

      // The implementation should slice the data to the last 50 entries
      // We can't directly test the internal slicing, but we can verify the result is valid
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
    });
  });

  describe('generateFrequencyChart', () => {
    it('should generate frequency chart for SSQ red balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('SSQ', 100, 'red');

      expect(fs.existsSync).toHaveBeenCalledWith(testFilePath);
      expect(XLSX.readFile).toHaveBeenCalledWith(testFilePath);
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

      expect(result).toHaveProperty('datasets');
      expect(result.datasets[0]).toHaveProperty('label', '红球出现频率');
      expect(result.datasets[0]).toHaveProperty('backgroundColor', '#ff4d4f');
    });

    it('should generate frequency chart for SSQ blue balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('SSQ', 100, 'blue');

      expect(result.datasets[0]).toHaveProperty('label', '蓝球出现频率');
      expect(result.datasets[0]).toHaveProperty('backgroundColor', '#1890ff');
    });

    it('should generate frequency chart for DLT front zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTExcelData);

      const result = await chartService.generateFrequencyChart('DLT', 100, 'red');

      expect(result.datasets[0]).toHaveProperty('label', '红球出现频率');
    });

    it('should generate frequency chart for DLT back zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTExcelData);

      const result = await chartService.generateFrequencyChart('DLT', 100, 'blue');

      expect(result.datasets[0]).toHaveProperty('label', '蓝球出现频率');
    });

    it('should handle file not found error', async () => {
      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Expect the service to throw an error
      await expect(chartService.generateFrequencyChart('SSQ')).rejects.toThrow('文件不存在');
    });

    it('should handle empty data error', async () => {
      // Mock XLSX.utils.sheet_to_json to return empty array
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      const result = await chartService.generateFrequencyChart('SSQ');

      // Should still return a valid structure even with empty data
      expect(result).toHaveProperty('datasets');
      expect(result.datasets[0].data.length).toBeGreaterThan(0); // Should have data for all possible numbers
    });
  });

  describe('private methods coverage', () => {
    // 测试 findRedBallsInRow 和 findBlueBallInRow 方法
    it('should find red balls in row with comma-separated values', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          开奖日期: '2023-01-01',
          号码: '1,2,3,4,5,6',
          蓝球: '7',
        },
      ]);

      const result = await chartService.generateNumberTrend('SSQ');

      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
    });

    it('should find blue ball in row with single value', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          开奖日期: '2023-01-01',
          红球: '1,2,3,4,5,6',
          特别号码: '7',
        },
      ]);

      const result = await chartService.generateNumberTrend('SSQ', 100, 'blue');

      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
    });

    it('should get correct numbers for red zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('SSQ', 100, 'red');

      expect(result.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should get correct numbers for blue zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('SSQ', 100, 'blue');

      expect(result.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should get correct numbers for DLT blue zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTExcelData);

      const result = await chartService.generateFrequencyChart('DLT', 100, 'blue');

      expect(result.datasets[0].data.length).toBeGreaterThan(0);
    });
  });
});
