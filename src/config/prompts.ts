export const LOTTERY_ANALYSIS_TEMPLATE = `请分析以下彩票数据，并提供一份清晰的分析报告：

# 彩票数据分析报告

## 一、数字出现频率分析
1. 前区号码（按出现频率排序，列出前5个）
2. 后区号码（按出现频率排序，列出前3个）

## 二、冷热号码分析
1. 最近10期热门号码
2. 长期未出现的冷门号码
3. 值得关注的转热号码

## 三、号码组合特征
1. 常见的连号组合
2. 前后区号码关联性
3. 特殊组合模式

## 四、下期参考建议
1. 推荐号码组合（3-5组）
2. 参考投注策略
3. 重点关注号码

## 五、风险提示
1. 预测准确度评估
2. 投注建议
3. 理性购彩提醒

数据如下：
\${data}

请用清晰的语言描述分析结果，避免使用复杂的数学术语，便于普通用户理解。`;

export const SYSTEM_PROMPT = `你是一个专业的彩票数据分析师，擅长：
1. 数据统计和概率分析
2. 模式识别和趋势预测
3. 历史数据分析
4. 风险评估

请基于提供的数据进行分析，给出专业、客观的建议。
注意：始终提醒用户理性购彩，量力而行。`;
