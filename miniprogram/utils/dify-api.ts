// miniprogram/utils/dify-api.ts

/**
 * Dify API 调用工具类
 * 封装所有与 Dify 相关的云函数调用
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: string;
}

interface DifyChatResponse {
  messageId: string;
  conversationId: string;
  answer: string;
  created_at: number;
  usage?: any;
  retriever_resources?: any[];
}

interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  created_at: number;
  updated_at: number;
}

interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
  query: string;
  message_files: any[];
  answer: string;
  created_at: number;
  feedback?: any;
  retriever_resources?: any[];
}

/**
 * 错误处理
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 */
function handleError(error: any, defaultMessage: string = '操作失败'): void {
  console.error('API调用失败:', error);
  
  let errorMessage = defaultMessage;
  if (error?.error) {
    errorMessage = error.error;
  } else if (error?.errMsg) {
    errorMessage = error.errMsg;
  }
  
  wx.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 3000
  });
}

/**
 * 发送聊天消息
 * @param query 用户输入的问题
 * @param conversationId 会话ID（可选）
 * @param inputs 输入参数（可选）
 * @returns Promise<DifyChatResponse | null>
 */
export async function sendChatMessage(
  query: string, 
  conversationId?: string, 
  inputs: Record<string, any> = {}
): Promise<DifyChatResponse | null> {
  try {
    // 显示加载提示
    wx.showLoading({
      title: '发送中...',
      mask: true
    });

    const result = await wx.cloud.callFunction({
      name: 'dify-chat',
      data: {
        action: 'sendMessage',
        query: query,
        conversationId: conversationId,
        inputs: inputs
      }
    });

    wx.hideLoading();

    const response = result.result as ApiResponse<DifyChatResponse>;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '发送消息失败');
      return null;
    }
  } catch (error) {
    wx.hideLoading();
    handleError(error, '发送消息失败');
    return null;
  }
}

/**
 * 获取应用参数
 * @returns Promise<any | null>
 */
export async function getAppParameters(): Promise<any | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'dify-chat',
      data: {
        action: 'getParameters'
      }
    });

    const response = result.result as ApiResponse;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '获取应用参数失败');
      return null;
    }
  } catch (error) {
    handleError(error, '获取应用参数失败');
    return null;
  }
}

/**
 * 获取应用信息
 * @returns Promise<any | null>
 */
export async function getAppInfo(): Promise<any | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'dify-chat',
      data: {
        action: 'getInfo'
      }
    });

    const response = result.result as ApiResponse;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '获取应用信息失败');
      return null;
    }
  } catch (error) {
    handleError(error, '获取应用信息失败');
    return null;
  }
}

/**
 * 获取会话列表
 * @param limit 限制数量
 * @param lastId 最后一条记录ID
 * @returns Promise<{conversations: DifyConversation[], hasMore: boolean} | null>
 */
export async function getConversations(
  limit: number = 20, 
  lastId: string = ''
): Promise<{conversations: DifyConversation[], hasMore: boolean} | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'conversation-history',
      data: {
        action: 'getConversations',
        limit: limit,
        lastId: lastId
      }
    });

    const response = result.result as ApiResponse<{conversations: DifyConversation[], hasMore: boolean}>;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '获取会话列表失败');
      return null;
    }
  } catch (error) {
    handleError(error, '获取会话列表失败');
    return null;
  }
}

/**
 * 获取会话消息
 * @param conversationId 会话ID
 * @param limit 限制数量
 * @param firstId 第一条记录ID
 * @returns Promise<{messages: DifyMessage[], hasMore: boolean} | null>
 */
export async function getMessages(
  conversationId: string,
  limit: number = 20,
  firstId: string = ''
): Promise<{messages: DifyMessage[], hasMore: boolean} | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'conversation-history',
      data: {
        action: 'getMessages',
        conversationId: conversationId,
        limit: limit,
        firstId: firstId
      }
    });

    const response = result.result as ApiResponse<{messages: DifyMessage[], hasMore: boolean}>;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '获取会话消息失败');
      return null;
    }
  } catch (error) {
    handleError(error, '获取会话消息失败');
    return null;
  }
}

/**
 * 删除会话
 * @param conversationId 会话ID
 * @returns Promise<boolean>
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'conversation-history',
      data: {
        action: 'deleteConversation',
        conversationId: conversationId
      }
    });

    const response = result.result as ApiResponse;
    if (response.success) {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      return true;
    } else {
      handleError(response, '删除会话失败');
      return false;
    }
  } catch (error) {
    handleError(error, '删除会话失败');
    return false;
  }
}

/**
 * 重命名会话
 * @param conversationId 会话ID
 * @param name 新名称
 * @param autoGenerate 是否自动生成
 * @returns Promise<boolean>
 */
