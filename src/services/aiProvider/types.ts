import { LotteryData } from '../../types/lottery';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  apiUrl: string;
  timeout: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
}

export interface AnalysisRequest {
  data: LotteryData[];
  type: 'SSQ' | 'DLT' | 'FC3D';
  systemPrompt: string;
  userPrompt: string;
}

export interface AnalysisResponse {
  rawContent: string;
  provider: string;
  model: string;
}
