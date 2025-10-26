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

// 获取当前位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy
        });
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        reject(new Error('获取位置失败，请检查定位权限'));
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
  getCurrentLocation,
  validateCheckinLocation,
  openMapNavigation,
  chooseLocation,
  geocode,
  reverseGeocode
};
