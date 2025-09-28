// pages/messages/index.js
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
      { key: 'system', name: '系统通知', active: false },
      { key: 'activity', name: '活动通知', active: false },
      { key: 'signup', name: '报名通知', active: false }
    ],
    activeFilter: 'all',
    allMessages: messageData,
    messages: []
  },

  onLoad() {
    this.updateMessages('all');
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
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});