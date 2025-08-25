// cloudfunctions/dify-chat/index.js
const cloud = require('wx-server-sdk');
const DIFY_CONFIG = require('./config');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

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
    }
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
    const { query, conversationId, inputs = {} } = event;
    
    if (!query) {
      throw new Error('缺少必要参数：query');
    }

    // 从上下文中获取用户的 openId
    const openId = cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    // 构建请求数据
    const requestData = {
      inputs: inputs,
      query: query,
      response_mode: 'blocking', // 使用阻塞模式，因为小程序不支持SSE
      user: userId,
      auto_generate_name: true
    };

    // 如果有会话ID，添加到请求中
    if (conversationId) {
      requestData.conversation_id = conversationId;
    }

    console.log('发送到 Dify 的请求数据:', JSON.stringify(requestData, null, 2));

    // 发送请求到 Dify API
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
    // 从上下文中获取用户的 openId
    const openId = cloud.getWXContext().OPENID;
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
  
  const { action } = event;
  
  try {
    switch (action) {
      case 'sendMessage':
        return await sendChatMessage(event, context);
      
      case 'getParameters':
        return await getAppParameters(event, context);
      
      case 'getInfo':
        return await getAppInfo(event);
      
      default:
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
