import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { LotteryData, AnalysisResult } from '../types/lottery';
import {
  STRUCTURED_ANALYSIS_TEMPLATE,
  STRUCTURED_SYSTEM_PROMPT,
  FC3D_STRUCTURED_ANALYSIS_TEMPLATE,
  FC3D_SYSTEM_PROMPT,
} from '../prompt/prompts';
import { getDefaultStandardLotteryResult, getDefaultFC3DResult } from '../constants/dafaultResults';
import config from '../config';
import { createLogger } from '../utils/logger';
import { AIProviderFactory } from './aiProvider';

const logger = createLogger('analyzeService');

interface CacheItem {
  data: AnalysisResult;
  id: string;
  createdAt: number;
}

class AnalyzeService {
  private readonly CACHE_DURATION = config.CACHE_DURATION;
  private readonly cache: Map<string, CacheItem> = new Map();

  // todo redis maybe not
  private getCacheKey(filename: string): string {
    // Just use the filename as the cache key for simplicity
    return filename;
  }

  private isValidCache(cacheItem: CacheItem): boolean {
    return Date.now() - cacheItem.createdAt < this.CACHE_DURATION;
  }

  async analyzeLotteryData(
    filename: string,
    type: 'SSQ' | 'DLT' | 'FC3D'
  ): Promise<AnalysisResult> {
    try {
      logger.info(`Starting lottery data analysis for file: ${filename}`);

      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json<LotteryData>(workbook.Sheets[sheetName]);

      logger.info(`Successfully loaded ${data.length} records from Excel file`);

      const cacheKey = this.getCacheKey(filename);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && this.isValidCache(cachedResult)) {
        logger.info('Returning cached analysis result');
        return cachedResult.data;
      }

      let prompt;
      let systemPrompt;

      if (type === 'FC3D') {
        prompt = this.buildFC3DAnalysisPrompt(data);
        systemPrompt = `${FC3D_SYSTEM_PROMPT}\n\n当前分析的是福彩3D数据，请严格按照对应的号码规则进行分析。`;
      } else {
        prompt = this.buildStructuredAnalysisPrompt(data);
        systemPrompt = `${STRUCTURED_SYSTEM_PROMPT}\n\n当前分析的是${type === 'SSQ' ? '双色球' : '大乐透'}数据，请严格按照对应的号码规则进行分析。`;
      }

      logger.info('Built analysis prompt, sending request to AI service...');

      try {
        // Get AI provider based on configuration
        const aiProvider = AIProviderFactory.getProvider();
        logger.info(`Using AI Provider: ${aiProvider.name}`);

        const response = await aiProvider.analyze({
          data,
          type,
          systemPrompt,
          userPrompt: prompt,
        });

        logger.info(`Successfully received response from ${response.provider} (${response.model})`);

        const rawContent = response.rawContent;
        logger.info(
          { preview: rawContent.substring(0, 100) + '...' },
          'Raw content from AI service'
        );

        // 解析结构化数据
        const result = this.parseStructuredResponse(rawContent, type);

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
        // Log basic error information for any error type
        logger.error(
          `AI Provider Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`
        );

        // Log stack trace if available
        if (error instanceof Error && error.stack) {
          logger.error(`Error Stack: ${error.stack}`);
        }

        throw error;
      }
    } catch (error) {
      logger.error('Error in analyzeLotteryData:', error);
      throw error;
    }
  }

  // 解析AI返回的结构化响应
  private parseStructuredResponse(
    rawContent: string,
    type: 'SSQ' | 'DLT' | 'FC3D'
  ): AnalysisResult {
    // 使用默认结果结构
    const defaultResult: AnalysisResult = {
      structured: type === 'FC3D' ? getDefaultFC3DResult() : getDefaultStandardLotteryResult(),
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
      logger.error(
        {
          error,
          dataLength: data?.length,
        },
        'Error building structured analysis prompt'
      );
      throw error;
    }
  }

  // 构建FC3D分析提示
  private buildFC3DAnalysisPrompt(data: LotteryData[]): string {
    try {
      const recentCount = config.RECENT_DATA_COUNT;
      const recentData = data.slice(0, recentCount);
      logger.info(`Building FC3D prompt with ${recentData.length} recent records`);

      return FC3D_STRUCTURED_ANALYSIS_TEMPLATE.replace(
        '${data}',
        JSON.stringify(recentData, null, 2)
      );
    } catch (error) {
      logger.error(
        {
          error,
          dataLength: data?.length,
        },
        'Error building FC3D analysis prompt'
      );
      throw error;
    }
  }
}

export default new AnalyzeService();
