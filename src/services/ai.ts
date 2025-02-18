import axios from 'axios';
import * as XLSX from 'xlsx';
import { LotteryData } from '../types/lottery';
import { LOTTERY_ANALYSIS_TEMPLATE, SYSTEM_PROMPT } from '../config/prompts';

class AIService {
  private readonly API_KEY = process.env.DEEPSEEK_API_KEY;
  private readonly API_URL = process.env.DEEPSEEK_API_URL as string;

  async analyzeLotteryData(filename: string): Promise<string> {
    try {
      // 读取 Excel 文件
      const workbook = XLSX.readFile(filename);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as LotteryData[];

      // 构建提示词
      const prompt = this.buildAnalysisPrompt(data);

      // 调用 DeepSeek R1 API
      const response = await axios.post(
        this.API_URL,
        {
          model: 'deepseek-reasoner',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT, // 添加系统提示词
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing lottery data:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(data: LotteryData[]): string {
    const recentCount = parseInt(process.env.RECENT_DATA_COUNT || '50');
    const recentData = data.slice(0, recentCount);
    return LOTTERY_ANALYSIS_TEMPLATE.replace('${data}', JSON.stringify(recentData, null, 2));
  }
}

export default new AIService();
