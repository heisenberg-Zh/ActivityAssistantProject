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
const { formatDateCN, getRelativeTime, isBeforeRegisterDeadline } = require('../../utils/datetime.js');
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
    loading: true,
    currentGroupIndex: 0 // 当前查看的分组索引
  },

  onLoad(query) {
    // 确保ID是字符串类型，并去除可能的空格
    const id = String(query.id || 'a1').trim();
    console.log('详情页接收到的原始 query:', query);
    console.log('处理后的活动 ID:', id, '类型:', typeof id);
    this.setData({ id });
    this.loadActivityDetail(id);
  },

  // 加载活动详情
  async loadActivityDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' });

      // 调试信息：打印活动ID和活动列表
      console.log('正在查找活动 ID:', id);
      console.log('活动列表数量:', activities.length);
      console.log('活动列表ID:', activities.map(a => a.id));

      let detail = activities.find(item => item.id === id);

      // 如果严格匹配失败，尝试宽松匹配
      if (!detail) {
        console.warn('严格匹配失败，尝试宽松匹配...');
        detail = activities.find(item => String(item.id).trim() === String(id).trim());
      }

      // 如果还是失败，尝试不区分大小写匹配
      if (!detail) {
        console.warn('宽松匹配失败，尝试不区分大小写匹配...');
        detail = activities.find(item =>
          String(item.id).trim().toLowerCase() === String(id).trim().toLowerCase()
        );
      }

      if (!detail) {
        console.error('所有匹配方式都失败了！');
        console.error('查找的 ID:', id, '(类型:', typeof id, ')');
        console.error('可用的活动 IDs:', activities.map(a => ({
          id: a.id,
          idType: typeof a.id,
          title: a.title
        })));
        wx.hideLoading();
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }

      console.log('成功找到活动:', detail.title, '(匹配方式:', detail.id === id ? '严格' : '宽松', ')');

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
      // 如果活动有分组，初始显示第一个分组的参与者；否则显示全部参与者
      const currentGroupId = detail.hasGroups && detail.groups && detail.groups.length > 0
        ? detail.groups[0].id
        : null;

      const activityRegs = registrations.filter(r => {
        if (r.activityId !== id || r.status !== 'approved') return false;
        // 如果有分组，只显示当前分组的参与者
        if (currentGroupId) {
          return r.groupId === currentGroupId;
        }
        return true;
      });

      const members = activityRegs.map(reg => {
        const user = participants.find(p => p.id === reg.userId);
        return {
          id: reg.userId,
          name: reg.name,
          avatar: user?.avatar || `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`,
          groupId: reg.groupId
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

      // 组装 extra 额外信息对象
      const extra = {
        organizer: organizerInfo.name,
        organizerInitial: organizerInfo.initial,
        deadline: detail.registerDeadline || '活动开始前',
        addressDetail: detail.address || '详细地址待确定',
        feeInfo: feeInfo,
        activityId: detail.id
      };

      this.setData({
        detail,
        organizer: organizerInfo,
        members,
        progress,
        feeInfo,
        extra,
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

  // 切换分组
  switchGroup(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentGroupIndex: index });

    // 更新参与成员列表，显示当前分组的成员
    this.updateMembersByGroup(index);
  },

  // 根据分组更新参与成员列表
  updateMembersByGroup(groupIndex) {
    const { detail, id } = this.data;

    if (!detail.hasGroups || !detail.groups || detail.groups.length === 0) {
      return;
    }

    const currentGroup = detail.groups[groupIndex];
    if (!currentGroup) return;

    // 获取该分组的参与者
    const activityRegs = registrations.filter(r => {
      return r.activityId === id &&
             r.status === 'approved' &&
             r.groupId === currentGroup.id;
    });

    const members = activityRegs.map(reg => {
      const user = participants.find(p => p.id === reg.userId);
      return {
        id: reg.userId,
        name: reg.name,
        avatar: user?.avatar || `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`,
        groupId: reg.groupId
      };
    });

    this.setData({ members });
  },

  // 跳转报名页
  goRegister() {
    const { id, canRegister, isRegistered, detail } = this.data;

    if (isRegistered) {
      wx.showToast({ title: '您已报名', icon: 'none' });
      return;
    }

    // 校验报名截止时间
    const deadlineCheck = isBeforeRegisterDeadline(detail.registerDeadline);
    if (!deadlineCheck.valid) {
      wx.showToast({
        title: deadlineCheck.message,
        icon: 'none',
        duration: 2500
      });
      return;
    }

    if (!canRegister) {
      wx.showToast({ title: '活动已满员', icon: 'none' });
      return;
    }

    wx.navigateTo({ url: `/pages/registration/index?id=${id}` });
  },

  // 取消报名
  cancelRegistration() {
    const { id, detail } = this.data;

    // 校验报名截止时间
    const deadlineCheck = isBeforeRegisterDeadline(detail.registerDeadline);
    if (!deadlineCheck.valid) {
      wx.showModal({
        title: '无法取消报名',
        content: deadlineCheck.message + '\n\n报名截止后不支持取消报名操作，如有问题请联系活动组织者。',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    wx.showModal({
      title: '确认取消报名',
      content: '确定要取消报名吗？取消后需要重新报名才能参加活动。',
      confirmText: '确认取消',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            // 这里应该调用API取消报名
            // await activityAPI.cancelRegistration({ activityId: id });

            // 模拟取消成功
            setTimeout(() => {
              wx.hideLoading();
              wx.showToast({ title: '已取消报名', icon: 'success' });

              // 刷新页面数据
              setTimeout(() => {
                this.loadActivityDetail(id);
              }, 1500);
            }, 1000);
          } catch (err) {
            wx.hideLoading();
            console.error('取消报名失败:', err);
            wx.showToast({ title: '取消失败，请重试', icon: 'none' });
          }
        }
      }
    });
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

  // 查看所有参与者
  viewAllMembers() {
    const { id, detail, currentGroupIndex, members } = this.data;

    if (members.length === 0) {
      wx.showToast({ title: '暂无参与者', icon: 'none' });
      return;
    }

    // 构建跳转参数
    let url = `/pages/participants/index?activityId=${id}`;

    // 如果有分组，传递当前分组信息
    if (detail.hasGroups && detail.groups && detail.groups.length > 0) {
      const currentGroup = detail.groups[currentGroupIndex];
      url += `&groupId=${currentGroup.id}&groupName=${encodeURIComponent(currentGroup.name)}`;
    }

    url += `&activityTitle=${encodeURIComponent(detail.title)}`;

    wx.navigateTo({ url });
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