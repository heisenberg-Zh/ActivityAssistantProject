// utils/data-adapter.js - 前后端数据适配层

/**
 * 前后端数据格式转换适配器
 *
 * 功能：
 * 1. 将后端返回的数据转换为前端期望的格式
 * 2. 将前端提交的数据转换为后端期望的格式
 * 3. 统一处理日期格式、字段名差异等问题
 *
 * 使用场景：
 * - 在 API 层自动调用，对请求和响应数据进行转换
 * - 确保前端代码无需修改，即可适配后端数据格式
 */

// ==================== 日期格式化工具 ====================

/**
 * 格式化日期时间
 * 输入: '2025-12-23T19:00:00' 或 '2025-12-23 19:00:00'
 * 输出: '12月23日 19:00'
 */
function formatDate(dateTime) {
  if (!dateTime) return '';

  try {
    // 兼容iOS：保持ISO格式或转换为斜杠格式
    // iOS不支持 "yyyy-MM-dd HH:mm:ss" 格式
    let dateStr = dateTime;

    // 如果包含空格（后端可能返回这种格式），转换为ISO格式
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
    }

    // 移除毫秒部分
    dateStr = dateStr.replace(/\.\d+/, '');

    const date = new Date(dateStr);

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${month}月${day}日 ${hour}:${minute}`;
  } catch (err) {
    console.error('日期格式化失败:', dateTime, err);
    return dateTime;
  }
}

/**
 * 格式化时间范围
 * 输入: startTime, endTime
 * 输出: '12月23日 19:00-22:00'
 */
function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return '';

  try {
    // 兼容iOS：保持ISO格式或转换为斜杠格式
    // iOS不支持 "yyyy-MM-dd HH:mm:ss" 格式
    let startStr = startTime;
    let endStr = endTime;

    // 如果包含空格（后端可能返回这种格式），转换为ISO格式
    if (startStr.includes(' ') && !startStr.includes('T')) {
      startStr = startStr.replace(' ', 'T');
    }
    if (endStr.includes(' ') && !endStr.includes('T')) {
      endStr = endStr.replace(' ', 'T');
    }

    // 移除毫秒部分
    startStr = startStr.replace(/\.\d+/, '');
    endStr = endStr.replace(/\.\d+/, '');

    const start = new Date(startStr);
    const end = new Date(endStr);

    const month = start.getMonth() + 1;
    const day = start.getDate();
    const startHour = String(start.getHours()).padStart(2, '0');
    const startMinute = String(start.getMinutes()).padStart(2, '0');
    const endHour = String(end.getHours()).padStart(2, '0');
    const endMinute = String(end.getMinutes()).padStart(2, '0');

    return `${month}月${day}日 ${startHour}:${startMinute}-${endHour}:${endMinute}`;
  } catch (err) {
    console.error('时间范围格式化失败:', startTime, endTime, err);
    return '';
  }
}

/**
 * 将前端日期字符串转换为后端格式
 * 输入: '2025-12-23 19:00' 或 '2025-12-23T19:00'
 * 输出: '2025-12-23T19:00:00' (ISO 8601 格式，LocalDateTime 标准格式)
 *
 * 重要说明：
 * - 后端使用 LocalDateTime 类型，默认支持 ISO 8601 格式（yyyy-MM-ddTHH:mm:ss）
 * - application.yml 中的 date-format 配置只对 java.util.Date 有效
 * - 必须使用 'T' 分隔符，不能使用空格
 */
function toBackendDateTime(dateTimeStr) {
  if (!dateTimeStr) return null;

  try {
    let dateStr = dateTimeStr.trim();

    // 如果包含空格，转换为 ISO 格式（使用 'T' 分隔符）
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
    }

    // 确保包含秒数
    const parts = dateStr.split('T');
    if (parts.length === 2) {
      const timePart = parts[1];
      const timeSegments = timePart.split(':');

      if (timeSegments.length === 2) {
        // HH:mm 格式，添加秒数
        return `${parts[0]}T${timePart}:00`;
      } else if (timeSegments.length === 3) {
        // HH:mm:ss 格式，直接返回
        return dateStr;
      }
    } else if (parts.length === 1) {
      // 只有日期，添加默认时间
      return `${parts[0]}T00:00:00`;
    }

    // 保持原样
    return dateStr;
  } catch (err) {
    console.error('后端日期转换失败:', dateTimeStr, err);
    return dateTimeStr;
  }
}

/**
 * 将后端日期转换为前端格式
 * 输入: '2025-12-23T19:00:00'
 * 输出: '2025-12-23T19:00' (保持ISO格式，兼容iOS)
 */
function toFrontendDateTime(dateTime) {
  if (!dateTime) return '';

  try {
    // 兼容iOS：保持ISO格式（使用'T'分隔符）
    // HTML datetime-local 输入框也需要 'T' 格式
    // 去掉秒数和毫秒，保留格式为 '2025-12-23T19:00'
    return dateTime.replace(/:\d{2}(\.\d+)?$/, '');
  } catch (err) {
    console.error('前端日期转换失败:', dateTime, err);
    return dateTime;
  }
}

// ==================== 活动数据适配 ====================

/**
 * 转换后端活动数据为前端格式
 */
function transformActivityFromBackend(activity) {
  if (!activity) return null;

  try {
    // 解析JSON字段
    let groups = null;
    let customFields = null;
    let recurringConfig = null;
    let tags = [];

    try {
      if (activity.groups && activity.groups !== '[]') {
        groups = JSON.parse(activity.groups);
      }
    } catch (e) {
      console.warn('解析groups失败:', e);
    }

    try {
      if (activity.customFields) {
        customFields = JSON.parse(activity.customFields);
      }
    } catch (e) {
      console.warn('解析customFields失败:', e);
    }

    try {
      if (activity.recurringConfig) {
        recurringConfig = JSON.parse(activity.recurringConfig);
      }
    } catch (e) {
      console.warn('解析recurringConfig失败:', e);
    }

    // 从活动类型生成标签
    if (activity.type) {
      tags.push(activity.type);
    }
    if (activity.isRecurring) {
      tags.push('固定活动');
    }

    // 转换后的数据
    return {
      ...activity,

      // 字段名适配
      desc: activity.description || '',  // 关键适配：description -> desc
      organizerId: activity.organizer_id || activity.organizerId,  // 关键适配：organizer_id -> organizerId
      organizerName: activity.organizer_name || activity.organizerName,  // organizer_name -> organizerName
      organizerPhone: activity.organizer_phone || activity.organizerPhone,  // organizer_phone -> organizerPhone
      organizerWechat: activity.organizer_wechat || activity.organizerWechat,  // organizer_wechat -> organizerWechat

      // 布尔值字段适配
      isPublic: activity.is_public !== undefined ? activity.is_public : activity.isPublic,  // is_public -> isPublic
      isDeleted: activity.is_deleted !== undefined ? activity.is_deleted : activity.isDeleted,  // is_deleted -> isDeleted
      needReview: activity.need_review !== undefined ? activity.need_review : activity.needReview,  // need_review -> needReview
      isRecurring: activity.is_recurring !== undefined ? activity.is_recurring : activity.isRecurring,  // is_recurring -> isRecurring

      // 日期格式化
      date: formatDate(activity.startTime),
      timeRange: formatTimeRange(activity.startTime, activity.endTime),

      // 前端需要的格式化时间（保留原始格式供表单使用）
      startTime: toFrontendDateTime(activity.startTime),
      endTime: toFrontendDateTime(activity.endTime),
      registerDeadline: toFrontendDateTime(activity.registerDeadline),

      // 解析JSON字段
      hasGroups: !!groups && groups.length > 0,
      groups: groups || [],
      customFields: customFields || [],
      recurringConfig: recurringConfig,

      // 添加前端需要的额外字段
      tags: tags,
      banner: activity.banner || 'blue',  // 默认蓝色横幅
      requirements: activity.requirements || '',

      // 保留后端原始字段，确保向前兼容
      description: activity.description
    };
  } catch (err) {
    console.error('活动数据转换失败:', err, activity);
    return activity;
  }
}

/**
 * 转换前端活动数据为后端格式
 */
function transformActivityToBackend(activity) {
  if (!activity) return null;

  try {
    // 将JSON对象转换为字符串
    const groups = activity.groups && activity.groups.length > 0
      ? JSON.stringify(activity.groups)
      : null;

    const customFields = activity.customFields && activity.customFields.length > 0
      ? JSON.stringify(activity.customFields)
      : null;

    const recurringConfig = activity.recurringConfig
      ? JSON.stringify(activity.recurringConfig)
      : null;

    return {
      ...activity,

      // 字段名适配
      description: activity.desc || activity.description || '',  // desc -> description

      // 日期格式转换
      startTime: toBackendDateTime(activity.startTime),
      endTime: toBackendDateTime(activity.endTime),
      registerDeadline: toBackendDateTime(activity.registerDeadline),
      scheduledPublishTime: toBackendDateTime(activity.scheduledPublishTime),
      actualPublishTime: toBackendDateTime(activity.actualPublishTime),  // 【修复】添加 actualPublishTime 转换

      // JSON字段
      groups: groups,
      customFields: customFields,
      recurringConfig: recurringConfig,

      // 移除前端专用字段（后端不需要）
      date: undefined,
      timeRange: undefined,
      hasGroups: undefined,
      tags: undefined,
      banner: undefined,
      desc: undefined  // 移除desc，只保留description
    };
  } catch (err) {
    console.error('活动数据提交转换失败:', err, activity);
    return activity;
  }
}

// ==================== 报名数据适配 ====================

/**
 * 转换后端报名数据为前端格式
 */
function transformRegistrationFromBackend(registration) {
  if (!registration) return null;

  try {
    // 解析自定义字段
    let formData = null;
    try {
      if (registration.formData) {
        formData = JSON.parse(registration.formData);
      }
    } catch (e) {
      console.warn('解析formData失败:', e);
    }

    return {
      ...registration,
      formData: formData || {},
      registeredAt: toFrontendDateTime(registration.createdAt),
      // 保留原始时间字段
      createdAt: toFrontendDateTime(registration.createdAt),
      updatedAt: toFrontendDateTime(registration.updatedAt)
    };
  } catch (err) {
    console.error('报名数据转换失败:', err, registration);
    return registration;
  }
}

/**
 * 转换前端报名数据为后端格式
 */
function transformRegistrationToBackend(registration) {
  if (!registration) return null;

  try {
    const formData = registration.formData
      ? JSON.stringify(registration.formData)
      : null;

    return {
      ...registration,
      formData: formData,
      // 移除前端专用字段
      registeredAt: undefined
    };
  } catch (err) {
    console.error('报名数据提交转换失败:', err, registration);
    return registration;
  }
}

// ==================== 签到数据适配 ====================

/**
 * 转换后端签到数据为前端格式
 */
function transformCheckinFromBackend(checkin) {
  if (!checkin) return null;

  try {
    return {
      ...checkin,
      checkinTime: toFrontendDateTime(checkin.checkinTime),
      createdAt: toFrontendDateTime(checkin.createdAt)
    };
  } catch (err) {
    console.error('签到数据转换失败:', err, checkin);
    return checkin;
  }
}

/**
 * 转换前端签到数据为后端格式
 */
function transformCheckinToBackend(checkin) {
  if (!checkin) return null;

  try {
    return {
      ...checkin,
      checkinTime: toBackendDateTime(checkin.checkinTime)
    };
  } catch (err) {
    console.error('签到数据提交转换失败:', err, checkin);
    return checkin;
  }
}

// ==================== 统一响应数据转换 ====================

/**
 * 根据URL自动转换响应数据
 */
function transformResponse(data, url) {
  if (!data) return data;

  try {
    // 活动相关接口
    if (url.includes('/api/activities')) {
      // 数组数据
      if (Array.isArray(data)) {
        return data.map(item => transformActivityFromBackend(item));
      }
      // 单个对象
      if (data.id) {
        return transformActivityFromBackend(data);
      }
      // 分页数据
      if (data.content && Array.isArray(data.content)) {
        return {
          ...data,
          content: data.content.map(item => transformActivityFromBackend(item))
        };
      }
    }

    // 报名相关接口
    if (url.includes('/api/registrations')) {
      if (Array.isArray(data)) {
        return data.map(item => transformRegistrationFromBackend(item));
      }
      if (data.id) {
        return transformRegistrationFromBackend(data);
      }
      if (data.content && Array.isArray(data.content)) {
        return {
          ...data,
          content: data.content.map(item => transformRegistrationFromBackend(item))
        };
      }
    }

    // 签到相关接口
    if (url.includes('/api/checkins')) {
      if (Array.isArray(data)) {
        return data.map(item => transformCheckinFromBackend(item));
      }
      if (data.id) {
        return transformCheckinFromBackend(data);
      }
      if (data.content && Array.isArray(data.content)) {
        return {
          ...data,
          content: data.content.map(item => transformCheckinFromBackend(item))
        };
      }
    }

    // 消息相关接口
    if (url.includes('/api/messages')) {
      // 如果是分页格式，提取 content 数组
      if (data.content && Array.isArray(data.content)) {
        // 返回分页数据，保持结构
        return {
          ...data,
          // 保持原有的分页信息
          content: data.content
        };
      }
      // 如果是 list 格式
      if (data.list && Array.isArray(data.list)) {
        // 转换为标准格式
        return data.list;
      }
      // 直接返回数据（可能是数组或对象）
      return data;
    }

    return data;
  } catch (err) {
    console.error('响应数据转换失败:', err, url, data);
    return data;
  }
}

/**
 * 根据URL自动转换请求数据
 */
function transformRequest(data, url, method) {
  if (!data || method === 'GET') return data;

  try {
    // 活动相关接口
    if (url.includes('/api/activities') && (method === 'POST' || method === 'PUT')) {
      return transformActivityToBackend(data);
    }

    // 报名相关接口
    if (url.includes('/api/registrations') && method === 'POST') {
      return transformRegistrationToBackend(data);
    }

    // 签到相关接口
    if (url.includes('/api/checkins') && method === 'POST') {
      return transformCheckinToBackend(data);
    }

    return data;
  } catch (err) {
    console.error('请求数据转换失败:', err, url, data);
    return data;
  }
}

// ==================== 导出 ====================

module.exports = {
  // 日期工具
  formatDate,
  formatTimeRange,
  toBackendDateTime,
  toFrontendDateTime,

  // 活动转换
  transformActivityFromBackend,
  transformActivityToBackend,

  // 报名转换
  transformRegistrationFromBackend,
  transformRegistrationToBackend,

  // 签到转换
  transformCheckinFromBackend,
  transformCheckinToBackend,

  // 统一转换
  transformResponse,
  transformRequest
};
