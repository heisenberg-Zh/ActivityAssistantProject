// pages/participants/index.js
const { registrationAPI } = require('../../utils/api.js');
const { getAvatarColor, getNameInitial } = require('../../utils/formatter.js');

Page({
  data: {
    activityId: '',
    activityTitle: '',
    groupId: null,
    groupName: '',
    members: [],
    hasGroup: false,
    loading: true
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
  async loadMembers() {
    const { activityId, groupId } = this.data;

    if (!activityId) {
      wx.showToast({ title: '活动信息缺失', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '加载中...' });
      this.setData({ loading: true });

      // 从后端API获取该活动的报名记录
      const registrationsResult = await registrationAPI.getByActivity(activityId, {
        page: 0,
        size: 1000 // 获取所有报名记录
      });

      if (registrationsResult.code !== 0) {
        throw new Error(registrationsResult.message || '获取报名记录失败');
      }

      const allRegistrations = registrationsResult.data.content || registrationsResult.data || [];

      console.log('API返回的所有报名记录数量:', allRegistrations.length);

      // 筛选已通过的报名记录
      let activityRegs = allRegistrations.filter(r => {
        if (r.status !== 'approved') return false;
        // 如果有分组，只显示该分组的参与者
        if (groupId) {
          return r.groupId === groupId;
        }
        return true;
      });

      console.log('筛选后的已通过报名记录数量:', activityRegs.length);

      const members = activityRegs.map(reg => {
        const name = reg.name || '未知用户';

        return {
          id: reg.userId,
          name: name,
          avatar: `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`,
          initial: getNameInitial(name),
          bgColor: getAvatarColor(name),
          registeredAt: reg.registeredAt || reg.createdAt,
          groupId: reg.groupId
        };
      });

      this.setData({
        members,
        loading: false
      });

      wx.hideLoading();

      if (members.length === 0) {
        wx.showToast({ title: '暂无参与者', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载参与者列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 返回
  goBack() {
    const pages = getCurrentPages();

    if (pages.length > 1) {
      // 有上一页，返回上一页
      wx.navigateBack({ delta: 1 });
    } else {
      // 没有上一页，跳转到活动列表
      wx.switchTab({ url: '/pages/activities/list' });
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
