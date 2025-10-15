# LotteryMaster 开发任务

## ✅ 已完成

### Phase 1: Claude API 支持
- [x] 创建 AI Provider 抽象层
- [x] 实现 ClaudeProvider
- [x] 实现 QwenProvider（支持 Qwen 和 DeepSeek）
- [x] 更新配置系统
- [x] 更新 README 文档

### Phase 2: 邮件订阅功能

#### 后端
- [x] 安装后端依赖（nodemailer、better-sqlite3、node-cron）
- [x] 创建数据库服务和表结构
- [x] 实现邮件服务（SMTP + HTML 模板）
- [x] 实现订阅管理服务（CRUD）
- [x] 实现定时任务服务（node-cron）
- [x] 创建订阅 API 控制器和路由
- [x] 后端构建测试

#### 前端
- [x] 创建订阅 store（subscription.ts）
- [x] 创建订阅设置页面（uni-app）
- [x] 在 pages.json 中添加页面路由
- [x] 更新"我的"页面添加订阅入口
- [x] 前端代码格式化和 lint 检查

#### 文档
- [x] 更新 README 文档说明邮件订阅功能

## 📝 功能说明

### 邮件订阅功能特性
1. **SMTP 配置**: 支持配置任意 SMTP 服务器
2. **测试邮件**: 发送测试邮件验证配置
3. **订阅管理**:
   - 添加/编辑/删除订阅
   - 支持三种彩票类型（双色球、大乐透、福彩3D）
   - 支持每天或每周定时发送
   - 可启用/禁用订阅
4. **邮件内容**:
   - 精美的 HTML 邮件模板
   - 包含预测号码
   - 链接到前端页面查看完整分析
5. **定时任务**: node-cron 自动定时发送

### Claude API 支持
- 支持 Claude 3.5 Sonnet、Opus、Haiku 等多个模型
- 与 Qwen、DeepSeek 并列，通过配置切换
- 完整的错误处理和日志记录
