// pages/messages/index.js
const notification = require('../../utils/notification.js');

// 示例假数据（当本地没有消息时显示）
const messageData = [
  {
    id: 'm1',
    title: '系统通知',
    time: '2分钟前',
    content: '欢迎使用活动助手！您已成功注册，现在可以开始创建和参与精彩活动了。',
    category: 'system',
    iconText: '铃',
    iconBg: '#DBEAFE',
    iconColor: '#2563eb',
    tags: [
      { name: '系统', bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' },
      { name: '未读', bg: '#ef4444', color: '#ffffff' }
    ]
  },
  {
    id: 'm2',
    title: '活动提醒',
    time: '1小时前',
    content: '您参与的活动“产品设计分享会”将在2小时后开始，请提前做好准备。',
    category: 'activity',
    iconText: '约',
    iconBg: '#DCFCE7',
    iconColor: '#047857',
    tags: [
      { name: '活动', bg: 'rgba(16,185,129,0.15)', color: '#047857' },
      { name: '未读', bg: '#ef4444', color: '#ffffff' }
    ]
  },
  {
    id: 'm3',
    title: '报名成功',
    time: '今天 10:20',
    content: '您已成功报名“周末聚餐活动”，期待与您相见。',
    category: 'signup',
    iconText: '报',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    tags: [
      { name: '报名', bg: 'rgba(234,179,8,0.18)', color: '#B45309' },
      { name: '已读', bg: '#e5e7eb', color: '#4b5563' }
    ]
  },
  {
    id: 'm4',
    title: '签到提醒',
    time: '今天 09:00',
    content: '请在18:00前到达签到地点“海底捞火锅（朝阳店）”。',
    category: 'activity',
    iconText: '签',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    tags: [
      { name: '签到', bg: 'rgba(99,102,241,0.18)', color: '#4338CA' },
      { name: '未读', bg: '#ef4444', color: '#ffffff' }
    ]
  },
  {
    id: 'm5',
    title: '活动变更',
    time: '昨天',
    content: '您创建的活动“周末登山活动”时间调整为12月20日 08:00，请及时通知参与者。',
    category: 'activity',
    iconText: '变',
    iconBg: '#FEE2E2',
    iconColor: '#B91C1C',
    tags: [
      { name: '变更', bg: 'rgba(239,68,68,0.15)', color: '#B91C1C' },
      { name: '已读', bg: '#e5e7eb', color: '#4b5563' }
    ]
  },
  {
    id: 'm6',
    title: '活动评价',
    time: '2天前',
    content: '活动“技术分享会”已结束，请为本次活动进行评价，帮助我们改进服务质量。',
    category: 'activity',
    iconText: '评',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    tags: [
      { name: '评价', bg: 'rgba(234,179,8,0.18)', color: '#B45309' },
      { name: '已读', bg: '#e5e7eb', color: '#4b5563' }
    ]
  },
  {
    id: 'm7',
    title: '新功能上线',
    time: '3天前',
    content: '活动助手新增数据统计功能，现在可以查看详细的活动数据分析报告。',
    category: 'system',
    iconText: '新',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    tags: [
      { name: '功能', bg: 'rgba(99,102,241,0.18)', color: '#4338CA' },
      { name: '已读', bg: '#e5e7eb', color: '#4b5563' }
    ]
  }
];

Page({
  data: {
    filters: [
      { key: 'all', name: '全部', active: true },
      { key: 'publish', name: '发布通知', active: false },
      { key: 'system', name: '系统通知', active: false },
      { key: 'activity', name: '活动通知', active: false },
      { key: 'signup', name: '报名通知', active: false }
    ],
    activeFilter: 'all',
    allMessages: [],
    messages: []
  },

  onLoad() {
    this.loadMessages();
  },

  onShow() {
    this.loadMessages();
  },

  // 加载消息列表
  loadMessages() {
    const notifications = notification.getAllNotifications();

    // 转换为页面所需的格式
    const formattedMessages = notifications.map(notif => {
      let category = 'system';
      let iconText = '消';
      let iconBg = '#DBEAFE';
      let iconColor = '#2563eb';
      let tags = [];

      // 根据消息类型设置样式
      if (notif.type === 'publish_success') {
        category = 'publish';
        iconText = '发';
        iconBg = '#DCFCE7';
        iconColor = '#047857';
        tags.push({ name: '发布成功', bg: 'rgba(16,185,129,0.15)', color: '#047857' });
      } else if (notif.type === 'publish_failed') {
        category = 'publish';
        iconText = '失';
        iconBg = '#FEE2E2';
        iconColor: '#B91C1C';
        tags.push({ name: '发布失败', bg: 'rgba(239,68,68,0.15)', color: '#B91C1C' });
      } else if (notif.type === 'activity_reminder') {
        category = 'activity';
        iconText = '约';
        iconBg = '#DCFCE7';
        iconColor = '#047857';
        tags.push({ name: '活动提醒', bg: 'rgba(16,185,129,0.15)', color: '#047857' });
      } else if (notif.type === 'system') {
        category = 'system';
        iconText = '铃';
        iconBg = '#DBEAFE';
        iconColor = '#2563eb';
        tags.push({ name: '系统通知', bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' });
      }

      // 添加已读/未读标签
      if (notif.isRead) {
        tags.push({ name: '已读', bg: '#e5e7eb', color: '#4b5563' });
      } else {
        tags.push({ name: '未读', bg: '#ef4444', color: '#ffffff' });
      }

      return {
        id: notif.id,
        title: notif.title,
        time: this.formatTime(notif.createdAt),
        content: notif.content,
        category,
        iconText,
        iconBg,
        iconColor,
        tags,
        activityId: notif.activityId
      };
    });

    // 如果没有消息，使用示例数据
    const messagesToDisplay = formattedMessages.length > 0 ? formattedMessages : messageData;

    this.setData({
      allMessages: messagesToDisplay,
      messages: messagesToDisplay
    });

    this.updateMessages(this.data.activeFilter);
  },

  // 格式化时间
  formatTime(isoString) {
    const now = new Date();
    const date = new Date(isoString);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 1) return '今天';
    if (days < 2) return '昨天';
    if (days < 7) return `${days}天前`;

    // 超过7天显示具体日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeFilter) {
      return;
    }
    this.updateMessages(key);
  },

  updateMessages(activeKey) {
    const messages = this.data.allMessages.filter(item => activeKey === 'all' || item.category === activeKey);
    const filters = this.data.filters.map(filter => Object.assign({}, filter, { active: filter.key === activeKey }));
    this.setData({ messages, filters, activeFilter: activeKey });

    // 更新未读消息数量（可选，用于显示在 tabBar 上）
    const unreadCount = notification.getUnreadCount();
    if (unreadCount > 0) {
      wx.setTabBarBadge({
        index: 3, // 假设消息中心是第4个tab（索引从0开始）
        text: String(unreadCount)
      });
    } else {
      wx.removeTabBarBadge({ index: 3 });
    }
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});