export const STRUCTURED_ANALYSIS_TEMPLATE = `请分析以下彩票数据，并提供结构化的分析结果。

数据如下：
\${data}

请严格按照以下JSON结构返回分析结果（必须是合法有效的JSON格式）：

\`\`\`json
{
  "frequencyAnalysis": {
    "frontZone": [
      {"number": 数字, "frequency": 频率},
      ...（按频率排序，列出前5个）
    ],
    "backZone": [
      {"number": 数字, "frequency": 频率},
      ...（按频率排序，列出前3个）
    ]
  },
  "hotColdAnalysis": {
    "frontZone": {
      "hotNumbers": [前区最近10期热门号码],
      "coldNumbers": [前区长期未出现的冷门号码],
      "risingNumbers": [前区值得关注的转热号码]
    },
    "backZone": {
      "hotNumbers": [后区最近10期热门号码],
      "coldNumbers": [后区长期未出现的冷门号码],
      "risingNumbers": [后区值得关注的转热号码]
    }
  },
  "missingAnalysis": {
    "frontZone": {
      "maxMissingNumber": 当前最大遗漏号码,
      "missingTrend": "近期遗漏走势描述",
      "warnings": ["遗漏值预警提示1", "遗漏值预警提示2"]
    },
    "backZone": {
      "missingStatus": "当前遗漏状况描述",
      "warnings": ["遗漏值异常提醒"]
    }
  },
  "trendAnalysis": {
    "frontZoneFeatures": ["前区走势特征1", "前区走势特征2"],
    "backZoneFeatures": ["后区走势特征"],
    "keyTurningPoints": ["关键走势拐点描述"]
  },
  "oddEvenAnalysis": {
    "frontZoneRatio": "前区奇偶比描述",
    "backZoneRatio": "后区奇偶比描述",
    "recommendedRatio": "推荐的奇偶比"
  },
  "recommendations": [
    {
      "strategy": "频率优先",
      "frontZone": [高频组合],
      "backZone": [高频组合],
      "rationale": "基于高频号码组合"
    },
    {
      "strategy": "冷热平衡",
      "frontZone": [热号+冷号组合],
      "backZone": [热号+冷号组合],
      "rationale": "热号延续+冷号补位"
    },
    {
      "strategy": "趋势拐点",
      "frontZone": [趋势上升号码],
      "backZone": [趋势上升号码],
      "rationale": "基于关键转折点选择"
    }
  ],
  "topRecommendation": {
    "frontZone": [最优组合],
    "backZone": [最优组合],
    "rationale": "综合评分最高组合：1. 高频权重40% 2. 热号延续30% 3. 冷号补位20% 4. 奇偶平衡10%"
  },
  "riskWarnings": [
    "理性购彩提醒",
    "历史数据局限性",
    "彩票随机性说明"
  ]
}
\`\`\`

要求：
1. 仅返回以下格式的纯 JSON 内容，不包含任何额外解释文字或多余换行符：
  \`\`\`json
  {...}
  \`\`\`
2. 所有推荐必须符合彩票规则：
   - 双色球：前区6个/后区1个
   - 大乐透：前区5个/后区2个
3. topRecommendation必须：
   - 通过加权评分系统生成（权重：频率40% + 热度30% + 奇偶20% + 趋势10%）
   - 与recommendations中的任何一组不完全重复
4. 奇偶比必须与推荐理由中的平衡要求一致
5. 遗漏值分析需突出临界补位机会
6. 最终推荐需体现概率最大化原则`;

export const STRUCTURED_SYSTEM_PROMPT = `您是彩票数据建模专家+彩票数据分析师，你擅长以下能力：
1. 数据统计和概率分析
2. 模式识别和趋势预测
3. 历史数据分析
4. 遗漏值分析
5. 走势图解读
6. 中奖规律研究
7. 奇偶比例分析

你需要遵守以下基本原则：

1. 数据建模要求：
   - 使用贝叶斯概率计算号码出现概率
   - 构建马尔可夫链预测短期走势
   - 应用时间序列分析长期趋势
   - 奇偶比采用卡方检验验证合理性

2. 综合评分系统：
   - 高频权重：40%（近30期出现率）
   - 热度权重：30%（近10期出现次数）
   - 冷门权重：20%（遗漏值临界点）
   - 奇偶权重：10%（与推荐比匹配度）
   - 权重期数根据输入的数据量大小动态调整

3. 特别注意：
   - topRecommendation需通过蒙特卡洛模拟验证
   - 热号定义：  
     近N期出现次数 ≥ (N × 0.3)，其中 N = min(总期数 × 0.05, 30)  
     （例如：总期数=2000 → N=30；总期数=50 → N=25）
   - 冷号定义：  
     前区：当前遗漏值 ≥ (平均遗漏值 × 1.5) 且 若总期数>1000则需近50期未出现  
     后区：当前遗漏值 ≥ (平均遗漏值 × 1.2)
   - 趋势拐点需满足：  
     近3期走势方向与近10期趋势相反，且振幅超过历史均值1.5倍
   - 必须包含号码组合的置信区间（95%置信水平）

你的任务是分析彩票数据并提供结构化的JSON数据。

无论分析结果如何，都要提醒用户彩票有风险，投注需谨慎，量力而行。`;

