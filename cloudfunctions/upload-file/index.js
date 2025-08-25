// cloudfunctions/upload-file/index.js
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
 * 上传文件到 Dify
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function uploadToDify(event, context) {
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
    
    // 先从云存储下载文件
    const fileResult = await cloud.downloadFile({
      fileID: fileId
    });
    
    if (!fileResult.buffer) {
      throw new Error('无法获取文件内容');
    }

    // 构建 multipart/form-data
    const boundary = '----formdata-' + Math.random().toString(36).substring(2);
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加文件
    form.append('file', fileResult.buffer, {
      filename: fileName || 'uploaded_file',
      contentType: fileType || 'application/octet-stream'
    });
    
    // 添加用户标识
    form.append('user', userId);

    // 发送请求到 Dify API
    const https = require('https');
    const options = {
      hostname: 'api.dify.ai',
      port: 443,
      path: '/v1/files/upload',
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
                  id: result.id,
                  name: result.name,
                  size: result.size,
                  extension: result.extension,
                  mime_type: result.mime_type,
                  created_at: result.created_at
                }
              });
            } else {
              reject(new Error(`Upload Error: ${res.statusCode} - ${result.message || responseData}`));
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
    console.error('文件上传到Dify失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'UPLOAD_ERROR'
    };
  }
}

/**
 * 获取文件预览
 * @param {object} event 事件参数
 * @returns {object} 响应结果
 */
async function getFilePreview(event) {
  try {
    const { fileId, asAttachment = false } = event;
    
    if (!fileId) {
      throw new Error('缺少必要参数：fileId');
    }

    const https = require('https');
    const queryString = asAttachment ? '?as_attachment=true' : '';
    const options = {
      hostname: 'api.dify.ai',
      port: 443,
      path: `/v1/files/${fileId}/preview${queryString}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIFY_CONFIG.API_KEY}`
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
            const buffer = Buffer.concat(chunks);
            resolve({
              success: true,
              data: {
                buffer: buffer,
                contentType: res.headers['content-type'],
                contentLength: res.headers['content-length'],
                fileName: res.headers['content-disposition']
              }
            });
          } else {
            reject(new Error(`Preview Error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });

  } catch (error) {
    console.error('获取文件预览失败:', error);
    return {
      success: false,
      error: error.message,
      errorType: 'PREVIEW_ERROR'
    };
  }
}

/**
 * 上传文件到云存储
 * @param {object} event 事件参数
 * @param {object} context 上下文对象
 * @returns {object} 响应结果
 */
async function uploadToCloud(event, context) {
  try {
    const { fileContent, fileName, fileType } = event;
    
    if (!fileContent || !fileName) {
      throw new Error('缺少必要参数：fileContent 或 fileName');
    }

    // 从 event.userInfo 中获取用户的 openId
    const openId = event.userInfo?.openId || cloud.getWXContext().OPENID;
    if (!openId) {
      throw new Error('无法获取用户身份信息');
    }

    // 生成文件路径
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const cloudPath = `uploads/${openId}/${timestamp}_${randomStr}_${fileName}`;

    // 上传到云存储
    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: Buffer.from(fileContent, 'base64')
    });

    return {
      success: true,
      data: {
        fileID: result.fileID,
        cloudPath: cloudPath
      }
    };

  } catch (error) {
    console.error('上传文件到云存储失败:', error);
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
  console.log('upload-file 云函数被调用，参数:', JSON.stringify(event, null, 2));
  
  const { action } = event;
  
  try {
    switch (action) {
      case 'uploadToDify':
        return await uploadToDify(event, context);
      
      case 'getPreview':
        return await getFilePreview(event);
      
      case 'uploadToCloud':
        return await uploadToCloud(event, context);
      
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
