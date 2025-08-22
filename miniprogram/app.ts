// app.ts

interface AppGlobalData {
  userInfo?: WechatMiniprogram.UserInfo;
  systemInfo?: WechatMiniprogram.SystemInfo;
  currentConversation?: any;
}

App<IAppOption>({
  globalData: {} as AppGlobalData,
  
  onLaunch() {
    console.log('PoultryGPT 小程序启动');
    
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
      this.globalData.systemInfo = systemInfo;
      
      // 设置状态栏高度CSS变量
      const statusBarHeight = systemInfo.statusBarHeight || 20;
      wx.nextTick(() => {
        const query = wx.createSelectorQuery();
        query.select('page').exec((res) => {
          if (res[0]) {
            res[0].node.style.setProperty('--status-bar-height', statusBarHeight + 'px');
          }
        });
      });
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
  }
})