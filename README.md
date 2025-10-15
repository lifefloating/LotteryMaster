# LotteryMaster

### ✨ deepwiki
- https://deepwiki.com/lifefloating/LotteryMaster

### ✨ 主要功能 (Key Features)

- 📊 **数据处理**:  抓取彩票数据，保存到Excel文件，支持抓取全部期数。
- 🤖 **输出报告**:  集成通义千问大模型(Qwen-MAX)/（Qwen-Long），根据prompt生成分析报告，包括号码预测、号码推荐、号码趋势等。
- 📱 **多端访问支持**:   支持Web、移动App等多平台访问，方便用户随时随地获取彩票分析信息
- 🎰 **支持双色球｜大乐透｜福彩3d**
- 📧 **邮件订阅功能**: 支持定时邮件订阅，每天或每周定时接收预测结果，使用 SMTP 发送精美的 HTML 邮件

### 🔗 前端项目
- 代码仓库：[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/lifefloating/LotteryMaster-Uniapp) 
- 在线演示：[![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://lottery-master.vercel.app/#/)


## 🛠️ 技术栈 (Tech Stack)

- **后端开发**
  - <a href="https://www.fastify.io/"><img src="https://img.shields.io/badge/Fastify-404D59?style=flat-square&logo=fastify&logoColor=white" alt="Fastify Badge"/></a>
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js Badge"/></a>
<a href="https://cheerio.js.org/"><img src="https://img.shields.io/badge/Cheerio.js-orange?style=flat-square&logo=css3&logoColor=white" alt="Cheerio.js Badge"/></a>
<a href="https://getpino.io/"><img src="https://img.shields.io/badge/Pino-green?style=flat-square&logo=npm&logoColor=white" alt="Pino Badge"/></a>
<a href="https://www.npmjs.com/package/xlsx"><img src="https://img.shields.io/badge/xlsx-lightgrey?style=flat-square&logo=npm&logoColor=red" alt="xlsx Badge"/></a>
<a href="https://jestjs.io/"><img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white" alt="Jest Badge"/></a>
<a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Badge"/></a>
<a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite Badge"/></a>
<a href="https://nodemailer.com/"><img src="https://img.shields.io/badge/Nodemailer-0F9DCE?style=flat-square&logo=nodemailer&logoColor=white" alt="Nodemailer Badge"/></a>

- **AI 模型**
  - [通义千问 Qwen API](https://tongyi.aliyun.com/qianwen/):  阿里云大语言模型API，用于生成分析报告，趋势分析图表。
  - [DeepSeek](https://help.aliyun.com/zh/model-studio/developer-reference/deepseek): 阿里云百炼平台提供的 DeepSeek 大语言模型，具有强大的推理和分析能力。
  - [Claude API](https://anthropic.com/claude): Anthropic 公司的 Claude 系列模型，支持多种版本（Opus、Sonnet、Haiku），具有出色的推理和分析能力。
  - deepseek的api比较慢，页面上使用不建议设置
  
  
  #### API 参数说明

  `.env.example` 中的 API 相关参数说明：

  - **API_PROVIDER**: 选择使用的 AI 服务提供商
    - `qwen`: 通义千问（阿里云）
    - `deepseek`: DeepSeek（阿里云百炼）
    - `claude`: Claude（Anthropic）

  #### 通义千问/DeepSeek 配置

  - **API_MODEL**: 选择使用的模型
    - `qwen-turbo` - 通义千问快速版
    - `qwen-long` - 通义千问长文本版
    - `qwen-max` - 通义千问旗舰版
    - `deepseek-v3` - DeepSeek V3
    - `deepseek-r1` - DeepSeek R1（推理模型）

  - **API_TEMPERATURE**: 控制输出的随机性，取值范围 0-1
    - 值越低（如 0.1）: 输出更确定、更保守，适合分析报告等需要准确性的场景
    - 值越高（如 0.7）: 输出更多样化、更创新，适合创意性内容生成
    - 注意：`deepseek-r1` 模型不支持此参数设置

  - **API_TOP_P**: 控制输出的多样性，取值范围 0-1
    - 值越低：输出更加集中在高概率的词上
    - 值越高：输出更多样化
    - 推荐值：0.6
    - 注意：`deepseek-r1` 模型不支持此参数设置

  - **API_PRESENCE_PENALTY**: 控制重复内容的惩罚程度，取值范围 0-2
    - 值越高：模型更倾向于生成新的内容而不是重复已有内容
    - 推荐值：0.95
    - 注意：`deepseek-r1` 模型不支持此参数设置

  - **API_MAX_TOKENS**: 限制模型返回的最大 Token 数量
    - 较大的值允许模型生成更详细的分析结果
    - 默认值为 3000，可根据需要调整

  - **API_TIMEOUT**: API 请求超时时间（毫秒）
    - 默认值为 120000（2分钟）
    - deepseek-r1的超时时间可能要拉长

  更多详细参数说明请参考[通义千问 API 文档](https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api)

  #### Claude 配置

  - **CLAUDE_MODEL**: 选择使用的 Claude 模型
    - `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet（推荐，平衡性能与成本）
    - `claude-3-opus-20240229` - Claude 3 Opus（最强性能）
    - `claude-3-sonnet-20240229` - Claude 3 Sonnet
    - `claude-3-haiku-20240307` - Claude 3 Haiku（最快速度，最低成本）

  - **CLAUDE_TEMPERATURE**: 控制输出的随机性，取值范围 0-1
    - 推荐值：0.5
    - Claude 所有模型都支持此参数

  - **CLAUDE_MAX_TOKENS**: 限制模型返回的最大 Token 数量
    - Claude 默认值为 4096
    - 可根据需要调整（最大支持 200000）

  - **CLAUDE_TIMEOUT**: API 请求超时时间（毫秒）
    - 默认值为 120000（2分钟）

  更多详细参数说明请参考[Claude API 文档](https://docs.anthropic.com/claude/reference/)
  
- **前端开发**
  - [LotteryMaster-Uniapp](https://github.com/lifefloating/LotteryMaster-Uniapp): 基于uniapp + Vue3 + TypeScript的多端应用

- **测试覆盖率**
- <a href="#"><img src="https://img.shields.io/badge/Coverage-89.67%25-success" alt="Coverage Badge"/></a>

  **支持的彩票类型测试覆盖**
  - 双色球 (SSQ)
  - 大乐透 (DLT)
  - 福彩3D (FC3D)

  **说明**
  - 具体的数据执行 `pnpm run test:coverage` 查看

## 🚀 快速开始 (Quick Start)

### ⚙️ 环境要求 (Prerequisites)

- [Node.js](https://nodejs.org/en/download/):  版本 >= 18.0 (推荐使用最新LTS版本)
- [pnpm](https://pnpm.io/) 或 [yarn](https://yarnpkg.com/):  包管理器 (推荐使用pnpm)
- [通义千问 Qwen-MAX API Key](https://tongyi.aliyun.com/qianwen/):  需要开通阿里云通义千问服务并获取API密钥

### 👣 步骤 (Steps)

1. **克隆代码仓库 (Clone the repository)**
   ```bash
   git clone https://github.com/lifefloating/LotteryMaster
   cd LotteryMaster
   ```

2. **安装后端依赖 (Install backend dependencies)**
   ```bash
   pnpm install
   ```

3. **配置环境变量 (Configure environment variables)**

   在项目根目录下创建 `.env` 文件，并根据 `.env.example` 文件中的示例配置以下环境变量：

   **使用通义千问（默认）：**
   ```env
   PORT=3008
   API_PROVIDER=qwen
   API_KEY=your_qwen_api_key
   API_MODEL=qwen-turbo
   ```

   **使用 Claude：**
   ```env
   PORT=3008
   API_PROVIDER=claude
   CLAUDE_API_KEY=your_claude_api_key
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```

   **使用 DeepSeek：**
   ```env
   PORT=3008
   API_PROVIDER=deepseek
   API_KEY=your_deepseek_api_key
   API_MODEL=deepseek-v3
   ```

   其他的按需求调整配置

4. **运行服务 (Run backend service)**
   ```bash
    pnpm run start
   ```

   后端服务默认运行在 `http://localhost:3008`。

5. **运行前端项目**

   前端项目请参考 [LotteryMaster-Uniapp](https://github.com/lifefloating/LotteryMaster-Uniapp) 的 `README.md` 文件启动前端服务，并确保前端配置的后端API地址正确。

6. **部署&运行 (Deployment & Running)**

   ### Docker部署

   #### 前提条件
   - 已安装 [Docker](https://www.docker.com/get-started)
   - 已克隆 LotteryMaster 代码仓库

   #### 运行步骤
   1. 使用环境变量文件运行Docker容器：
   ```bash
   docker run -d -p 3008:3008 --name lottery-master-app lottery-master
   ```

   更多详细的部署说明请参考：[部署指南](./DEPLOYMENT.md)


### 🔗 访问API

后端服务启动后，您可以使用Postman、curl等工具访问API接口。

例如，访问健康检查接口：
```bash
curl http://localhost:3008/api/health
```

### 🖼️ 接口测试结果

以下是几个主要接口的示例：

1. **双色球分析接口**
   ```bash
   curl http://localhost:3008/api/analyze/ssq
   ```

2. **大乐透分析接口**
   ```bash
   curl http://localhost:3008/api/analyze/dlt
   ```

3. **福彩3D分析接口**
   ```bash
   curl http://localhost:3008/api/analyze/fc3d
   ```

[完整结果示例](./resultCollections/analyzeDlt.json)

### 🧪 运行测试 (Run Tests)

运行所有测试：
```bash
pnpm test
```

运行所有测试并生成覆盖率报告：
```bash
pnpm test:coverage
```

测试覆盖率报告将生成在 `coverage` 目录下。

### 📝 TODO
 -- todo

文档将在后续继续完善。

### 数学方法

针对大乐透和双色球的特点（随机抽取、离散分布、独立事件），以下是分析的适用性排序：

- 离散型均匀分布公式: 最适合，直接用于计算中奖概率，是彩票分析的核心工具。  
<del>- 全概率公式: 有一定适用性，可用于分解复杂中奖概率的计算。</del>  
<del>- 正态分布: 可用于分析历史数据的统计特性（如和值分布），但预测能力有限。</del>  
<del>- 层次聚类 & K均值聚类: 适合探索历史号码的模式，辅助选号策略。</del>  
<del>- 贝叶斯公式、一元线性回归、多元线性回归: 适用性较低，彩票的随机性削弱了这些方法的预测效果。</del>  
<del>- 连续型均匀分布公式: 不适用，与彩票的离散性质不符。</del>  

---

**注意**:  本项目仍处于开发阶段，部分功能可能尚未完善。分析报告的结果仅供参考，不构成任何投资建议。请理性对待彩票，切勿沉迷。

如果您在使用过程中遇到任何问题，或者有任何建议，欢迎提交Issue或Pull Request。

<p align="center">
  <a href="https://github.com/Hubery-Lee/LotteryMaster/issues"><img src="https://img.shields.io/badge/Issues-提交Issue-blueviolet" alt="Issues"/></a>
  <a href="https://github.com/Hubery-Lee/LotteryMaster/pulls"><img src="https://img.shields.io/badge/Pull%20Requests-提交PR-success" alt="Pull Requests"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-Beta-yellow" alt="Project Status: Beta"/></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-brightgreen" alt="License: MIT"/></a>
</p>

<p align="center">
  <a href="https://www.netlify.com">
    <img src="https://www.netlify.com/img/global/badges/netlify-color-bg.svg" alt="Deploys by Netlify" />
  </a>
<p>