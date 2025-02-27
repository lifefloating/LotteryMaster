import axios, { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import { LotteryData, AnalysisResult } from '../types/lottery';
import { 
  LOTTERY_ANALYSIS_TEMPLATE, 
  STRUCTURED_ANALYSIS_TEMPLATE,
  STRUCTURED_SYSTEM_PROMPT
} from '../prompt/prompts';
import config from '../config';

interface CacheItem {
  data: AnalysisResult;
  timestamp: number;
}

class AnalyzeService {
  private readonly API_KEY = config.API_KEY;
  private readonly API_URL = config.API_URL;
  private readonly API_TIMEOUT = config.API_TIMEOUT;
  private readonly TEMPERATURE = config.API_TEMPERATURE;
  private readonly MAX_TOKENS = config.API_MAX_TOKENS;
  private readonly CACHE_DURATION = config.CACHE_DURATION;
  private readonly API_MODEL = config.API_MODEL;

  private cache: Map<string, CacheItem> = new Map();

  private getCacheKey(filename: string, data: LotteryData[]): string {
    return `${filename}_${JSON.stringify(data)}`;
  }

  private isValidCache(cacheItem: CacheItem): boolean {
    return Date.now() - cacheItem.timestamp < this.CACHE_DURATION;
  }

  async analyzeLotteryData(filename: string): Promise<AnalysisResult> {
    try {
      console.log(`Starting lottery data analysis for file: ${filename}`);

      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as LotteryData[];

      console.log(`Successfully loaded ${data.length} records from Excel file`);

      // 检查缓存
      const cacheKey = this.getCacheKey(filename, data);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && this.isValidCache(cachedResult)) {
        console.log('Returning cached analysis result');
        return cachedResult.data;
      }

      const prompt = this.buildStructuredAnalysisPrompt(data);
      console.log('Built structured analysis prompt, sending request to AI service...');

      const response = await axios.post(
        this.API_URL,
        {
          model: this.API_MODEL,
          messages: [
            {
              role: 'system',
              content: STRUCTURED_SYSTEM_PROMPT,
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
          },
          timeout: this.API_TIMEOUT,
        }
      );

      console.log('Successfully received response from AI service');
      const rawContent = response.data.choices[0].message.content;
      
      // 解析结构化数据和Markdown
      const result = this.parseStructuredResponse(rawContent);
      
      // 保存到缓存
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('API Request Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else if (error instanceof Error) {
        console.error('Error analyzing lottery data:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error('Unknown error:', error);
      }
      throw error;
    }
  }
  
  // 解析AI返回的结构化响应
  private parseStructuredResponse(rawContent: string): AnalysisResult {
    try {
      console.log('Parsing structured response from AI');
      
      // 默认结果
      const result: AnalysisResult = {
        rawContent,
        structured: {
          frequencyAnalysis: { frontZone: [], backZone: [] },
          hotColdAnalysis: { hotNumbers: [], coldNumbers: [], risingNumbers: [] },
          missingAnalysis: { 
            frontZone: { maxMissingNumber: 0, missingTrend: '', warnings: [] },
            backZone: { missingStatus: '', warnings: [] }
          },
          trendAnalysis: { frontZoneFeatures: [], backZoneFeatures: [], keyTurningPoints: [] },
          oddEvenAnalysis: { frontZoneRatio: '', backZoneRatio: '', recommendedRatio: '' },
          recommendations: [],
          riskWarnings: []
        }
      };
      
      // 提取JSON部分
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          result.structured = jsonData;
        } catch (jsonError) {
          console.error('Error parsing JSON from AI response:', jsonError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing structured response:', error);
      // 返回原始内容作为备用
      return {
        rawContent,
        structured: {
          frequencyAnalysis: { frontZone: [], backZone: [] },
          hotColdAnalysis: { hotNumbers: [], coldNumbers: [], risingNumbers: [] },
          missingAnalysis: { 
            frontZone: { maxMissingNumber: 0, missingTrend: '', warnings: [] },
            backZone: { missingStatus: '', warnings: [] }
          },
          trendAnalysis: { frontZoneFeatures: [], backZoneFeatures: [], keyTurningPoints: [] },
          oddEvenAnalysis: { frontZoneRatio: '', backZoneRatio: '', recommendedRatio: '' },
          recommendations: [],
          riskWarnings: []
        },
      };
    }
  }

  // 构建传统分析提示
  // private buildAnalysisPrompt(data: LotteryData[]): string {
  //   try {
  //     const recentCount = config.RECENT_DATA_COUNT;
  //     const recentData = data.slice(0, recentCount);
  //     console.log(`Building prompt with ${recentData.length} recent records`);

  //     return LOTTERY_ANALYSIS_TEMPLATE.replace('${data}', JSON.stringify(recentData, null, 2));
  //   } catch (error) {
  //     console.error('Error building analysis prompt:', {
  //       error,
  //       dataLength: data?.length,
  //     });
  //     throw error;
  //   }
  // }
  
  // 构建结构化分析提示
  private buildStructuredAnalysisPrompt(data: LotteryData[]): string {
    try {
      const recentCount = config.RECENT_DATA_COUNT;
      const recentData = data.slice(0, recentCount);
      console.log(`Building structured prompt with ${recentData.length} recent records`);

      return STRUCTURED_ANALYSIS_TEMPLATE.replace('${data}', JSON.stringify(recentData, null, 2));
    } catch (error) {
      console.error('Error building structured analysis prompt:', {
        error,
        dataLength: data?.length,
      });
      throw error;
    }
  }
}

export default new AnalyzeService();
