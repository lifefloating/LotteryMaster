import { AnalysisResult } from '../../types/lottery';

interface EmailTemplateData {
  lotteryType: 'ssq' | 'dlt' | 'fc3d';
  period: string;
  date: string;
  analysis: AnalysisResult;
  frontendUrl: string;
}

const getLotteryTypeName = (type: string): string => {
  switch (type) {
    case 'ssq':
      return '双色球';
    case 'dlt':
      return '大乐透';
    case 'fc3d':
      return '福彩3D';
    default:
      return '彩票';
  }
};

const formatNumbers = (numbers: number[], isSpecial = false): string => {
  const ballClass = isSpecial ? 'special-ball' : 'primary-ball';
  return numbers
    .map((num) => `<span class="${ballClass}">${String(num).padStart(2, '0')}</span>`)
    .join(' ');
};

export const generateEmailHTML = (data: EmailTemplateData): string => {
  const lotteryTypeName = getLotteryTypeName(data.lotteryType);
  const recommendations = data.analysis.structured?.recommendations || [];
  const topRecommendation = data.analysis.structured?.topRecommendation || recommendations[0];

  // Format numbers for display
  let mainNumbers = '';
  let specialNumbers = '';

  if (topRecommendation) {
    // Handle different recommendation structures
    if ('frontZone' in topRecommendation && topRecommendation.frontZone) {
      mainNumbers = formatNumbers(topRecommendation.frontZone);
      if ('backZone' in topRecommendation && topRecommendation.backZone) {
        specialNumbers = formatNumbers(topRecommendation.backZone, true);
      }
    } else if ('directSelection' in topRecommendation && topRecommendation.directSelection) {
      mainNumbers = formatNumbers(topRecommendation.directSelection);
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>彩票大师 - ${lotteryTypeName}预测</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f7fa;
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header .subtitle {
          color: #666;
          font-size: 16px;
          margin: 0;
        }
        .info-section {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          color: #666;
          font-weight: 500;
        }
        .info-value {
          color: #333;
          font-weight: 600;
        }
        .recommendation-section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 20px;
          color: #333;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .numbers-container {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .numbers-row {
          margin-bottom: 15px;
        }
        .numbers-row:last-child {
          margin-bottom: 0;
        }
        .numbers-label {
          display: block;
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .primary-ball, .special-ball {
          display: inline-block;
          width: 36px;
          height: 36px;
          line-height: 36px;
          border-radius: 50%;
          margin: 0 4px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
        }
        .primary-ball {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .special-ball {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .footer .disclaimer {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          margin-top: 15px;
          text-align: left;
          border-radius: 4px;
        }
        .footer .disclaimer strong {
          color: #f59e0b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 彩票大师</h1>
          <p class="subtitle">${lotteryTypeName}智能预测</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">期数：</span>
            <span class="info-value">${data.period}</span>
          </div>
          <div class="info-row">
            <span class="info-label">日期：</span>
            <span class="info-value">${data.date}</span>
          </div>
        </div>

        <div class="recommendation-section">
          <h2 class="section-title">💎 推荐号码</h2>
          <div class="numbers-container">
            ${mainNumbers ? `
            <div class="numbers-row">
              <span class="numbers-label">${data.lotteryType === 'fc3d' ? '号码' : '前区'}</span>
              <div>${mainNumbers}</div>
            </div>
            ` : ''}
            ${specialNumbers ? `
            <div class="numbers-row">
              <span class="numbers-label">后区</span>
              <div>${specialNumbers}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="cta-section">
          <a href="${data.frontendUrl}" class="cta-button">查看完整分析报告 →</a>
        </div>

        <div class="footer">
          <p>感谢使用彩票大师！</p>
          <div class="disclaimer">
            <strong>⚠️ 免责声明</strong><br>
            本预测结果仅供参考，基于历史数据分析生成。彩票具有随机性，请理性购彩，量力而行。
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateEmailSubject = (lotteryType: 'ssq' | 'dlt' | 'fc3d', period: string, date: string): string => {
  const typeName = getLotteryTypeName(lotteryType);
  return `【彩票大师】${typeName}预测 - ${period} (${date})`;
};
