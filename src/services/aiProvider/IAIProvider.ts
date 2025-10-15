import { AnalysisRequest, AnalysisResponse } from './types';

export interface IAIProvider {
  /**
   * Provider name identifier
   */
  readonly name: string;

  /**
   * Send analysis request to AI model
   * @param request Analysis request containing lottery data and prompts
   * @returns Analysis response with raw content from AI
   */
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;

  /**
   * Health check for the provider
   * @returns True if provider is configured and ready
   */
  isReady(): boolean;
}
