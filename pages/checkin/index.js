// pages/checkin/index.js
const { activities } = require('../../utils/mock.js');

Page({
  data: {
    activity: activities[0],
    checked: true,
    checkTime: '18:15',
    currentAddr: '北京市朝阳区三里屯太古里南区',
    withinRange: true,
    records: [
      { id: 'u1', name: '张小北', role: '组织者', checked: true, time: '18:05', avatar: '/activityassistant_avatar_01.png' },
      { id: 'u2', name: '李小雅', checked: true, time: '18:12', avatar: '/activityassistant_avatar_02.png' },
      { id: 'u3', name: '王小文', checked: true, time: '18:15', avatar: '/activityassistant_avatar_03.png' },
      { id: 'u4', name: '赵小海', checked: false, time: '', avatar: '/activityassistant_avatar_04.png' }
    ],
    checkedCount: 3,
    progress: 37.5
  },

  doCheckin() {
    this.setData({ checked: true, checkTime: '18:15' });
    wx.showToast({ title: '签到成功' });
  },

  share() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '已打开分享面板', icon: 'none' });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});
