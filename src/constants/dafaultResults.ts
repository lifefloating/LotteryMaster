import { StandardLotteryAnalysis, FC3DLotteryAnalysis } from '../types/lottery';

// 标准彩票（双色球/大乐透）默认结果结构
export const getDefaultStandardLotteryResult = (): StandardLotteryAnalysis => ({
  frequencyAnalysis: {
    frontZone: [],
    backZone: [],
  },
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
    frontZone: {
      maxMissingNumber: 0,
      missingTrend: '',
      warnings: [],
    },
    backZone: {
      missingStatus: '',
      warnings: [],
    },
  },
  trendAnalysis: {
    frontZoneFeatures: [],
    backZoneFeatures: [],
    keyTurningPoints: [],
  },
  oddEvenAnalysis: {
    frontZoneRatio: '',
    backZoneRatio: '',
    recommendedRatio: '',
  },
  recommendations: [],
  topRecommendation: {
    frontZone: [],
    backZone: [],
    rationale: '',
  },
  riskWarnings: [],
});

// 福彩3D默认结果结构
export const getDefaultFC3DResult = (): FC3DLotteryAnalysis => ({
  frequencyAnalysis: {
    hundredsPlace: [],
    tensPlace: [],
    onesPlace: [],
    sumValue: {
      mostFrequent: [],
      distribution: '',
    },
  },
  hotColdAnalysis: {
    hundredsPlace: {
      hotNumbers: [],
      coldNumbers: [],
    },
    tensPlace: {
      hotNumbers: [],
      coldNumbers: [],
    },
    onesPlace: {
      hotNumbers: [],
      coldNumbers: [],
    },
  },
  missingAnalysis: {
    hundredsPlace: {
      maxMissingNumber: 0,
      missingTrend: '',
    },
    tensPlace: {
      maxMissingNumber: 0,
      missingTrend: '',
    },
    onesPlace: {
      maxMissingNumber: 0,
      missingTrend: '',
    },
  },
  spanAnalysis: {
    currentSpan: 0,
    spanTrend: '',
    recommendedSpan: [],
  },
  oddEvenAnalysis: {
    currentRatio: '',
    ratioTrend: '',
    recommendedRatio: '',
  },
  groupAnalysis: {
    groupDistribution: {
      group6: '',
      group3: '',
      groupTrend: '',
    },
    currentPattern: '',
  },
  recommendations: [],
  topRecommendation: {
    directSelection: [],
    groupSelection: {
      type: '',
      numbers: [],
    },
    rationale: '',
  },
  riskWarnings: [],
});
