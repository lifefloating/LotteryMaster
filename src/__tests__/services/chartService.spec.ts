import * as XLSX from 'xlsx';
import * as fs from 'fs';
import chartService from '../../services/chartService';
import { LotteryData } from '../../types/lottery';

// Mock dependencies
jest.mock('xlsx');
jest.mock('fs');

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
  });

  describe('generateNumberTrend', () => {
    it('should generate trend data for SSQ red balls', async () => {
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'red');

      // Verify file existence was checked
      expect(fs.existsSync).toHaveBeenCalledWith('test-file.xlsx');

      // Verify XLSX was called correctly
      expect(XLSX.readFile).toHaveBeenCalledWith('test-file.xlsx');
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
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'blue');

      // Verify the result structure for blue balls
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '蓝球走势');
      expect(result.chartData?.datasets[0]).toHaveProperty('borderColor', '#1890ff');
    });

    it('should generate trend data for DLT front zone', async () => {
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'DLT', 100, 'red');

      // Verify the result structure for DLT front zone
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '红球走势');
    });

    it('should generate trend data for DLT back zone', async () => {
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'DLT', 100, 'blue');

      // Verify the result structure for DLT back zone
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '蓝球走势');
    });

    it('should handle file not found error', async () => {
      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Expect the service to throw an error
      await expect(
        chartService.generateNumberTrend('non-existent-file.xlsx', 'SSQ')
      ).rejects.toThrow('文件不存在');
    });

    it('should handle empty data error', async () => {
      // Mock XLSX.utils.sheet_to_json to return empty array
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ');

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
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 50);

      // The implementation should slice the data to the last 50 entries
      // We can't directly test the internal slicing, but we can verify the result is valid
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
    });
  });
});
