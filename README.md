# LotteryMaster


### ✨ 主要功能 (Key Features)

- 📊 **数据处理**:  抓取彩票数据，保存到Excel文件，支持抓取全部期数。
- 🤖 **输出报告**:  集成通义千问大模型(Qwen-MAX)/（Qwen-Long），根据prompt生成分析报告，包括号码预测、号码推荐、号码趋势等。
- 📱 **多端访问支持**:   支持Web、移动App等多平台访问，方便用户随时随地获取彩票分析信息

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

- **AI 模型**
  - [通义千问 Qwen API](https://tongyi.aliyun.com/qianwen/):  阿里云大语言模型API，用于生成分析报告，趋势分析图表。
  - [DeepSeek](https://help.aliyun.com/zh/model-studio/developer-reference/deepseek): 阿里云百炼平台提供的 DeepSeek 大语言模型，具有强大的推理和分析能力。
  - deepseek的api比较慢，页面上使用不建议设置
  
  
  #### API 参数说明
  
  `.env.example` 中的 API 相关参数说明：
  
  - **API_MODEL**: 选择使用的模型，可选值包括：
    - `qwen-turbo`
    - `qwen-long`
    - `qwen-max`
    - `deepseek-v3`
    - `deepseek-r1`
  
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
  
- **前端开发**
  - [LotteryMaster-Uniapp](https://github.com/lifefloating/LotteryMaster-Uniapp): 基于uniapp + Vue3 + TypeScript的多端应用

- **测试覆盖率**
- <a href="#"><img src="https://img.shields.io/badge/Coverage-91.3%25-success" alt="Coverage Badge"/></a>

  **总体覆盖率指标**

  | 指标 | 覆盖率 |
  |------|--------|
  | Statements | 91.14% |
  | Branches | 78.97% |
  | Functions | 90.32% |
  | Lines | 91.3% |

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

   ```env
   PORT=3008
   API_KEY=your_key
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

以 api/analyze/dlt 为例，获取结果:

[完整结果](./resultCollections/analyzeDlt.json)

### 🧪 运行测试 (Run Tests)

运行所有测试并生成覆盖率报告：
```bash
pnpm test:coverage
```

测试覆盖率报告将生成在 `coverage` 目录下。

### 📝 TODO
  - 考虑前端加上模型切换选项卡
  - bun 暂时先这样，后续会切换
  - 优化下 axios请求的处理，暂时不用openai


文档将在后续继续完善。

---

**注意**:  本项目仍处于开发阶段，部分功能可能尚未完善。分析报告的结果仅供参考，不构成任何投资建议。请理性对待彩票，切勿沉迷。

如果您在使用过程中遇到任何问题，或者有任何建议，欢迎提交Issue或Pull Request。

<p align="center">
  <a href="https://github.com/Hubery-Lee/LotteryMaster/issues"><img src="https://img.shields.io/badge/Issues-提交Issue-blueviolet" alt="Issues"/></a>
  <a href="https://github.com/Hubery-Lee/LotteryMaster/pulls"><img src="https://img.shields.io/badge/Pull%20Requests-提交PR-success" alt="Pull Requests"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-Beta-yellow" alt="Project Status: Beta"/></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-brightgreen" alt="License: MIT"/></a>
</p>
