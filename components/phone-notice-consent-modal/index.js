Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    checked: false
  },

  observers: {
    visible(val) {
      if (val) {
        this.setData({ checked: false });
      }
    }
  },

  methods: {
    noop() {},

    toggleChecked() {
      this.setData({ checked: !this.data.checked });
    },

    onViewPolicy() {
      this.triggerEvent('viewpolicy');
    },

    onCancel() {
      this.triggerEvent('cancel');
    },

    onConfirm() {
      if (!this.data.checked) {
        wx.showToast({ title: '请先阅读并同意《隐私政策》', icon: 'none' });
        return;
      }
      this.triggerEvent('confirm');
    }
  }
});

