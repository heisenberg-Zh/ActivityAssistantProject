// pages/participants/index.js
const { activities, participants, registrations } = require('../../utils/mock.js');
const { getAvatarColor, getNameInitial } = require('../../utils/formatter.js');

Page({
  data: {
    activityId: '',
    activityTitle: '',
    groupId: null,
    groupName: '',
    members: [],
    hasGroup: false
  },

  onLoad(options) {
    const activityId = String(options.activityId || '').trim();
    const activityTitle = decodeURIComponent(options.activityTitle || '活动');
    const groupId = options.groupId || null;
    const groupName = options.groupName ? decodeURIComponent(options.groupName) : '';

    console.log('参与者列表页接收参数:', { activityId, groupId, groupName, activityTitle });

    this.setData({
      activityId,
      activityTitle,
      groupId,
      groupName,
      hasGroup: !!groupId
    });

    // 设置导航栏标题
    const title = groupId ? `${groupName} - 参与成员` : '参与成员';
    wx.setNavigationBarTitle({ title });

    this.loadMembers();
  },

  // 加载参与成员列表
  loadMembers() {
    const { activityId, groupId } = this.data;

    if (!activityId) {
      wx.showToast({ title: '活动信息缺失', icon: 'none' });
      return;
    }

    // 获取参与者列表
    let activityRegs = registrations.filter(r => {
      if (r.activityId !== activityId || r.status !== 'approved') return false;
      // 如果有分组，只显示该分组的参与者
      if (groupId) {
        return r.groupId === groupId;
      }
      return true;
    });

    console.log('找到的报名记录:', activityRegs.length);

    const members = activityRegs.map(reg => {
      const user = participants.find(p => p.id === reg.userId);
      const name = reg.name || user?.name || '未知用户';

      return {
        id: reg.userId,
        name: name,
        avatar: user?.avatar || `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`,
        initial: getNameInitial(name),
        bgColor: getAvatarColor(name),
        registeredAt: reg.registeredAt,
        groupId: reg.groupId
      };
    });

    this.setData({ members });

    if (members.length === 0) {
      wx.showToast({ title: '暂无参与者', icon: 'none' });
    }
  },

  // 返回
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  // 分享
  onShareAppMessage() {
    const { activityTitle, activityId, groupId, groupName } = this.data;
    let title = `${activityTitle} - 参与成员`;
    if (groupName) {
      title = `${activityTitle} - ${groupName} 参与成员`;
    }

    let path = `/pages/participants/index?activityId=${activityId}&activityTitle=${encodeURIComponent(activityTitle)}`;
    if (groupId) {
      path += `&groupId=${groupId}&groupName=${encodeURIComponent(groupName)}`;
    }

    return {
      title,
      path
    };
  }
});
