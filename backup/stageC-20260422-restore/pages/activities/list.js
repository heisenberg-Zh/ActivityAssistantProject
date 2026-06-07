// pages/activities/list.js
const { activityAPI, registrationAPI, adminAPI } = require('../../utils/api.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
const { getReadMap, markActivityRead, isActivityRead } = require('../../utils/activity-read.js');
const app = getApp();

const TYPE_FILTER_OPTIONS = [
  { key: 'all', name: '全部' },
  { key: '聚会', name: '聚会' },
  { key: '培训', name: '培训' },
  { key: '户外', name: '户外' },
  { key: '运动', name: '运动' },
  { key: '其他', name: '其他' }
];

const STATUS_FILTER_OPTIONS_USER = [
  { key: 'all', name: '全部' },
  { key: '报名中', name: '报名中' },
  { key: '即将开始', name: '即将开始' },
  { key: '进行中', name: '进行中' },
  { key: '已结束', name: '已结束' }
];

const STATUS_FILTER_OPTIONS_ADMIN = [
  { key: 'all', name: '全部' },
  { key: '报名中', name: '报名中' },
  { key: '即将开始', name: '即将开始' },
  { key: '进行中', name: '进行中' },
  { key: '已结束', name: '已结束' },
  { key: '已取消', name: '已取消' }
];

const buildFilters = (options, activeKey) => options.map(opt => ({
  ...opt,
  active: opt.key === activeKey
}));

const getStatusBadgeClass = (statusText) => {
  if (statusText === '进行中') return 'badge--ok';
  if (statusText === '即将开始') return 'badge--info';
  if (statusText === '报名中') return 'badge--warning';
  return 'badge--muted';
};

const parseActivityStartTimeMs = (startTime) => {
  if (!startTime) return NaN;
  const raw = String(startTime);
  const d = raw.includes('T') ? new Date(raw) : new Date(raw.replace(/-/g, '/'));
  const ts = d.getTime();
  return Number.isFinite(ts) ? ts : NaN;
};

const getTypeVisual = (type) => {
  const t = String(type || '').trim();
  const map = {
    '聚会': { icon: '🎉', bg: '#fef3c7' },
    '培训': { icon: '📚', bg: '#dbeafe' },
    '户外': { icon: '⛰️', bg: '#dcfce7' },
    '运动': { icon: '🏃', bg: '#fee2e2' },
    '其他': { icon: '✨', bg: '#f3f4f6' }
  };
  return map[t] || { icon: '✨', bg: '#f3f4f6' };
};

Page({
  data: {
    needsLogin: false,
    isSystemAdmin: false,
    keyword: '',

    statusFilters: buildFilters(STATUS_FILTER_OPTIONS_USER, 'all'),
    typeFilters: buildFilters(TYPE_FILTER_OPTIONS, 'all'),
    activeStatus: 'all',
    activeType: 'all',

    list: [],
    filtered: [],
    loading: true,

    // 系统管理员分页加载（普通用户不使用）
    adminPage: 0,
    adminSize: 50,
    adminHasMore: true,
    adminLoadingMore: false
  },

  async onLoad() {
    await this.initAndLoad({ resetAdminPaging: true });
  },

  async onShow() {
    if (app.checkLoginStatus() && this.data.needsLogin) {
      await this.initAndLoad({ resetAdminPaging: true });
      return;
    }

    if (app.checkLoginStatus() && !this.data.needsLogin) {
      this.refreshReadFlags();
    }
  },

  async onPullDownRefresh() {
    await this.initAndLoad({ resetAdminPaging: true });
    wx.stopPullDownRefresh();
  },

  async onReachBottom() {
    if (!this.data.isSystemAdmin) return;
    if (!this.data.adminHasMore || this.data.adminLoadingMore) return;
    await this.loadSystemAdminActivities({ append: true });
  },

  setNeedsLogin() {
    this.setData({
      needsLogin: true,
      loading: false,
      list: [],
      filtered: []
    });
  },

  async initAndLoad({ resetAdminPaging = false } = {}) {
    const isLoggedIn = app.checkLoginStatus();
    if (!isLoggedIn) {
      this.setNeedsLogin();
      return;
    }

    this.setData({ needsLogin: false, loading: true });

    let isSystemAdmin = false;
    try {
      const adminRes = await adminAPI.me();
      isSystemAdmin = !!(adminRes && adminRes.code === 0 && adminRes.data && adminRes.data.systemAdmin === true);
    } catch (e) {
      isSystemAdmin = false;
    }

    const statusOptions = isSystemAdmin ? STATUS_FILTER_OPTIONS_ADMIN : STATUS_FILTER_OPTIONS_USER;

    const activeStatus = statusOptions.some(o => o.key === this.data.activeStatus) ? this.data.activeStatus : 'all';
    const activeType = TYPE_FILTER_OPTIONS.some(o => o.key === this.data.activeType) ? this.data.activeType : 'all';

    const nextData = {
      isSystemAdmin,
      activeStatus,
      activeType,
      statusFilters: buildFilters(statusOptions, activeStatus),
      typeFilters: buildFilters(TYPE_FILTER_OPTIONS, activeType)
    };

    if (resetAdminPaging) {
      nextData.adminPage = 0;
      nextData.adminHasMore = true;
      nextData.adminLoadingMore = false;
    }

    this.setData(nextData);

    if (isSystemAdmin) {
      await this.loadSystemAdminActivities({ append: false });
    } else {
      await this.loadUserActivities();
    }
  },

  async loadUserActivities() {
    try {
      wx.showLoading({ title: '加载中...' });

      const currentUserId = app.globalData.currentUserId || null;

      const settled = await Promise.allSettled([
        activityAPI.getList({
          isPublic: true,
          page: 0,
          size: 200,
          sortBy: 'startTime',
          sortDirection: 'desc'
        }),
        activityAPI.getRelatedPrivateActivities({
          page: 0,
          size: 200,
          sortBy: 'startTime',
          sortDirection: 'desc'
        }),
        registrationAPI.getMyRegistrations({ page: 0, size: 500 })
      ]);

      const [publicRes, privateRes, regsRes] = settled.map(r => (r.status === 'fulfilled' ? r.value : { code: -1, data: null }));

      const publicActivities = publicRes.code === 0
        ? (publicRes.data.content || publicRes.data || [])
        : [];
      const relatedPrivateActivities = privateRes.code === 0
        ? (privateRes.data.content || privateRes.data || [])
        : [];
      const myRegistrations = regsRes.code === 0
        ? (regsRes.data.content || regsRes.data || [])
        : [];

      const relatedPrivateIds = new Set((relatedPrivateActivities || []).map(a => a && a.id).filter(Boolean));

      const regByActivityId = new Map();
      (myRegistrations || []).forEach((r) => {
        if (r && r.activityId) regByActivityId.set(r.activityId, r);
      });

      const activityMap = new Map();
      const upsert = (activity, extras = {}) => {
        if (!activity || !activity.id) return;
        const prev = activityMap.get(activity.id) || {};
        activityMap.set(activity.id, { ...prev, ...activity, ...extras });
      };

      (publicActivities || []).forEach(a => upsert(a, { __sourcePublic: true }));
      (relatedPrivateActivities || []).forEach(a => upsert(a, { __sourceRelatedPrivate: true }));

      const mergedActivities = Array.from(activityMap.values());
      const readMap = getReadMap();

      const enriched = mergedActivities.map((activity) => {
        const rawReg = regByActivityId.get(activity.id) || null;
        const myReg = rawReg && (rawReg.status === 'approved' || rawReg.status === 'pending') ? rawReg : null;

        const statusText = calculateActivityStatus(activity);
        const typeVisual = getTypeVisual(activity.type);
        const read = isActivityRead(activity.id, readMap);

        const isOrganizer = !!currentUserId && (activity.organizerId === currentUserId || activity.isOrganizer === true);
        const isAdmin = activity.isAdmin === true;
        const isRegistrant = !!myReg;
        const isRelatedPrivateSource = relatedPrivateIds.has(activity.id) || activity.__sourceRelatedPrivate === true;
        const isPrivate = activity.isPublic === false;

        const isRelated = isOrganizer || isAdmin || isRegistrant || (isPrivate && isRelatedPrivateSource);

        let relationTag = '';
        if (isOrganizer) relationTag = '我创建';
        else if (isAdmin) relationTag = '我管理';
        else if (isRegistrant) relationTag = '我参加';
        else if (isPrivate && isRelated) relationTag = '白名单';

        const privacyTag = isPrivate ? '私密' : '';

        const buttonState = this.calculateButtonState(activity, myReg, statusText);

        return {
          ...activity,
          status: statusText,
          statusBadgeClass: getStatusBadgeClass(statusText),
          relationTag,
          privacyTag,
          typeIcon: typeVisual.icon,
          typeIconBg: typeVisual.bg,
          isRead: read,
          isRelated,
          registrationStatus: rawReg ? rawReg.status : null,
          isRegistered: !!myReg && myReg.status === 'approved',
          ...buttonState
        };
      }).filter((item) => {
        // 普通用户：不展示草稿/待发布/已取消
        if (item.status === '草稿' || item.status === '待发布' || item.status === '已取消') return false;

        // 私密活动：无关不展示（兜底保护）
        if (item.isPublic === false && !item.isRelated) return false;

        // 已结束：仅展示与我相关
        if (item.status === '已结束' && !item.isRelated) return false;

        return true;
      }).sort((a, b) => {
        const aTime = parseActivityStartTimeMs(a.startTime);
        const bTime = parseActivityStartTimeMs(b.startTime);
        const aValid = Number.isFinite(aTime);
        const bValid = Number.isFinite(bTime);
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        return bTime - aTime;
      });

      this.setData({
        list: enriched,
        loading: false
      });

      this.applyCurrentFilters();
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

  async loadSystemAdminActivities({ append }) {
    try {
      if (append) {
        this.setData({ adminLoadingMore: true });
      } else {
        this.setData({ loading: true, adminPage: 0, adminHasMore: true });
        wx.showLoading({ title: '加载中...' });
      }

      const nextPage = append ? this.data.adminPage + 1 : 0;
      const readMap = getReadMap();

      const res = await adminAPI.listActivities({
        page: nextPage,
        size: this.data.adminSize,
        sortBy: 'startTime',
        sortDirection: 'desc'
      });

      if (!res || res.code !== 0) {
        throw new Error(res?.message || '获取活动列表失败');
      }

      const pageData = res.data || {};
      const content = pageData.content || pageData || [];
      const totalPages = pageData.totalPages;
      const hasMore = typeof totalPages === 'number'
        ? nextPage + 1 < totalPages
        : (Array.isArray(content) && content.length >= this.data.adminSize);

      const existingMap = new Map((this.data.list || []).map(a => [a.id, a]));

      (content || []).forEach((activity) => {
        if (!activity || !activity.id) return;

        const statusText = calculateActivityStatus(activity);
        if (statusText === '草稿' || statusText === '待发布') return;

        const privacyTag = activity.isPublic === false ? '私密' : '';
        const buttonState = this.calculateButtonState(activity, null, statusText);
        const typeVisual = getTypeVisual(activity.type);
        const read = isActivityRead(activity.id, readMap);

        existingMap.set(activity.id, {
          ...existingMap.get(activity.id),
          ...activity,
          status: statusText,
          statusBadgeClass: getStatusBadgeClass(statusText),
          relationTag: '',
          privacyTag,
          typeIcon: typeVisual.icon,
          typeIconBg: typeVisual.bg,
          isRead: read,
          isRelated: true,
          registrationStatus: null,
          isRegistered: false,
          ...buttonState
        });
      });

      const merged = Array.from(existingMap.values()).sort((a, b) => {
        const aTime = parseActivityStartTimeMs(a.startTime);
        const bTime = parseActivityStartTimeMs(b.startTime);
        const aValid = Number.isFinite(aTime);
        const bValid = Number.isFinite(bTime);
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        return bTime - aTime;
      });

      this.setData({
        list: merged,
        loading: false,
        adminPage: nextPage,
        adminHasMore: hasMore,
        adminLoadingMore: false
      });

      this.applyCurrentFilters();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载系统活动数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false, adminLoadingMore: false });
    }
  },

  onSearchInput(e) {
    const keyword = (e.detail.value || '').trim();
    this.setData({ keyword });
    this.applyCurrentFilters();
  },

  onStatusTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeStatus) return;
    const statusOptions = this.data.isSystemAdmin ? STATUS_FILTER_OPTIONS_ADMIN : STATUS_FILTER_OPTIONS_USER;
    this.setData({
      activeStatus: key,
      statusFilters: buildFilters(statusOptions, key)
    });
    this.applyCurrentFilters();
  },

  onTypeTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeType) return;
    this.setData({
      activeType: key,
      typeFilters: buildFilters(TYPE_FILTER_OPTIONS, key)
    });
    this.applyCurrentFilters();
  },

  applyCurrentFilters() {
    const kw = (this.data.keyword || '').toLowerCase();
    const activeStatus = this.data.activeStatus;
    const activeType = this.data.activeType;

    const filtered = (this.data.list || []).filter((item) => {
      const title = (item.title || '').toLowerCase();
      const place = (item.place || '').toLowerCase();
      const matchKeyword = !kw || title.includes(kw) || place.includes(kw);
      if (!matchKeyword) return false;

      const matchStatus = activeStatus === 'all' || item.status === activeStatus;
      if (!matchStatus) return false;

      const matchType = activeType === 'all' || item.type === activeType;
      if (!matchType) return false;

      return true;
    });

    this.setData({ filtered });
  },

  refreshReadFlags() {
    const readMap = getReadMap();
    const list = (this.data.list || []).map((item) => {
      if (!item || !item.id) return item;
      return { ...item, isRead: isActivityRead(item.id, readMap) };
    });
    const filtered = (this.data.filtered || []).map((item) => {
      if (!item || !item.id) return item;
      return { ...item, isRead: isActivityRead(item.id, readMap) };
    });
    this.setData({ list, filtered });
  },

  calculateButtonState(activity, myReg, translatedStatus) {
    const now = new Date();
    const registerDeadline = activity.registerDeadline ? new Date(activity.registerDeadline) : null;
    const isFull = (activity.joined || 0) >= (activity.total || 0);
    const isDeadlinePassed = registerDeadline ? now > registerDeadline : false;

    // 已结束：隐藏报名按钮
    if (translatedStatus === '已结束') {
      return {
        showRegisterButton: false,
        buttonText: '',
        buttonStyle: '',
        buttonDisabled: true,
        buttonAction: 'none'
      };
    }

    // 名额已满 / 报名截止：仅未报名的人禁用
    if (isFull && !myReg) {
      return {
        showRegisterButton: true,
        buttonText: '已满',
        buttonStyle: 'btn--disabled',
        buttonDisabled: true,
        buttonAction: 'none'
      };
    }

    if (isDeadlinePassed && !myReg) {
      return {
        showRegisterButton: true,
        buttonText: '已截止',
        buttonStyle: 'btn--disabled',
        buttonDisabled: true,
        buttonAction: 'none'
      };
    }

    // 已报名（pending / approved）
    if (myReg) {
      if (myReg.status === 'pending') {
        return {
          showRegisterButton: true,
          buttonText: '待审核',
          buttonStyle: 'btn--pending',
          buttonDisabled: false,
          buttonAction: 'viewRegistration'
        };
      }
      if (myReg.status === 'approved') {
        return {
          showRegisterButton: true,
          buttonText: '已报名',
          buttonStyle: 'btn--registered',
          buttonDisabled: false,
          buttonAction: 'viewDetail'
        };
      }
    }

    // 默认可报名
    return {
      showRegisterButton: true,
      buttonText: '立即报名',
      buttonStyle: 'btn--primary',
      buttonDisabled: false,
      buttonAction: 'register'
    };
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    markActivityRead(id);
    this.refreshReadFlags();
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  goRegister(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;

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

    if (action === 'viewDetail') {
      markActivityRead(id);
      this.refreshReadFlags();
      wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
      return;
    }

    if (action === 'register' || action === 'viewRegistration') {
      markActivityRead(id);
      this.refreshReadFlags();
      wx.navigateTo({ url: `/pages/registration/index?id=${id}` });
      return;
    }
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});
