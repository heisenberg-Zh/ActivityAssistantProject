// pages/activities/detail.js
const { activityAPI, registrationAPI, userAPI, favoriteAPI } = require('../../utils/api.js');
const { parseDate } = require('../../utils/date-helper.js');
const {
  formatMoney,
  formatParticipants,
  calculateActivityStatus,
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
    allRegistrations: [], // 存储所有报名记录，用于分组筛选
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

      // ========== 【关键】检查登录状态 ==========
      // 如果用户未登录，不应该使用默认的 'u1'，而应该使用 null
      const isLoggedIn = app.checkLoginStatus();
      const currentUserId = isLoggedIn ? (app.globalData.currentUserId || null) : null;

      console.log('用户登录状态:', isLoggedIn, '当前用户ID:', currentUserId);
      // ========== 登录状态检查结束 ==========

      // 并行请求活动详情和报名记录
      const [detailResult, registrationsResult] = await Promise.all([
        activityAPI.getDetail(id),
        registrationAPI.getByActivity(id, { page: 0, size: 100 })
      ]);

      // 检查API响应
      if (detailResult.code !== 0) {
        throw new Error(detailResult.message || '获取活动详情失败');
      }

      const detail = detailResult.data;

      if (!detail) {
        wx.hideLoading();
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }

      console.log('成功加载活动详情:', detail.title);

      // ========== 权限检查 ==========
      // 获取当前用户的报名记录（从活动报名列表中筛选）
      const allRegistrations = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];
      const currentUserRegistrations = allRegistrations.filter(r => r.userId === currentUserId);

      console.log('当前用户的报名记录:', currentUserRegistrations);

      // 检查用户是否有权查看此活动（私密活动等）
      const permissionCheck = checkActivityViewPermission(
        detail,
        currentUserId,
        currentUserRegistrations, // 传入当前用户的报名记录
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
      let organizerInfo = {
        id: detail.organizerId,
        name: detail.organizerName || '组织者',
        avatar: '/activityassistant_avatar_01.png'
      };

      // 尝试获取组织者详细信息
      try {
        const organizerResult = await userAPI.getUserInfo(detail.organizerId);
        if (organizerResult.code === 0) {
          organizerInfo = {
            ...organizerInfo,
            ...organizerResult.data,
            initial: getNameInitial(organizerResult.data.nickname || organizerResult.data.name),
            bgColor: getAvatarColor(organizerResult.data.nickname || organizerResult.data.name)
          };
        }
      } catch (err) {
        console.warn('获取组织者信息失败，使用默认信息:', err);
        organizerInfo = {
          ...organizerInfo,
          initial: getNameInitial(organizerInfo.name),
          bgColor: getAvatarColor(organizerInfo.name)
        };
      }

      // 获取参与者列表（使用前面已获取的报名记录）
      const activityRegs = allRegistrations.filter(r => r.status === 'approved');

      // 如果活动有分组，初始显示第一个分组的参与者
      const currentGroupId = detail.hasGroups && detail.groups && detail.groups.length > 0
        ? detail.groups[0].id
        : null;

      const filteredRegs = currentGroupId
        ? activityRegs.filter(r => r.groupId === currentGroupId)
        : activityRegs;

      const members = filteredRegs.map(reg => ({
        id: reg.userId,
        name: reg.name,
        avatar: `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`,
        groupId: reg.groupId
      }));

      // 存储所有报名记录，用于分组切换时筛选
      const allApprovedRegs = activityRegs;

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

      // 动态计算活动状态（根据时间）
      const dynamicStatus = calculateActivityStatus(detail);
      const statusInfo = formatActivityStatus(dynamicStatus);

      // 判断是否可以报名
      const now = new Date();
      const deadline = parseDate(detail.registerDeadline);
      const canRegister = now < deadline && detail.joined < detail.total;

      // 判断是否可以签到
      const startTime = parseDate(detail.startTime);
      const canCheckin = dynamicStatus === '进行中' ||
        (Math.abs(now.getTime() - startTime.getTime()) <= 30 * 60 * 1000);

      // ========== 【关键】检查当前用户是否已报名 ==========
      // 如果用户未登录，直接设置为 false，不检查报名记录
      let isRegistered = false;
      if (currentUserId) {
        // 只有登录用户才检查是否已报名
        isRegistered = activityRegs.some(r =>
          r.userId === currentUserId &&
          (r.status === 'approved' || r.status === 'pending')
        );
      }
      console.log('是否已报名:', isRegistered, '(登录状态:', !!currentUserId, ')');
      // ========== 报名状态检查结束 ==========

      // 检查管理权限（只有登录用户才能管理）
      const managementPermission = currentUserId
        ? checkManagementPermission(detail, currentUserId)
        : { hasPermission: false, role: '' };

      // 判断是否可以查看联系方式
      // 规则：已报名且审核通过的用户、管理员、组织者都可以查看
      // 游客无法查看联系方式
      const isOrganizer = currentUserId && currentUserId === detail.organizerId;
      const isAdministrator = currentUserId && detail.administrators && detail.administrators.some(admin => admin.userId === currentUserId);
      const canViewContact = currentUserId && (isRegistered || isOrganizer || isAdministrator || managementPermission.hasPermission);

      // 检查是否已收藏（从后端API获取）
      let isFavorited = false;
      if (currentUserId) {
        try {
          const favoriteResult = await favoriteAPI.checkFavorited(id);
          if (favoriteResult.code === 0) {
            isFavorited = favoriteResult.data?.favorited || false;
          }
        } catch (err) {
          console.warn('检查收藏状态失败，使用默认值false:', err);
        }
      }

      // 组装 extra 额外信息对象
      const extra = {
        organizer: organizerInfo.name,
        organizerInitial: organizerInfo.initial,
        deadline: detail.registerDeadline || '活动开始前',
        addressDetail: detail.address || '详细地址待确定',
        feeInfo: feeInfo,
        activityId: detail.id
      };

      // 设置活动详情（使用动态计算的状态）
      const enrichedDetail = {
        ...detail,
        status: dynamicStatus // 使用动态计算的状态
      };

      this.setData({
        detail: enrichedDetail,
        organizer: organizerInfo,
        members,
        allRegistrations: allApprovedRegs, // 存储所有已审核通过的报名记录
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
    const { detail, allRegistrations } = this.data;

    if (!detail.hasGroups || !detail.groups || detail.groups.length === 0) {
      return;
    }

    const currentGroup = detail.groups[groupIndex];
    if (!currentGroup) return;

    // 从已存储的所有报名记录中筛选该分组的参与者
    const filteredRegs = allRegistrations.filter(r => r.groupId === currentGroup.id);

    const members = filteredRegs.map(reg => ({
      id: reg.userId,
      name: reg.name,
      avatar: `/activityassistant_avatar_0${Math.floor(Math.random() * 4) + 1}.png`,
      groupId: reg.groupId
    }));

    console.log(`切换到分组: ${currentGroup.name}, 成员数: ${members.length}`);
    this.setData({ members });
  },

  // 跳转报名页
  goRegister() {
    const { id, canRegister, isRegistered, detail } = this.data;

    // 【优先级1】先检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '报名活动需要登录后才能操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          }
        }
      });
      return;
    }

    // 【优先级2】检查是否已报名
    if (isRegistered) {
      wx.showToast({ title: '您已报名', icon: 'none' });
      return;
    }

    // 【优先级3】校验报名截止时间
    const deadlineCheck = isBeforeRegisterDeadline(detail.registerDeadline);
    if (!deadlineCheck.valid) {
      wx.showToast({
        title: deadlineCheck.message,
        icon: 'none',
        duration: 2500
      });
      return;
    }

    // 【优先级4】检查是否满员
    if (!canRegister) {
      wx.showToast({ title: '活动已满员', icon: 'none' });
      return;
    }

    wx.navigateTo({ url: `/pages/registration/index?id=${id}` });
  },

  // 取消报名
  cancelRegistration() {
    const { id, detail } = this.data;

    // 【优先级1】先检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '取消报名需要登录后才能操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          }
        }
      });
      return;
    }

    // 【优先级2】校验报名截止时间
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

    // 【优先级1】先检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '签到功能需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          }
        }
      });
      return;
    }

    // 【优先级2】检查是否在签到时间范围内
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
    const { id } = this.data;

    wx.showModal({
      title: '取消活动',
      content: '确定要取消这个活动吗？取消后无法恢复',
      confirmText: '确定取消',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            // 调用API取消活动
            const result = await activityAPI.cancel(id);

            wx.hideLoading();

            if (result.code === 0) {
              wx.showToast({
                title: '活动已取消',
                icon: 'success',
                duration: 2000
              });

              // 延迟返回，让用户看到提示
              setTimeout(() => {
                wx.navigateBack({ delta: 1 });
              }, 1500);
            } else {
              wx.showToast({
                title: result.message || '取消失败',
                icon: 'none',
                duration: 2000
              });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('取消活动失败:', err);
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
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
    const pages = getCurrentPages();

    if (pages.length > 1) {
      // 有上一页，返回上一页
      wx.navigateBack({ delta: 1 });
    } else {
      // 没有上一页（通过分享等方式直接进入），跳转到活动列表
      // 优先跳转活动列表（因为是活动详情页），如果用户想回首页可以点击TabBar
      wx.switchTab({ url: '/pages/activities/list' });
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

  // 切换收藏状态（使用后端API）
  async toggleFavorite() {
    // 【优先级1】先检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '收藏功能需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          }
        }
      });
      return;
    }

    const { id, isFavorited } = this.data;

    try {
      if (isFavorited) {
        // 取消收藏
        const result = await favoriteAPI.remove(id);
        if (result.code === 0) {
          this.setData({ isFavorited: false });
          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: result.message || '取消收藏失败',
            icon: 'none'
          });
        }
      } else {
        // 添加收藏
        const result = await favoriteAPI.add(id);
        if (result.code === 0) {
          this.setData({ isFavorited: true });
          wx.showToast({
            title: '收藏成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: result.message || '收藏失败',
            icon: 'none'
          });
        }
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
  }
});