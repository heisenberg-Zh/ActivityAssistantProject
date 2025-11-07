// utils/location.js - 地理位置工具

// 计算两点之间的距离（米）- Haversine公式
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // 地球半径（米）
  const rad = Math.PI / 180;

  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
};

// 格式化距离显示
const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
};

/**
 * 检查位置权限状态
 * @returns {Promise<Object>} 权限状态
 */
const checkLocationPermission = () => {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        const authStatus = res.authSetting['scope.userLocation'];
        resolve({
          authorized: authStatus === true,
          denied: authStatus === false,
          notAsked: authStatus === undefined
        });
      },
      fail: () => {
        resolve({
          authorized: false,
          denied: false,
          notAsked: true
        });
      }
    });
  });
};

/**
 * 请求位置权限
 * @returns {Promise<Boolean>} 是否授权成功
 */
const requestLocationPermission = () => {
  return new Promise((resolve) => {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        console.log('位置权限授权成功');
        resolve(true);
      },
      fail: () => {
        console.log('位置权限授权失败');
        resolve(false);
      }
    });
  });
};

/**
 * 显示位置权限引导弹窗
 * @param {Object} options - 配置选项
 * @returns {Promise<Boolean>} 用户是否同意授权
 */
const showLocationPermissionGuide = (options = {}) => {
  const {
    title = '需要位置权限',
    content = '为了验证您的签到位置，需要获取您的地理位置信息。\n\n请点击"去设置"开启位置权限。',
    showCancel = true
  } = options;

  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText: '去设置',
      cancelText: '取消',
      showCancel,
      success: (res) => {
        if (res.confirm) {
          // 用户点击"去设置"，打开设置页
          wx.openSetting({
            success: (settingRes) => {
              const authorized = settingRes.authSetting['scope.userLocation'] === true;
              if (authorized) {
                wx.showToast({
                  title: '权限已开启',
                  icon: 'success'
                });
              }
              resolve(authorized);
            },
            fail: () => {
              resolve(false);
            }
          });
        } else {
          // 用户点击"取消"
          resolve(false);
        }
      },
      fail: () => {
        resolve(false);
      }
    });
  });
};

/**
 * 获取当前位置（带权限处理）
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 位置信息
 */
const getCurrentLocation = async (options = {}) => {
  const {
    showGuide = true,    // 是否显示权限引导
    guideOptions = {}    // 权限引导弹窗配置
  } = options;

  // 1. 检查权限状态
  const permission = await checkLocationPermission();

  // 2. 如果权限被拒绝，引导用户开启
  if (permission.denied) {
    if (showGuide) {
      const authorized = await showLocationPermissionGuide(guideOptions);
      if (!authorized) {
        throw {
          code: 'PERMISSION_DENIED',
          message: '位置权限未开启',
          type: 'permission'
        };
      }
    } else {
      throw {
        code: 'PERMISSION_DENIED',
        message: '位置权限未开启，请在设置中开启位置权限',
        type: 'permission'
      };
    }
  }

  // 3. 如果权限未询问，尝试请求权限
  if (permission.notAsked) {
    const granted = await requestLocationPermission();
    if (!granted) {
      // 请求失败，显示引导
      if (showGuide) {
        const authorized = await showLocationPermissionGuide(guideOptions);
        if (!authorized) {
          throw {
            code: 'PERMISSION_DENIED',
            message: '位置权限未开启',
            type: 'permission'
          };
        }
      } else {
        throw {
          code: 'PERMISSION_DENIED',
          message: '需要位置权限才能继续',
          type: 'permission'
        };
      }
    }
  }

  // 4. 获取位置
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      altitude: false,
      success: (res) => {
        console.log('获取位置成功:', res);
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy || 0,
          altitude: res.altitude || 0,
          speed: res.speed || 0
        });
      },
      fail: (err) => {
        console.error('获取位置失败:', err);

        // 解析错误类型
        let errorMessage = '获取位置失败';
        let errorCode = 'GET_LOCATION_FAIL';

        if (err.errMsg) {
          if (err.errMsg.includes('auth deny')) {
            errorMessage = '位置权限被拒绝';
            errorCode = 'PERMISSION_DENIED';
          } else if (err.errMsg.includes('timeout')) {
            errorMessage = '获取位置超时，请检查GPS是否开启';
            errorCode = 'TIMEOUT';
          } else if (err.errMsg.includes('fail')) {
            errorMessage = '定位服务异常，请检查系统设置';
            errorCode = 'SYSTEM_ERROR';
          }
        }

        reject({
          code: errorCode,
          message: errorMessage,
          type: 'location',
          originalError: err
        });
      }
    });
  });
};

// 验证签到位置是否在范围内
const validateCheckinLocation = async (activityLat, activityLon, allowedRadius) => {
  try {
    const current = await getCurrentLocation();
    const distance = calculateDistance(
      current.latitude,
      current.longitude,
      activityLat,
      activityLon
    );

    return {
      valid: distance <= allowedRadius,
      distance,
      currentLocation: current,
      message: distance <= allowedRadius
        ? '位置验证通过'
        : `您距离活动地点${formatDistance(distance)}，超出签到范围（${allowedRadius}米）`
    };
  } catch (error) {
    return {
      valid: false,
      distance: -1,
      currentLocation: null,
      message: error.message
    };
  }
};

// 打开地图导航
const openMapNavigation = (latitude, longitude, name, address) => {
  wx.openLocation({
    latitude,
    longitude,
    name,
    address,
    scale: 15,
    fail: (err) => {
      console.error('打开地图失败:', err);
      wx.showToast({
        title: '打开地图失败',
        icon: 'none'
      });
    }
  });
};

// 选择位置
const chooseLocation = () => {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: (res) => {
        resolve({
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
        reject(new Error('选择位置失败'));
      }
    });
  });
};

// 地理编码 - 地址转坐标（需要腾讯地图API密钥）
const geocode = (address, apiKey) => {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error('缺少地图API密钥'));
      return;
    }

    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        address,
        key: apiKey
      },
      success: (res) => {
        if (res.data.status === 0) {
          const location = res.data.result.location;
          resolve({
            latitude: location.lat,
            longitude: location.lng,
            address: res.data.result.address
          });
        } else {
          reject(new Error(res.data.message || '地址解析失败'));
        }
      },
      fail: reject
    });
  });
};

// 逆地理编码 - 坐标转地址（需要腾讯地图API密钥）
const reverseGeocode = (latitude, longitude, apiKey) => {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error('缺少地图API密钥'));
      return;
    }

    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${latitude},${longitude}`,
        key: apiKey
      },
      success: (res) => {
        if (res.data.status === 0) {
          resolve({
            address: res.data.result.address,
            formatted_address: res.data.result.formatted_addresses?.recommend || res.data.result.address
          });
        } else {
          reject(new Error(res.data.message || '坐标解析失败'));
        }
      },
      fail: reject
    });
  });
};

module.exports = {
  calculateDistance,
  formatDistance,
  checkLocationPermission,
  requestLocationPermission,
  showLocationPermissionGuide,
  getCurrentLocation,
  validateCheckinLocation,
  openMapNavigation,
  chooseLocation,
  geocode,
  reverseGeocode
};
