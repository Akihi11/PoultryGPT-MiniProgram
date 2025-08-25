// cloudfunctions/conversation-history/index.js
const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库引用
const db = cloud.database();

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
  let queryString = '';
  
  // 处理GET请求的查询参数
  if (method === 'GET' && Object.keys(data).length > 0) {
    queryString = '?' + Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }
  
  const options = {
    hostname: 'api.dify.ai',
    port: 443,
    path: `/v1${url}${queryString}`,
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
 * 获取会话列表
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function getConversations(event, context) {
  try {
    const { limit = 20, lastId = '' } = event;
    
    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    const requestData = {
      user: userId,
      limit: limit,
      last_id: lastId
    };

    // 发送请求到 Dify API
    const response = await sendToDifyAPI('/conversations', requestData, 'GET');
    
    console.log('获取会话列表成功:', response);

    return {
      success: true,
      data: {
        conversations: response.data || [],
        hasMore: response.has_more || false,
        limit: response.limit || limit
      }
    };

  } catch (error) {
    console.error('获取会话列表失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 获取会话历史消息
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function getMessages(event, context) {
  try {
    const { conversationId, limit = 20, firstId = '' } = event;
    
    if (!conversationId) {
      throw new Error('缺少必要参数：conversationId');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    const requestData = {
      user: userId,
      conversation_id: conversationId,
      limit: limit,
      first_id: firstId
    };

    // 发送请求到 Dify API
    const response = await sendToDifyAPI('/messages', requestData, 'GET');
    
    console.log('获取会话消息成功:', response);

    return {
      success: true,
      data: {
        messages: response.data || [],
        hasMore: response.has_more || false,
        limit: response.limit || limit
      }
    };

  } catch (error) {
    console.error('获取会话消息失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 删除会话
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function deleteConversation(event, context) {
  try {
    const { conversationId } = event;
    
    if (!conversationId) {
      throw new Error('缺少必要参数：conversationId');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    const requestData = {
      user: userId
    };

    // 发送删除请求到 Dify API
    const response = await sendToDifyAPI(`/conversations/${conversationId}`, requestData, 'DELETE');
    
    console.log('删除会话成功:', response);

    return {
      success: true,
      data: response
    };

  } catch (error) {
    console.error('删除会话失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 重命名会话
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function renameConversation(event, context) {
  try {
    const { conversationId, name, autoGenerate = false } = event;
    
    if (!conversationId) {
      throw new Error('缺少必要参数：conversationId');
    }

    if (!name && !autoGenerate) {
      throw new Error('必须提供新名称或启用自动生成');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    const requestData = {
      user: userId,
      auto_generate: autoGenerate
    };

    if (name) {
      requestData.name = name;
    }

    // 发送重命名请求到 Dify API
    const response = await sendToDifyAPI(`/conversations/${conversationId}/name`, requestData, 'POST');
    
    console.log('重命名会话成功:', response);

    return {
      success: true,
      data: response
    };

  } catch (error) {
    console.error('重命名会话失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DIFY_API_ERROR'
    };
  }
}

/**
 * 保存会话到本地数据库（可选）
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function saveConversationLocal(event, context) {
  try {
    const { conversationData } = event;
    
    if (!conversationData) {
      throw new Error('缺少必要参数：conversationData');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    // 保存到云数据库
    const result = await db.collection('conversations').add({
      data: {
        openId: openId,
        conversationId: conversationData.conversationId,
        title: conversationData.title,
        preview: conversationData.preview,
        created_at: new Date(),
        updated_at: new Date(),
        difyData: conversationData
      }
    });

    return {
      success: true,
      data: {
        localId: result._id
      }
    };

  } catch (error) {
    console.error('保存会话到本地失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'DATABASE_ERROR'
    };
  }
}

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  console.log('conversation-history 云函数被调用，参数:', JSON.stringify(event, null, 2));
  
  const { action } = event;
  
  try {
    switch (action) {
      case 'getConversations':
        return await getConversations(event, context);
      
      case 'getMessages':
        return await getMessages(event, context);
      
      case 'deleteConversation':
        return await deleteConversation(event, context);
      
      case 'renameConversation':
        return await renameConversation(event, context);
      
      case 'saveLocal':
        return await saveConversationLocal(event, context);
      
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
