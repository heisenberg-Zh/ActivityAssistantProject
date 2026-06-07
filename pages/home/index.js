// pages/home/index.js
const { activityAPI, registrationAPI, userAPI, appConfigAPI } = require('../../utils/api.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
const { getActivityImage } = require('../../utils/default-images.js');
const { getCreateActivityAccess } = require('../../utils/create-activity-access.js');
const app = getApp();

// 状态到CSS类名的映射
const STATUS_CLASS_MAP = {
  '报名中': 'registering',
  '进行中': 'ongoing',
  '已结束': 'ended',
  '已取消': 'cancelled',
  '已满员': 'full'
};

// 获取状态对应的CSS类名
const getStatusClass = (status) => {
  return STATUS_CLASS_MAP[status] || '';
};

// 判断活动是否应该在首页显示
// 规则：已取消的活动不显示；当天结束的活动仍显示，跨天后才不显示
const shouldShowInHome = (activity) => {
  // 已取消的活动不显示
  if (activity.status === '已取消') {
    return false;
  }

  // 如果不是"已结束"状态，直接显示
  if (activity.status !== '已结束') {
    return true;
  }

  // 如果是"已结束"状态，检查是否是当天结束
  if (!activity.endTime) {
    return false;  // 没有结束时间，不显示
  }

  try {
    // 解析结束时间
    let endTimeStr = activity.endTime;
    if (endTimeStr.includes(' ') && !endTimeStr.includes('T')) {
      endTimeStr = endTimeStr.replace(' ', 'T');
    }
    endTimeStr = endTimeStr.replace(/\.\d+/, '');
    const endTime = new Date(endTimeStr);

    // 获取今天的日期（去掉时间部分）
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 获取活动结束日期（去掉时间部分）
    const endDate = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());

    // 如果结束日期 >= 今天，显示（包括当天结束的活动）
    // 如果结束日期 < 今天（已经过了结束日期），不显示
    return endDate >= todayDate;
  } catch (err) {
    console.error('解析活动结束时间失败:', err);
    return false;  // 解析失败，不显示
  }
};

// 首页报名按钮状态（与列表页逻辑保持一致）
const getHomeButtonState = (activity, myReg) => {
  const now = new Date();
  const registerDeadline = activity.registerDeadline ? new Date(activity.registerDeadline) : null;
  const isFull = (activity.joined || 0) >= (activity.total || 0);
  const isDeadlinePassed = registerDeadline ? now > registerDeadline : false;

  // 1. 名额已满 且 未报名：显示"已满"（禁用）
  if (isFull && !myReg) {
    return { buttonText: '已满', buttonStyle: 'btn--disabled', buttonAction: 'none' };
  }

  // 2. 报名截止 且 未报名：显示"已截止"（禁用）
  if (isDeadlinePassed && !myReg) {
    return { buttonText: '已截止', buttonStyle: 'btn--disabled', buttonAction: 'none' };
  }

  // 3. 已报名（pending / approved）
  if (myReg && myReg.status === 'pending') {
    return { buttonText: '待审核', buttonStyle: 'btn--pending', buttonAction: 'viewRegistration' };
  }
  if (myReg && myReg.status === 'approved') {
    return { buttonText: '已报名', buttonStyle: 'btn--registered', buttonAction: 'viewDetail' };
  }

  // 4. 默认可报名
  return { buttonText: '立即报名', buttonStyle: 'btn--primary', buttonAction: 'register' };
};

