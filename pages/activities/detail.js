// pages/activities/detail.js
const { activities, participants, registrations } = require('../../utils/mock.js');
const { activityAPI } = require('../../utils/api.js');
const {
  formatMoney,
  formatParticipants,
  formatActivityStatus,
  getNameInitial,
  getAvatarColor
} = require('../../utils/formatter.js');
const { formatDateCN, getRelativeTime } = require('../../utils/datetime.js');
const { openMapNavigation } = require('../../utils/location.js');

Page({
  data: {
    id: '',
    detail: {},
    organizer: {},
    members: [],
    progress: 0,
    feeInfo: '',
    statusInfo: {},
    canRegister: true,
    canCheckin: false,
    isRegistered: false,
    loading: true
  },

  onLoad(query) {
    const id = query.id || 'a1';
    this.setData({ id });
    this.loadActivityDetail(id);
  },

  // 加载活动详情
  async loadActivityDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' });

      const detail = activities.find(item => item.id === id);
      if (!detail) {
        wx.hideLoading();
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }

      // 获取组织者信息
      const organizer = participants.find(p => p.id === detail.organizerId) || {
        id: detail.organizerId,
        name: detail.organizerName,
        avatar: ''
      };

      // 组装组织者展示信息
      const organizerInfo = {
        ...organizer,
        initial: getNameInitial(organizer.name),
        bgColor: getAvatarColor(organizer.name)
      };

      // 获取参与者列表
      const activityRegs = registrations.filter(
        r => r.activityId === id && r.status === 'approved'
      );

      const members = activityRegs.map(reg => {
        const user = participants.find(p => p.id === reg.userId);
        return {
          id: reg.userId,
          name: reg.name,
          avatar: user?.avatar || `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`
        };
      });

      // 计算进度
      const progress = Math.min(100, Math.round((detail.joined / detail.total) * 100));

      // 生成费用说明
      let feeInfo = '';
      if (detail.feeType === '免费') {
        feeInfo = '本次活动免费参加';
      } else if (detail.feeType === 'AA') {
        feeInfo = `本次活动采用AA制，预估每人${formatMoney(detail.fee)}`;
      } else {
        feeInfo = `本次活动费用${formatMoney(detail.fee)}/人`;
      }

      // 活动状态信息
      const statusInfo = formatActivityStatus(detail.status);

      // 判断是否可以报名
      const now = new Date();
      const deadline = new Date(detail.registerDeadline);
      const canRegister = now < deadline && detail.joined < detail.total;

      // 判断是否可以签到
      const startTime = new Date(detail.startTime);
      const canCheckin = detail.status === '进行中' ||
        (Math.abs(now.getTime() - startTime.getTime()) <= 30 * 60 * 1000);

      // 检查当前用户是否已报名
      const isRegistered = activityRegs.some(r => r.userId === 'u1'); // 应从登录态获取

      this.setData({
        detail,
        organizer: organizerInfo,
        members,
        progress,
        feeInfo,
        statusInfo,
        canRegister,
        canCheckin,
        isRegistered,
        loading: false
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 跳转报名页
  goRegister() {
    const { id, canRegister, isRegistered } = this.data;

    if (isRegistered) {
      wx.showToast({ title: '您已报名', icon: 'none' });
      return;
    }

    if (!canRegister) {
      wx.showToast({ title: '报名已截止或已满员', icon: 'none' });
      return;
    }

    wx.navigateTo({ url: `/pages/registration/index?id=${id}` });
  },

  // 跳转签到页
  goCheckin() {
    const { id, canCheckin } = this.data;

    if (!canCheckin) {
      wx.showToast({ title: '不在签到时间范围内', icon: 'none' });
      return;
    }

    wx.navigateTo({ url: `/pages/checkin/index?id=${id}` });
  },

  // 打开地图
  openMap() {
    const { detail } = this.data;
    if (!detail.latitude || !detail.longitude) {
      wx.showToast({ title: '位置信息不完整', icon: 'none' });
      return;
    }

    openMapNavigation(
      detail.latitude,
      detail.longitude,
      detail.place,
      detail.address
    );
  },

  // 查看参与者列表
  viewMembers() {
    wx.showModal({
      title: '参与者列表',
      content: `共${this.data.members.length}人参与`,
      showCancel: false
    });
  },

  // 联系组织者
  contactOrganizer() {
    const { organizer } = this.data;
    wx.showModal({
      title: '联系组织者',
      content: `组织者：${organizer.name}`,
      confirmText: '发消息',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '功能开发中', icon: 'none' });
        }
      }
    });
  },

  // 编辑活动（仅组织者）
  editActivity() {
    const { id } = this.data;
    wx.navigateTo({ url: `/pages/activities/edit?id=${id}` });
  },

  // 取消活动（仅组织者）
  cancelActivity() {
    wx.showModal({
      title: '取消活动',
      content: '确定要取消这个活动吗？',
      confirmText: '确定',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          // 这里应该调用API取消活动
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '活动已取消', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack({ delta: 1 });
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  // 分享
  onShare() {
    wx.showShareMenu({ withShareTicket: true });
  },

  // 返回
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  // 分享给好友
  onShareAppMessage() {
    const { detail, id } = this.data;
    return {
      title: detail.title || '活动详情',
      path: `/pages/activities/detail?id=${id}`,
      imageUrl: detail.poster || ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { detail } = this.data;
    return {
      title: detail.title || '活动详情',
      imageUrl: detail.poster || ''
    };
  }
});