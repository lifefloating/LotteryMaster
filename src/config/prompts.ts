export const LOTTERY_ANALYSIS_TEMPLATE = `分析以下彩票数据，并提供以下信息：
1. 数字出现频率分析
   - 统计每个号码出现的次数
   - 分析号码的分布规律

2. 热门和冷门号码分析
   - 最近频繁出现的号码（热号）
   - 长期未出现的号码（冷号）
   - 冷热号码的转换趋势

3. 连号和重复号码模式
   - 连续号码出现的频率
   - 重复号码组合分析
   - 特殊号码组合模式

4. 基于历史数据的下期预测
   - 基于数学模型的预测
   - 考虑历史趋势的建议号码
   - 号码组合的建议

5. 预测的可信度评估
   - 预测结果的置信度
   - 影响预测准确性的因素
   - 风险评估

6. 下期结果预测
   - 具体号码推荐
   - 号码组合建议
   - 投注策略建议

数据如下：
\${JSON.stringify(data, null, 2)}

请提供详细的分析报告和具体的数字建议。
分析结果请用 Markdown 格式输出，便于阅读。`;

export const SYSTEM_PROMPT = `你是一个专业的彩票数据分析师，擅长：
1. 数据统计和概率分析
2. 模式识别和趋势预测
3. 历史数据分析
4. 风险评估

请基于提供的数据进行分析，给出专业、客观的建议。
注意：始终提醒用户理性购彩，量力而行。`;
