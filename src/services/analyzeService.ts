import axios, { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { LotteryData, AnalysisResult } from '../types/lottery';
import { STRUCTURED_ANALYSIS_TEMPLATE, STRUCTURED_SYSTEM_PROMPT } from '../prompt/prompts';
import config from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('analyzeService');

interface CacheItem {
  data: AnalysisResult;
  id: string;
  createdAt: number;
}

class AnalyzeService {
  private readonly API_KEY = config.API_KEY;
  private readonly API_URL = config.API_URL;
  private readonly API_TIMEOUT = config.API_TIMEOUT;
  private readonly TEMPERATURE = config.API_TEMPERATURE;
  private readonly MAX_TOKENS = config.API_MAX_TOKENS;
  private readonly CACHE_DURATION = config.CACHE_DURATION;
  private readonly API_MODEL = config.API_MODEL;

  private readonly cache: Map<string, CacheItem> = new Map();

  private getCacheKey(filename: string, data: LotteryData[]): string {
    return `${filename}_${JSON.stringify(data)}`;
  }

  private isValidCache(cacheItem: CacheItem): boolean {
    return Date.now() - cacheItem.createdAt < this.CACHE_DURATION;
  }

  async analyzeLotteryData(filename: string, type: 'SSQ' | 'DLT'): Promise<AnalysisResult> {
    try {
      logger.info(`Starting lottery data analysis for file: ${filename}`);

      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json<LotteryData>(workbook.Sheets[sheetName]);

      logger.info(`Successfully loaded ${data.length} records from Excel file`);

      // 检查缓存
      const cacheKey = this.getCacheKey(filename, data);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && this.isValidCache(cachedResult)) {
        logger.info('Returning cached analysis result');
        return cachedResult.data;
      }

      const prompt = this.buildStructuredAnalysisPrompt(data);
      logger.info('Built structured analysis prompt, sending request to AI service...');

      const response = await axios.post(
        this.API_URL,
        {
          model: this.API_MODEL,
          messages: [
            {
              role: 'system',
              content: `${STRUCTURED_SYSTEM_PROMPT}\n\n当前分析的是${type === 'SSQ' ? '双色球' : '大乐透'}数据，请严格按照对应的号码规则进行分析。`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.TEMPERATURE,
          max_tokens: this.MAX_TOKENS,
        },
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip,deflate',
          },
          timeout: this.API_TIMEOUT,
        }
      );

      logger.info('Successfully received response from AI service');

      // 验证响应数据的完整性
      if (!response.data) {
        throw new Error('Empty response from AI service');
      }

      if (!response.data.choices?.[0]?.message?.content) {
        logger.error('Invalid API response structure:', response.data);
        throw new Error('Invalid response structure from AI service');
      }

      const rawContent = response.data.choices[0].message.content;
      logger.info('Raw content from AI service:', rawContent.substring(0, 100) + '...');

      // 解析结构化数据和Markdown
      const result = this.parseStructuredResponse(rawContent);

      // 验证解析结果
      if (!result.structured || Object.keys(result.structured).length === 0) {
        logger.error('Failed to parse structured data from AI response');
        throw new Error('Failed to parse AI response into structured format');
      }

      // 保存到缓存
      this.cache.set(cacheKey, {
        data: result,
        id: uuidv4(),
        createdAt: Date.now(),
      });

      return result;
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error('API Request Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: this.API_URL,
          timeout: this.API_TIMEOUT,
        });
        throw new Error(`API Request failed: ${error.message} (Status: ${error.response?.status})`);
      } else if (error instanceof Error) {
        logger.error('Error analyzing lottery data:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } else {
        logger.error('Unknown error:', error);
        throw new Error('Unknown error occurred during analysis');
      }
    }
  }

  // 解析AI返回的结构化响应
  private parseStructuredResponse(rawContent: string): AnalysisResult {
    // 默认结果结构
    const defaultResult: AnalysisResult = {
      rawContent,
      structured: {
        frequencyAnalysis: { frontZone: [], backZone: [] },
        hotColdAnalysis: {
          frontZone: {
            hotNumbers: [],
            coldNumbers: [],
            risingNumbers: [],
          },
          backZone: {
            hotNumbers: [],
            coldNumbers: [],
            risingNumbers: [],
          },
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

    try {
      logger.info('Parsing structured response from AI');

      // 提取JSON部分
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const jsonMatch = jsonRegex.exec(rawContent);
      if (jsonMatch?.[1]) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          return {
            ...defaultResult,
            structured: jsonData,
          };
        } catch (jsonError) {
          logger.error('Error parsing JSON from AI response:', jsonError);
        }
      }

      return defaultResult;
    } catch (error) {
      logger.error('Error parsing structured response:', error);
      return defaultResult;
    }
  }

  // 构建结构化分析提示
  private buildStructuredAnalysisPrompt(data: LotteryData[]): string {
    try {
      const recentCount = config.RECENT_DATA_COUNT;
      const recentData = data.slice(0, recentCount);
      logger.info(`Building structured prompt with ${recentData.length} recent records`);

      return STRUCTURED_ANALYSIS_TEMPLATE.replace('${data}', JSON.stringify(recentData, null, 2));
    } catch (error) {
      logger.error('Error building structured analysis prompt:', {
        error,
        dataLength: data?.length,
      });
      throw error;
    }
  }
}

export default new AnalyzeService();
