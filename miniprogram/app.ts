// app.ts

interface AppGlobalData {
  userInfo?: WechatMiniprogram.UserInfo;
  systemInfo?: WechatMiniprogram.SystemInfo;
  currentConversation?: any;
  statusBarHeight?: number;
}

interface IAppMethods {
  getSystemInfo(): void;
  initUserSettings(): void;
  initCloudService(): void;
}

App<IAppOption & IAppMethods>({
  globalData: {
    userInfo: undefined,
    systemInfo: undefined,
    currentConversation: undefined,
    statusBarHeight: undefined
  } as AppGlobalData,
  
  onLaunch() {
    console.log('PoultryGPT 小程序启动');
    
    // 初始化云开发
    this.initCloudService();
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 初始化用户设置
    this.initUserSettings();
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 登录
    wx.login({
      success: res => {
        console.log('登录成功，code:', res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
      fail: err => {
        console.error('登录失败:', err);
      }
    });
  },

  onShow() {
    console.log('PoultryGPT 小程序显示');
  },

  onHide() {
    console.log('PoultryGPT 小程序隐藏');
  },

  onError(error: string) {
    console.error('PoultryGPT 小程序错误:', error);
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      (this.globalData as AppGlobalData).systemInfo = systemInfo;
      
      // 设置状态栏高度CSS变量
      const statusBarHeight = systemInfo.statusBarHeight || 20;
      
      // 设置全局CSS变量
      try {
        const app = getApp();
        if (app.globalData) {
          (app.globalData as AppGlobalData).statusBarHeight = statusBarHeight;
        }
      } catch (e) {
        console.warn('设置状态栏高度失败:', e);
      }
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // 初始化用户设置
  initUserSettings() {
    try {
      const userSettings = wx.getStorageSync('userSettings');
      if (!userSettings) {
        // 设置默认用户设置
        const defaultSettings = {
          theme: 'light',
          language: 'zh-CN'
        };
        wx.setStorageSync('userSettings', defaultSettings);
      }
    } catch (error) {
      console.error('初始化用户设置失败:', error);
    }
  },

  // 全局错误处理
  onUnhandledRejection(res: WechatMiniprogram.OnUnhandledRejectionCallbackResult) {
    console.error('未处理的Promise拒绝:', res.reason);
  },

  // 全局页面未找到处理
  onPageNotFound(res: WechatMiniprogram.OnPageNotFoundCallbackResult) {
    console.error('页面未找到:', res);
    // 重定向到首页
    wx.reLaunch({
      url: '/pages/chat/index'
    });
  },

  // 初始化云开发
  initCloudService() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    try {
      wx.cloud.init({
        env: "poultrygpt-6gmda5fva5c75a84", 
        traceUser: true
      });
      console.log('云开发初始化成功');
    } catch (error) {
      console.error('云开发初始化失败:', error);
    }
  }
})