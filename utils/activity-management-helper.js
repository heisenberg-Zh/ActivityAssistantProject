// utils/activity-management-helper.js
// 活动管理相关辅助函数

/**
 * 检查用户是否是活动创建者
 * @param {Object} activity - 活动对象
 * @param {string} userId - 用户ID
 * @returns {boolean} 是否是创建者
 */
function isActivityCreator(activity, userId) {
  // 确保都转换为字符串再比较，避免类型不匹配（数字vs字符串）
  const orgId = String(activity.organizerId || '').trim();
  const uid = String(userId || '').trim();

  // 添加调试日志
  console.log('[权限检查] 创建者ID比较:', {
    organizerId: activity.organizerId,
    orgIdType: typeof activity.organizerId,
    userId: userId,
    userIdType: typeof userId,
    orgIdStr: orgId,
    uidStr: uid,
    isEqual: orgId === uid
  });

  return orgId === uid;
}

/**
 * 检查用户是否是活动管理员
 * @param {Object} activity - 活动对象
 * @param {string} userId - 用户ID
 * @returns {boolean} 是否是管理员
 */
function isActivityAdmin(activity, userId) {
  if (!activity.administrators || activity.administrators.length === 0) {
    return false;
  }

  // 确保都转换为字符串再比较
  const uid = String(userId || '').trim();

  return activity.administrators.some(admin => {
    const adminId = String(admin.userId || '').trim();
    return adminId === uid;
  });
}

/**
 * 检查用户是否有管理权限（创建者或管理员）
 * @param {Object} activity - 活动对象
 * @param {string} userId - 用户ID
 * @returns {Object} { hasPermission: boolean, role: 'creator'|'admin'|null }
 */
function checkManagementPermission(activity, userId) {
  if (isActivityCreator(activity, userId)) {
    return { hasPermission: true, role: 'creator' };
  }
  if (isActivityAdmin(activity, userId)) {
    return { hasPermission: true, role: 'admin' };
  }
  return { hasPermission: false, role: null };
}

/**
 * 检查用户是否在白名单中
 * @param {Object} activity - 活动对象
 * @param {string} phone - 手机号
 * @param {string} userId - 用户ID（可选）
 * @returns {boolean} 是否在白名单中
 */
function isInWhitelist(activity, phone, userId = null) {
  if (!activity.whitelist || activity.whitelist.length === 0) {
    return false;
  }

  return activity.whitelist.some(item => {
    // 匹配手机号
    if (item.phone === phone) return true;
    // 如果提供了userId，也检查userId
    if (userId && item.userId === userId) return true;
    return false;
  });
}

/**
 * 检查用户是否在黑名单中（考虑过期时间和激活状态）
 * @param {Object} activity - 活动对象
 * @param {string} phone - 手机号
 * @param {string} userId - 用户ID（可选）
 * @returns {Object} { isBlocked: boolean, reason: string }
 */
function isInBlacklist(activity, phone, userId = null) {
  if (!activity.blacklist || activity.blacklist.length === 0) {
    return { isBlocked: false, reason: '' };
  }

  const now = new Date();

  const blockedItem = activity.blacklist.find(item => {
    // 只检查激活状态的黑名单
    if (!item.isActive) return false;

    // 检查是否过期（如果设置了过期时间）
    if (item.expiresAt) {
      const expiryDate = new Date(item.expiresAt);
      if (now > expiryDate) return false; // 已过期，不再生效
    }

    // 匹配手机号或用户ID
    if (item.phone === phone) return true;
    if (userId && item.userId === userId) return true;

    return false;
  });

  if (blockedItem) {
    return {
      isBlocked: true,
      reason: blockedItem.reason || '您已被禁止报名此活动'
    };
  }

  return { isBlocked: false, reason: '' };
}

/**
 * 获取用户管理的活动列表（包括创建的和被指定为管理员的）
 * @param {Array} activities - 所有活动列表
 * @param {string} userId - 用户ID
 * @param {Object} options - 可选参数 { includeCreated: boolean, includeManaged: boolean }
 * @returns {Array} 用户管理的活动列表
 */
function getUserManagedActivities(activities, userId, options = {}) {
  const { includeCreated = true, includeManaged = true } = options;

  // 确保userId是字符串
  const uid = String(userId || '').trim();

  return activities.filter(activity => {
    if (activity.isDeleted) return false;

    // 是否包含创建的活动（使用字符串比较）
    if (includeCreated) {
      const orgId = String(activity.organizerId || '').trim();
      if (orgId === uid) return true;
    }

    // 是否包含被指定为管理员的活动
    if (includeManaged && isActivityAdmin(activity, userId)) return true;

    return false;
  });
}

/**
 * 检查活动字段是否可以编辑
 * @param {Object} activity - 活动对象
 * @param {string} fieldName - 字段名称
 * @param {number} currentRegistrations - 当前报名人数
 * @returns {Object} { canEdit: boolean, reason: string, requiresConfirmation: boolean }
 */
