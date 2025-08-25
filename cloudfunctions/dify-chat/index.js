// cloudfunctions/dify-chat/index.js
const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// Dify API 配置
const DIFY_CONFIG = {
  API_KEY: 'app-EF0oHmInk30U17B9xX29YXaU',
  API_URL: 'https://api.dify.ai/v1',
  APP_ID: '79b14015-c5a2-4e34-b575-c69e702650c6'
};

/**
 * 生成用户标识
 * @param {string} openId 用户openId
 * @returns {string} 用户标识
 */
function generateUserId(openId) {
  return `user_${DIFY_CONFIG.APP_ID}:${openId}`;
}

/**
 * 发送请求到 Dify API
 * @param {string} url API路径
 * @param {object} data 请求数据
 * @param {string} method HTTP方法
 * @returns {Promise} 请求结果
 */
async function sendToDifyAPI(url, data = {}, method = 'POST') {
  const https = require('https');
  const options = {
    hostname: 'api.dify.ai',
    port: 443,
    path: `/v1${url}`,
    method: method,
    headers: {
      'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 25000 // 设置25秒超时，避免云函数3秒超时
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${result.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Dify API 请求超时'));
    });

    if (method !== 'GET' && data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 发送聊天消息到 Dify
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function sendChatMessage(event, context) {
  try {
    console.log('sendChatMessage 被调用，event:', JSON.stringify(event, null, 2));
    console.log('context:', JSON.stringify(context, null, 2));
    
    const { query, conversationId, inputs = {} } = event;
    
    console.log('解析的参数:', { query, conversationId, inputs });
    
    if (!query) {
          console.error('缺少 query 参数');
    throw new Error('缺少必要参数：query');
  }

  // 从 event.userInfo 中获取用户的 openId
  const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
  if (!openId) {
    throw new Error('无法获取用户身份信息');
  }

  const userId = generateUserId(openId);
    
    // 构建请求数据 - 针对 Chatflow 优化
    const requestData = {
      inputs: inputs,
      query: query,
      response_mode: 'blocking', // 使用阻塞模式，因为小程序不支持SSE
      user: userId,
      auto_generate_name: true,
      // Chatflow 特定参数
      conversation_id: conversationId || undefined,
      files: [] // 如果需要文件上传，可以在这里添加
    };

    console.log('发送到 Dify Chatflow 的请求数据:', JSON.stringify(requestData, null, 2));

    // 发送请求到 Dify Chatflow API
    const response = await sendToDifyAPI('/chat-messages', requestData);
    
    console.log('Dify API 响应:', JSON.stringify(response, null, 2));

    return {
      success: true,
      data: {
        messageId: response.message_id,
        conversationId: response.conversation_id,
        answer: response.answer,
        created_at: response.created_at,
        usage: response.metadata?.usage || null,
        retriever_resources: response.metadata?.retriever_resources || []
      }
    };

  } catch (error) {
    console.error('Dify聊天API调用失败:', error);
    
    // 特殊处理 "Workflow not published" 错误
    if (error.message && error.message.includes('Workflow not published')) {
      return {
        success: false,
        error: 'Dify 应用尚未发布，请先在 Dify 控制台发布应用（开发环境或生产环境均可）',
        errorType: 'WORKFLOW_NOT_PUBLISHED'
      };
    }
    
    // 特殊处理其他常见错误
    if (error.message && error.message.includes('API Error: 400')) {
      return {
        success: false,
        error: `Dify 应用配置错误: ${error.message}`,
        errorType: 'DIFY_CONFIG_ERROR'
      };
    }
    
    // 特殊处理 401 错误（认证失败）
    if (error.message && error.message.includes('API Error: 401')) {
      return {
        success: false,
        error: 'API 密钥无效，请检查 Dify 应用配置',
        errorType: 'DIFY_AUTH_ERROR'
      };
    }
    
    // 特殊处理 403 错误（权限不足）
    if (error.message && error.message.includes('API Error: 403')) {
      return {
        success: false,
        error: '权限不足，请检查应用访问权限',
        errorType: 'DIFY_PERMISSION_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 获取应用参数
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function getAppParameters(event, context) {
  try {
    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    // 发送请求到 Dify API
    const response = await sendToDifyAPI('/parameters', { user: userId }, 'GET');
    
    return {
      success: true,
      data: response
    };

  } catch (error) {
    console.error('获取应用参数失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 获取应用信息
 * @param {object} event 事件参数
 * @returns {object} 响应结果
 */
async function getAppInfo(event) {
  try {
    // 发送请求到 Dify API
    const response = await sendToDifyAPI('/info', {}, 'GET');
    
    return {
      success: true,
      data: response
    };

  } catch (error) {
    console.error('获取应用信息失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  console.log('dify-chat 云函数被调用，参数:', JSON.stringify(event, null, 2));
  console.log('context:', JSON.stringify(context, null, 2));
  
  const { action } = event;
  console.log('action:', action);
  
  try {
    switch (action) {
      case 'sendMessage':
        console.log('执行 sendMessage 操作');
        return await sendChatMessage(event, context);
      
      case 'getParameters':
        console.log('执行 getParameters 操作');
        return await getAppParameters(event, context);
      
      case 'getInfo':
        console.log('执行 getInfo 操作');
        return await getAppInfo(event);
      
      default:
        console.log('未知的操作类型:', action);
        return {
          success: false,
          error: `未知的操作类型: ${action}`,
          errorType: 'INVALID_ACTION'
        };
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'FUNCTION_ERROR'
    };
  }
};
