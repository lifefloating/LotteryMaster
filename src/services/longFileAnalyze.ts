import axios, { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import FormData from 'form-data';
import { Blob } from 'buffer';
import { LotteryData, AnalysisResult } from '../types/lottery';
import { STRUCTURED_ANALYSIS_TEMPLATE, STRUCTURED_SYSTEM_PROMPT } from '../prompt/prompts';
import config from '../config';

interface CacheItem {
  data: AnalysisResult;
  timestamp: number;
}

class LongFileAnalyzeService {
  private readonly API_KEY = config.API_KEY;
  private readonly API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  private readonly FILES_URL = `${this.API_URL}/files`;
  private readonly CHAT_URL = `${this.API_URL}/chat/completions`;
  private readonly API_TIMEOUT = config.API_TIMEOUT;
  private readonly TEMPERATURE = 0.2; // 这里直接指定
  private readonly MAX_TOKENS = config.API_MAX_TOKENS;
  private readonly CACHE_DURATION = config.CACHE_DURATION;
  private readonly MODEL = config.API_MODEL_LONG;

  private readonly cache: Map<string, CacheItem> = new Map();

  private getCacheKey(filename: string, data: LotteryData[]): string {
    return `${filename}_${JSON.stringify(data)}`;
  }

  private isValidCache(cacheItem: CacheItem): boolean {
    return Date.now() - cacheItem.timestamp < this.CACHE_DURATION;
  }

  private async uploadFile(filename: string): Promise<string> {
    try {
      const formData = new FormData();
      const fileBuffer = await fs.promises.readFile(filename);
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, filename);
      formData.append('purpose', 'file-extract');

      const response = await axios.post(this.FILES_URL, formData, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: this.API_TIMEOUT,
      });

      if (!response.data?.id) {
        throw new Error('Invalid response from file upload');
      }

      return response.data.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file to Qwen service');
    }
  }

  async analyzeLotteryData(filename: string): Promise<AnalysisResult> {
    try {
      console.log(`Starting lottery data analysis for file: ${filename}`);

      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json<LotteryData>(workbook.Sheets[sheetName]);

      console.log(`Successfully loaded ${data.length} records from Excel file`);

      // 检查缓存
      const cacheKey = this.getCacheKey(filename, data);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && this.isValidCache(cachedResult)) {
        console.log('Returning cached analysis result');
        return cachedResult.data;
      }

      // 上传Excel文件
      const fileId = await this.uploadFile(filename);
      console.log('File uploaded successfully, file ID:', fileId);

      // 构建分析提示
      const prompt = this.buildStructuredAnalysisPrompt(data);
      console.log('Built structured analysis prompt, sending request to Qwen service...');

      const response = await axios.post(
        this.CHAT_URL,
        {
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: STRUCTURED_SYSTEM_PROMPT,
            },
            {
              role: 'system',
              content: `fileid://${fileId}`,
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

      console.log('Successfully received response from Qwen service');

      const rawContent = response.data.choices[0].message.content;

      // 解析结构化数据
      const result = this.parseStructuredResponse(rawContent);

      // 验证解析结果
      if (!result.structured || Object.keys(result.structured).length === 0) {
        console.error('Failed to parse structured data from Qwen response');
        throw new Error('Failed to parse response into structured format');
      }

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
          url: this.API_URL,
          timeout: this.API_TIMEOUT,
        });
        throw new Error(`API Request failed: ${error.message} (Status: ${error.response?.status})`);
      } else if (error instanceof Error) {
        console.error('Error analyzing lottery data:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } else {
        console.error('Unknown error:', error);
        throw new Error('Unknown error occurred during analysis');
      }
    }
  }

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
      console.log('Parsing structured response from Qwen');

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
          console.error('Error parsing JSON from Qwen response:', jsonError);
        }
      }

      return defaultResult;
    } catch (error) {
      console.error('Error parsing structured response:', error);
      return defaultResult;
    }
  }

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

export default new LongFileAnalyzeService();
