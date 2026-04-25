const { adminAPI, activityAPI } = require('../../../utils/api.js');

const TYPE_OPTIONS = ['全部', '聚会', '培训', '户外', '运动', '会议', '其他'];
const STATUS_OPTIONS = ['全部', '报名中', '即将开始', '进行中', '已结束', '已取消'];

const parseDateTime = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalized = String(value).replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pad = (value) => String(value).padStart(2, '0');

const formatDateRange = (startTime, endTime) => {
  const start = parseDateTime(startTime);
  const end = parseDateTime(endTime);
  if (!start || !end) {
    return startTime || endTime || '未设置';
  }

  const sameDay = start.getFullYear() === end.getFullYear()
    && start.getMonth() === end.getMonth()
    && start.getDate() === end.getDate();

  const startDate = `${start.getMonth() + 1}月${start.getDate()}日`;
  const startClock = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endDate = `${end.getMonth() + 1}月${end.getDate()}日`;
  const endClock = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  return sameDay
    ? `${startDate} ${startClock} - ${endClock}`
    : `${startDate} ${startClock} - ${endDate} ${endClock}`;
};

const getStatusMeta = (activity) => {
  const rawStatus = String(activity.status || '').trim();
  if (rawStatus === 'cancelled' || rawStatus === '已取消') {
    return { label: '已取消', className: 'cancelled' };
  }

  const now = new Date();
  const start = parseDateTime(activity.startTime);
  const end = parseDateTime(activity.endTime);
  const deadline = parseDateTime(activity.registerDeadline);

  if (end && now.getTime() >= end.getTime()) {
    return { label: '已结束', className: 'finished' };
  }

  if (start && now.getTime() >= start.getTime()) {
    return { label: '进行中', className: 'ongoing' };
  }

  if (deadline && now.getTime() < deadline.getTime()) {
    return { label: '报名中', className: 'registering' };
  }

  if (start && now.getTime() < start.getTime()) {
    return { label: '即将开始', className: 'upcoming' };
  }

  return { label: '报名中', className: 'registering' };
};

