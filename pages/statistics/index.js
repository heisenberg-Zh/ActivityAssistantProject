// pages/statistics/index.js
const { activities } = require('../../utils/mock.js');

const ranges = [
  { key: 'week', label: '本周', active: true },
  { key: 'month', label: '本月', active: false },
  { key: 'year', label: '本年', active: false }
];

const overview = [
  { label: '创建活动', value: 24, icon: '活', bg: '#dbeafe', color: '#1d4ed8', trend: '+12%' },
  { label: '参与人数', value: 186, icon: '人', bg: '#dcfce7', color: '#047857', trend: '+8%' },
  { label: '签到率', value: '92%', icon: '签', bg: '#fde68a', color: '#b45309', trend: '+5%' },
  { label: '满意度', value: '4.8', icon: '评', bg: '#ede9fe', color: '#6d28d9', trend: '+3%' }
];

const sources = [
  { name: '微信群', percent: 55 },
  { name: '朋友圈', percent: 30 },
  { name: '二维码', percent: 15 }
];

const hotActivities = activities.map((item, index) => Object.assign({}, item, {
  joined: item.joined,
  bg: index === 0 ? 'linear-gradient(135deg,#f472b6,#ef4444)' : (index === 1 ? 'linear-gradient(135deg,#60a5fa,#6366f1)' : 'linear-gradient(135deg,#34d399,#14b8a6)')
}));

Page({
  data: {
    ranges,
    overview,
    chart: [40, 60, 80, 50, 35, 65, 45],
    sources,
    hot: hotActivities
  },

  onRangeTap(e) {
    const key = e.currentTarget.dataset.key;
    const updated = this.data.ranges.map(item => Object.assign({}, item, { active: item.key === key }));
    this.setData({ ranges: updated });
    wx.showToast({ title: `已切换到${updated.find(item => item.active).label}`, icon: 'none' });
  },

  shareNow() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '已打开分享面板', icon: 'none' });
  },

  copyLink() {
    wx.setClipboardData({ data: 'https://example.com/statistics', success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) });
  },

  makeImage() {
    wx.showToast({ title: '正在生成图片', icon: 'none' });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});