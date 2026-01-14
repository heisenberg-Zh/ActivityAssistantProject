// pages/activities/text-editor.js
Page({
  data: {
    title: '全屏编辑',
    placeholder: '请输入内容',
    maxLength: 5000,
    text: '',
    count: 0,
    cursor: 0
  },

  onLoad(query) {
    const key = query && query.key ? String(query.key) : '';
    if (!key) {
      wx.showToast({ title: '参数缺失', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const payload = wx.getStorageSync(key) || null;
    wx.removeStorageSync(key);

    if (!payload || typeof payload !== 'object') {
      wx.showToast({ title: '编辑会话失效', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const title = payload.title ? String(payload.title) : '全屏编辑';
    const maxLength = Number(payload.maxLength || 5000) || 5000;
    const text = payload.value != null ? String(payload.value) : '';
    const placeholder = payload.placeholder ? String(payload.placeholder) : '请输入内容';

    this._initialText = text;
    this._meta = {
      scope: payload.scope || 'form',
      field: payload.field || '',
      index: typeof payload.index === 'number' ? payload.index : null
    };

    try {
      wx.setNavigationBarTitle({ title });
    } catch (e) {}

    this.setData({
      title,
      maxLength,
      placeholder,
      text,
      count: text.length,
      cursor: text.length
    });
  },

  onFocus(e) {
    if (typeof e.detail.cursor === 'number') {
      this.setData({ cursor: e.detail.cursor });
    }
  },

  onInput(e) {
    const text = e.detail.value || '';
    const cursor = typeof e.detail.cursor === 'number' ? e.detail.cursor : text.length;
    this.setData({ text, count: text.length, cursor });
  },

  handlePaste() {
    wx.getClipboardData({
      success: (res) => {
        const clip = (res && res.data != null) ? String(res.data) : '';
        if (!clip) {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
          return;
        }

        const oldValue = String(this.data.text || '');
        const cursor = (typeof this.data.cursor === 'number') ? this.data.cursor : oldValue.length;
        const nextValue = oldValue.slice(0, cursor) + clip + oldValue.slice(cursor);
        const next = nextValue.length > this.data.maxLength ? nextValue.slice(0, this.data.maxLength) : nextValue;
        const nextCursor = Math.min(cursor + clip.length, next.length);
        this.setData({ text: next, count: next.length, cursor: nextCursor });
        wx.showToast({ title: '已粘贴', icon: 'success' });
      },
      fail: () => wx.showToast({ title: '读取剪贴板失败', icon: 'none' })
    });
  },

  handleClear() {
    if (!this.data.text) return;
    wx.showModal({
      title: '清空内容',
      content: '确认清空当前内容吗？',
      confirmText: '清空',
      confirmColor: '#dc2626',
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ text: '', count: 0, cursor: 0 });
      }
    });
  },

  handleSave() {
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (eventChannel && eventChannel.emit) {
      eventChannel.emit('save', {
        ...this._meta,
        value: this.data.text
      });
    }
    wx.navigateBack();
  },

  handleBack() {
    const changed = String(this.data.text || '') !== String(this._initialText || '');
    if (!changed) {
      wx.navigateBack();
      return;
    }

    wx.showModal({
      title: '内容已修改',
      content: '是否放弃修改并返回？',
      confirmText: '放弃修改',
      confirmColor: '#dc2626',
      cancelText: '继续编辑',
      success: (res) => {
        if (res.confirm) wx.navigateBack();
      }
    });
  }
});
