const { adminAPI } = require('../../../utils/api.js');
const { parseDate } = require('../../../utils/date-helper.js');

const STATUS_MAP = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const TYPE_MAP = {
  bug: 'Bug',
  suggestion: '建议',
  other: '其他'
};

const formatShortTime = (time) => {
  if (!time) return '';
  const d = parseDate(time);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
};

Page({
  data: {
    statusTabs: [
      { key: 'pending', label: '待处理' },
      { key: 'processing', label: '处理中' },
      { key: 'resolved', label: '已解决' },
      { key: 'closed', label: '已关闭' },
      { key: 'all', label: '全部' }
    ],
    statusFilter: 'pending',
    keyword: '',
    items: [],
    page: 0,
    size: 20,
    hasMore: true,
    loadingMore: false,
    needsRefresh: false
  },

  async onLoad() {
    const ok = await this.ensureSystemAdmin();
    if (!ok) return;
    await this.reload();
  },

  async onShow() {
    if (this.data.needsRefresh) {
      this.setData({ needsRefresh: false });
      await this.reload();
    }
  },

  async onPullDownRefresh() {
    await this.reload();
    wx.stopPullDownRefresh();
  },

  async onReachBottom() {
    await this.loadMore();
  },

  async ensureSystemAdmin() {
    try {
      const res = await adminAPI.me();
      const isSystemAdmin = res && res.code === 0 && res.data && res.data.systemAdmin === true;
      if (!isSystemAdmin) {
        wx.showToast({ title: '无权限访问', icon: 'none' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
        return false;
      }
      return true;
    } catch (err) {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return false;
    }
  },

  switchStatus(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.statusFilter) return;
    this.setData({ statusFilter: key, page: 0, hasMore: true, items: [] });
    this.reload();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value || '' });
  },

  onSearchConfirm() {
    this.doSearch();
  },

  doSearch() {
    this.setData({ page: 0, hasMore: true, items: [] });
    this.reload();
  },

  async reload() {
    this.setData({ page: 0, hasMore: true, loadingMore: false });
    await this.fetchPage(0, true);
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    const nextPage = this.data.page + 1;
    this.setData({ loadingMore: true });
    await this.fetchPage(nextPage, false);
    this.setData({ loadingMore: false });
  },

  async fetchPage(page, replace) {
    try {
      const { statusFilter, keyword, size } = this.data;
      const params = { page, size };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (keyword && keyword.trim()) params.keyword = keyword.trim();

      const res = await adminAPI.listFeedback(params);
      if (!res || res.code !== 0 || !res.data) {
        throw new Error(res?.message || '加载失败');
      }

      const pageData = res.data;
      const content = pageData.content || pageData.list || pageData || [];
      const totalPages = pageData.totalPages;
      const hasMore = typeof totalPages === 'number'
        ? page < (totalPages - 1)
        : (content.length === size);

      const mapped = content.map(item => {
        const submitter = item.submitter || {};
        const nickname = submitter.nickname || '';
        const avatarInitial = nickname ? nickname.slice(0, 1) : '匿';
        return {
          id: item.id,
          content: item.content || '',
          status: item.status || 'pending',
          statusText: STATUS_MAP[item.status] || '待处理',
          typeText: TYPE_MAP[item.type] || '',
          createdAtText: formatShortTime(item.createdAt),
          userId: submitter.userId || '',
          nickname,
          avatar: submitter.avatar || '',
          avatarInitial
        };
      });

      const items = replace ? mapped : (this.data.items.concat(mapped));
      this.setData({ items, page, hasMore });
    } catch (err) {
      console.error('加载反馈失败:', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      this.setData({ hasMore: false });
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ needsRefresh: true });
    wx.navigateTo({ url: `/pages/admin/feedback/detail?id=${id}` });
  }
});
