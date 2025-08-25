你说得对，Cursor 无法看到这个 web 项目的代码。我需要修改 prompt，让它包含具体的实现细节和代码示例<cite/>。

## 修改后的 Cursor Prompt

````
我需要在微信小程序中集成Dify AI对话功能。请帮我创建一个完整的小程序Dify客户端，参考以下web版本的实现方式：

## 1. 配置管理
创建 utils/config.js：
```javascript
// 参考web版本的配置方式
export const APP_ID = 'your_app_id'
export const API_KEY = 'your_api_key'
export const API_URL = 'https://api.dify.ai/v1'
````

## 2. 会话管理

创建 utils/session.js，实现类似 web 版本的会话管理：

```javascript
// web版本使用: const user = userPrefix + sessionId
// 小程序版本需要用wx.storage替代cookie
const userPrefix = `user_${APP_ID}:`;

export function getSessionId() {
  let sessionId = wx.getStorageSync("session_id");
  if (!sessionId) {
    sessionId = generateUUID(); // 需要实现UUID生成
    wx.setStorageSync("session_id", sessionId);
  }
  return sessionId;
}

export function getUserId() {
  return userPrefix + getSessionId();
}
```

## 3. HTTP 客户端封装

创建 utils/http.js，替代 web 版本的 fetch：

```javascript
// web版本使用fetch和SSE，小程序需要用wx.request
class HttpClient {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseURL + options.url,
        method: options.method || "GET",
        data: options.data,
        header: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...options.header,
        },
        success: resolve,
        fail: reject,
      });
    });
  }
}
```

## 4. 核心 API 服务

创建 utils/dify-client.js，实现这些关键方法：

```javascript
// 参考web版本的API调用方式
export async function sendChatMessage(data) {
  // web版本: ssePost('chat-messages', {body: {...body, response_mode: 'streaming'}})
  // 小程序版本: 改为blocking模式
  return httpClient.request({
    url: "/chat-messages",
    method: "POST",
    data: {
      ...data,
      response_mode: "blocking", // 小程序不支持SSE，使用blocking模式
      user: getUserId(),
    },
  });
}

export async function fetchConversations() {
  // web版本: get('conversations', { params: { limit: 100, first_id: '' } })
  return httpClient.request({
    url: "/conversations",
    method: "GET",
    data: {
      user: getUserId(),
      limit: 100,
      first_id: "",
    },
  });
}

export async function fetchAppParams() {
  // web版本: get('parameters')
  return httpClient.request({
    url: "/parameters",
    method: "GET",
    data: {
      user: getUserId(),
    },
  });
}
```

## 5. 数据结构定义

定义聊天消息和对话的数据结构，参考 web 版本：

```javascript
// 消息结构
const messageStructure = {
  id: "",
  content: "",
  isAnswer: false,
  message_files: [],
  agent_thoughts: [],
};

// 对话结构
const conversationStructure = {
  id: "",
  name: "",
  inputs: {},
  status: "",
  created_at: 0,
};
```

## 6. 错误处理

实现统一的错误处理机制：

```javascript
function handleError(error) {
  console.error("Dify API Error:", error);
  wx.showToast({
    title: error.message || "请求失败",
    icon: "none",
  });
}
```

请创建完整的文件结构，确保 API 调用方式与上述 web 版本保持一致，但适配小程序环境的限制。

```

```
