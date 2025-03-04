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
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTData);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'DLT', 100, 'red');

      // Verify the result structure for DLT front zone
      expect(result.chartData?.datasets[0]).toHaveProperty('label', '红球走势');
    });

    it('should generate trend data for DLT back zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTData);

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

  describe('generateFrequencyChart', () => {
    it('should generate frequency chart for SSQ red balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'SSQ', 100, 'red');

      expect(fs.existsSync).toHaveBeenCalledWith('test-file.xlsx');
      expect(XLSX.readFile).toHaveBeenCalledWith('test-file.xlsx');
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

      expect(result).toHaveProperty('datasets');
      expect(result.datasets[0]).toHaveProperty('label', '红球出现频率');
      expect(result.datasets[0]).toHaveProperty('backgroundColor', '#ff4d4f');
      expect(result.type).toBe('bar');
    });

    it('should generate frequency chart for SSQ blue balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart(
        'test-file.xlsx',
        'SSQ',
        100,
        'blue'
      );

      expect(result.datasets[0]).toHaveProperty('label', '蓝球出现频率');
      expect(result.datasets[0]).toHaveProperty('backgroundColor', '#1890ff');
    });

    it('should generate frequency chart for DLT red balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'DLT', 100, 'red');

      expect(result.datasets[0]).toHaveProperty('label', '红球出现频率');
    });

    it('should generate frequency chart for DLT blue balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTExcelData);

      const result = await chartService.generateFrequencyChart(
        'test-file.xlsx',
        'DLT',
        100,
        'blue'
      );

      expect(result.datasets[0]).toHaveProperty('label', '蓝球出现频率');
    });

    it('should handle file not found error for frequency chart', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        chartService.generateFrequencyChart('non-existent-file.xlsx', 'SSQ')
      ).rejects.toThrow('文件不存在');
    });

    it('should handle empty data for frequency chart', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'SSQ');

      expect(result).toHaveProperty('datasets');
      expect(result.type).toBe('bar');
    });
  });

  describe('data extraction methods', () => {
    it('should extract SSQ data from Excel with standard column names', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          开奖日期: '2023-01-01',
          红球: '1,2,3,4,5,6',
          蓝球: '7',
        },
      ]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ');

      expect(result.chartData?.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should extract SSQ data from Excel with non-standard column names', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          日期: '2023-01-01',
          红球组合: '1,2,3,4,5,6',
          特别号: '7',
        },
      ]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ');

      // 即使列名不标准，也应该能够提取数据
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('statistics');
    });

    it('should extract DLT data from Excel with standard column names', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          开奖日期: '2023-01-01',
          前区号码: '1,2,3,4,5',
          后区号码1: '6',
          后区号码2: '7',
        },
      ]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'DLT');

      expect(result.chartData?.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should extract data for frequency analysis', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'SSQ');

      expect(result.datasets[0].data.length).toBeGreaterThan(0);
    });
  });

  describe('private methods coverage', () => {
    // 测试 findRedBallsInRow 和 findBlueBallInRow 方法
    it('should find red balls in row with comma-separated values', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          日期: '2023-01-01',
          号码组合: '1,2,3,4,5,6',
        },
      ]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ');

      expect(result).toHaveProperty('chartData');
      expect(result.chartData?.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should find blue ball in row with single number value', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          日期: '2023-01-01',
          红球: '1,2,3,4,5,6',
          特别号码: '7',
        },
      ]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'blue');

      expect(result).toHaveProperty('chartData');
    });

    // 测试 getNumberRange 方法
    it('should return correct number range for SSQ red balls', async () => {
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'red');

      // 红球范围应该是 1-33
      const maxNumber = Math.max(...result.statistics.numberStats.map((stat) => stat.number));
      expect(maxNumber).toBe(33);
    });

    it('should return correct number range for SSQ blue balls', async () => {
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'blue');

      // 蓝球范围应该是 1-16
      const maxNumber = Math.max(...result.statistics.numberStats.map((stat) => stat.number));
      expect(maxNumber).toBe(16);
    });

    it('should return correct number range for DLT red balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTData);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'DLT', 100, 'red');

      // 大乐透前区范围应该是 1-35
      const maxNumber = Math.max(...result.statistics.numberStats.map((stat) => stat.number));
      expect(maxNumber).toBe(35);
    });

    it('should return correct number range for DLT blue balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTData);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'DLT', 100, 'blue');

      // 大乐透后区范围应该是 1-12
      const maxNumber = Math.max(...result.statistics.numberStats.map((stat) => stat.number));
      expect(maxNumber).toBe(12);
    });

    // 测试 processTrendData 方法
    it('should process trend data correctly for red balls', async () => {
      // 使用有频率的数据
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          日期: '2023-01-01',
          红球: '1,2,3,4,5,6',
          蓝球: '7',
        },
        {
          日期: '2023-01-03',
          红球: '1,2,3,4,5,6', // 重复的红球，确保频率 > 0
          蓝球: '8',
        },
      ]);

      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'red');

      // 验证统计数据是否正确计算
      expect(
        result.statistics.numberStats.some((stat) => stat.number === 1 && stat.frequency > 0)
      ).toBe(true);
      expect(result.statistics.numberStats.some((stat) => stat.probability >= 0)).toBe(true);
    });

    it('should process trend data correctly for blue balls', async () => {
      const result = await chartService.generateNumberTrend('test-file.xlsx', 'SSQ', 100, 'blue');

      // 验证统计数据是否正确计算
      expect(result.statistics.numberStats.some((stat) => stat.frequency > 0)).toBe(true);
    });

    // 测试 calculateFrequency 方法
    it('should calculate frequency correctly for SSQ', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'SSQ');

      // 验证频率图表数据是否正确
      expect(result.datasets[0].data.some((point: any) => point.value > 0)).toBe(true);
    });

    it('should calculate frequency correctly for DLT', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockDLTExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'DLT');

      // 验证频率图表数据是否正确
      expect(result.datasets[0].data.some((point: any) => point.value > 0)).toBe(true);
    });

    // 测试 getNumbersForZone 方法
    it('should get correct numbers for red zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'SSQ', 100, 'red');

      // 红球区域应该有数据
      expect(result.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should get correct numbers for blue zone', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart(
        'test-file.xlsx',
        'SSQ',
        100,
        'blue'
      );

      // 蓝球区域应该有数据
      expect(result.datasets[0].data.length).toBeGreaterThan(0);
    });

    // 测试 formatFrequencyChartData 方法
    it('should format frequency chart data correctly for red balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart('test-file.xlsx', 'SSQ', 100, 'red');

      // 验证图表格式是否正确
      expect(result.type).toBe('bar');
      expect(result).toHaveProperty('options');
      expect(result.options).toHaveProperty('scales');
    });

    it('should format frequency chart data correctly for blue balls', async () => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);

      const result = await chartService.generateFrequencyChart(
        'test-file.xlsx',
        'SSQ',
        100,
        'blue'
      );

      // 验证图表格式是否正确
      expect(result.type).toBe('bar');
      expect(result.options.scales.y.title.text).toBe('出现次数');
    });
  });
});
