const { appConfigAPI, adminAPI } = require('./api.js');

const RESTRICTED_CREATE_MODES = ['create', 'copy', 'draft'];

function isRestrictedCreateMode(mode) {
  return RESTRICTED_CREATE_MODES.includes(mode || 'create');
}

function getDeniedMessage(mode) {
  switch (mode) {
    case 'copy':
      return '当前仅系统管理员可复制并新建活动';
    case 'draft':
      return '当前仅系统管理员可继续创建草稿活动';
    default:
      return '当前仅系统管理员可创建活动';
  }
}

function isLoggedIn() {
  const app = getApp();
  return !!(app && app.checkLoginStatus && app.checkLoginStatus());
}

async function getCreateActivityAccess() {
  try {
    const token = wx.getStorageSync('token');
    if (!token || !String(token).trim() || !isLoggedIn()) {
      return {
        success: true,
        anonymous: true,
        requiresLogin: true,
        adminOnly: false,
        isSystemAdmin: false,
        canCreate: false,
        message: '创建活动需要先登录'
      };
    }

    const configRes = await appConfigAPI.getCreateActivityConfig();
    const adminOnly = !!(
      configRes
      && configRes.code === 0
      && configRes.data
      && configRes.data.createActivityAdminOnly === true
    );

    if (!adminOnly) {
      return {
        success: true,
        adminOnly: false,
        isSystemAdmin: false,
        canCreate: true,
        message: ''
      };
    }

    const adminRes = await adminAPI.me();
    const isSystemAdmin = !!(
      adminRes
      && adminRes.code === 0
      && adminRes.data
      && adminRes.data.systemAdmin === true
    );

    return {
      success: true,
      adminOnly: true,
      isSystemAdmin,
      canCreate: isSystemAdmin,
      message: isSystemAdmin ? '' : getDeniedMessage('create')
    };
  } catch (err) {
    return {
      success: false,
      adminOnly: true,
      isSystemAdmin: false,
      canCreate: false,
      message: '暂时无法校验创建权限，请稍后再试',
      error: err
    };
  }
}

module.exports = {
  RESTRICTED_CREATE_MODES,
  isRestrictedCreateMode,
  getDeniedMessage,
  getCreateActivityAccess
};
