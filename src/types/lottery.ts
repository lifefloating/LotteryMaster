export enum LotteryType {
  SSQ = 'ssq',
  DLT = 'dlt',
  FC3D = 'fc3d',
}

export interface LotteryData {
  date: string;
  numbers: number[];
  bonusNumber?: number; // For 双色球's blue ball or 大乐透's blue balls
  bonusNumber2?: number; // For 大乐透's second blue ball
}

export interface ScrapedData {
  type: 'ssq' | 'dlt' | 'fc3d'; // ssq: 双色球, dlt: 大乐透, fc3d: 福彩3D
  data: LotteryData[];
}

export interface ScrapeResult {
  success: boolean;
  message: string;
  fileName?: string;
  isNewFile: boolean;
}

// 标准彩票分析结果（双色球/大乐透）
export interface StandardLotteryAnalysis {
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
    strategy: string;
    frontZone: number[];
    backZone: number[];
    rationale: string;
  }>;

  topRecommendation: {
    frontZone: number[];
    backZone: number[];
    rationale: string;
  };

  // 风险提示
  riskWarnings: string[];
}

// 福彩3D分析结果
export interface FC3DLotteryAnalysis {
  // 频率分析
  frequencyAnalysis: {
    hundredsPlace: Array<{ number: number; frequency: number }>;
    tensPlace: Array<{ number: number; frequency: number }>;
    onesPlace: Array<{ number: number; frequency: number }>;
    sumValue: {
      mostFrequent: number[];
      distribution: string;
    };
  };

  // 冷热号分析
  hotColdAnalysis: {
    hundredsPlace: {
      hotNumbers: number[];
      coldNumbers: number[];
    };
    tensPlace: {
      hotNumbers: number[];
      coldNumbers: number[];
    };
    onesPlace: {
      hotNumbers: number[];
      coldNumbers: number[];
    };
  };

  // 遗漏分析
  missingAnalysis: {
    hundredsPlace: {
      maxMissingNumber: number;
      missingTrend: string;
    };
    tensPlace: {
      maxMissingNumber: number;
      missingTrend: string;
    };
    onesPlace: {
      maxMissingNumber: number;
      missingTrend: string;
    };
  };

  // 跨度分析
  spanAnalysis: {
    currentSpan: number;
    spanTrend: string;
    recommendedSpan: number[];
  };

  // 奇偶比分析
  oddEvenAnalysis: {
    currentRatio: string;
    ratioTrend: string;
    recommendedRatio: string;
  };

  // 组选分析
  groupAnalysis: {
    groupDistribution: {
      group6: string;
      group3: string;
      groupTrend: string;
    };
    currentPattern: string;
  };

  // 推荐号码
  recommendations: Array<{
    strategy: string;
    numbers: number[];
    type?: string;
    sumValue?: number;
    possibleNumbers?: number[][];
    rationale: string;
  }>;

  topRecommendation: {
    directSelection: number[];
    groupSelection: {
      type: string;
      numbers: number[];
    };
    rationale: string;
  };

  // 风险提示
  riskWarnings: string[];
}

export interface AnalysisResult {
  // 结构化数据 - 可能是标准彩票或福彩3D
  structured: StandardLotteryAnalysis | FC3DLotteryAnalysis;
}
