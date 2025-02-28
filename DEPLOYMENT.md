# LotteryMaster 部署指南

本文档提供了使用Docker部署LotteryMaster应用的详细步骤。

## 前提条件

- 已安装 [Docker](https://www.docker.com/get-started)
- 已克隆 LotteryMaster 代码仓库

## 部署步骤

### 1. 准备环境变量

在项目根目录创建 `.env.production` 文件，参考 `.env.example` 配置必要的环境变量：

```env
# Server Configuration
PORT=3008

# API Configuration
API_KEY=your_API_KEY_here
API_MODEL=qwen-turbo
API_MODEL_LONG=qwen-long
API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
...
```

请确保替换 `API_KEY` 为您的实际API密钥。

### 2. 构建Docker镜像

在项目根目录执行以下命令构建Docker镜像：

```bash
docker build -t lottery-master .
```

这将创建一个名为 `lottery-master` 的Docker镜像。

### 3. 运行Docker容器

#### 方式一：使用环境变量文件

如果您已经创建了 `.env.production` 文件，可以直接运行：

```bash
docker run -d -p 3008:3008 --name lottery-master-app lottery-master
```

#### 方式二：直接传递环境变量

如果您想直接传递环境变量，可以使用 `--env` 参数：

```bash
docker run -d -p 3008:3008 --name lottery-master-app \
  --env PORT=3008 \
  --env API_KEY=your_API_KEY_here \
  --env API_MODEL=qwen-turbo \
  --env API_MODEL_LONG=qwen-long \
  --env API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  lottery-master
```

请替换 `your_API_KEY_here` 为您的实际API密钥。

### 4. 验证部署

应用成功部署后，可以通过以下方式验证：

```bash
curl http://localhost:3008/api/health
```

如果返回正常响应，说明应用已成功部署。

### 5. 查看容器日志

```bash
docker logs lottery-master-app
```

### 6. 停止和删除容器

```bash
# 停止容器
docker stop lottery-master-app

# 删除容器
docker rm lottery-master-app
```