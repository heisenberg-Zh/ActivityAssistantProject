// pages/activities/detail.js
const { activities, participants } = require('../../utils/mock.js');

const extraDetail = {
  a1: {
    organizer: '张小北',
    deadline: '12月15日 17:00',
    addressDetail: '北京市朝阳区三里屯太古里南区',
    feeInfo: 'AA制，预计每人80-120元'
  },
  a2: {
    organizer: '李晓峰',
    deadline: '12月18日 12:00',
    addressDetail: '北京市海淀区知春路创新中心',
    feeInfo: '培训课程，免费参与'
  },
  a3: {
    organizer: '王晨',
    deadline: '12月19日 18:00',
    addressDetail: '北京密云山地公园集合点',
    feeInfo: 'AA制，含交通费用'
  }
};

const memberLibrary = participants.concat([
  { id: 'u5', name: '陈小雨', avatar: '/activityassistant_avatar_01.png' },
  { id: 'u6', name: '刘小宇', avatar: '/activityassistant_avatar_02.png' },
  { id: 'u7', name: '孙小果', avatar: '/activityassistant_avatar_03.png' },
  { id: 'u8', name: '周小安', avatar: '/activityassistant_avatar_04.png' }
]);

Page({
  data: { id: '', detail: {}, extra: {}, members: [], progress: 0 },

  onLoad(query) {
    const id = query.id || 'a1';
    const detail = activities.find(item => item.id === id) || activities[0];
    const extra = extraDetail[id] || extraDetail.a1;
    const members = memberLibrary.slice(0, 8);
    const progress = Math.min(100, Math.round((detail.joined / detail.total) * 100));
    this.setData({
      id,
      detail,
      extra: Object.assign({ organizerInitial: extra.organizer.slice(0, 1) }, extra),
      members,
      progress
    });
  },

  goRegister() {
    wx.navigateTo({ url: `/pages/registration/index?id=${this.data.detail.id}` });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  },

  onShare() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '已打开分享面板', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: this.data.detail.title,
      path: `/pages/activities/detail?id=${this.data.detail.id}`
    };
  },

  onShareTimeline() {
    return { title: this.data.detail.title };
  }
});