export async function renameConversation(
  conversationId: string, 
  name?: string, 
  autoGenerate: boolean = false
): Promise<boolean> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'conversation-history',
      data: {
        action: 'renameConversation',
        conversationId: conversationId,
        name: name,
        autoGenerate: autoGenerate
      }
    });

    const response = result.result as ApiResponse;
    if (response.success) {
      wx.showToast({
        title: '重命名成功',
        icon: 'success'
      });
      return true;
    } else {
      handleError(response, '重命名失败');
      return false;
    }
  } catch (error) {
    handleError(error, '重命名失败');
    return false;
  }
}

/**
 * 上传文件到 Dify
 * @param fileId 云存储文件ID
 * @param fileName 文件名
 * @param fileType 文件类型
 * @returns Promise<any | null>
 */
export async function uploadFileToDify(
  fileId: string, 
  fileName: string, 
  fileType: string
): Promise<any | null> {
  try {
    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    const result = await wx.cloud.callFunction({
      name: 'upload-file',
      data: {
        action: 'uploadToDify',
        fileId: fileId,
        fileName: fileName,
        fileType: fileType
      }
    });

    wx.hideLoading();

    const response = result.result as ApiResponse;
    if (response.success && response.data) {
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
      return response.data;
    } else {
      handleError(response, '文件上传失败');
      return null;
    }
  } catch (error) {
    wx.hideLoading();
    handleError(error, '文件上传失败');
    return null;
  }
}

/**
 * 语音转文字
 * @param fileId 云存储音频文件ID
 * @param fileName 文件名
 * @param fileType 文件类型
 * @returns Promise<{text: string} | null>
 */
export async function audioToText(
  fileId: string, 
  fileName: string, 
  fileType: string
): Promise<{text: string} | null> {
  try {
    wx.showLoading({
      title: '识别中...',
      mask: true
    });

    const result = await wx.cloud.callFunction({
      name: 'audio-to-text',
      data: {
        action: 'audioToText',
        fileId: fileId,
        fileName: fileName,
        fileType: fileType
      }
    });

    wx.hideLoading();

    const response = result.result as ApiResponse<{text: string}>;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '语音识别失败');
      return null;
    }
  } catch (error) {
    wx.hideLoading();
    handleError(error, '语音识别失败');
    return null;
  }
}

/**
 * 文字转语音
 * @param text 文字内容
 * @param messageId 消息ID（可选）
 * @returns Promise<{audio: string, contentType: string} | null>
 */
export async function textToAudio(
  text?: string, 
  messageId?: string
): Promise<{audio: string, contentType: string} | null> {
  try {
    wx.showLoading({
      title: '生成中...',
      mask: true
    });

    const result = await wx.cloud.callFunction({
      name: 'audio-to-text',
      data: {
        action: 'textToAudio',
        text: text,
        messageId: messageId
      }
    });

    wx.hideLoading();

    const response = result.result as ApiResponse<{audio: string, contentType: string}>;
    if (response.success && response.data) {
      return response.data;
    } else {
      handleError(response, '语音生成失败');
      return null;
    }
  } catch (error) {
    wx.hideLoading();
    handleError(error, '语音生成失败');
    return null;
  }
}

/**
 * 初始化云开发
 */
export function initCloudService(): void {
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    return;
  }

  wx.cloud.init({
    // 环境 ID，可以在云开发控制台获取
    // env: 'your-env-id',
    traceUser: true
  });
}

// 数据转换工具
export const DataConverter = {
  /**
   * 将 Dify 消息转换为前端消息格式
   * @param difyMessage Dify 消息
   * @returns 前端消息格式
   */
  convertDifyMessageToLocal(difyMessage: DifyMessage): any {
    return {
      id: difyMessage.id,
      type: 'ai',
      content: difyMessage.answer,
      timestamp: difyMessage.created_at * 1000, // 转换为毫秒
      workflow: [], // 这里可以根据需要添加工作流信息
      workflowExpanded: false,
      retriever_resources: difyMessage.retriever_resources || []
    };
  },

  /**
   * 将 Dify 会话转换为前端历史记录格式
   * @param difyConversation Dify 会话
   * @returns 前端历史记录格式
   */
  convertDifyConversationToLocal(difyConversation: DifyConversation): any {
    return {
      id: difyConversation.id,
      title: difyConversation.name || '新对话',
      preview: `会话创建于 ${new Date(difyConversation.created_at * 1000).toLocaleString()}`,
      time: this.formatTime(difyConversation.updated_at * 1000),
      messages: []
    };
  },

  /**
   * 格式化时间
   * @param timestamp 时间戳
   * @returns 格式化的时间字符串
   */
  formatTime(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}周前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  }
};