Page({
  data: {
    categories: [
      { name: '全部', key: 'all', active: true },
      { name: '聚会', key: '聚会', active: false },
      { name: '培训', key: '培训', active: false },
      { name: '户外', key: '户外', active: false },
      { name: '运动', key: '运动', active: false },
      { name: '其他', key: '其他', active: false }
    ],
    list: [],
    enrichedActivities: [],
    loading: true,
    canCreateActivity: false,
    showProfileCompletionDialog: false,
    profileCompletionLoading: false
  },

  async onLoad() {
    await this.refreshCreateActivityAccess();
    await this.loadActivities();
  },

  // 每次显示页面时刷新数据
  async onShow() {
    await this.refreshCreateActivityAccess();
    activityAPI.consumeActivityListDirty && activityAPI.consumeActivityListDirty();
    await this.loadActivities();
    this.maybePromptProfileCompletion();
  },

  async refreshCreateActivityAccess() {
    if (!app.checkLoginStatus || !app.checkLoginStatus()) {
      try {
        const configRes = await appConfigAPI.getCreateActivityConfig();
        const adminOnly = !!(
          configRes
          && configRes.code === 0
          && configRes.data
          && configRes.data.createActivityAdminOnly === true
        );
        this.setData({ canCreateActivity: !adminOnly });
      } catch (err) {
        console.warn('加载创建活动开关失败:', err);
        this.setData({ canCreateActivity: false });
      }
      return;
    }

    const access = await getCreateActivityAccess();
    this.setData({
      canCreateActivity: !!access.canCreate || access.adminOnly === false
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    activityAPI.clearActivityCaches && activityAPI.clearActivityCaches();
    await this.loadActivities();
    wx.stopPullDownRefresh();
  },

  // 加载活动数据
  async loadActivities() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 检查登录状态
      const isLoggedIn = app.checkLoginStatus();
      const currentUserId = isLoggedIn ? (app.globalData.currentUserId || null) : null;

      // 1. 请求公开活动列表
      const publicActivitiesResult = await activityAPI.getList({
        status: 'published',
        isPublic: true,
        page: 0,
        size: 50,
        sort: 'startTime,asc'
      });

      // 检查API响应
      if (publicActivitiesResult.code !== 0) {
        throw new Error(publicActivitiesResult.message || '获取活动列表失败');
      }

      // 获取公开活动列表
      let activities = publicActivitiesResult.data.content || publicActivitiesResult.data || [];

      // 2. 如果用户已登录，额外获取与用户相关的私密活动（组织者/管理员/白名单/已报名）
      if (isLoggedIn && currentUserId) {
        try {
          const relatedPrivateResult = await activityAPI.getRelatedPrivateActivities({
            page: 0,
            size: 100,
            status: 'published',
            sortBy: 'startTime',
            sortDirection: 'asc'
          });

          if (relatedPrivateResult.code === 0) {
            const myPrivateActivities = relatedPrivateResult.data.content || relatedPrivateResult.data || [];

            // 合并公开活动和私密活动，并去重（使用Map以id为key）
            const activityMap = new Map();

            // 先添加公开活动
            activities.forEach(activity => {
              activityMap.set(activity.id, activity);
            });

            // 再添加私密活动（如果有重复ID会覆盖，但实际上不会有重复因为私密活动不在公开列表）
            myPrivateActivities.forEach(activity => {
              activityMap.set(activity.id, activity);
            });

            // 转换回数组
            activities = Array.from(activityMap.values());

            console.log(`✅ 已加载活动：公开 ${publicActivitiesResult.data.content?.length || 0} 个，私密 ${myPrivateActivities.length} 个`);
          }
        } catch (err) {
          console.warn('获取我的私密活动失败（不影响公开活动显示）:', err);
          // 失败不影响公开活动的显示
        }
      }

      // 获取我的报名记录（只有登录用户才请求）
      let myRegistrations = [];
      if (isLoggedIn && currentUserId) {
        try {
          const registrationsResult = await registrationAPI.getMyRegistrations({
            page: 0,
            size: 100
          });
          myRegistrations = registrationsResult.code === 0
            ? (registrationsResult.data.content || registrationsResult.data || [])
            : [];
        } catch (err) {
          console.warn('获取报名记录失败（可能未登录）:', err);
          myRegistrations = [];
        }
      }

      // 为活动列表添加已报名状态，并动态计算状态
      const enrichedActivities = activities.map(activity => {
        const rawReg = isLoggedIn
          ? myRegistrations.find(r => r.activityId === activity.id)
          : null;
        const myReg = rawReg && (rawReg.status === 'approved' || rawReg.status === 'pending')
          ? rawReg
          : null;
        const { buttonText, buttonStyle, buttonAction } = getHomeButtonState(activity, myReg);
        const calculatedStatus = calculateActivityStatus(activity);
        const imageUrl = getActivityImage(activity.image, activity.type);

        return {
          ...activity,
          registrationStatus: rawReg ? rawReg.status : null,
          status: calculatedStatus,
          statusClass: getStatusClass(calculatedStatus), // 添加状态CSS类名
          imageUrl,  // 添加图片URL（自定义或默认）
          buttonText,
          buttonStyle,
          buttonAction
        };
      });

      // 首页只显示有效活动：过滤掉"已取消"和已过期的"已结束"活动
      // 当天结束的活动仍然显示，跨天后才不显示
      const validActivities = enrichedActivities.filter(activity => {
        return shouldShowInHome(activity);
      });

      this.setData({
        list: validActivities,
        enrichedActivities: validActivities,
        loading: false
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    }
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    const categories = this.data.categories.map(item => Object.assign({}, item, { active: item.key === key }));
    const list = key === 'all' ? this.data.enrichedActivities : this.data.enrichedActivities.filter(item => item.type === key);
    this.setData({ categories, list });
  },

  async goCreateActivity() {
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '创建活动需要登录后才能使用，是否前往登录？',
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

    wx.showLoading({ title: '请稍候', mask: true });
    const access = await getCreateActivityAccess();
    wx.hideLoading();

    if (access.canCreate) {
      wx.navigateTo({ url: '/pkg-biz/create/index' });
      return;
    }

    wx.showModal({
      title: '暂无法创建活动',
      content: access.message || '暂时无法校验创建权限，请稍后再试',
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#3b82f6'
    });
  },

  goMyActivities() {
    // 检查是否已登录
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '查看我的活动需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login'
            });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/my-activities/index' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  goRegister(e) {
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

    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pkg-biz/registration/index?id=${id}` });
  },

  onRegisteredClick(e) {
    const id = e.currentTarget.dataset.id;
    // 已报名的活动，点击后跳转到详情页
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  onCardButtonTap(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;
    if (!id || !action) return;

    if (action === 'viewDetail') {
      wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
      return;
    }

    // register / viewRegistration 都跳到报名页（报名页会展示待审核/已报名等状态）
    wx.navigateTo({ url: `/pkg-biz/registration/index?id=${id}` });
  },

  getProfileCompletionPromptKey(userId) {
    return `profile_completion_prompted_${userId || 'unknown'}`;
  },

  isDefaultNickname(nickname) {
    if (!nickname) return true;
    const trimmed = String(nickname).trim();
    if (!trimmed) return true;
    return /^用户[a-zA-Z0-9]{6}$/.test(trimmed);
  },

  isDefaultOrInvalidAvatar(avatar) {
    const val = String(avatar || '').trim();
    if (!val) return true;
    return val === '/default_avatar.png';
  },

  getCachedUserBasics() {
    const userId = app.globalData.currentUserId || wx.getStorageSync('currentUserId') || '';

    const globalUserInfo = app.globalData.userInfo || {};
    const storedUserInfo = wx.getStorageSync('userInfo') || {};

    const nickname = globalUserInfo.nickName || globalUserInfo.nickname || storedUserInfo.nickName || storedUserInfo.nickname || '';
    const avatar = globalUserInfo.avatarUrl || globalUserInfo.avatar || storedUserInfo.avatarUrl || storedUserInfo.avatar || '';

    return { userId, nickname, avatar };
  },

  maybePromptProfileCompletion() {
    try {
      if (!app.checkLoginStatus || !app.checkLoginStatus()) return;
      if (this.data.showProfileCompletionDialog) return;

      const { userId, nickname, avatar } = this.getCachedUserBasics();
      if (!userId) return;

      const promptKey = this.getProfileCompletionPromptKey(userId);
      const prompted = wx.getStorageSync(promptKey);
      if (prompted === true || prompted === 'true') return;

      const needPrompt = this.isDefaultNickname(nickname) || this.isDefaultOrInvalidAvatar(avatar);
      if (!needPrompt) return;

      this.setData({ showProfileCompletionDialog: true });
    } catch (e) {
      // 不阻断首页
    }
  },

  markProfileCompletionPrompted() {
    const { userId } = this.getCachedUserBasics();
    if (!userId) return;
    wx.setStorageSync(this.getProfileCompletionPromptKey(userId), true);
  },

  async useWechatProfile() {
    if (this.data.profileCompletionLoading) return;
    this.setData({ profileCompletionLoading: true });

    try {
      const wxRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善个人资料（昵称、头像）在活动中展示',
          success: resolve,
          fail: reject
        });
      });

      const wxUserInfo = (wxRes && wxRes.userInfo) || {};
      const wxNickname = (wxUserInfo.nickName || '').trim();
      const wxAvatarUrl = (wxUserInfo.avatarUrl || '').trim();

      const { nickname: currentNickname } = this.getCachedUserBasics();
      const updateData = {};

      if (wxNickname && this.isDefaultNickname(currentNickname) && wxNickname !== '微信用户') {
        updateData.nickname = wxNickname;
      }
      if (wxAvatarUrl) {
        updateData.avatar = wxAvatarUrl;
      }

      if (!updateData.nickname && !updateData.avatar) {
        wx.showToast({ title: '未获取到可用的昵称/头像', icon: 'none' });
        return;
      }

      const result = await userAPI.updateProfile(updateData);
      if (!result || result.code !== 0) {
        throw new Error(result?.message || '更新失败');
      }

      const updated = result.data || {};
      const userId = updated.id || this.getCachedUserBasics().userId;
      const nextNickname = updated.nickname || updateData.nickname || currentNickname;
      const nextAvatar = updated.avatar || updateData.avatar || '';

      app.globalData.userInfo = { nickName: nextNickname, avatarUrl: nextAvatar, id: userId };
      app.globalData.currentUser = { id: userId, name: nextNickname, avatar: nextAvatar };
      try {
        const { setSecureStorage } = require('../../utils/security.js');
        setSecureStorage('userInfo', { nickName: nextNickname, avatarUrl: nextAvatar, id: userId });
        setSecureStorage('currentUser', { id: userId, name: nextNickname, avatar: nextAvatar });
        setSecureStorage('currentUserId', userId);
      } catch (e) {
        wx.setStorageSync('userInfo', { nickName: nextNickname, avatarUrl: nextAvatar, id: userId });
        wx.setStorageSync('currentUser', { id: userId, name: nextNickname, avatar: nextAvatar });
        wx.setStorageSync('currentUserId', userId);
      }

      this.markProfileCompletionPrompted();
      this.setData({ showProfileCompletionDialog: false });
      wx.showToast({ title: '资料已更新', icon: 'success' });
    } catch (err) {
      const msg = (err && err.errMsg) ? err.errMsg : (err && err.message) ? err.message : '';
      if (msg.includes('getUserProfile:fail') || msg.includes('fail auth deny') || msg.includes('deny')) {
        wx.showToast({ title: '已取消授权', icon: 'none' });
      } else {
        wx.showToast({ title: '更新失败，请稍后重试', icon: 'none' });
      }
    } finally {
      this.setData({ profileCompletionLoading: false });
    }
  },

  goManualProfileEdit() {
    this.markProfileCompletionPrompted();
    this.setData({ showProfileCompletionDialog: false });
    wx.navigateTo({ url: '/pkg-user/profile-edit/index' });
  },

  skipProfileCompletion() {
    this.markProfileCompletionPrompted();
    this.setData({ showProfileCompletionDialog: false });
  },

  onShareAppMessage() {
    return { title: '活动记鹿', path: '/pages/home/index' };
  }
});
