const { adminAPI } = require('../../../utils/api.js');
const { parseDate } = require('../../../utils/date-helper.js');

const STATUS_OPTIONS = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' }
];

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
    id: null,
    detail: null,
    submitter: {
      userId: '',
      nickname: '',
      avatar: '',
      avatarInitial: '匿'
    },
    statusOptions: STATUS_OPTIONS,
    statusIndex: 0,
    noteDraft: '',
    noteCount: 0
  },

  async onLoad(query) {
    const id = query.id ? Number(query.id) : null;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }
    const ok = await this.ensureSystemAdmin();
    if (!ok) return;

    this.setData({ id });
    await this.loadDetail();
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

  async loadDetail() {
    try {
      const res = await adminAPI.getFeedbackDetail(this.data.id);
      if (!res || res.code !== 0 || !res.data) {
        throw new Error(res?.message || '加载失败');
      }

      const submitter = res.data.submitter || {};
      const nickname = submitter.nickname || '';
      const avatarInitial = nickname ? nickname.slice(0, 1) : '匿';

      const statusKey = res.data.status || 'pending';
      const idx = STATUS_OPTIONS.findIndex(s => s.key === statusKey);

      const detail = {
        ...res.data,
        statusText: STATUS_OPTIONS.find(s => s.key === statusKey)?.label || '待处理',
        typeText: TYPE_MAP[res.data.type] || '',
        createdAtText: formatShortTime(res.data.createdAt),
        handledAtText: formatShortTime(res.data.handledAt)
      };

      const noteDraft = res.data.note || '';
      this.setData({
        detail,
        submitter: {
          userId: submitter.userId || '',
          nickname,
          avatar: submitter.avatar || '',
          avatarInitial
        },
        statusIndex: idx >= 0 ? idx : 0,
        noteDraft,
        noteCount: noteDraft.length
      });
    } catch (err) {
      console.error('加载反馈详情失败:', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    }
  },

  onStatusChange(e) {
    const idx = Number(e.detail.value) || 0;
    this.setData({ statusIndex: idx });
  },

  onNoteInput(e) {
    const v = e.detail.value || '';
    this.setData({ noteDraft: v, noteCount: v.length });
  },

  async save() {
    try {
      const status = STATUS_OPTIONS[this.data.statusIndex]?.key || 'pending';
      const note = this.data.noteDraft || '';

      const res = await adminAPI.updateFeedback(this.data.id, { status, note });
      if (!res || res.code !== 0 || !res.data) {
        throw new Error(res?.message || '保存失败');
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      await this.loadDetail();
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  }
});
