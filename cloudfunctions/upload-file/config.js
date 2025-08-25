// cloudfunctions/upload-file/config.js
// Dify API 配置 - 从环境变量获取

const DIFY_CONFIG = {
  API_KEY: process.env.DIFY_API_KEY || 'app-EF0oHmInk30U17B9xX29YXaU',
  API_URL: process.env.DIFY_API_URL || 'https://api.dify.ai/v1',
  APP_ID: process.env.DIFY_APP_ID || '79b14015-c5a2-4e34-b575-c69e702650c6'
};

module.exports = DIFY_CONFIG;
