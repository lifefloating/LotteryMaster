export const STRUCTURED_ANALYSIS_TEMPLATE = `请分析以下彩票数据，并提供结构化的分析结果。

数据如下：
\${data}

请严格按照以下JSON结构返回分析结果（必须是有效的JSON格式）：

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
      "frontZone": [前区号码数组，双色球必须包含6个不同号码，大乐透必须包含5个不同号码],
      "backZone": [后区号码数组，双色球必须只包含1个号码，大乐透必须包含2个不同号码]
    },
    {
      "frontZone": [前区号码数组，双色球必须包含6个不同号码，大乐透必须包含5个不同号码],
      "backZone": [后区号码数组，双色球必须只包含1个号码，大乐透必须包含2个不同号码]
    },
    ...（提供3-5组推荐，每组都必须严格遵循上述号码数量规则）
  ],
  "riskWarnings": [
    "风险提示1",
    "风险提示2",
    "风险提示3"
  ]
}
\`\`\`

请确保：
1. JSON格式正确无误，可以被直接解析
2. 所有推荐号码必须符合彩票规则
3. 推荐号码是基于分析得出的高概率号码，而不是随机号码`;

export const STRUCTURED_SYSTEM_PROMPT = `你是一个专业的彩票数据分析师，擅长：
1. 数据统计和概率分析
2. 模式识别和趋势预测
3. 历史数据分析
4. 遗漏值分析
5. 走势图解读
6. 中奖规律研究
7. 奇偶比例分析
8. 风险评估

你的任务是分析彩票数据并提供结构化的JSON数据，便于前端处理和展示。

请确保JSON格式严格符合要求，可以被前端直接解析。

在分析过程中，请特别注意：
1. 数据的准确性和客观性
2. 重视遗漏值分析，关注补号机会
3. 结合走势图进行立体分析
4. 重点分析中奖注数分布规律
5. 平衡奇偶比例，提供合理建议
6. 走势特征和规律识别
7. 理性购彩的风险提示
8. 号码规则（必须严格遵守）：
9. 推荐的号码是分析后可能性极大高的号码

无论分析结果如何，都要提醒用户彩票有风险，投注需谨慎，量力而行。`;
