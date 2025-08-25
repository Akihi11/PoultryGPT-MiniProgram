# PoultryGPT-Dify 部署指南

## 项目概述

本项目已经成功集成了 Dify AI 聊天功能，使用微信小程序云开发作为后端服务，通过云函数调用 Dify API。

## 部署步骤

### 1. 环境配置

#### 1.1 开通云开发服务

1. 在微信开发者工具中打开项目
2. 点击工具栏中的"云开发"按钮
3. 按照提示开通云开发服务
4. 创建云开发环境（建议创建两个环境：开发环境和生产环境）

#### 1.2 配置环境 ID

在 `miniprogram/app.ts` 中的 `initCloudService` 方法中，可以指定环境 ID：

```typescript
wx.cloud.init({
  env: "your-env-id", // 替换为你的环境 ID
  traceUser: true,
});
```

### 2. 部署云函数

#### 2.1 安装依赖

为每个云函数安装依赖包：

```bash
# 进入云函数目录
cd cloudfunctions/dify-chat
npm install

cd ../conversation-history
npm install

cd ../upload-file
npm install

cd ../audio-to-text
npm install
```

#### 2.2 部署云函数

在微信开发者工具中：

1. 右键点击 `cloudfunctions` 目录
2. 选择"同步云函数列表"
3. 分别右键点击每个云函数目录：
   - `dify-chat`
   - `conversation-history`
   - `upload-file`
   - `audio-to-text`
4. 选择"上传并部署：云端安装依赖"

### 3. 配置 Dify API

#### 3.1 获取 Dify 配置信息

1. 登录你的 Dify 控制台
2. 进入应用设置
3. 获取以下信息：
   - API Key
   - App ID
   - API Base URL

#### 3.2 配置 Dify API 密钥

现在所有云函数都使用环境变量来管理 Dify 配置，提供更好的安全性。

**选项 1: 通过微信云开发控制台设置（推荐）**

1. 打开微信云开发控制台
2. 进入 "云函数" 页面
3. 选择要配置的云函数（dify-chat, conversation-history, upload-file, audio-to-text）
4. 点击 "环境变量" 或 "版本管理"
5. 添加以下环境变量：
   ```
   DIFY_API_KEY = your-actual-api-key
   DIFY_API_URL = https://api.dify.ai/v1
   DIFY_APP_ID = your-actual-app-id
   ```

**选项 2: 修改配置文件默认值**

如果不设置环境变量，可以直接修改各云函数的 `config.js` 文件：

```javascript
// cloudfunctions/dify-chat/config.js
const DIFY_CONFIG = {
  API_KEY: process.env.DIFY_API_KEY || "your-actual-api-key",
  API_URL: process.env.DIFY_API_URL || "https://api.dify.ai/v1",
  APP_ID: process.env.DIFY_APP_ID || "your-actual-app-id",
};
```

> 📋 **注意**: 当前配置文件中已经包含了示例值，如果不更改，将使用这些默认配置。

### 4. 数据库配置（可选）

如果需要使用本地数据库存储功能：

1. 在云开发控制台中创建数据库
2. 创建 `conversations` 集合
3. 设置相应的权限规则

### 5. 测试部署

#### 5.1 功能测试

1. 在开发者工具中预览小程序
2. 测试以下功能：
   - 发送消息
   - 接收 AI 回复
   - 查看历史记录
   - 删除和重命名对话

#### 5.2 云函数日志

在云开发控制台中查看云函数调用日志，确保没有错误。

## 功能特性

### 已实现功能

1. **AI 聊天对话**

   - 发送文本消息到 Dify
   - 接收 AI 回复
   - 支持多轮对话

2. **会话管理**

   - 自动创建新会话
   - 查看历史会话列表
   - 重命名会话
   - 删除会话

3. **消息历史**

   - 加载历史消息
   - 支持会话切换
   - 本地缓存优化

4. **文件上传**（预留）

   - 支持图片上传
   - 支持文档上传
   - 文件预览功能

5. **语音功能**（预留）
   - 语音转文字
   - 文字转语音

### 云函数架构

1. **dify-chat**: 核心聊天功能

   - 发送消息到 Dify
   - 获取应用参数和信息
   - 错误处理和重试机制

2. **conversation-history**: 会话管理

   - 获取会话列表
   - 获取会话消息
   - 删除和重命名会话

3. **upload-file**: 文件处理

   - 上传文件到 Dify
   - 文件预览
   - 云存储集成

4. **audio-to-text**: 语音处理
   - 语音识别
   - 语音合成
   - 音频文件管理

## API 配置说明

### Dify API 配置

根据你的 Dify 部署方式，需要相应配置：

#### 云服务版本

```javascript
const DIFY_CONFIG = {
  API_KEY: "app-xxxxxxxxxxxxxxxx",
  API_URL: "https://api.dify.ai/v1",
  APP_ID: "your-app-id",
};
```

#### 私有部署版本

```javascript
const DIFY_CONFIG = {
  API_KEY: "app-xxxxxxxxxxxxxxxx",
  API_URL: "https://your-domain.com/v1",
  APP_ID: "your-app-id",
};
```

## 安全注意事项

1. **API Key 保护**

   - API Key 只存储在云函数中，不暴露给前端
   - 定期轮换 API Key
   - 监控 API 使用情况

2. **用户身份验证**

   - 使用微信 openId 作为用户标识
   - 实现适当的访问控制

3. **数据安全**
   - 敏感数据加密存储
   - 定期备份重要数据

## 性能优化

1. **缓存策略**

   - 历史记录本地缓存
   - API 响应缓存

2. **资源优化**
   - 图片压缩和懒加载
   - 云函数冷启动优化

## 故障排除

### 常见问题

1. **云函数调用失败**

   - 检查环境 ID 是否正确
   - 验证云函数是否正确部署
   - 查看云函数日志

2. **Dify API 调用失败**

   - 验证 API Key 是否正确
   - 检查网络连接
   - 确认 API 配额

3. **消息发送失败**
   - 检查用户权限
   - 验证会话 ID
   - 查看错误日志

### 调试方法

1. 开启云函数日志
2. 使用开发者工具调试
3. 监控 API 调用状态

## 更新和维护

1. **定期更新依赖**

   - 更新云函数依赖包
   - 升级微信小程序基础库

2. **监控和告警**

   - 设置云函数监控
   - 配置错误告警

3. **备份策略**
   - 定期备份云函数代码
   - 备份数据库数据

## 支持和反馈

如果在部署过程中遇到问题，请检查：

1. 云开发服务是否正常
2. Dify API 配置是否正确
3. 网络连接是否稳定
4. 小程序权限设置是否完整
