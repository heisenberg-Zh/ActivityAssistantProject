// pages/activities/detail.js
const { activities, participants, registrations } = require('../../utils/mock.js');
const { activityAPI } = require('../../utils/api.js');
const { parseDate } = require('../../utils/date-helper.js');
const {
  formatMoney,
  formatParticipants,
  formatActivityStatus,
  getNameInitial,
  getAvatarColor
} = require('../../utils/formatter.js');
const { formatDateCN, getRelativeTime, isBeforeRegisterDeadline } = require('../../utils/datetime.js');
const { openMapNavigation } = require('../../utils/location.js');
const { checkActivityViewPermission } = require('../../utils/activity-helper.js');
const { checkManagementPermission } = require('../../utils/activity-management-helper.js');
const app = getApp();

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
    currentGroupIndex: 0, // 当前查看的分组索引
    // 权限相关
    hasPermission: true,
    permissionDeniedReason: '',
    fromShare: false, // 是否通过分享链接访问
    // 管理权限
    canManage: false,
    managementRole: '', // 'creator' 或 'admin'
    // 收藏相关
    isFavorited: false // 是否已收藏
  },

  onLoad(query) {
    // 确保ID是字符串类型，并去除可能的空格
    const id = String(query.id || 'a1').trim();
    const fromShare = query.from === 'share'; // 检查是否通过分享链接访问

    console.log('详情页接收到的原始 query:', query);
    console.log('处理后的活动 ID:', id, '类型:', typeof id);
    console.log('是否通过分享访问:', fromShare);

    this.setData({ id, fromShare });
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

      // ========== 权限检查 ==========
      const currentUserId = app.globalData.currentUserId || 'u1';
      const userRegistrations = registrations.filter(
        r => r.userId === currentUserId && r.status === 'approved'
      );

      // 检查用户是否有权查看此活动
      const permissionCheck = checkActivityViewPermission(
        detail,
        currentUserId,
        userRegistrations,
        this.data.fromShare
      );

      console.log('权限检查结果:', permissionCheck);

      // 如果没有权限，显示无权限页面
      if (!permissionCheck.hasPermission) {
        wx.hideLoading();
        this.setData({
          hasPermission: false,
          permissionDeniedReason: permissionCheck.reason,
          loading: false
        });
        return;
      }
      // ========== 权限检查结束 ==========

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
      const deadline = parseDate(detail.registerDeadline);
      const canRegister = now < deadline && detail.joined < detail.total;

      // 判断是否可以签到
      const startTime = parseDate(detail.startTime);
      const canCheckin = detail.status === '进行中' ||
        (Math.abs(now.getTime() - startTime.getTime()) <= 30 * 60 * 1000);

      // 检查当前用户是否已报名（必须是审核通过的报名）
      // 注意：这里要检查该活动的所有报名记录，不能只检查 activityRegs（它可能只包含当前分组）
      const isRegistered = registrations.some(r =>
        r.activityId === id &&
        r.userId === currentUserId &&
        r.status === 'approved'
      );

      // 检查管理权限
      const managementPermission = checkManagementPermission(detail, currentUserId);

      // 判断是否可以查看联系方式
      // 规则：已报名且审核通过的用户、管理员、组织者都可以查看
      const isOrganizer = currentUserId === detail.organizerId;
      const isAdministrator = detail.administrators && detail.administrators.some(admin => admin.userId === currentUserId);
      const canViewContact = isRegistered || isOrganizer || isAdministrator || managementPermission.hasPermission;

      // 检查是否已收藏
      const favoriteIds = wx.getStorageSync('favoriteActivityIds') || [];
      const isFavorited = favoriteIds.includes(id);

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
        canManage: managementPermission.hasPermission,
        managementRole: managementPermission.role || '',
        canViewContact, // 是否可以查看联系方式
        isFavorited, // 是否已收藏
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

  // 跳转到管理页面
  goManagement() {
    const { id, canManage } = this.data;

    if (!canManage) {
      wx.showToast({ title: '无管理权限', icon: 'none' });
      return;
    }

    wx.navigateTo({ url: `/pages/management/index?id=${id}` });
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

    // 构建分享标题，包含关键信息
    let shareTitle = detail.title || '活动详情';
    if (detail.date) {
      shareTitle = `${detail.title} | ${detail.date}`;
    }

    return {
      title: shareTitle,
      path: `/pages/activities/detail?id=${id}&from=share`, // 添加 from=share 参数
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
  },

  // 拨打组织者电话
  callOrganizer() {
    const { detail } = this.data;
    const phone = detail.organizerPhone;

    if (!phone || phone.trim().length === 0) {
      wx.showToast({
        title: '组织者未提供电话',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 去除脱敏符号，获取真实号码
    const realPhone = phone.replace(/\*/g, '');

    // 检查号码是否有效
    if (realPhone.length < 7) {
      wx.showToast({
        title: '电话号码无效',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.makePhoneCall({
      phoneNumber: realPhone,
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.error('拨打电话失败:', err);
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  // 复制组织者微信号
  copyWechat() {
    const { detail } = this.data;
    const wechat = detail.organizerWechat;

    if (!wechat || wechat.trim().length === 0) {
      wx.showToast({
        title: '组织者未提供微信号',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 去除脱敏符号，获取真实微信号
    const realWechat = wechat.replace(/\*/g, '');

    wx.setClipboardData({
      data: realWechat,
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success',
          duration: 2000
        });
        // 可选：显示提示引导用户添加微信
        setTimeout(() => {
          wx.showModal({
            title: '添加微信',
            content: `微信号「${realWechat}」已复制到剪贴板，请前往微信添加好友`,
            showCancel: false,
            confirmText: '知道了'
          });
        }, 2000);
      },
      fail: (err) => {
        console.error('复制微信号失败:', err);
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 切换收藏状态
  toggleFavorite() {
    const { id, isFavorited } = this.data;

    // 获取收藏列表
    let favoriteIds = wx.getStorageSync('favoriteActivityIds') || [];

    if (isFavorited) {
      // 取消收藏
      favoriteIds = favoriteIds.filter(fid => fid !== id);
      wx.setStorageSync('favoriteActivityIds', favoriteIds);
      this.setData({ isFavorited: false });
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
    } else {
      // 添加收藏
      if (!favoriteIds.includes(id)) {
        favoriteIds.push(id);
        wx.setStorageSync('favoriteActivityIds', favoriteIds);
      }
      this.setData({ isFavorited: true });
      wx.showToast({
        title: '收藏成功',
        icon: 'success'
      });
    }
  }
});