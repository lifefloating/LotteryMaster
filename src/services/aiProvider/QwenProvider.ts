import axios from 'axios';
import config from '../../config';
import { createLogger } from '../../utils/logger';
import { IAIProvider } from './IAIProvider';
import { AnalysisRequest, AnalysisResponse } from './types';

const logger = createLogger('QwenProvider');

export class QwenProvider implements IAIProvider {
  readonly name: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiUrl: string;
  private readonly timeout: number;
  private readonly temperature?: number;
  private readonly maxTokens: number;
  private readonly topP?: number;
  private readonly presencePenalty?: number;

  constructor() {
    this.apiKey = config.API_KEY;
    this.model = config.API_MODEL;
    this.apiUrl = config.API_URL;
    this.timeout = config.API_TIMEOUT;
    this.temperature = config.API_TEMPERATURE;
    this.maxTokens = config.API_MAX_TOKENS;
    this.topP = config.API_TOP_P;
    this.presencePenalty = config.API_PRESENCE_PENALTY;

    // Set name based on model prefix
    if (this.model.includes('deepseek')) {
      this.name = 'DeepSeek';
    } else {
      this.name = 'Qwen';
    }

    logger.info(`${this.name}Provider initialized with model: ${this.model}`);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      logger.info(`Sending analysis request to ${this.name} API for ${request.type}`);

      const requestBody: any = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      };

      // DeepSeek-r1 model doesn't support temperature, top_p, presence_penalty
      if (!this.model.includes('deepseek-r1')) {
        if (this.temperature !== undefined) {
          requestBody.temperature = this.temperature;
        }
        if (this.topP !== undefined) {
          requestBody.top_p = this.topP;
        }
        if (this.presencePenalty !== undefined) {
          requestBody.presence_penalty = this.presencePenalty;
        }
      }

      // max_tokens is supported by all models
      requestBody.max_tokens = this.maxTokens;

      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip,deflate',
        },
        timeout: this.timeout,
      });

      logger.info(`Successfully received response from ${this.name} API`);

      // Validate response structure
      if (!response.data) {
        throw new Error('Empty response from AI service');
      }

      if (!response.data.choices?.[0]?.message?.content) {
        logger.error(
          { response: JSON.stringify(response.data, null, 2) },
          'Invalid API response structure'
        );
        throw new Error('Invalid response structure from AI service');
      }

      const rawContent = response.data.choices[0].message.content;
      logger.info({ preview: rawContent.substring(0, 100) + '...' }, 'Raw content from AI service');

      return {
        rawContent,
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error(`Error calling ${this.name} API:`, error);

      if (axios.isAxiosError(error)) {
        logger.error(`API Response Data: ${JSON.stringify(error.response?.data || {})}`);

        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          throw new Error(
            `${this.name} API request timeout. Please try again or increase timeout setting.`
          );
        }

        if (error.response?.status === 401) {
          throw new Error(`${this.name} API authentication failed. Please check your API key.`);
        } else if (error.response?.status === 429) {
          throw new Error(`${this.name} API rate limit exceeded. Please try again later.`);
        }
      }

      throw error;
    }
  }

  isReady(): boolean {
    const isConfigured = !!(this.apiKey && this.model && this.apiUrl);

    if (!isConfigured) {
      logger.warn(`${this.name}Provider is not properly configured`);
    }

    return isConfigured;
  }
}
