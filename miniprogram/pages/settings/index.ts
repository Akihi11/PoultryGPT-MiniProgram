// pages/settings/index.ts

interface LanguageOption {
  label: string;
  value: string;
}

interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
}

Page({
  data: {
    // 当前主题
    currentTheme: 'light' as 'light' | 'dark',
    
    // 当前语言
    currentLanguage: 'zh-CN',
    currentLanguageLabel: '简体中文',
    selectedLanguage: 'zh-CN',
    
    // 语言选项
    languageOptions: [
      { label: '简体中文', value: 'zh-CN' },
      { label: '繁體中文', value: 'zh-TW' },
      { label: 'English', value: 'en-US' },
      { label: '日本語', value: 'ja-JP' },
      { label: '한국어', value: 'ko-KR' }
    ] as LanguageOption[],
    
    // 弹窗状态
    showLanguageModal: false,
    showLogoutDialog: false,
    showAboutModal: false
  },

  onLoad() {
    // 获取系统信息
    this.getSystemInfo();
    
    // 加载用户设置
    this.loadUserSettings();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 获取系统信息
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  // 加载用户设置
  loadUserSettings() {
    try {
      const settings = wx.getStorageSync('userSettings') as UserSettings;
      if (settings) {
        const { theme, language } = settings;
        const languageOption = this.data.languageOptions.find(opt => opt.value === language);
        
        this.setData({
          currentTheme: theme || 'light',
          currentLanguage: language || 'zh-CN',
          currentLanguageLabel: languageOption?.label || '简体中文',
          selectedLanguage: language || 'zh-CN'
        });
        
        // 应用主题
        this.applyTheme(theme || 'light');
      }
    } catch (error) {
      console.log('加载用户设置失败:', error);
    }
  },

  // 保存用户设置
  saveUserSettings() {
    try {
      const settings: UserSettings = {
        theme: this.data.currentTheme,
        language: this.data.currentLanguage
      };
      wx.setStorageSync('userSettings', settings);
    } catch (error) {
      console.log('保存用户设置失败:', error);
    }
  },

  // 主题变化
  onThemeChange(e: any) {
    const theme = e.detail.value as 'light' | 'dark';
    this.setData({
      currentTheme: theme
    });
    
    this.applyTheme(theme);
    this.saveUserSettings();
  },

  // 应用主题
  applyTheme(theme: 'light' | 'dark') {
    // 这里可以通过修改页面class或全局变量来应用主题
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (theme === 'dark') {
      // 添加深色主题类
      console.log('应用深色主题');
      // 可以通过设置全局变量或CSS变量来应用主题
    } else {
      // 应用浅色主题
      console.log('应用浅色主题');
    }
  },

  // 打开账号管理
  openAccountManagement() {
    wx.showToast({
      title: '账号管理功能开发中',
      icon: 'none'
    });
  },

  // 打开语言设置
  openLanguageSettings() {
    this.setData({
      showLanguageModal: true
    });
  },

  // 语言弹窗显示状态变化
  onLanguageModalChange(e: any) {
    this.setData({
      showLanguageModal: e.detail.visible
    });
  },

  // 隐藏语言选择弹窗
  hideLanguageModal() {
    this.setData({
      showLanguageModal: false
    });
  },

  // 选择语言
  selectLanguage(e: any) {
    const { value, label } = e.currentTarget.dataset;
    
    // 直接应用语言设置
    this.setData({
      currentLanguage: value,
      currentLanguageLabel: label,
      selectedLanguage: value,
      showLanguageModal: false  // 立即关闭弹窗
    });
    
    // 保存设置
    this.saveUserSettings();
    
    // 应用语言设置
    this.applyLanguage(value);
  },

  // 确认语言更改（保留函数但不再使用）
  confirmLanguageChange() {
    // 这个函数现在不再需要，但保留以防其他地方有引用
    console.log('confirmLanguageChange 已弃用，语言选择现在是直接生效的');
  },

  // 应用语言设置
  applyLanguage(language: string) {
    // 这里可以实现国际化逻辑
    console.log('应用语言设置:', language);
    
    // 可以通过事件通知其他页面更新语言
    wx.$emit && wx.$emit('languageChange', language);
  },

  // 打开关于页面
  openAbout() {
    this.setData({
      showAboutModal: true
    });
  },

  // 关于弹窗显示状态变化
  onAboutModalChange(e: any) {
    this.setData({
      showAboutModal: e.detail.visible
    });
  },

  // 隐藏关于弹窗
  hideAboutModal() {
    this.setData({
      showAboutModal: false
    });
  },

  // 打开GitHub
  openGitHub() {
    wx.showModal({
      title: '访问GitHub',
      content: '即将跳转到GitHub页面，是否继续？',
      success: (res) => {
        if (res.confirm) {
          // 小程序中不能直接打开外部链接，可以复制链接到剪贴板
          wx.setClipboardData({
            data: 'https://github.com/poultry-gpt',
            success: () => {
              wx.showToast({
                title: 'GitHub链接已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 显示退出登录确认
  showLogoutConfirm() {
    this.setData({
      showLogoutDialog: true
    });
  },

  // 隐藏退出登录确认
  hideLogoutConfirm() {
    this.setData({
      showLogoutDialog: false
    });
  },

  // 确认退出登录
  confirmLogout() {
    // 清除用户数据
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('authToken');
      // 保留用户设置
    } catch (error) {
      console.log('清除用户数据失败:', error);
    }
    
    this.setData({
      showLogoutDialog: false
    });
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 2000
    });
    
    // 这里可以跳转到登录页面或重置应用状态
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/chat/index'
      });
    }, 2000);
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'PoultryGPT - 专业的家禽养殖助手',
      path: '/pages/chat/index',
      imageUrl: '/images/share-cover.jpg'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'PoultryGPT - 专业的家禽养殖助手',
      imageUrl: '/images/share-cover.jpg'
    };
  }
});
