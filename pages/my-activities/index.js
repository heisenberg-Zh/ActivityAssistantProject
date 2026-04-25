// pages/my-activities/index.js
const { activityAPI, registrationAPI, reviewAPI } = require('../../utils/api.js');
const { calculateActivityStatus, formatRegistrationStatus } = require('../../utils/formatter.js');
const { isBeforeRegisterDeadline } = require('../../utils/datetime.js');
const { getCreateActivityAccess, getDeniedMessage } = require('../../utils/create-activity-access.js');
const app = getApp();

const ROLE_OPTIONS = [
  { key: 'all', name: '全部' },
  { key: 'created', name: '我创建' },
  { key: 'managed', name: '我管理' },
  { key: 'joined', name: '我参加' },
  { key: 'draft', name: '草稿' }
];

const STATUS_OPTIONS_ALL = [
  { key: 'all', name: '全部' },
  { key: '待发布', name: '待发布' },
  { key: '报名中', name: '报名中' },
  { key: '即将开始', name: '即将开始' },
  { key: '进行中', name: '进行中' },
  { key: '已结束', name: '已结束' }
];

const STATUS_OPTIONS_CREATED_MANAGED = STATUS_OPTIONS_ALL.concat([
  { key: '已取消', name: '已取消' }
]);

const STATUS_OPTIONS_JOINED = [
  { key: 'all', name: '全部' },
  { key: '报名中', name: '报名中' },
  { key: '即将开始', name: '即将开始' },
  { key: '进行中', name: '进行中' },
  { key: '已结束', name: '已结束' },
  { key: '待审核', name: '待审核' }
];

const STATUS_OPTIONS_DRAFT = [
  { key: 'all', name: '全部' }
];

const withActive = (items, activeKey) => items.map(item => ({ ...item, active: item.key === activeKey }));

const getStatusOptionsByRole = (roleKey) => {
  if (roleKey === 'created' || roleKey === 'managed') return STATUS_OPTIONS_CREATED_MANAGED;
  if (roleKey === 'joined') return STATUS_OPTIONS_JOINED;
  if (roleKey === 'draft') return STATUS_OPTIONS_DRAFT;
  return STATUS_OPTIONS_ALL;
};

const normalizeArray = (res) => {
  if (!res || res.code !== 0) return [];
  return res.data?.content || res.data || [];
};

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const date = new Date(timeStr);
  return isNaN(date.getTime()) ? null : date;
};

const isScheduledPublish = (activity) => {
  if (!activity) return false;
  const scheduledTime = parseTime(activity.scheduledPublishTime);
  return activity.status === 'pending' && !!scheduledTime && scheduledTime.getTime() > Date.now();
};

const getStatusBadgeClass = (statusText) => {
  if (statusText === '进行中') return 'badge--ok';
  if (statusText === '即将开始') return 'badge--info';
  if (statusText === '报名中') return 'badge--warning';
  return 'badge--muted';
};

