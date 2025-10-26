// components/datetime-picker/datetime-picker.js
Component({
  properties: {
    // 标签文本
    label: {
      type: String,
      value: '选择日期时间'
    },
    // 是否必填
    required: {
      type: Boolean,
      value: false
    },
    // 日期初始值 YYYY-MM-DD
    dateValue: {
      type: String,
      value: ''
    },
    // 时间初始值 HH:mm
    timeValue: {
      type: String,
      value: ''
    },
    // 最小日期 YYYY-MM-DD
    startDate: {
      type: String,
      value: '1900-01-01'
    },
    // 最大日期 YYYY-MM-DD
    endDate: {
      type: String,
      value: '2100-12-31'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 错误提示
    error: {
      type: String,
      value: ''
    }
  },

  data: {},

  methods: {
    // 日期改变
    onDateChange(e) {
      const date = e.detail.value;
      this.triggerEvent('datechange', { date });
      this.triggerEvent('change', {
        date,
        time: this.data.timeValue
      });
    },

    // 时间改变
    onTimeChange(e) {
      const time = e.detail.value;
      this.triggerEvent('timechange', { time });
      this.triggerEvent('change', {
        date: this.data.dateValue,
        time
      });
    }
  }
});
