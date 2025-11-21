// pages/activities/list.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
const { translateActivityStatus } = require('../../utils/formatter.js');
const app = getApp();

const filters = [
  { key: 'all', name: '全部', active: true },
  { key: 'status:进行中', name: '进行中', active: false },
  { key: 'status:即将开始', name: '即将开始', active: false },
  { key: 'status:已结束', name: '已结束', active: false },
  { key: 'type:聚会', name: '聚会', active: false },
  { key: 'type:培训', name: '培训', active: false },
  { key: 'type:户外', name: '户外', active: false }
];

Page({
  data: {
    keyword: '',
    filters,
    activeFilter: 'all',
    list: [],
    filtered: [],
    loading: true
  },

  async onLoad() {
    await this.loadActivities();
  },

  // 加载活动数据
  async loadActivities() {
    try {
      wx.showLoading({ title: '加载中...' });

      // ========== 【关键】检查登录状态 ==========
      const isLoggedIn = app.checkLoginStatus();
      const currentUserId = isLoggedIn ? (app.globalData.currentUserId || null) : null;
      console.log('用户登录状态:', isLoggedIn, '当前用户ID:', currentUserId);
      // ========== 登录状态检查结束 ==========

      // 请求活动列表（所有人都可以看）
      const activitiesResult = await activityAPI.getList({
        page: 0,
        size: 100,
        sort: 'createdAt,desc'
      });

      // 检查API响应
      if (activitiesResult.code !== 0) {
        throw new Error(activitiesResult.message || '获取活动列表失败');
      }

      // 获取活动列表
      const activities = activitiesResult.data.content || activitiesResult.data || [];

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

      // 为活动列表添加报名状态和按钮显示逻辑
      const enrichedActivities = activities.map(activity => {
        // 查找该活动的报名记录（只有登录用户才有）
        const myReg = isLoggedIn ? myRegistrations.find(r => r.activityId === activity.id) : null;

        // 翻译活动状态为中文
        const translatedStatus = translateActivityStatus(activity.status);

        // 计算按钮状态
        const buttonState = this.calculateButtonState(activity, myReg, translatedStatus);

        return {
          ...activity,
          status: translatedStatus,
          isRegistered: !!myReg && myReg.status !== 'cancelled' && myReg.status !== 'rejected',
          registrationStatus: myReg ? myReg.status : null,
          ...buttonState
        };
      });

      this.setData({
        list: enrichedActivities,
        filtered: enrichedActivities,
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

  onSearchInput(e) {
    const keyword = (e.detail.value || '').trim();
    this.setData({ keyword });
    this.applyFilters(keyword, this.data.activeFilter);
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeFilter) {
      return;
    }
    const updated = this.data.filters.map(item => Object.assign({}, item, { active: item.key === key }));
    this.setData({ filters: updated, activeFilter: key });
    this.applyFilters(this.data.keyword, key);
  },

  applyFilters(keyword, filterKey) {
    const kw = keyword.toLowerCase();
    const filtered = this.data.list.filter(item => {
      const matchKeyword = !kw || item.title.toLowerCase().includes(kw) || item.place.toLowerCase().includes(kw);
      if (!matchKeyword) return false;
      if (filterKey === 'all') return true;
      if (filterKey.startsWith('status:')) {
        const status = filterKey.split(':')[1];
        return item.status === status;
      }
      if (filterKey.startsWith('type:')) {
        const type = filterKey.split(':')[1];
        return item.type === type;
      }
      return true;
    });
    this.setData({ filtered });
  },

  /**
   * 计算活动卡片的按钮状态
   * @param {Object} activity - 活动对象
   * @param {Object} myReg - 我的报名记录（如果有）
   * @param {String} translatedStatus - 翻译后的活动状态
   * @returns {Object} 按钮状态对象
   */
  calculateButtonState(activity, myReg, translatedStatus) {
    const now = new Date();
    const registerDeadline = new Date(activity.registerDeadline);
    const isFull = activity.joined >= activity.total;
    const isDeadlinePassed = now > registerDeadline;

    // 优先级1: 已结束的活动 - 隐藏报名按钮
    if (translatedStatus === '已结束') {
      return {
        showRegisterButton: false,
        buttonText: '',
        buttonStyle: '',
        buttonDisabled: true,
        buttonAction: 'none'
      };
    }

    // 优先级2: 报名已满
    if (isFull && (!myReg || myReg.status === 'rejected' || myReg.status === 'cancelled')) {
      return {
        showRegisterButton: true,
        buttonText: '已满',
        buttonStyle: 'btn--disabled',
        buttonDisabled: true,
        buttonAction: 'none'
      };
    }

    // 优先级3: 报名截止
    if (isDeadlinePassed && (!myReg || myReg.status === 'rejected' || myReg.status === 'cancelled')) {
      return {
        showRegisterButton: true,
        buttonText: '已截止',
        buttonStyle: 'btn--disabled',
        buttonDisabled: true,
        buttonAction: 'none'
      };
    }

    // 优先级4-6: 已报名的各种状态
    if (myReg) {
      switch (myReg.status) {
        case 'pending':
          return {
            showRegisterButton: true,
            buttonText: '待审核',
            buttonStyle: 'btn--pending',
            buttonDisabled: false,
            buttonAction: 'viewDetail'
          };
        case 'approved':
          return {
            showRegisterButton: true,
            buttonText: '已报名',
            buttonStyle: 'btn--registered',
            buttonDisabled: false,
            buttonAction: 'viewDetail'
          };
        case 'rejected':
          return {
            showRegisterButton: true,
            buttonText: '已拒绝',
            buttonStyle: 'btn--rejected',
            buttonDisabled: false,
            buttonAction: 'reRegister'
          };
        case 'cancelled':
          // 已取消，可以重新报名（如果未满且未截止）
          break;
        default:
          break;
      }
    }

    // 优先级7: 可以报名
    return {
      showRegisterButton: true,
      buttonText: '立即报名',
      buttonStyle: 'btn--primary',
      buttonDisabled: false,
      buttonAction: 'register'
    };
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  goRegister(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;

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

    // 根据不同的action执行不同的操作
    if (action === 'viewDetail') {
      // 已报名的活动，点击查看详情
      wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
    } else if (action === 'register' || action === 'reRegister') {
      // 立即报名或重新报名
      wx.navigateTo({ url: `/pages/registration/index?id=${id}` });
    } else if (action === 'none') {
      // 不可点击的状态（已满、已截止等）
      return;
    }
  },

  onRegisteredClick(e) {
    const id = e.currentTarget.dataset.id;
    // 已报名的活动，点击后跳转到详情页
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});