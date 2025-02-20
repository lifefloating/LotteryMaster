import axios, { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import { LotteryData } from '../types/lottery';
import { LOTTERY_ANALYSIS_TEMPLATE, SYSTEM_PROMPT } from '../prompt/prompts';
import config from '../config';

class AnalyzeService {
  private readonly API_KEY = config.API_KEY;
  private readonly API_URL = config.API_URL;
  private readonly API_TIMEOUT = config.API_TIMEOUT;
  private readonly TEMPERATURE = config.API_TEMPERATURE;
  private readonly MAX_TOKENS = config.API_MAX_TOKENS;

  async analyzeLotteryData(filename: string): Promise<string> {
    try {
      // Log the start of analysis
      console.log(`Starting lottery data analysis for file: ${filename}`);

      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as LotteryData[];

      console.log(`Successfully loaded ${data.length} records from Excel file`);

      const prompt = this.buildAnalysisPrompt(data);
      console.log('Built analysis prompt, sending request to AI service...');

      const response = await axios.post(
        this.API_URL,
        {
          model: 'qwen-plus',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
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
      return rawContent;
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

  private buildAnalysisPrompt(data: LotteryData[]): string {
    try {
      const recentCount = config.RECENT_DATA_COUNT;
      const recentData = data.slice(0, recentCount);
      console.log(`Building prompt with ${recentData.length} recent records`);

      return LOTTERY_ANALYSIS_TEMPLATE.replace('${data}', JSON.stringify(recentData, null, 2));
    } catch (error) {
      console.error('Error building analysis prompt:', {
        error,
        dataLength: data?.length,
      });
      throw error;
    }
  }
}

export default new AnalyzeService();
