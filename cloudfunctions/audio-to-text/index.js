// cloudfunctions/audio-to-text/index.js
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
 * 语音转文字
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function audioToText(event, context) {
  try {
    const { fileId, fileName, fileType } = event;
    
    if (!fileId) {
      throw new Error('缺少必要参数：fileId');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    const userId = generateUserId(openId);
    
    // 先从云存储下载音频文件
    const fileResult = await cloud.downloadFile({
      fileID: fileId
    });
    
    if (!fileResult.buffer) {
      throw new Error('无法获取音频文件内容');
    }

    // 验证音频格式
    const supportedFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
    const extension = (fileName || '').split('.').pop()?.toLowerCase();
    
    if (!extension || !supportedFormats.includes(extension)) {
      throw new Error(`不支持的音频格式。支持的格式：${supportedFormats.join(', ')}`);
    }

    // 检查文件大小（15MB限制）
    if (fileResult.buffer.length > 15 * 1024 * 1024) {
      throw new Error('音频文件大小不能超过15MB');
    }

    // 构建 multipart/form-data
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加音频文件
    form.append('file', fileResult.buffer, {
      filename: fileName || `audio.${extension}`,
      contentType: fileType || `audio/${extension}`
    });
    
    // 添加用户标识
    form.append('user', userId);

    // 发送请求到 Dify API
    const https = require('https');
    const options = {
      hostname: 'api.dify.ai',
      port: 443,
      path: '/v1/audio-to-text',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`,
        ...form.getHeaders()
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
              resolve({
                success: true,
                data: {
                  text: result.text,
                  duration: result.duration || null,
                  language: result.language || null
                }
              });
            } else {
              reject(new Error(`Audio API Error: ${res.statusCode} - ${result.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      form.pipe(req);
    });

  } catch (error) {
    console.error('语音转文字失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'AUDIO_TO_TEXT_ERROR'
    };
  }
}

/**
 * 文字转语音
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function textToAudio(event, context) {
  try {
    const { text, messageId } = event;
    
    if (!text && !messageId) {
      throw new Error('缺少必要参数：text 或 messageId');
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

    // 优先使用 messageId，否则使用 text
    if (messageId) {
      requestData.message_id = messageId;
    } else {
      requestData.text = text;
    }

    // 发送请求到 Dify API
    const https = require('https');
    const options = {
      hostname: 'api.dify.ai',
      port: 443,
      path: '/v1/text-to-audio',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const audioBuffer = Buffer.concat(chunks);
            
            // 如果返回的是音频数据，转换为base64
            if (res.headers['content-type']?.includes('audio')) {
              resolve({
                success: true,
                data: {
                  audio: audioBuffer.toString('base64'),
                  contentType: res.headers['content-type'],
                  size: audioBuffer.length
                }
              });
            } else {
              // 如果是JSON响应，解析错误信息
              try {
                const result = JSON.parse(audioBuffer.toString());
                reject(new Error(`TTS Error: ${result.message || 'Unknown error'}`));
              } catch (parseError) {
                reject(new Error('TTS API返回了无效的响应'));
              }
            }
          } else {
            reject(new Error(`TTS API Error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(JSON.stringify(requestData));
      req.end();
    });

  } catch (error) {
    console.error('文字转语音失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'TEXT_TO_AUDIO_ERROR'
    };
  }
}

/**
 * 保存音频到云存储
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function saveAudioToCloud(event, context) {
  try {
    const { audioBase64, fileName } = event;
    
    if (!audioBase64) {
      throw new Error('缺少必要参数：audioBase64');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    // 生成文件路径
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const cloudPath = `audio/${openId}/${timestamp}_${randomStr}_${fileName || 'audio.mp3'}`;

    // 上传到云存储
    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: Buffer.from(audioBase64, 'base64')
    });

    return {
      success: true,
      data: {
        fileID: result.fileID,
        cloudPath: cloudPath
      }
    };

  } catch (error) {
    console.error('保存音频到云存储失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'CLOUD_STORAGE_ERROR'
    };
  }
}

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  console.log('audio-to-text 云函数被调用，参数:', JSON.stringify(event, null, 2));
  
  const { action } = event;
  
  try {
    switch (action) {
      case 'audioToText':
        return await audioToText(event, context);
      
      case 'textToAudio':
        return await textToAudio(event, context);
      
      case 'saveToCloud':
        return await saveAudioToCloud(event, context);
      
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
