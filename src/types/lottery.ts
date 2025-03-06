export interface LotteryData {
  date: string;
  numbers: number[];
  bonusNumber?: number; // For 双色球's blue ball or 大乐透's blue balls
  bonusNumber2?: number; // For 大乐透's second blue ball
}

export interface ScrapedData {
  type: 'ssq' | 'dlt'; // ssq: 双色球, dlt: 大乐透
  data: LotteryData[];
}

export interface ScrapeResult {
  success: boolean;
  message: string;
  fileName?: string;
  isNewFile: boolean;
}

export interface AnalysisResult {
  // 原始文本分析
  rawContent: string;

  // 结构化数据
  structured: {
    // 频率分析
    frequencyAnalysis: {
      frontZone: Array<{ number: number; frequency: number }>;
      backZone: Array<{ number: number; frequency: number }>;
    };

    // 冷热号分析
    hotColdAnalysis: {
      frontZone: {
        hotNumbers: number[];
        coldNumbers: number[];
        risingNumbers: number[];
      };
      backZone: {
        hotNumbers: number[];
        coldNumbers: number[];
        risingNumbers: number[];
      };
    };

    // 遗漏分析
    missingAnalysis: {
      frontZone: {
        maxMissingNumber: number;
        missingTrend: string;
        warnings: string[];
      };
      backZone: {
        missingStatus: string;
        warnings: string[];
      };
    };

    // 走势分析
    trendAnalysis: {
      frontZoneFeatures: string[];
      backZoneFeatures: string[];
      keyTurningPoints: string[];
    };

    // 奇偶比分析
    oddEvenAnalysis: {
      frontZoneRatio: string;
      backZoneRatio: string;
      recommendedRatio: string;
    };

    // 推荐号码
    recommendations: Array<{
      frontZone: number[];
      backZone: number[];
    }>;

    topRecommendation: {
      frontZone: number[];
      backZone: number[];
    };

    // 风险提示
    riskWarnings: string[];
  };
}
