// utils/scheduler.js
// 定时任务管理器 - 用于管理活动的定时发布

/**
 * 定时任务数据结构
 * {
 *   activityId: '活动ID',
 *   scheduledTime: '定时发布时间（ISO字符串）',
 *   status: 'pending' | 'published' | 'failed',
 *   createdAt: '创建时间',
 *   failedReason: '失败原因（可选）'
 * }
 */

const STORAGE_KEY = 'scheduled_tasks';

/**
 * 获取所有定时任务
 */
function getAllTasks() {
  try {
    const tasks = wx.getStorageSync(STORAGE_KEY) || [];
    return tasks;
  } catch (e) {
    console.error('获取定时任务失败:', e);
    return [];
  }
}

/**
 * 添加定时任务
 * @param {string} activityId - 活动ID
 * @param {string} scheduledTime - 定时发布时间（ISO字符串）
 * @returns {boolean} 是否成功
 */
function addTask(activityId, scheduledTime) {
  try {
    const tasks = getAllTasks();

    // 检查是否已存在该活动的任务
    const existingIndex = tasks.findIndex(task => task.activityId === activityId);

    const newTask = {
      activityId,
      scheduledTime,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // 更新现有任务
      tasks[existingIndex] = newTask;
    } else {
      // 添加新任务
      tasks.push(newTask);
    }

    wx.setStorageSync(STORAGE_KEY, tasks);
    console.log('定时任务添加成功:', newTask);
    return true;
  } catch (e) {
    console.error('添加定时任务失败:', e);
    return false;
  }
}

/**
 * 取消定时任务
 * @param {string} activityId - 活动ID
 * @returns {boolean} 是否成功
 */
function cancelTask(activityId) {
  try {
    const tasks = getAllTasks();
    const filteredTasks = tasks.filter(task => task.activityId !== activityId);
    wx.setStorageSync(STORAGE_KEY, filteredTasks);
    console.log('定时任务取消成功:', activityId);
    return true;
  } catch (e) {
    console.error('取消定时任务失败:', e);
    return false;
  }
}

/**
 * 获取指定活动的定时任务
 * @param {string} activityId - 活动ID
 * @returns {object|null} 任务对象或null
 */
function getTask(activityId) {
  const tasks = getAllTasks();
  return tasks.find(task => task.activityId === activityId) || null;
}

/**
 * 更新任务状态
 * @param {string} activityId - 活动ID
 * @param {string} status - 新状态 'pending' | 'published' | 'failed'
 * @param {string} failedReason - 失败原因（可选）
 * @returns {boolean} 是否成功
 */
function updateTaskStatus(activityId, status, failedReason = null) {
  try {
    const tasks = getAllTasks();
    const taskIndex = tasks.findIndex(task => task.activityId === activityId);

    if (taskIndex === -1) {
      console.error('未找到任务:', activityId);
      return false;
    }

    tasks[taskIndex].status = status;
    if (failedReason) {
      tasks[taskIndex].failedReason = failedReason;
    }

    wx.setStorageSync(STORAGE_KEY, tasks);
    return true;
  } catch (e) {
    console.error('更新任务状态失败:', e);
    return false;
  }
}

/**
 * 检查并执行到期的定时任务
 * @param {function} onTaskDue - 任务到期回调函数，参数为 activityId
 * @returns {array} 已执行的任务ID列表
 */
function checkAndExecuteTasks(onTaskDue) {
  try {
    const tasks = getAllTasks();
    const now = new Date();
    const executedTasks = [];

    tasks.forEach(task => {
      if (task.status === 'pending') {
        const scheduledTime = new Date(task.scheduledTime);

        // 如果定时时间已到或已过
        if (scheduledTime <= now) {
          console.log('执行定时任务:', task.activityId, '定时时间:', task.scheduledTime);

          // 调用回调函数
          if (onTaskDue && typeof onTaskDue === 'function') {
            onTaskDue(task.activityId);
          }

          executedTasks.push(task.activityId);
        }
      }
    });

    return executedTasks;
  } catch (e) {
    console.error('检查定时任务失败:', e);
    return [];
  }
}

/**
 * 获取待执行的任务列表
 * @returns {array} 待执行的任务列表
 */
function getPendingTasks() {
  const tasks = getAllTasks();
  return tasks.filter(task => task.status === 'pending');
}

/**
 * 清理已完成或失败的任务（可选功能）
 * @param {number} daysToKeep - 保留最近几天的记录，默认7天
 */
function cleanupOldTasks(daysToKeep = 7) {
  try {
    const tasks = getAllTasks();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredTasks = tasks.filter(task => {
      // 保留所有待执行的任务
      if (task.status === 'pending') {
        return true;
      }

      // 只保留最近的已完成/失败任务
      const createdAt = new Date(task.createdAt);
      return createdAt > cutoffDate;
    });

    wx.setStorageSync(STORAGE_KEY, filteredTasks);
    console.log('清理旧任务成功，保留', filteredTasks.length, '个任务');
    return true;
  } catch (e) {
    console.error('清理旧任务失败:', e);
    return false;
  }
}

/**
 * 校验定时发布时间
 * @param {string} scheduledTime - 定时发布时间字符串
 * @returns {object} { isValid: boolean, error: string }
 */
function validateScheduledTime(scheduledTime) {
  try {
    const now = new Date();
    const scheduled = new Date(scheduledTime);

    // 检查时间格式是否有效
    if (isNaN(scheduled.getTime())) {
      return {
        isValid: false,
        error: '时间格式无效'
      };
    }

    // 检查是否为过去时间
    if (scheduled <= now) {
      return {
        isValid: false,
        error: '不能设置过去的时间'
      };
    }

    // 检查是否超过1年（可选限制）
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    if (scheduled > oneYearLater) {
      return {
        isValid: false,
        error: '定时发布时间不能超过一年'
      };
    }

    return {
      isValid: true,
      error: null
    };
  } catch (e) {
    return {
      isValid: false,
      error: '时间校验失败'
    };
  }
}

module.exports = {
  addTask,
  cancelTask,
  getTask,
  getAllTasks,
  updateTaskStatus,
  checkAndExecuteTasks,
  getPendingTasks,
  cleanupOldTasks,
  validateScheduledTime
};
