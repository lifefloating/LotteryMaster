import config from '../../config';
import { createLogger } from '../../utils/logger';
import { IAIProvider } from './IAIProvider';

const logger = createLogger('AIProviderFactory');

export class AIProviderFactory {
  private static instance: IAIProvider | null = null;

  /**
   * Get AI Provider instance based on configuration
   * Uses singleton pattern to reuse provider instance
   */
  static getProvider(): IAIProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = config.API_PROVIDER;
    logger.info(`Creating AI Provider: ${providerType}`);

    switch (providerType) {
      case 'qwen':
      case 'deepseek': {
        // Both Qwen and DeepSeek use the same OpenAI-compatible API
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { QwenProvider } = require('./QwenProvider');
        this.instance = new QwenProvider();
        break;
      }

      case 'claude': {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ClaudeProvider } = require('./ClaudeProvider');
        this.instance = new ClaudeProvider();
        break;
      }

      default: {
        logger.error(`Unknown API provider: ${providerType}, falling back to qwen`);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { QwenProvider: FallbackProvider } = require('./QwenProvider');
        this.instance = new FallbackProvider();
      }
    }

    if (!this.instance) {
      throw new Error(`Failed to create AI Provider for ${providerType}`);
    }

    if (!this.instance.isReady()) {
      throw new Error(`AI Provider ${providerType} is not properly configured`);
    }

    logger.info(`AI Provider ${this.instance.name} initialized successfully`);
    return this.instance;
  }

  /**
   * Reset the provider instance (useful for testing or reloading config)
   */
  static reset(): void {
    this.instance = null;
  }
}