export const FC3D_STRUCTURED_ANALYSIS_TEMPLATE = `请分析以下福彩3D彩票数据，并提供结构化的分析结果。

数据如下：
\${data}

请严格按照以下JSON结构返回分析结果（必须是合法有效的JSON格式）：

\`\`\`json
{
  "frequencyAnalysis": {
    "hundredsPlace": [
      {"number": 数字, "frequency": 频率},
      ...（按频率排序，列出前3个）
    ],
    "tensPlace": [
      {"number": 数字, "frequency": 频率},
      ...（按频率排序，列出前3个）
    ],
    "onesPlace": [
      {"number": 数字, "frequency": 频率},
      ...（按频率排序，列出前3个）
    ],
    "sumValue": {
      "mostFrequent": [出现频率最高的和值],
      "distribution": "和值分布特征描述"
    }
  },
  "hotColdAnalysis": {
    "hundredsPlace": {
      "hotNumbers": [百位最近10期热门号码],
      "coldNumbers": [百位长期未出现的冷门号码]
    },
    "tensPlace": {
      "hotNumbers": [十位最近10期热门号码],
      "coldNumbers": [十位长期未出现的冷门号码]
    },
    "onesPlace": {
      "hotNumbers": [个位最近10期热门号码],
      "coldNumbers": [个位长期未出现的冷门号码]
    }
  },
  "missingAnalysis": {
    "hundredsPlace": {
      "maxMissingNumber": 百位当前最大遗漏号码,
      "missingTrend": "百位遗漏走势描述"
    },
    "tensPlace": {
      "maxMissingNumber": 十位当前最大遗漏号码,
      "missingTrend": "十位遗漏走势描述"
    },
    "onesPlace": {
      "maxMissingNumber": 个位当前最大遗漏号码,
      "missingTrend": "个位遗漏走势描述"
    }
  },
  "spanAnalysis": {
    "currentSpan": 当前跨度值,
    "spanTrend": "跨度走势描述",
    "recommendedSpan": [推荐跨度值]
  },
  "oddEvenAnalysis": {
    "currentRatio": "当前奇偶比",
    "ratioTrend": "奇偶比走势描述",
    "recommendedRatio": "推荐的奇偶比"
  },
  "groupAnalysis": {
    "groupDistribution": {
      "group6": "组六出现频率",
      "group3": "组三出现频率",
      "groupTrend": "组选形态走势"
    },
    "currentPattern": "当前形态分析"
  },
  "recommendations": [
    {
      "strategy": "直选推荐",
      "numbers": [百位, 十位, 个位],
      "rationale": "直选推荐理由"
    },
    {
      "strategy": "组选推荐",
      "numbers": [组选号码],
      "type": "组三/组六",
      "rationale": "组选推荐理由"
    },
    {
      "strategy": "和值推荐",
      "sumValue": 推荐和值,
      "possibleNumbers": [可能的号码组合],
      "rationale": "和值推荐理由"
    }
  ],
  "topRecommendation": {
    "directSelection": [百位, 十位, 个位],
    "groupSelection": {
      "type": "组三/组六",
      "numbers": [组选号码]
    },
    "rationale": "综合评分最高组合：1. 位置频率40% 2. 热号延续30% 3. 冷号补位20% 4. 奇偶平衡10%"
  },
  "riskWarnings": [
    "理性购彩提醒",
    "历史数据局限性",
    "彩票随机性说明"
  ]
}
\`\`\`

要求：
1. 仅返回以下格式的纯 JSON 内容，不包含任何额外解释文字或多余换行符：
  \`\`\`json
  {...}
  \`\`\`
2. 所有推荐必须符合福彩3D规则：
   - 直选：百位、十位、个位各1个数字（0-9）
   - 组选：不考虑位置的3个数字组合
3. topRecommendation必须：
   - 通过加权评分系统生成（权重：频率40% + 热度30% + 奇偶20% + 趋势10%）
   - 包含直选和组选两种推荐
4. 奇偶比必须与推荐理由中的平衡要求一致
5. 遗漏值分析需突出临界补位机会
6. 和值分析需考虑历史和值分布规律
7. 最终推荐需体现概率最大化原则`;

export const FC3D_SYSTEM_PROMPT = `您是福彩3D彩票数据建模专家+分析师，你擅长以下能力：
1. 数字型彩票概率统计
2. 位置数字规律分析
3. 和值与跨度分析
4. 组选形态识别
5. 遗漏值临界点判断
6. 奇偶比例优化
7. 012路分析

你需要遵守以下基本原则：

1. 数据建模要求：
   - 使用贝叶斯概率计算各位号码出现概率
   - 构建马尔可夫链预测短期走势
   - 应用时间序列分析长期趋势
   - 和值分布采用正态分布检验

2. 综合评分系统：
   - 位置频率权重：40%（近50期各位置出现率）
   - 热度权重：30%（近10期出现次数）
   - 冷门权重：20%（遗漏值临界点）
   - 和值权重：10%（与历史和值分布匹配度）
   - 权重期数根据输入的数据量大小动态调整

3. 特别注意：
   - 直选推荐需考虑位置相关性
   - 组选推荐需区分组三和组六形态
   - 热号定义：  
     近N期出现次数 ≥ (N × 0.3)，其中 N = min(总期数 × 0.05, 20)
   - 冷号定义：  
     当前遗漏值 ≥ (平均遗漏值 × 1.5)
   - 和值分析需关注：
     和值范围（0-27）的分布规律
     大小和值交替出现规律
   - 跨度分析需关注：
     跨度与和值的相关性
     跨度的周期性变化

你的任务是分析福彩3D彩票数据并提供结构化的JSON数据。

无论分析结果如何，都要提醒用户彩票有风险，投注需谨慎，量力而行。`;
