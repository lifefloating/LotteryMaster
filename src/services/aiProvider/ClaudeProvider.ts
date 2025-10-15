import Anthropic from '@anthropic-ai/sdk';
import config from '../../config';
import { createLogger } from '../../utils/logger';
import { IAIProvider } from './IAIProvider';
import { AnalysisRequest, AnalysisResponse } from './types';

const logger = createLogger('ClaudeProvider');

export class ClaudeProvider implements IAIProvider {
  readonly name = 'Claude';
  private client: Anthropic;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly timeout: number;

  constructor() {
    this.model = config.CLAUDE_MODEL;
    this.temperature = config.CLAUDE_TEMPERATURE;
    this.maxTokens = config.CLAUDE_MAX_TOKENS;
    this.timeout = config.CLAUDE_TIMEOUT;

    this.client = new Anthropic({
      apiKey: config.CLAUDE_API_KEY,
      timeout: this.timeout,
    });

    logger.info(`ClaudeProvider initialized with model: ${this.model}`);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      logger.info(`Sending analysis request to Claude API for ${request.type}`);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      });

      logger.info('Successfully received response from Claude API');

      // Extract text content from response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as Anthropic.TextBlock).text)
        .join('\n');

      if (!textContent) {
        throw new Error('No text content in Claude API response');
      }

      logger.info('Successfully extracted text content from Claude response');

      return {
        rawContent: textContent,
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error('Error calling Claude API:', error);

      if (error instanceof Anthropic.APIError) {
        logger.error(`Claude API Error: ${error.status} - ${error.message}`);
        if (error.status === 401) {
          throw new Error('Claude API authentication failed. Please check your API key.');
        } else if (error.status === 429) {
          throw new Error('Claude API rate limit exceeded. Please try again later.');
        }
      }

      throw error;
    }
  }

  isReady(): boolean {
    const isConfigured = !!(config.CLAUDE_API_KEY && config.CLAUDE_MODEL && this.client);

    if (!isConfigured) {
      logger.warn('ClaudeProvider is not properly configured');
    }

    return isConfigured;
  }
}