Page({
  data: {
    roleFilters: withActive(ROLE_OPTIONS, 'all'),
    statusFilters: withActive(STATUS_OPTIONS_ALL, 'all'),
    activeRole: 'all',
    activeStatus: 'all',

    showHistory: false,
    list: [],
    display: [],

    showReviewModal: false,
    currentActivityId: '',
    currentActivityTitle: '',
    rating: 0,
    reviewText: '',
    hoverRating: 0,

    isLoggedIn: false
  },

  onLoad(options = {}) {
    const tab = options.tab;

    const next = { activeRole: 'all', activeStatus: 'all', showHistory: false };
    if (tab === 'drafts') next.activeRole = 'draft';
    if (tab === 'created') next.activeRole = 'created';
    if (tab === 'managed') next.activeRole = 'managed';
    if (tab === 'joined') next.activeRole = 'joined';
    if (tab === 'scheduled') next.activeStatus = '待发布';
    if (tab === 'ended') next.activeStatus = '已结束';

    const statusOptions = getStatusOptionsByRole(next.activeRole);
    if (!statusOptions.some(o => o.key === next.activeStatus)) next.activeStatus = 'all';

    this.setData({
      ...next,
      roleFilters: withActive(ROLE_OPTIONS, next.activeRole),
      statusFilters: withActive(statusOptions, next.activeStatus)
    });
    this.checkAndLoadData();
  },

  onShow() {
    this.checkAndLoadData();
  },

  checkAndLoadData() {
    const isLoggedIn = app.checkLoginStatus();
    this.setData({ isLoggedIn });

    if (!isLoggedIn) {
      this.setData({ list: [], display: [] });
      return;
    }

    this.loadActivities();
  },

  async loadActivities() {
    try {
      wx.showLoading({ title: '加载中...' });

      const drafts = wx.getStorageSync('activity_drafts') || [];
      const draftItems = (drafts || []).map(draft => ({
        id: draft.draftId,
        displayId: draft.draftId,
        title: draft?.form?.title || '未命名草稿',
        type: draft?.form?.type || '',
        status: '草稿',
        statusBadgeClass: getStatusBadgeClass('草稿'),
        rawStatus: 'draft',
        roleKey: 'draft',
        role: '我的草稿',
        timeRange: draft?.form?.startDate ? `${draft.form.startDate} ${draft.form.startTime || ''}` : '',
        place: draft?.form?.place || '',
        joined: 0,
        total: draft?.form?.total || 0,
        registerDeadline: null,
        isScheduled: false,
        registrationId: null,
        registrationStatus: null,
        registrationStatusText: '',
        registrationBadgeClass: '',
        actions: [
          { label: '继续编辑', action: 'editDraft', type: 'primary' },
          { label: '删除', action: 'deleteDraft', type: 'danger' }
        ]
      }));

      // 增强接口（我管理的）失败不应导致整页空白
      const settled = await Promise.allSettled([
        activityAPI.getMyActivities({ page: 0, size: 200 }),
        activityAPI.getManagedActivities({ page: 0, size: 200 }),
        registrationAPI.getMyRegistrations({ page: 0, size: 300 })
      ]);

      const [createdRes, managedRes, registrationsRes] = settled.map((r) => {
        if (r.status === 'fulfilled') return r.value;
        return { code: -1, data: null };
      });

      const createdActivities = normalizeArray(createdRes);
      const managedActivities = normalizeArray(managedRes);
      const registrations = normalizeArray(registrationsRes);

      const createdItems = createdActivities.map(a => this.buildActivityItem(a, 'created', '我创建的'));
      const createdIds = new Set(createdItems.map(x => x.id));

      const managedItems = managedActivities
        .filter(a => a && a.id && !createdIds.has(a.id))
        .map(a => this.buildActivityItem(a, 'managed', '我管理的'));
      const managedIds = new Set(managedItems.map(x => x.id));

      const includeHistory = this.data.showHistory === true;
      const allowedJoinStatuses = includeHistory
        ? ['approved', 'pending', 'rejected', 'cancelled']
        : ['approved', 'pending'];

      const joinRegs = (registrations || []).filter(r => r && r.activityId && allowedJoinStatuses.includes(r.status));
      const regByActivity = new Map();
      joinRegs.forEach(r => {
        if (!regByActivity.has(r.activityId)) {
          regByActivity.set(r.activityId, r);
          return;
        }
        const prev = regByActivity.get(r.activityId);
        const prevTime = parseTime(prev.registeredAt) || new Date(0);
        const curTime = parseTime(r.registeredAt) || new Date(0);
        if (curTime.getTime() >= prevTime.getTime()) regByActivity.set(r.activityId, r);
      });

      const joinedItemsRaw = await Promise.all(Array.from(regByActivity.values()).map(async (reg) => {
        try {
          const detailRes = await activityAPI.getDetail(reg.activityId);
          const activity = detailRes.code === 0 ? detailRes.data : null;
          return this.buildJoinedItem(activity, reg);
        } catch (e) {
          return this.buildJoinedItem(null, reg);
        }
      }));

      const joinedItems = joinedItemsRaw
        .filter(Boolean)
        .filter(item => !createdIds.has(item.id) && !managedIds.has(item.id));

      const all = [].concat(draftItems, createdItems, managedItems, joinedItems);

      this.setData({ list: all });
      this.applyFilters();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载我的活动失败:', err);
      wx.showToast({ title: err?.message || '加载失败，请稍后重试', icon: 'none' });
    }
  },

  buildActivityItem(activity, roleKey, roleLabel) {
    const statusText = calculateActivityStatus(activity);
    const item = {
      ...activity,
      id: activity.id,
      displayId: activity.displayId || activity.id,
      title: activity.title || '活动',
      type: activity.type || '',
      status: statusText,
      statusBadgeClass: getStatusBadgeClass(statusText),
      rawStatus: activity.status,
      roleKey,
      role: roleLabel,
      timeRange: activity.timeRange || '',
      place: activity.place || '',
      joined: activity.joined || 0,
      total: activity.total || 0,
      registerDeadline: activity.registerDeadline || null,
      isScheduled: isScheduledPublish(activity),
      registrationId: null,
      registrationStatus: null,
      registrationStatusText: '',
      registrationBadgeClass: ''
    };

    item.actions = this.getActionsForItem(item);
    return item;
  },

  buildJoinedItem(activity, reg) {
    const base = activity || {};
    const statusText = activity ? calculateActivityStatus(activity) : '未知';
    const regUi = formatRegistrationStatus(reg.status);
    const needsRegBadge = reg.status && reg.status !== 'approved';

    const isHistoryStatus = reg.status === 'rejected' || reg.status === 'cancelled';
    const registrationStatusText = needsRegBadge ? (regUi?.text || reg.status) : '';

    const item = {
      ...base,
      id: reg.activityId,
      displayId: base.displayId || reg.activityId,
      title: base.title || reg.activityTitle || '活动',
      type: base.type || '',
      status: statusText || '',
      statusBadgeClass: getStatusBadgeClass(statusText),
      rawStatus: base.status || null,
      roleKey: 'joined',
      role: '我参加的',
      timeRange: base.timeRange || '',
      place: base.place || '',
      joined: base.joined || 0,
      total: base.total || 0,
      registerDeadline: base.registerDeadline || null,
      isScheduled: false,
      registrationId: reg.id,
      registrationStatus: reg.status,
      registrationStatusText: registrationStatusText,
      registrationBadgeClass: reg.status === 'pending' ? 'badge--warning' : (isHistoryStatus ? 'badge--muted' : 'badge--muted')
    };

    item.actions = this.getActionsForItem(item);
    return item;
  },

  getActionsForItem(item) {
    const actions = [];

    if (item.roleKey === 'draft') {
      return item.actions || [];
    }

    if (item.roleKey === 'created') {
      if (item.isScheduled || item.rawStatus === 'pending') {
        actions.push({ label: '手动发布', action: 'publishNow', type: 'primary' });
        actions.push({ label: '编辑', action: 'edit', type: 'secondary' });
        if (item.isScheduled) actions.push({ label: '取消定时', action: 'cancelScheduled', type: 'danger' });
      } else if (item.status === '进行中') {
        actions.push({ label: '管理', action: 'manage', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      } else if (item.status === '即将开始') {
        actions.push({ label: '编辑', action: 'edit', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      } else {
        actions.push({ label: '管理', action: 'manage', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      }
      actions.push({ label: '复制', action: 'copy', type: 'secondary' });
      return actions;
    }

    if (item.roleKey === 'managed') {
      actions.push({ label: '管理', action: 'manage', type: 'primary' });
      actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      actions.push({ label: '复制', action: 'copy', type: 'secondary' });
      return actions;
    }

    if (item.roleKey === 'joined') {
      if (item.registrationStatus === 'pending') {
        actions.push({ label: '待审核', action: 'viewRegistration', type: 'primary' });
        actions.push({ label: '取消报名', action: 'cancelRegistration', type: 'danger' });
        return actions;
      }

      if (item.registrationStatus === 'approved') {
        if (item.status === '进行中') {
          if (item.needCheckin !== false) {
            actions.push({ label: '签到', action: 'checkin', type: 'primary' });
            actions.push({ label: '详情', action: 'detail', type: 'secondary' });
          } else {
            actions.push({ label: '详情', action: 'detail', type: 'primary' });
          }
          return actions;
        }

        if (item.status === '即将开始') {
          actions.push({ label: '详情', action: 'detail', type: 'primary' });
          actions.push({ label: '取消报名', action: 'cancelRegistration', type: 'danger' });
          return actions;
        }

        if (item.status === '已结束') {
          actions.push({ label: '评价', action: 'review', type: 'primary' });
          actions.push({ label: '详情', action: 'detail', type: 'secondary' });
          return actions;
        }

        actions.push({ label: '详情', action: 'detail', type: 'primary' });
        return actions;
      }

      actions.push({ label: '立即报名', action: 'register', type: 'primary' });
      actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      return actions;
    }

    return actions;
  },

  onRoleTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeRole) return;

    const statusOptions = getStatusOptionsByRole(key);
    const nextStatus = statusOptions.some(o => o.key === this.data.activeStatus) ? this.data.activeStatus : 'all';
    const nextHistory = key === 'joined' ? this.data.showHistory : false;

    this.setData({
      activeRole: key,
      roleFilters: withActive(ROLE_OPTIONS, key),
      activeStatus: nextStatus,
      statusFilters: withActive(statusOptions, nextStatus),
      showHistory: nextHistory
    });

    this.applyFilters();
  },

  onStatusTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeStatus) return;

    this.setData({
      activeStatus: key,
      statusFilters: withActive(getStatusOptionsByRole(this.data.activeRole), key)
    });

    this.applyFilters();
  },

  toggleHistory() {
    if (this.data.activeRole !== 'joined') return;
    const next = !this.data.showHistory;
    this.setData({ showHistory: next });
    // 历史模式需要刷新报名列表（决定是否拉取 rejected/cancelled）
    this.loadActivities();
  },

  applyFilters() {
    const roleKey = this.data.activeRole;
    const statusKey = this.data.activeStatus;

    const includeHistory = this.data.showHistory === true;

    const display = (this.data.list || []).filter((item) => {
      // 身份过滤
      if (roleKey !== 'all' && item.roleKey !== roleKey) return false;

      // 状态过滤
      if (statusKey !== 'all') {
        if (statusKey === '待发布') {
          if (!(item.isScheduled === true || item.rawStatus === 'pending' || item.status === '待发布')) return false;
        } else if (statusKey === '待审核') {
          if (!(item.roleKey === 'joined' && item.registrationStatus === 'pending')) return false;
        } else {
          if (item.status !== statusKey) return false;
        }
      }

      // 我参加：默认不含历史 rejected/cancelled（按钮开关外的兜底）
      if (item.roleKey === 'joined' && !includeHistory && (item.registrationStatus === 'rejected' || item.registrationStatus === 'cancelled')) {
        return false;
      }

      return true;
    });

    this.setData({ display });
  },

  async handleAction(e) {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;
    const registrationId = e.currentTarget.dataset.registrationId;

    if (!action || !id) return;

    switch (action) {
      case 'editDraft':
        {
          const access = await getCreateActivityAccess();
          if (!access.canCreate) {
            wx.showModal({ title: '暂无法操作', content: getDeniedMessage('draft'), showCancel: false });
            return;
          }
        }
        wx.navigateTo({ url: `/pkg-biz/create/index?mode=draft&draftId=${id}` });
        return;
      case 'deleteDraft':
        this.deleteDraft(id);
        return;
      case 'manage':
        wx.navigateTo({ url: `/pages/management/index?id=${id}` });
        return;
      case 'edit':
        wx.navigateTo({ url: `/pkg-biz/create/index?mode=edit&id=${id}` });
        return;
      case 'copy':
        {
          const access = await getCreateActivityAccess();
          if (!access.canCreate) {
            wx.showModal({ title: '暂无法操作', content: getDeniedMessage('copy'), showCancel: false });
            return;
          }
        }
        wx.navigateTo({ url: `/pkg-biz/create/index?mode=copy&id=${id}` });
        return;
      case 'detail':
        wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
        return;
      case 'checkin':
        {
          const item = (this.data.display || []).find(it => it && it.id === id) || (this.data.list || []).find(it => it && it.id === id);
          if (item && item.needCheckin === false) {
            wx.showToast({ title: '本活动无需签到', icon: 'none' });
            return;
          }
          wx.navigateTo({ url: `/pkg-biz/checkin/index?id=${id}` });
          return;
        }
      case 'review':
        this.openReviewModal(id);
        return;
      case 'register':
      case 'viewRegistration':
        wx.navigateTo({ url: `/pkg-biz/registration/index?id=${id}` });
        return;
      case 'cancelRegistration':
        this.cancelRegistration(id, registrationId);
        return;
      case 'publishNow':
        this.publishNow(id);
        return;
      case 'cancelScheduled':
        this.cancelScheduled(id);
        return;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  async publishNow(activityId) {
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '发布活动需要登录后才能操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/auth/login' });
        }
      });
      return;
    }

    wx.showModal({
      title: '确认发布',
      content: '确定要立即发布该活动吗？',
      confirmText: '发布',
      confirmColor: '#3b82f6',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const scheduler = require('../../utils/scheduler.js');
          wx.showLoading({ title: '发布中...' });
          const result = await activityAPI.publish(activityId);
          wx.hideLoading();
          if (result.code !== 0) throw new Error(result.message || '发布失败');
          scheduler.cancelTask(activityId);
          wx.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => this.loadActivities(), 600);
        } catch (err) {
          wx.hideLoading();
          console.error('发布失败:', err);
          wx.showToast({ title: err?.message || '发布失败', icon: 'none' });
        }
      }
    });
  },

  cancelScheduled(activityId) {
    wx.showModal({
      title: '取消定时发布',
      content: '确定要取消该活动的定时发布吗？（仅移除本设备的定时任务）',
      confirmText: '确定',
      confirmColor: '#ef4444',
      success: (res) => {
        if (!res.confirm) return;
        try {
          const scheduler = require('../../utils/scheduler.js');
          scheduler.cancelTask(activityId);
          wx.showToast({ title: '已取消定时', icon: 'success' });
          setTimeout(() => this.loadActivities(), 600);
        } catch (e) {
          wx.showToast({ title: '取消失败', icon: 'none' });
        }
      }
    });
  },

  deleteDraft(draftId) {
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '删除草稿需要登录后才能操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/auth/login' });
        }
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个草稿吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (!res.confirm) return;
        try {
          let drafts = wx.getStorageSync('activity_drafts') || [];
          drafts = drafts.filter(d => d.draftId !== draftId);
          wx.setStorageSync('activity_drafts', drafts);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => this.loadActivities(), 400);
        } catch (err) {
          console.error('删除草稿失败:', err);
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    });
  },

  cancelRegistration(activityId, registrationId) {
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '取消报名需要登录后才能操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/auth/login' });
        }
      });
      return;
    }

    const resolvedRegistrationId = registrationId
      || (this.data.display || []).find(x => x.id === activityId)?.registrationId
      || (this.data.list || []).find(x => x.id === activityId)?.registrationId;

    if (!resolvedRegistrationId) {
      wx.showToast({ title: '报名记录缺失', icon: 'none' });
      return;
    }

    const item = (this.data.display || []).find(x => x.id === activityId);
    const deadlineCheck = isBeforeRegisterDeadline(item?.registerDeadline);
    if (deadlineCheck && deadlineCheck.valid === false) {
      wx.showModal({
        title: '无法取消报名',
        content: `${deadlineCheck.message}\n\n报名截止后不支持取消报名，如有问题请联系活动组织者。`,
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    wx.showModal({
      title: '确认取消报名',
      content: '确定要取消报名吗？取消后可重新报名。',
      confirmText: '确认取消',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const result = await registrationAPI.cancel(resolvedRegistrationId);
          if (result.code !== 0) throw new Error(result.message || '取消失败');
          wx.showToast({ title: '已取消报名', icon: 'success' });
          setTimeout(() => this.loadActivities(), 600);
        } catch (err) {
          console.error('取消报名失败:', err);
          wx.showToast({ title: err?.message || '取消失败', icon: 'none' });
        }
      }
    });
  },

  async openReviewModal(activityId) {
    const activity = (this.data.display || []).find(item => item.id === activityId);
    if (!activity) return;

    try {
      const result = await reviewAPI.getMyReview(activityId);
      if (result.code === 0 && result.data) {
        this.setData({
          showReviewModal: true,
          currentActivityId: activityId,
          currentActivityTitle: activity.title,
          rating: result.data.rating || 0,
          reviewText: result.data.content || '',
          hoverRating: 0
        });
        return;
      }
    } catch (e) {
      // ignore and fallback to empty
    }

    this.setData({
      showReviewModal: true,
      currentActivityId: activityId,
      currentActivityTitle: activity.title,
      rating: 0,
      reviewText: '',
      hoverRating: 0
    });
  },

  closeReviewModal() {
    this.setData({
      showReviewModal: false,
      currentActivityId: '',
      currentActivityTitle: '',
      rating: 0,
      reviewText: '',
      hoverRating: 0
    });
  },

  preventClose() {},

  onStarTap(e) {
    const rating = e.currentTarget.dataset.star;
    this.setData({ rating, hoverRating: 0 });
  },

  onStarTouchStart(e) {
    const rating = e.currentTarget.dataset.star;
    this.setData({ hoverRating: rating });
  },

  onStarTouchEnd() {
    this.setData({ hoverRating: 0 });
  },

  onReviewInput(e) {
    this.setData({ reviewText: e.detail.value || '' });
  },

  async submitReview() {
    const { currentActivityId, rating, reviewText } = this.data;
    if (!currentActivityId) return;

    if (!rating || rating <= 0) {
      wx.showToast({ title: '请先点击星级评分', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '提交中...' });
      const result = await reviewAPI.createOrUpdate({
        activityId: currentActivityId,
        rating,
        content: reviewText || ''
      });
      wx.hideLoading();
      if (result.code !== 0) throw new Error(result.message || '提交失败');
      wx.showToast({ title: '评价提交成功', icon: 'success' });
      this.closeReviewModal();
    } catch (err) {
      wx.hideLoading();
      console.error('提交评价失败:', err);
      wx.showToast({ title: err?.message || '提交失败，请重试', icon: 'none' });
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login' });
  }
});
