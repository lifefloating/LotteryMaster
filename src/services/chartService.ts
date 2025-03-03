import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { createLogger } from '../utils/logger';
import { LotteryData } from '../types/lottery';

const logger = createLogger('chartService');

// Define interfaces for trend analysis
export interface NumberTrendPoint {
  position: number; // X-axis position (e.g., draw number)
  value: number; // Y-axis value (e.g., ball number)
}

export interface TrendDataset {
  label: string; // Name of the dataset (e.g., "Red Ball 1")
  data: NumberTrendPoint[];
  borderColor?: string;
  backgroundColor?: string;
}

export interface ChartData {
  datasets: TrendDataset[];
  type: 'line' | 'bar' | 'scatter';
  options?: any;
}

export interface TrendAnalysisResult {
  chartData?: ChartData;
  statistics: {
    // For numbers 1-36 (or whatever range is appropriate for the lottery type)
    numberStats: Array<{
      number: number;
      frequency: number;
      averageInterval: number;
      maxInterval: number;
      lastInterval: number;
      currentInterval: number;
      probability: number;
    }>;
  };
}

class ChartService {
  /**
   * Generate frequency trend data for lottery numbers
   * @param filename Path to the Excel file
   * @param type The lottery type (SSQ or DLT)
   * @param periodCount Number of periods to analyze (e.g., 30, 50, 100)
   * @param zoneType 'red' for red balls, 'blue' for blue balls
   */
  async generateNumberTrend(
    filename: string,
    type: 'SSQ' | 'DLT',
    periodCount: number = 100,
    zoneType: 'red' | 'blue' = 'red'
  ): Promise<TrendAnalysisResult> {
    try {
      // Read Excel file
      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const allData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

      // Special handling for SSQ data
      if (type === 'SSQ') {
        // Check if we have the expected column names
        const firstRow = allData[0];
        const hasRedColumn = Object.hasOwn(firstRow, '红球');
        const hasBlueColumn = Object.hasOwn(firstRow, '蓝球');

        // If we don't have the expected columns, try to determine the actual column names
        if (!hasRedColumn || !hasBlueColumn) {
          // For debugging, print the first few rows - removed these logs
        }
      }

      // Convert raw Excel data to LotteryData format with more flexible column detection
      const lotteryData: LotteryData[] = [];

      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];

        // Extract front zone numbers (前区号码/红球)
        let frontNumbers: number[] = [];
        let backNumber1: number | undefined = undefined;
        let backNumber2: number | undefined = undefined;

        if (type === 'SSQ') {
          // For SSQ, try to extract red and blue balls
          // First, check if we have a column named '红球'
          if (row['红球'] !== undefined) {
            const redStr = row['红球'].toString();
            frontNumbers = redStr.split(/[,，\s]+/).map((n: string) => parseInt(n.trim(), 10));
          }
          // If not, try to find red balls in other columns
          else {
            // Look for a column that might contain red balls
            for (const key of Object.keys(row)) {
              // Skip date and other non-number columns
              if (key.includes('期号') || key.includes('日期') || key.includes('蓝球')) {
                continue;
              }

              const value = row[key];
              if (typeof value === 'string' && value.includes(',')) {
                const numbers = value.split(/[,，\s]+/).map((n: string) => parseInt(n.trim(), 10));
                // If we have 6 numbers, it's likely the red balls
                if (numbers.length === 6 && numbers.every((n) => !isNaN(n))) {
                  frontNumbers = numbers;
                  break;
                }
              }
            }
          }

          // Extract blue ball
          if (row['蓝球'] !== undefined) {
            backNumber1 = parseInt(row['蓝球'].toString(), 10);
          }
          // If not, try to find blue ball in other columns
          else {
            // Look for a column that might contain the blue ball
            for (const key of Object.keys(row)) {
              // Skip columns that are likely not blue ball
              if (key.includes('期号') || key.includes('日期') || key.includes('红球')) {
                continue;
              }

              const value = row[key];
              // If it's a single number, it might be the blue ball
              if (
                typeof value === 'number' ||
                (typeof value === 'string' && !value.includes(','))
              ) {
                const num = parseInt(value.toString(), 10);
                if (!isNaN(num) && num >= 1 && num <= 16) {
                  backNumber1 = num;
                  break;
                }
              }
            }
          }
        } else {
          // DLT
          // For DLT, use the standard column names
          if (row['前区号码']) {
            const frontStr = row['前区号码'].toString();
            frontNumbers = frontStr.split(/[,，\s]+/).map((n: string) => parseInt(n.trim(), 10));
          }

          if (row['后区号码1'] !== undefined) {
            backNumber1 = parseInt(row['后区号码1'].toString(), 10);
          }
          if (row['后区号码2'] !== undefined) {
            backNumber2 = parseInt(row['后区号码2'].toString(), 10);
          }
        }

        lotteryData.push({
          date: row['开奖日期'] || row['日期'] || '',
          numbers: frontNumbers,
          bonusNumber: backNumber1,
          bonusNumber2: backNumber2,
        });
      }

