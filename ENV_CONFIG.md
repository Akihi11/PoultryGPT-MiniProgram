# 🔧 环境变量配置指南

## 概述

所有云函数的 Dify API 配置现在都从环境变量中获取，提供了更好的安全性和灵活性。

## 📁 配置文件结构

每个云函数都有自己的 `config.js` 文件：

```
cloudfunctions/
├── dify-chat/config.js
├── conversation-history/config.js
├── upload-file/config.js
└── audio-to-text/config.js
```

## 🔑 环境变量

每个配置文件都支持以下环境变量：

- `DIFY_API_KEY` - Dify API 密钥
- `DIFY_API_URL` - Dify API 基础 URL
- `DIFY_APP_ID` - Dify 应用 ID

## 🛠️ 配置方法

### 方法 1: 通过微信云开发控制台设置（推荐）

1. 打开微信云开发控制台
2. 进入 "云函数" 页面
3. 选择要配置的云函数
4. 点击 "版本管理" 或 "环境变量"
5. 添加环境变量：
   ```
   DIFY_API_KEY = app-EF0oHmInk30U17B9xX29YXaU
   DIFY_API_URL = https://api.dify.ai/v1
   DIFY_APP_ID = 79b14015-c5a2-4e34-b575-c69e702650c6
   ```

### 方法 2: 直接修改配置文件

如果不设置环境变量，系统会使用默认值（当前的 Dify 配置）。

你可以直接修改 `config.js` 文件中的默认值：

```javascript
const DIFY_CONFIG = {
  API_KEY: process.env.DIFY_API_KEY || "your-new-api-key",
  API_URL: process.env.DIFY_API_URL || "your-api-url",
  APP_ID: process.env.DIFY_APP_ID || "your-app-id",
};
```

## 🔄 更新步骤

### 1. 修改配置文件（如果需要）

编辑对应云函数的 `config.js` 文件，更新默认值。

### 2. 重新部署云函数

对每个修改过的云函数：

1. 右键点击云函数目录
2. 选择 "上传并部署：云端安装依赖"
3. 等待部署完成

### 3. 验证配置

在开发者工具控制台测试：

```javascript
wx.cloud
  .callFunction({
    name: "dify-chat",
    data: {
      action: "getInfo",
    },
  })
  .then((res) => {
    console.log("配置验证成功:", res);
  })
  .catch((err) => {
    console.error("配置验证失败:", err);
  });
```

## 🔐 安全最佳实践

1. **生产环境**: 始终使用环境变量，不要在代码中硬编码密钥
2. **开发环境**: 可以使用默认值进行快速开发
3. **密钥轮换**: 定期更新 API 密钥
4. **权限控制**: 确保只有必要的人员能访问环境变量

## 🌍 不同环境配置

### 开发环境

```javascript
DIFY_API_KEY = app-dev-xxxxxxxxxxxx
DIFY_API_URL = https://api.dify.ai/v1
DIFY_APP_ID = dev-app-id
```

### 生产环境

```javascript
DIFY_API_KEY = app-prod-xxxxxxxxxxxx
DIFY_API_URL = https://api.dify.ai/v1
DIFY_APP_ID = prod-app-id
```

## 📋 配置检查清单

- [ ] 所有云函数都有 `config.js` 文件
- [ ] 环境变量设置正确
- [ ] 云函数重新部署完成
- [ ] 功能测试通过
- [ ] API 调用正常

## 🔧 故障排除

### 问题 1: API 调用失败

- 检查环境变量是否设置正确
- 验证 API 密钥是否有效
- 确认 API URL 格式正确

### 问题 2: 配置文件不生效

- 确保云函数已重新部署
- 检查 `require('./config')` 路径是否正确
- 验证配置文件语法无误

### 问题 3: 默认值问题

- 检查 `process.env` 后的默认值
- 确认逻辑运算符 `||` 使用正确

## 📞 获取帮助

如果遇到配置问题：

1. 检查云函数部署日志
2. 验证环境变量格式
3. 测试 API 连接性
4. 查看云开发控制台错误信息

---

**注意**: 配置更改后必须重新部署云函数才能生效！