function checkFieldEditability(activity, fieldName, currentRegistrations) {
  const hasRegistrations = currentRegistrations > 0;

  // 字段编辑规则
  const editRules = {
    // 无限制字段
    'title': {
      canEdit: true,
      requiresConfirmation: false,
      reason: ''
    },
    'desc': {
      canEdit: true,
      requiresConfirmation: false,
      reason: ''
    },
    'description': {
      canEdit: true,
      requiresConfirmation: false,
      reason: ''
    },
    'isPublic': {
      canEdit: true,
      requiresConfirmation: false,
      reason: ''
    },

    // 需要确认的字段
    'type': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改活动类型可能影响已报名用户的预期' : ''
    },
    'startTime': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改活动时间可能影响已报名用户的安排' : ''
    },
    'endTime': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改活动时间可能影响已报名用户的安排' : ''
    },
    'place': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改活动地点可能影响已报名用户的出行计划' : ''
    },
    'address': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改活动地址可能影响已报名用户的出行计划' : ''
    },
    'fee': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改活动费用可能影响已报名用户的预算' : ''
    },
    'feeType': {
      canEdit: true,
      requiresConfirmation: hasRegistrations,
      reason: hasRegistrations ? '修改费用类型可能影响已报名用户的预算' : ''
    },

    // 锁定字段（有报名后不可编辑）
    'needReview': {
      canEdit: !hasRegistrations,
      requiresConfirmation: false,
      reason: hasRegistrations ? '已有用户报名，无法修改审核要求' : ''
    },
    'hasGroups': {
      canEdit: !hasRegistrations,
      requiresConfirmation: false,
      reason: hasRegistrations ? '已有用户报名，无法修改分组设置' : ''
    }
  };

  return editRules[fieldName] || { canEdit: true, requiresConfirmation: false, reason: '' };
}

/**
 * 检查参与人数上限是否可以修改
 * @param {number} newTotal - 新的人数上限
 * @param {number} currentJoined - 当前已报名人数
 * @returns {Object} { canEdit: boolean, reason: string }
 */
function checkTotalLimitChange(newTotal, currentJoined) {
  if (newTotal < currentJoined) {
    return {
      canEdit: false,
      reason: `新的人数上限（${newTotal}人）不能低于当前已报名人数（${currentJoined}人）`
    };
  }

  return {
    canEdit: true,
    reason: ''
  };
}

/**
 * 为活动列表添加管理权限标记
 * @param {Array} activities - 活动列表
 * @param {string} userId - 用户ID
 * @returns {Array} 添加了权限标记的活动列表
 */
function enrichActivitiesWithPermissions(activities, userId) {
  return activities.map(activity => {
    const permission = checkManagementPermission(activity, userId);
    return {
      ...activity,
      isCreator: permission.role === 'creator',
      isAdmin: permission.role === 'admin',
      canManage: permission.hasPermission
    };
  });
}

/**
 * 获取管理员列表（包含用户详细信息）
 * @param {Object} activity - 活动对象
 * @param {Array} participants - 参与者列表
 * @returns {Array} 管理员详细信息列表
 */
function getAdministratorsWithDetails(activity, participants) {
  if (!activity.administrators || activity.administrators.length === 0) {
    return [];
  }

  return activity.administrators.map(admin => {
    const user = participants.find(p => p.id === admin.userId);
    return {
      ...admin,
      name: user?.name || '未知用户',
      avatar: user?.avatar || '',
      mobile: user?.mobile || ''
    };
  });
}

/**
 * 检查是否可以添加管理员（最多5个）
 * @param {Object} activity - 活动对象
 * @returns {Object} { canAdd: boolean, reason: string }
 */
function canAddAdministrator(activity) {
  const currentCount = activity.administrators?.length || 0;

  if (currentCount >= 5) {
    return {
      canAdd: false,
      reason: '管理员数量已达上限（5人）'
    };
  }

  return {
    canAdd: true,
    reason: ''
  };
}

/**
 * 验证白名单/黑名单手机号格式
 * @param {string} phone - 手机号
 * @returns {Object} { isValid: boolean, message: string }
 */
function validatePhoneNumber(phone) {
  // 简单的手机号格式验证（中国大陆）
  const phoneRegex = /^1[3-9]\d{9}$/;

  // 如果是脱敏格式（如 138****1234），也认为有效
  const maskedPhoneRegex = /^1[3-9]\d\*{4}\d{4}$/;

  if (phoneRegex.test(phone) || maskedPhoneRegex.test(phone)) {
    return { isValid: true, message: '' };
  }

  return { isValid: false, message: '手机号格式不正确' };
}

/**
 * 批量解析手机号（从多行文本）
 * @param {string} text - 多行文本
 * @returns {Object} { phones: Array, errors: Array }
 */
function parseBatchPhoneNumbers(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const phones = [];
  const errors = [];

  lines.forEach((line, index) => {
    const validation = validatePhoneNumber(line);
    if (validation.isValid) {
      // 检查重复
      if (!phones.includes(line)) {
        phones.push(line);
      } else {
        errors.push({ line: index + 1, phone: line, reason: '重复的手机号' });
      }
    } else {
      errors.push({ line: index + 1, phone: line, reason: validation.message });
    }
  });

  return { phones, errors };
}

module.exports = {
  isActivityCreator,
  isActivityAdmin,
  checkManagementPermission,
  isInWhitelist,
  isInBlacklist,
  getUserManagedActivities,
  checkFieldEditability,
  checkTotalLimitChange,
  enrichActivitiesWithPermissions,
  getAdministratorsWithDetails,
  canAddAdministrator,
  validatePhoneNumber,
  parseBatchPhoneNumbers
};
