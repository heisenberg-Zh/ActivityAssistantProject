// utils/config.js - 全局配置文件

/**
 * 环境配置
 * - development: 开发环境（使用本地后端）
 * - production: 生产环境（使用线上后端）
 * - mock: Mock模式（使用假数据）
 *
 * 切换方式：修改下方的 CURRENT_ENV 变量
 */
const CURRENT_ENV = 'production'; // 可选值: 'development' | 'production' | 'mock'

// 不同环境的API配置
const ENV_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8082',
    useMock: false,
    description: '开发环境（需在微信开发者工具中禁用域名校验）'
  },
  production: {
    baseUrl: 'https://aap.hnsgj.com/hdtj-api',  // 生产环境API地址（HTTPS域名）
    useMock: false,
    description: '生产环境（需在微信公众平台配置合法服务器域名）'
  },
  mock: {
    baseUrl: '',
    useMock: true,
    description: 'Mock模式（使用本地假数据）'
  }
};

// 获取当前环境配置
const currentEnvConfig = ENV_CONFIG[CURRENT_ENV] || ENV_CONFIG.development;

// API配置
const API_CONFIG = {
  // 当前环境
  env: CURRENT_ENV,

  // API基础地址
  baseUrl: currentEnvConfig.baseUrl,

  // 是否使用Mock数据
  useMock: currentEnvConfig.useMock,

  // 请求超时时间（毫秒）
  timeout: 10000,

  // 请求重试次数
  retryCount: 3,

  // 环境描述（用于调试）
  description: currentEnvConfig.description
};

// 地图配置
const MAP_CONFIG = {
  // 腾讯地图API密钥
  key: '56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ',

  // 默认签到范围（米）
  defaultCheckinRadius: 500,

  // 签到时间窗口（分钟）
  checkinWindowMinutes: 30,

  // 迟到容忍时间（分钟）
  lateToleranceMinutes: 10
};

// 微信小程序配置
const WX_CONFIG = {
  // 小程序AppID
  appId: 'wx92bf60c1218c0abc',

  // 分享默认图片
  defaultShareImage: '/images/share-default.png',

  // 默认标题
  defaultTitle: 'ActivityAssistant - 活动助手'
};

// 业务配置
const BUSINESS_CONFIG = {
  // 活动类型
  activityTypes: ['聚会', '培训', '户外', '运动', '会议'],

  // 费用类型
  feeTypes: ['免费', 'AA', '统一收费'],

  // 活动状态
  activityStatus: ['进行中', '即将开始', '已结束', '已取消', '报名中'],

  // 报名状态
  registrationStatus: {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  },

  // 签到状态
  checkinStatus: {
    checked: '已签到',
    late: '迟到',
    absent: '缺席',
    pending: '未签到'
  },

  // 活动人数限制
  participantLimits: {
    min: 1,
    max: 10000
  },

  // 活动标题长度限制
  titleLengthLimits: {
    min: 2,
    max: 50
  },

  // 活动描述长度限制
  descLengthLimits: {
    min: 0,
    max: 500
  }
};

// 主题配置
const THEME_CONFIG = {
  // 主色
  primaryColor: '#3b82f6',

  // 成功色
  successColor: '#10b981',

  // 警告色
  warningColor: '#f59e0b',

  // 错误色
  errorColor: '#ef4444',

  // 文字颜色
  textColors: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    disabled: '#d1d5db'
  },

  // 背景颜色
  bgColors: {
    primary: '#ffffff',
    secondary: '#f7f8fa',
    tertiary: '#f3f4f6'
  },

  // 边框颜色
  borderColor: '#e5e7eb',

  // 圆角
  borderRadius: {
    small: '4rpx',
    medium: '8rpx',
    large: '16rpx',
    full: '9999rpx'
  },

  // 间距
  spacing: {
    xs: '8rpx',
    sm: '16rpx',
    md: '24rpx',
    lg: '32rpx',
    xl: '48rpx'
  },

  // 字体大小
  fontSizes: {
    xs: '24rpx',
    sm: '28rpx',
    base: '32rpx',
    lg: '36rpx',
    xl: '40rpx',
    '2xl': '48rpx',
    '3xl': '56rpx'
  }
};

// 缓存键名
const STORAGE_KEYS = {
  // 用户Token
  token: 'user_token',

  // 用户信息
  userInfo: 'user_info',

  // 活动草稿
  activityDraft: 'activity_draft',

  // 最近浏览
  recentViewed: 'recent_viewed',

  // 收藏列表
  favorites: 'favorites'
};

// 页面路由配置
const ROUTES = {
  home: '/pages/home/index',
  activityList: '/pages/activities/list',
  activityDetail: '/pages/activities/detail',
  activityCreate: '/pages/activities/create',
  registration: '/pages/registration/index',
  checkin: '/pages/checkin/index',
  statistics: '/pages/statistics/index',
  profile: '/pages/profile/index',
  myActivities: '/pages/my-activities/index',
  messages: '/pages/messages/index',
  settings: '/pages/settings/index'
};

// 导出所有配置
module.exports = {
  API_CONFIG,
  MAP_CONFIG,
  WX_CONFIG,
  BUSINESS_CONFIG,
  THEME_CONFIG,
  STORAGE_KEYS,
  ROUTES
};
