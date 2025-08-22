// pages/chat/index.ts

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  workflow?: WorkflowStep[];
  workflowExpanded?: boolean;
  timestamp: number;
}

interface WorkflowStep {
  name: string;
  status: 'completed' | 'running' | 'pending';
}

interface HistoryItem {
  id: string;
  title: string;
  preview: string;
  time: string;
  messages: Message[];
}

Page({
  data: {
    // 当前模型
    currentModel: 'PoultryGPT-Turbo',
    
    // 消息列表
    messages: [] as Message[],
    
    // 输入框内容
    inputValue: '',
    
    // 打字效果
    isTyping: false,
    
    // 滚动位置
    scrollIntoView: '',
    
    // 模型选择器
    showModelSheet: false,
    modelOptions: [
      { label: 'PoultryGPT-Turbo', value: 'PoultryGPT-Turbo' },
      { label: 'PoultryGPT-4', value: 'PoultryGPT-4' },
      { label: 'Dify Workflow', value: 'Dify Workflow' }
    ],
    
    // 操作选择器
    showActionOptions: false,
    actionOptions: [
      { label: '文件', value: 'file', icon: '📁' },
      { label: '照片', value: 'photo', icon: '🖼️' },
      { label: '拍照', value: 'camera', icon: '📷' }
    ],
    
    // 侧边栏
    showSidebar: false,
    
    // 搜索
    searchValue: '',
    filteredHistory: [] as HistoryItem[],
    
    // 历史记录
    historyList: [
      {
        id: 'item1',
        title: '肉鸡养殖基础咨询',
        preview: '用户: 请问肉鸡养殖的温度要求是多少？',
        time: '今天 14:32',
        messages: []
      },
      {
        id: 'item2',
        title: '疫苗接种计划制定',
        preview: '用户: 能帮我制定一个完整的肉鸡疫苗接种时间表吗？',
        time: '昨天 16:45',
        messages: []
      },
      {
        id: 'item3',
        title: '30日龄饲料配方优化',
        preview: '用户: 我的肉鸡现在30日龄，体重偏轻，怎么调整饲料配方？',
        time: '2天前',
        messages: []
      },
      {
        id: 'item4',
        title: '鸡舍通风系统故障',
        preview: '用户: 鸡舍通风不好，鸡群出现呼吸道症状怎么办？',
        time: '3天前',
        messages: []
      },
      {
        id: 'item5',
        title: '球虫病预防措施',
        preview: '用户: 最近鸡群有球虫病，如何预防和治疗？',
        time: '1周前',
        messages: []
      },
      {
        id: 'item6',
        title: '养殖成本核算分析',
        preview: '用户: 请帮我分析一下1000只肉鸡的养殖成本。',
        time: '2周前',
        messages: []
      }
    ] as HistoryItem[],
    
    // 滑动操作
    swipeActions: [
      {
        text: '重命名',
        style: 'background: #f59e0b; color: white;',
        key: 'rename'
      },
      {
        text: '删除',
        style: 'background: #dc2626; color: white;',
        key: 'delete'
      }
    ]
  },

  onLoad() {
    // 获取系统信息
    this.getSystemInfo();
    
    // 加载历史记录
    this.loadHistoryList();
    
    // 初始化示例对话
    this.initSampleChat();
  },

  // 获取系统信息
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  // 加载历史记录
  loadHistoryList() {
    // 这里可以从本地存储或服务器加载历史记录
    // 目前使用示例数据
  },

  // 初始化示例对话
  initSampleChat() {
    const sampleMessages: Message[] = [
      {
        id: 'user-1',
        type: 'user',
        content: '你好，我想了解一下肉鸡养殖的基本要求有哪些？',
        timestamp: Date.now() - 60000
      },
      {
        id: 'ai-1',
        type: 'ai',
        content: `<h2>🐔 肉鸡养殖的基本要求</h2>
<p>肉鸡养殖的基本要求主要包括以下几个关键方面：</p>
<h3>🏠 1. 鸡舍环境</h3>
<ul>
<li><strong>温度控制</strong>：保持适宜的温度（18-25℃）</li>
<li><strong>湿度管理</strong>：控制湿度在50-70%之间</li>
<li><strong>通风系统</strong>：确保良好的空气流通</li>
</ul>
<h3>🍽️ 2. 饲料管理</h3>
<ul>
<li>提供 <strong>营养均衡</strong> 的饲料配方</li>
<li>实行定时定量喂养制度</li>
<li>根据生长阶段调整饲料结构</li>
</ul>
<h3>💧 3. 饮水系统</h3>
<ul>
<li>确保清洁充足的饮水供应</li>
<li>定期清洗和消毒饮水设备</li>
<li>监测水质安全</li>
</ul>
<h3>🛡️ 4. 疫病防控</h3>
<ul>
<li>制定完善的免疫程序</li>
<li>建立严格的生物安全措施</li>
<li>定期健康检查</li>
</ul>
<h3>📏 5. 密度控制</h3>
<ul>
<li>合理安排饲养密度</li>
<li>避免过度拥挤导致的应激</li>
<li>根据鸡舍面积科学配置</li>
</ul>
<blockquote>
<p><strong>提示</strong>：以上各个方面相互关联，需要综合考虑和统一管理。</p>
</blockquote>
<p>您想了解哪个方面的详细信息呢？</p>`,
        workflow: [
          { name: '问题分析', status: 'completed' },
          { name: '知识库检索', status: 'completed' },
          { name: '专业知识匹配', status: 'completed' },
          { name: '内容生成', status: 'completed' },
          { name: '格式化输出', status: 'completed' }
        ],
        workflowExpanded: true,
        timestamp: Date.now()
      }
    ];
    
    this.setData({
      messages: sampleMessages
    }, () => {
      this.scrollToBottom();
    });
  },

  // 输入框变化
  onInputChange(e: any) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 发送消息
  sendMessage() {
    const { inputValue } = this.data;
    if (!inputValue.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputValue: '',
      isTyping: true
    }, () => {
      this.scrollToBottom();
    });

    // 模拟AI回复
    setTimeout(() => {
      this.generateAIResponse(userMessage.content);
    }, 1000);
  },

  // 生成AI回复
  generateAIResponse(userInput: string) {
    let workflow: WorkflowStep[] = [];
    let content = '';

    // 根据用户输入选择不同的工作流和回复
    if (userInput.includes('病') || userInput.includes('症状') || userInput.includes('治疗')) {
      workflow = [
        { name: '症状识别', status: 'completed' },
        { name: '病因分析', status: 'completed' },
        { name: '诊断匹配', status: 'completed' },
        { name: '治疗方案生成', status: 'completed' },
        { name: '风险评估', status: 'completed' },
        { name: '预防建议', status: 'completed' }
      ];
      content = this.getDiseaseResponse();
    } else if (userInput.includes('饲料') || userInput.includes('配方') || userInput.includes('营养')) {
      workflow = [
        { name: '需求分析', status: 'completed' },
        { name: '生长阶段判断', status: 'completed' },
        { name: '营养计算', status: 'completed' },
        { name: '配方优化', status: 'completed' },
        { name: '成本评估', status: 'completed' }
      ];
      content = this.getFeedResponse();
    } else {
      workflow = [
        { name: '问题分析', status: 'completed' },
        { name: '知识库检索', status: 'completed' },
        { name: '专业知识匹配', status: 'completed' },
        { name: '内容生成', status: 'completed' },
        { name: '格式化输出', status: 'completed' }
      ];
      content = this.getGeneralResponse();
    }

    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content,
      workflow,
      workflowExpanded: true,
      timestamp: Date.now()
    };

    this.setData({
      messages: [...this.data.messages, aiMessage],
      isTyping: false
    }, () => {
      this.scrollToBottom();
    });
  },

  // 获取疾病相关回复
  getDiseaseResponse() {
    return `<h2>🏥 家禽疾病诊断与治疗</h2>
<p>根据您的描述，我为您提供以下建议：</p>
<h3>📋 常见症状分析</h3>
<ul>
<li><strong>呼吸道症状</strong>：咳嗽、喘息、流鼻涕</li>
<li><strong>消化道症状</strong>：腹泻、食欲不振、消瘦</li>
<li><strong>神经症状</strong>：歪脖、转圈、瘫痪</li>
</ul>
<h3>💊 基础治疗原则</h3>
<ol>
<li><strong>隔离病鸡</strong>：防止疫情扩散</li>
<li><strong>对症治疗</strong>：根据症状选择合适药物</li>
<li><strong>支持疗法</strong>：补充电解质和维生素</li>
<li><strong>环境改善</strong>：调整温湿度和通风</li>
</ol>
<blockquote>
<p>⚠️ <strong>重要提醒</strong>：严重病例请及时联系兽医专业人士！</p>
</blockquote>
<p>具体需要什么帮助吗？</p>`;
  },

  // 获取饲料相关回复
  getFeedResponse() {
    return `<h2>🌾 饲料配方与营养管理</h2>
<p>针对您的饲料问题，我提供以下专业建议：</p>
<h3>📊 营养需求表</h3>
<table>
<thead>
<tr>
<th>生长阶段</th>
<th>蛋白质(%)</th>
<th>能量(MJ/kg)</th>
<th>赖氨酸(%)</th>
</tr>
</thead>
<tbody>
<tr>
<td>0-3周</td>
<td>22-24</td>
<td>12.5-13.0</td>
<td>1.35-1.40</td>
</tr>
<tr>
<td>4-6周</td>
<td>20-22</td>
<td>13.0-13.2</td>
<td>1.20-1.25</td>
</tr>
<tr>
<td>7周-出栏</td>
<td>18-20</td>
<td>13.2-13.4</td>
<td>1.10-1.15</td>
</tr>
</tbody>
</table>
<h3>🥗 配方要点</h3>
<ul>
<li><strong>玉米</strong>：55-65%（主要能量来源）</li>
<li><strong>豆粕</strong>：20-30%（蛋白质来源）</li>
<li><strong>麸皮</strong>：3-8%（调节纤维）</li>
<li><strong>预混料</strong>：4-5%（维生素矿物质）</li>
</ul>
<p>需要具体的配方计算吗？</p>`;
  },

  // 获取通用回复
  getGeneralResponse() {
    return `<h2>🐔 家禽养殖专业建议</h2>
<p>感谢您的咨询！我为您提供以下专业指导：</p>
<h3>🎯 核心管理要点</h3>
<ol>
<li><strong>环境控制</strong>
<ul>
<li>温度：根据日龄调整（首日35°C，每周降2-3°C）</li>
<li>湿度：保持60-70%</li>
<li>光照：合理的光照程序</li>
</ul>
</li>
<li><strong>营养管理</strong>
<ul>
<li>分阶段饲喂</li>
<li>清洁饮水</li>
<li>定期营养评估</li>
</ul>
</li>
<li><strong>健康监测</strong>
<ul>
<li>日常观察</li>
<li>定期体重监测</li>
<li>预防免疫</li>
</ul>
</li>
</ol>
<h3>📈 效益提升建议</h3>
<blockquote>
<p>💡 <strong>小贴士</strong>：记录详细的生产数据，有助于持续改进养殖效果。</p>
</blockquote>
<p>还有其他具体问题需要解答吗？</p>`;
  },

  // 滚动到底部
  scrollToBottom() {
    const lastIndex = this.data.messages.length - 1;
    if (lastIndex >= 0) {
      this.setData({
        scrollIntoView: `msg-${this.data.messages[lastIndex].id}`
      });
    }
  },

  // 显示模型选择器
  showModelSelector() {
    this.setData({
      showModelSheet: true
    });
  },

  // 隐藏模型选择器
  hideModelSelector() {
    this.setData({
      showModelSheet: false
    });
  },

  // 选择模型
  onModelSelect(e: any) {
    const { value } = e.detail;
    this.setData({
      currentModel: value,
      showModelSheet: false
    });
    
    wx.showToast({
      title: `已切换到 ${value}`,
      icon: 'success'
    });
  },

  // 显示操作选择器
  showActionSheet() {
    this.setData({
      showActionOptions: true
    });
  },

  // 隐藏操作选择器
  hideActionSheet() {
    this.setData({
      showActionOptions: false
    });
  },

  // 选择操作
  onActionSelect(e: any) {
    const { value } = e.detail;
    this.setData({
      showActionOptions: false
    });

    switch (value) {
      case 'file':
        this.chooseFile();
        break;
      case 'photo':
        this.choosePhoto();
        break;
      case 'camera':
        this.takePhoto();
        break;
    }
  },

  // 选择文件
  chooseFile() {
    wx.showToast({
      title: '文件选择功能开发中',
      icon: 'none'
    });
  },

  // 选择照片
  choosePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        // 处理图片上传
        wx.showToast({
          title: '图片上传功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 拍照
  takePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        // 处理图片上传
        wx.showToast({
          title: '图片上传功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 切换侧边栏
  toggleSidebar() {
    this.setData({
      showSidebar: !this.data.showSidebar
    });
  },

  // 隐藏侧边栏
  hideSidebar() {
    this.setData({
      showSidebar: false
    });
  },

  // 防止点击侧边栏内容关闭
  preventClose() {
    // 空方法，用于阻止事件冒泡
  },

  // 搜索输入处理
  onSearchInput(e: any) {
    const searchValue = e.detail.value;
    this.setData({
      searchValue
    });
    this.filterHistory(searchValue);
  },

  // 搜索确认处理
  onSearchConfirm(e: any) {
    this.filterHistory(e.detail.value);
  },

  // 过滤历史记录
  filterHistory(keyword: string) {
    if (!keyword.trim()) {
      this.setData({
        filteredHistory: []
      });
      return;
    }

    const lowerKeyword = keyword.toLowerCase();
    const filtered = this.data.historyList.filter(item => 
      item.title.toLowerCase().includes(lowerKeyword) ||
      item.preview.toLowerCase().includes(lowerKeyword)
    );

    this.setData({
      filteredHistory: filtered
    });
  },

  // 侧边栏显示状态变化
  onSidebarChange(e: any) {
    this.setData({
      showSidebar: e.detail.visible
    });
  },



  // 打开历史记录
  openHistory(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({
      title: `打开对话 ${id}`,
      icon: 'success'
    });
    
    this.setData({
      showSidebar: false
    });
  },

  // 切换工作流展开状态
  toggleWorkflow(e: any) {
    const { id } = e.currentTarget.dataset;
    const messages = this.data.messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          workflowExpanded: !msg.workflowExpanded
        };
      }
      return msg;
    });
    
    this.setData({
      messages
    });
  },

  // 新建对话
  newChat() {
    wx.showModal({
      title: '新建对话',
      content: '确定要新建对话吗？当前对话内容将被清空。',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [],
            inputValue: ''
          });
          
          wx.showToast({
            title: '已新建对话',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转到设置页面
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/index'
    });
  },

  // 历史记录页面已删除，现在只使用侧边栏显示历史记录
});