      // For blue zone, check if we have any bonus numbers
      if (zoneType === 'blue') {
        let blueBallCount = 0;
        lotteryData.forEach((item) => {
          if (item.bonusNumber !== undefined) blueBallCount++;
        });
      }

      // Get the most recent n periods
      const data = lotteryData.slice(-periodCount);

      // Define number range based on lottery type and zone
      const numberRange = this.getNumberRange(type, zoneType);

      // Initialize statistics tracking
      const numberStats = this.initializeNumberStats(numberRange);

      // Process data to generate trend points
      const trendData = this.processTrendData(data, numberRange, zoneType, numberStats, type);

      return {
        chartData: {
          datasets: [
            {
              label: zoneType === 'red' ? '红球走势' : '蓝球走势',
              data: trendData,
              borderColor: zoneType === 'red' ? '#ff4d4f' : '#1890ff',
              backgroundColor:
                zoneType === 'red' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(24, 144, 255, 0.1)',
            },
          ],
          type: 'line',
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: '期数',
                },
              },
              y: {
                title: {
                  display: true,
                  text: '号码',
                },
                min: numberRange.min - 1,
                max: numberRange.max + 1,
              },
            },
          },
        },
        statistics: {
          numberStats: Object.values(numberStats),
        },
      };
    } catch (error) {
      logger.error('Error generating chart data:', error);
      throw new Error(`Failed to generate chart data: ${(error as Error).message}`);
    }
  }

  /**
   * Get the valid number range for the lottery type and zone
   */
  private getNumberRange(
    type: 'SSQ' | 'DLT',
    zoneType: 'red' | 'blue'
  ): { min: number; max: number } {
    if (type === 'SSQ') {
      return zoneType === 'red' ? { min: 1, max: 33 } : { min: 1, max: 16 };
    } else {
      // DLT
      return zoneType === 'red' ? { min: 1, max: 35 } : { min: 1, max: 12 };
    }
  }

  /**
   * Initialize statistics tracking for each number in the range
   */
  private initializeNumberStats(range: { min: number; max: number }): Record<number, any> {
    const stats: Record<number, any> = {};

    for (let num = range.min; num <= range.max; num++) {
      stats[num] = {
        number: num,
        frequency: 0,
        averageInterval: 0,
        maxInterval: 0,
        lastInterval: 0,
        currentInterval: 0,
        probability: 0,
      };
    }

    return stats;
  }

  /**
   * Process the data to generate trend points and update statistics
   */
  private processTrendData(
    data: LotteryData[],
    range: { min: number; max: number },
    zoneType: 'red' | 'blue',
    stats: Record<number, any>,
    type?: 'SSQ' | 'DLT'
  ): NumberTrendPoint[] {
    const trendPoints: NumberTrendPoint[] = [];
    const intervals: Record<number, number[]> = {};
    const lastAppearance: Record<number, number> = {};

    // Initialize intervals tracking
    for (let num = range.min; num <= range.max; num++) {
      intervals[num] = [];
      lastAppearance[num] = -1;
    }

    // Process each draw
    data.forEach((draw, index) => {
      const numbers = zoneType === 'red' ? draw.numbers : [];

      // For blue balls, include the bonus numbers
      if (zoneType === 'blue') {
        if (draw.bonusNumber !== undefined) {
          numbers.push(draw.bonusNumber);
        }
        if (draw.bonusNumber2 !== undefined) {
          numbers.push(draw.bonusNumber2);
        }
      }

      // For trend visualization, we pick either the first red ball or both blue balls
      if (numbers.length > 0) {
        if (zoneType === 'red') {
          // For red balls, just use the first one for the trend line
          const firstNumber = numbers[0];
          trendPoints.push({
            position: index + 1, // 1-indexed position for chart
            value: firstNumber,
          });

          // Update statistics for this number only
          stats[firstNumber].frequency += 1;
        } else {
          // For blue balls, process all of them
          numbers.forEach((ballNumber) => {
            trendPoints.push({
              position: index + 1, // 1-indexed position for chart
              value: ballNumber,
            });

            // Update statistics for each blue ball
            stats[ballNumber].frequency += 1;
          });
        }

        // Update intervals for all numbers in range
        for (let num = range.min; num <= range.max; num++) {
          if (numbers.includes(num)) {
            if (lastAppearance[num] >= 0) {
              const interval = index - lastAppearance[num];
              intervals[num].push(interval);
              stats[num].lastInterval = interval;
            }
            lastAppearance[num] = index;
            stats[num].currentInterval = 0;
          } else {
            if (lastAppearance[num] >= 0) {
              stats[num].currentInterval = index - lastAppearance[num];
            } else {
              stats[num].currentInterval = index + 1; // Hasn't appeared yet
            }
          }
        }
      }
    });

    // Calculate statistics
    for (let num = range.min; num <= range.max; num++) {
      if (intervals[num].length > 0) {
        const sum = intervals[num].reduce((a, b) => a + b, 0);
        stats[num].averageInterval = parseFloat((sum / intervals[num].length).toFixed(2));
        stats[num].maxInterval = Math.max(...intervals[num]);
      }

      stats[num].probability = parseFloat((stats[num].frequency / data.length).toFixed(2));
    }

    return trendPoints;
  }

  /**
   * Generate the number frequency chart
   */
  async generateFrequencyChart(
    filename: string,
    type: 'SSQ' | 'DLT',
    periodCount: number = 100,
    zoneType: 'red' | 'blue' = 'red'
  ): Promise<ChartData> {
    try {
      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const allData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

      // Convert raw Excel data to LotteryData format with more flexible column detection
      const lotteryData: LotteryData[] = [];

      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];

        // Extract front zone numbers (前区号码/红球)
        let frontNumbers: number[] = [];
        let backNumber1: number | undefined = undefined;
        let backNumber2: number | undefined = undefined;

        if (type === 'SSQ') {
          // For SSQ, try to extract red and blue balls
          // First, check if we have a column named '红球'
          if (row['红球'] !== undefined) {
            const redStr = row['红球'].toString();
            frontNumbers = redStr.split(/[,，\s]+/).map((n: string) => parseInt(n.trim(), 10));
          }
          // If not, try to find red balls in other columns
          else {
            // Look for a column that might contain red balls
            for (const key of Object.keys(row)) {
              // Skip date and other non-number columns
              if (key.includes('期号') || key.includes('日期') || key.includes('蓝球')) {
                continue;
              }

              const value = row[key];
              if (typeof value === 'string' && value.includes(',')) {
                const numbers = value.split(/[,，\s]+/).map((n: string) => parseInt(n.trim(), 10));
                // If we have 6 numbers, it's likely the red balls
                if (numbers.length === 6 && numbers.every((n) => !isNaN(n))) {
                  frontNumbers = numbers;
                  break;
                }
              }
            }
          }

          // Extract blue ball
          if (row['蓝球'] !== undefined) {
            backNumber1 = parseInt(row['蓝球'].toString(), 10);
          }
          // If not, try to find blue ball in other columns
          else {
            // Look for a column that might contain the blue ball
            for (const key of Object.keys(row)) {
              // Skip columns that are likely not blue ball
              if (key.includes('期号') || key.includes('日期') || key.includes('红球')) {
                continue;
              }

              const value = row[key];
              // If it's a single number, it might be the blue ball
              if (
                typeof value === 'number' ||
                (typeof value === 'string' && !value.includes(','))
              ) {
                const num = parseInt(value.toString(), 10);
                if (!isNaN(num) && num >= 1 && num <= 16) {
                  backNumber1 = num;
                  break;
                }
              }
            }
          }
        } else {
          // DLT
          // For DLT, use the standard column names
          if (row['前区号码']) {
            const frontStr = row['前区号码'].toString();
            frontNumbers = frontStr.split(/[,，\s]+/).map((n: string) => parseInt(n.trim(), 10));
          }

          if (row['后区号码1'] !== undefined) {
            backNumber1 = parseInt(row['后区号码1'].toString(), 10);
          }
          if (row['后区号码2'] !== undefined) {
            backNumber2 = parseInt(row['后区号码2'].toString(), 10);
          }
        }

        lotteryData.push({
          date: row['开奖日期'] || row['日期'] || '',
          numbers: frontNumbers,
          bonusNumber: backNumber1,
          bonusNumber2: backNumber2,
        });
      }

      // Get the most recent n periods
      const data = lotteryData.slice(-periodCount);

      // Define number range based on lottery type and zone
      const range = this.getNumberRange(type, zoneType);

      // Initialize frequency count
      const frequency: Record<number, number> = {};
      for (let num = range.min; num <= range.max; num++) {
        frequency[num] = 0;
      }

      // Count frequencies
      data.forEach((draw) => {
        const numbers = zoneType === 'red' ? draw.numbers : [];

        // For blue balls, include the bonus numbers
        if (zoneType === 'blue') {
          if (draw.bonusNumber !== undefined) {
            numbers.push(draw.bonusNumber);
          }
          if (draw.bonusNumber2 !== undefined) {
            numbers.push(draw.bonusNumber2);
          }
        }

        numbers.forEach((num) => {
          if (num >= range.min && num <= range.max) {
            frequency[num] += 1;
          }
        });
      });

      // Convert to chart data format
      const labels: string[] = [];
      const values: number[] = [];

      for (let num = range.min; num <= range.max; num++) {
        labels.push(num.toString());
        values.push(frequency[num]);
      }

      return {
        datasets: [
          {
            label: zoneType === 'red' ? '红球出现频率' : '蓝球出现频率',
            data: labels.map((label, index) => ({
              position: parseInt(label),
              value: values[index],
            })),
            backgroundColor: zoneType === 'red' ? '#ff4d4f' : '#1890ff',
          },
        ],
        type: 'bar',
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: '号码',
              },
            },
            y: {
              title: {
                display: true,
                text: '出现次数',
              },
              beginAtZero: true,
            },
          },
        },
      };
    } catch (error) {
      logger.error('Error generating frequency chart data:', error);
      throw new Error(`Failed to generate frequency chart data: ${(error as Error).message}`);
    }
  }
}

export default new ChartService();