const matchesKeyword = (activity, keyword) => {
  if (!keyword) return true;
  const source = [activity.title, activity.place, activity.address, activity.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return source.includes(keyword.toLowerCase());
};

Page({
  data: {
    ready: false,
    loading: true,
    keyword: '',
    keywordDraft: '',
    selectedType: '全部',
    selectedStatus: '全部',
    typeOptions: TYPE_OPTIONS,
    statusOptions: STATUS_OPTIONS,
    allActivities: [],
    activities: [],
    stats: {
      total: 0,
      ongoing: 0,
      finished: 0,
      cancelled: 0
    }
  },

  async onLoad() {
    const ok = await this.ensureSystemAdmin();
    if (!ok) return;
    await this.loadActivities();
  },

  async onPullDownRefresh() {
    if (!this.data.ready) {
      wx.stopPullDownRefresh();
      return;
    }
    await this.loadActivities();
    wx.stopPullDownRefresh();
  },

  async ensureSystemAdmin() {
    try {
      const res = await adminAPI.me();
      const isSystemAdmin = !!(res && res.code === 0 && res.data && res.data.systemAdmin === true);
      if (!isSystemAdmin) {
        wx.showToast({ title: '无权限访问', icon: 'none' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
        return false;
      }
      this.setData({ ready: true });
      return true;
    } catch (err) {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return false;
    }
  },

  normalizeActivities(content) {
    return (content || []).map(item => {
      const statusMeta = getStatusMeta(item);
      const statusText = statusMeta.label;
      const joined = Number(item.joined || 0);
      const total = Number(item.total || 0);
      return {
        ...item,
        statusMeta,
        statusText,
        visibilityText: item.isPublic === false ? '私密' : '公开',
        visibilityClass: item.isPublic === false ? 'private' : 'public',
        joinedText: `${joined} / ${total} 人`,
        timeText: formatDateRange(item.startTime, item.endTime),
        placeText: item.place || item.address || '未填写',
        codeText: item.id || '--',
        canCancel: ['报名中', '即将开始', '进行中'].includes(statusText),
        canDelete: statusText === '已取消'
      };
    });
  },

  buildStats(allActivities) {
    return {
      total: allActivities.length,
      ongoing: allActivities.filter(item => item.statusText === '进行中').length,
      finished: allActivities.filter(item => item.statusText === '已结束').length,
      cancelled: allActivities.filter(item => item.statusText === '已取消').length
    };
  },

  applyFilters() {
    const keyword = (this.data.keyword || '').trim();
    const selectedType = this.data.selectedType;
    const selectedStatus = this.data.selectedStatus;

    const filtered = this.data.allActivities.filter(item => {
      if (selectedType !== '全部' && item.type !== selectedType) return false;
      if (selectedStatus !== '全部' && item.statusText !== selectedStatus) return false;
      return matchesKeyword(item, keyword);
    });

    this.setData({ activities: filtered });
  },

  async loadActivities() {
    this.setData({ loading: true });

    try {
      const pageSize = 100;
      let page = 0;
      let hasNext = true;
      let merged = [];

      while (hasNext && page < 20) {
        const res = await adminAPI.listActivities({
          page,
          size: pageSize,
          sortBy: 'startTime',
          sortDirection: 'desc'
        });

        if (!res || res.code !== 0) {
          throw new Error((res && res.message) || '加载失败');
        }

        const pageData = res.data || {};
        const content = Array.isArray(pageData.content) ? pageData.content : (Array.isArray(pageData) ? pageData : []);
        merged = merged.concat(content);

        if (typeof pageData.last === 'boolean') {
          hasNext = !pageData.last;
        } else {
          hasNext = content.length >= pageSize;
        }

        page += 1;
      }

      const normalized = this.normalizeActivities(merged);
      this.setData({
        allActivities: normalized,
        stats: this.buildStats(normalized),
        loading: false
      });
      this.applyFilters();
    } catch (err) {
      console.error('加载系统活动失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    }
  },

  onKeywordInput(e) {
    this.setData({ keywordDraft: e.detail.value || '' });
  },

  onSearch() {
    this.setData({ keyword: this.data.keywordDraft || '' });
    this.applyFilters();
  },

  clearKeyword() {
    this.setData({ keyword: '', keywordDraft: '' });
    this.applyFilters();
  },

  onTypeTap(e) {
    const type = e.currentTarget.dataset.type;
    if (!type || type === this.data.selectedType) return;
    this.setData({ selectedType: type });
    this.applyFilters();
  },

  onStatusTap(e) {
    const status = e.currentTarget.dataset.status;
    if (!status || status === this.data.selectedStatus) return;
    this.setData({ selectedStatus: status });
    this.applyFilters();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/activities/detail?id=' + id });
  },

  goManage(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/management/index?id=' + id });
  },

  async onCancelTap(e) {
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title || '该活动';
    if (!id) return;

    wx.showModal({
      title: '确认取消活动',
      content: `确定要取消「${title}」吗？已报名用户会收到取消通知。`,
      confirmText: '确认取消',
      confirmColor: '#f59e0b',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const result = await activityAPI.cancel(id);
          if (!result || result.code !== 0) {
            throw new Error((result && result.message) || '取消失败');
          }
          wx.showToast({ title: '已取消活动', icon: 'success' });
          await this.loadActivities();
        } catch (error) {
          wx.showToast({ title: error.message || '取消失败', icon: 'none' });
        }
      }
    });
  },

  async onDeleteTap(e) {
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title || '该活动';
    if (!id) return;

    wx.showModal({
      title: '确认删除活动',
      content: `确定要删除「${title}」吗？删除后不可恢复。`,
      confirmText: '确认删除',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const result = await activityAPI.delete(id);
          if (!result || result.code !== 0) {
            throw new Error((result && result.message) || '删除失败');
          }
          wx.showToast({ title: '已删除活动', icon: 'success' });
          await this.loadActivities();
        } catch (error) {
          wx.showToast({ title: error.message || '删除失败', icon: 'none' });
        }
      }
    });
  }
});
