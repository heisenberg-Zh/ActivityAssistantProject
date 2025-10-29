// pages/checkin/index.js
const { activities, registrations, checkinRecords } = require('../../utils/mock.js');
const { checkinAPI } = require('../../utils/api.js');
const { validateCheckinLocation, formatDistance } = require('../../utils/location.js');
const { isInCheckinWindow, isLate, formatDateTime } = require('../../utils/datetime.js');
const { formatCheckinStatus } = require('../../utils/formatter.js');

Page({
  data: {
    activityId: '',
    activity: null,
    activityStatusClass: '', // 活动状态的CSS类名
    checked: false,
    checkTime: '',
    currentLocation: null,
    currentAddr: '',
    withinRange: false,
    distance: 0,
    canCheckin: false,
    checkinMessage: '',
    records: [],
    checkedCount: 0,
    progress: 0,
    loading: false
  },

  // 状态映射函数
  getStatusClass(status) {
    const statusMap = {
      '进行中': 'status-ongoing',
      '已结束': 'status-finished',
      '未开始': 'status-upcoming',
      '报名中': 'status-ongoing'
    };
    return statusMap[status] || 'status-ongoing';
  },

  onLoad(options) {
    const activityId = options.id || 'a1';
    this.setData({ activityId });
    this.loadActivity(activityId);
    this.loadCheckinRecords(activityId);
    this.checkCurrentLocation();
  },

  // 加载活动信息
  async loadActivity(activityId) {
    try {
      const activity = activities.find(a => a.id === activityId);
      if (!activity) {
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }

      // 获取状态对应的CSS类名
      const activityStatusClass = this.getStatusClass(activity.status);

      this.setData({
        activity,
        activityStatusClass
      });

      // 检查是否在签到时间窗口内
      const inWindow = isInCheckinWindow(activity.startTime, 30);
      const message = inWindow
        ? '可以签到'
        : '签到时间：活动开始前后30分钟内';

      this.setData({
        canCheckin: inWindow,
        checkinMessage: message
      });
    } catch (err) {
      console.error('加载活动失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载签到记录
  async loadCheckinRecords(activityId) {
    try {
      // 获取该活动的所有报名记录
      const activityRegs = registrations.filter(
        r => r.activityId === activityId && r.status === 'approved'
      );

      // 获取该活动的签到记录
      const activityCheckins = checkinRecords.filter(
        c => c.activityId === activityId
      );

      // 合并报名和签到信息
      const records = activityRegs.map(reg => {
        const checkin = activityCheckins.find(c => c.registrationId === reg.id);
        return {
          id: reg.userId,
          name: reg.name,
          role: reg.userId === this.data.activity?.organizerId ? '组织者' : '',
          checked: !!checkin,
          time: checkin ? formatDateTime(checkin.checkinTime, 'HH:mm') : '',
          isLate: checkin ? checkin.isLate : false,
          avatar: `/activityassistant_avatar_0${(Math.floor(Math.random() * 4) + 1)}.png`
        };
      });

      const checkedCount = records.filter(r => r.checked).length;
      const progress = activityRegs.length > 0
        ? Math.round((checkedCount / activityRegs.length) * 100)
        : 0;

      this.setData({
        records,
        checkedCount,
        progress
      });
    } catch (err) {
      console.error('加载签到记录失败:', err);
    }
  },

  // 检查当前位置
  async checkCurrentLocation() {
    const { activity } = this.data;
    if (!activity) return;

    this.setData({ loading: true });

    try {
      const result = await validateCheckinLocation(
        activity.latitude,
        activity.longitude,
        activity.checkinRadius
      );

      if (result.valid) {
        this.setData({
          withinRange: true,
          distance: result.distance,
          currentLocation: result.currentLocation,
          currentAddr: activity.address,
          checkinMessage: `您距离活动地点${formatDistance(result.distance)}，可以签到`
        });
      } else {
        this.setData({
          withinRange: false,
          distance: result.distance,
          currentLocation: result.currentLocation,
          checkinMessage: result.message
        });
      }
    } catch (err) {
      console.error('获取位置失败:', err);
      this.setData({
        checkinMessage: '获取位置失败，请检查定位权限'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新位置
  refreshLocation() {
    this.checkCurrentLocation();
  },

  // 执行签到
  async doCheckin() {
    const {
      activityId,
      activity,
      withinRange,
      canCheckin,
      currentLocation,
      checked
    } = this.data;

    // 检查是否已签到
    if (checked) {
      wx.showToast({ title: '您已签到', icon: 'none' });
      return;
    }

    // 检查时间窗口
    if (!canCheckin) {
      wx.showToast({ title: '不在签到时间范围内', icon: 'none' });
      return;
    }

    // 检查位置
    if (!withinRange) {
      wx.showModal({
        title: '位置不符',
        content: '您当前不在签到范围内，是否继续签到？',
        success: (res) => {
          if (res.confirm) {
            this.submitCheckin();
          }
        }
      });
      return;
    }

    // 正常签到
    this.submitCheckin();
  },

  // 提交签到
  async submitCheckin() {
    const { activityId, activity, currentLocation, distance } = this.data;

    wx.showLoading({ title: '签到中...' });

    try {
      const now = new Date();
      const checkIsLate = isLate(now.toISOString(), activity.startTime, 10);

      const result = await checkinAPI.create({
        activityId,
        userId: 'u1', // 当前用户ID，应从登录态获取
        registrationId: 'r1', // 应从报名记录获取
        latitude: currentLocation?.latitude || activity.latitude,
        longitude: currentLocation?.longitude || activity.longitude,
        address: activity.address,
        isLate: checkIsLate,
        isValid: this.data.withinRange,
        distance
      });

      wx.hideLoading();

      if (result.code === 0) {
        const checkTime = formatDateTime(now.toISOString(), 'HH:mm');
        this.setData({
          checked: true,
          checkTime
        });

        const message = checkIsLate ? '签到成功（迟到）' : '签到成功';
        wx.showToast({ title: message, icon: 'success' });

        // 重新加载签到记录
        setTimeout(() => {
          this.loadCheckinRecords(activityId);
        }, 1000);
      } else {
        wx.showToast({ title: result.message || '签到失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('签到失败:', err);
      wx.showToast({ title: '签到失败，请重试', icon: 'none' });
    }
  },

  // 打开地图
  openMap() {
    const { activity } = this.data;
    if (!activity) return;

    wx.openLocation({
      latitude: activity.latitude,
      longitude: activity.longitude,
      name: activity.place,
      address: activity.address,
      scale: 15
    });
  },

  // 分享
  share() {
    wx.showShareMenu({ withShareTicket: true });
  },

  // 返回
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  // 分享给好友
  onShareAppMessage() {
    const { activity, activityId } = this.data;
    return {
      title: `${activity?.title || '活动'} - 签到`,
      path: `/pages/checkin/index?id=${activityId}`
    };
  }
});
