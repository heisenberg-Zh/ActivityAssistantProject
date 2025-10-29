// utils/mock.js
const activities = [
  // 有分组的活动示例
  {
    id: 'a1',
    title: '周末网球活动',
    desc: '奥体中心网球场，分基础教学组和进阶比赛组，欢迎不同水平的球友参加。',
    date: '12月15日 14:00',
    timeRange: '12月15日 14:00-18:00',
    startTime: '2025-12-15 14:00',
    endTime: '2025-12-15 18:00',
    registerDeadline: '2025-12-15 12:00',
    place: '奥体中心网球场',
    address: '北京市朝阳区奥体中心',
    latitude: 39.9928,
    longitude: 116.3972,
    checkinRadius: 500,
    type: '运动',
    status: '进行中',
    total: 20, // 总人数上限（所有分组之和）
    joined: 13, // 总已报名人数（所有分组之和）
    minParticipants: 10,
    banner: 'blue',
    fee: 0, // 默认费用（当有分组时，以各分组费用为准）
    feeType: '免费',
    needReview: false,
    organizerId: 'u1',
    organizerName: '张小北',
    tags: ['运动', '网球', '周末'],
    requirements: '请自带球拍和运动装备',
    createdAt: '2025-12-10 10:00',
    hasGroups: true, // 标识此活动有分组
    groups: [
      {
        id: 'g1',
        name: 'A组-基础教学',
        total: 12,
        joined: 8,
        fee: 50,
        feeType: 'AA',
        requirements: '适合初学者，在8号场地，需自带球拍',
        description: '基础动作教学，适合零基础和初学者，教练现场指导。',
        customFields: [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
          { id: 'custom_1', label: '网球经验', required: false, desc: '请简述您的网球经验', isCustom: true }
        ]
      },
      {
        id: 'g2',
        name: 'B组-进阶比赛',
        total: 8,
        joined: 5,
        fee: 80,
        feeType: 'AA',
        requirements: '需有一定基础，在9号场地，需自带球拍和运动鞋',
        description: '适合有一定基础的球友，进行实战对抗和技术提升。',
        customFields: [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
          { id: 'custom_1', label: '技术水平', required: true, desc: '初级/中级/高级', isCustom: true }
        ]
      }
    ]
  },
  // 无分组的活动示例
  {
    id: 'a1b',
    title: '周末聚餐活动',
    desc: '邀约伙伴一起享受美食时光，畅聊生活与工作心得。',
    date: '12月16日 18:00',
    timeRange: '12月16日 18:00-21:00',
    startTime: '2025-12-16 18:00',
    endTime: '2025-12-16 21:00',
    registerDeadline: '2025-12-16 17:00',
    place: '海底捞火锅（朝阳店）',
    address: '北京市朝阳区三里屯太古里南区',
    latitude: 39.9354,
    longitude: 116.4481,
    checkinRadius: 500,
    type: '聚会',
    status: '即将开始',
    total: 12,
    joined: 8,
    minParticipants: 5,
    banner: 'pink',
    fee: 100,
    feeType: 'AA',
    needReview: false,
    organizerId: 'u1',
    organizerName: '张小北',
    tags: ['美食', '社交', '周末'],
    requirements: '请确认能够按时参加活动',
    createdAt: '2025-12-10 10:00',
    hasGroups: false, // 无分组
    customFields: [
      { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
      { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
      { id: 'custom_1', label: '饮食偏好', required: false, desc: '', isCustom: true }
    ]
  },
  {
    id: 'a2',
    title: '产品设计沙龙',
    desc: '学习最新的产品设计趋势和优秀案例分享。',
    date: '12月18日 14:00',
    timeRange: '12月18日 14:00-17:00',
    startTime: '2025-12-18 14:00',
    endTime: '2025-12-18 17:00',
    registerDeadline: '2025-12-18 12:00',
    place: '创新大厅',
    address: '北京市海淀区知春路创新中心',
    latitude: 39.9764,
    longitude: 116.3252,
    checkinRadius: 300,
    type: '培训',
    status: '即将开始',
    total: 20,
    joined: 15,
    minParticipants: 10,
    banner: 'blue',
    fee: 0,
    feeType: '免费',
    needReview: true,
    organizerId: 'u5',
    organizerName: '李晓峰',
    tags: ['设计', '学习', '职业'],
    requirements: '请携带笔记本电脑',
    createdAt: '2025-12-08 15:30',
    customFields: [
      { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
      { id: 'mobile', label: '手机号', required: false, desc: '用于联系参与者', isCustom: false },
      { id: 'custom_1', label: '公司名称', required: false, desc: '', isCustom: true },
      { id: 'custom_2', label: '职位', required: false, desc: '', isCustom: true }
    ]
  },
  {
    id: 'a3',
    title: '周末登山活动',
    desc: '感受自然风光，锻炼身体，适合亲友共同参与。',
    date: '12月20日 08:00',
    timeRange: '12月20日 08:00-16:00',
    startTime: '2025-12-20 08:00',
    endTime: '2025-12-20 16:00',
    registerDeadline: '2025-12-19 18:00',
    place: '密云山地公园',
    address: '北京密云山地公园集合点',
    latitude: 40.3764,
    longitude: 116.8432,
    checkinRadius: 1000,
    type: '户外',
    status: '即将开始',
    total: 10,
    joined: 6,
    minParticipants: 5,
    banner: 'green',
    fee: 50,
    feeType: 'AA',
    needReview: false,
    organizerId: 'u6',
    organizerName: '王晨',
    tags: ['户外', '运动', '健康'],
    requirements: '请准备登山装备和饮用水',
    createdAt: '2025-12-09 09:00',
    customFields: [
      { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
      { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
      { id: 'custom_1', label: '紧急联系人', required: true, desc: '', isCustom: true },
      { id: 'custom_2', label: '紧急联系电话', required: true, desc: '', isCustom: true }
    ]
  },
  {
    id: 'a4',
    title: '城市摄影漫步',
    desc: '与摄影爱好者一起探索冬日城市的光影故事。',
    date: '12月12日 15:00',
    timeRange: '12月12日 15:00-18:00',
    startTime: '2025-12-12 15:00',
    endTime: '2025-12-12 18:00',
    registerDeadline: '2025-12-12 14:00',
    place: '国贸三期集合',
    address: '北京市朝阳区建外大街国贸三期',
    latitude: 39.9085,
    longitude: 116.4579,
    checkinRadius: 200,
    type: '户外',
    status: '已结束',
    total: 18,
    joined: 18,
    minParticipants: 8,
    banner: 'purple',
    fee: 0,
    feeType: '免费',
    needReview: false,
    organizerId: 'u2',
    organizerName: '李小雅',
    tags: ['摄影', '艺术', '城市'],
    requirements: '请自备相机或手机',
    createdAt: '2025-12-05 12:00',
    customFields: [
      { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
      { id: 'mobile', label: '手机号', required: false, desc: '用于联系参与者', isCustom: false },
      { id: 'custom_1', label: '摄影经验', required: false, desc: '', isCustom: true }
    ]
  }
];

const participants = [
  {
    id: 'u1',
    name: '张小北',
    avatar: '/activityassistant_avatar_01.png',
    mobile: '138****1234',
    createdCount: 8,
    joinedCount: 15,
    checkinRate: 95
  },
  {
    id: 'u2',
    name: '李小雅',
    avatar: '/activityassistant_avatar_02.png',
    mobile: '139****5678',
    createdCount: 5,
    joinedCount: 22,
    checkinRate: 88
  },
  {
    id: 'u3',
    name: '王小文',
    avatar: '/activityassistant_avatar_03.png',
    mobile: '136****9012',
    createdCount: 3,
    joinedCount: 18,
    checkinRate: 92
  },
  {
    id: 'u4',
    name: '赵小海',
    avatar: '/activityassistant_avatar_04.png',
    mobile: '137****3456',
    createdCount: 2,
    joinedCount: 12,
    checkinRate: 85
  },
  {
    id: 'u5',
    name: '李晓峰',
    avatar: '/activityassistant_avatar_01.png',
    mobile: '135****7890',
    createdCount: 12,
    joinedCount: 8,
    checkinRate: 98
  },
  {
    id: 'u6',
    name: '王晨',
    avatar: '/activityassistant_avatar_02.png',
    mobile: '134****2345',
    createdCount: 6,
    joinedCount: 20,
    checkinRate: 90
  }
];

// 报名记录
const registrations = [
  {
    id: 'r1',
    activityId: 'a1',
    groupId: 'g1', // 报名的分组ID（如果活动有分组）
    userId: 'u1',
    name: '张小北',
    mobile: '138****1234',
    status: 'approved',
    registeredAt: '2025-12-14 12:30',
    approvedAt: '2025-12-14 12:30',
    checkinStatus: 'checked',
    checkinTime: '2025-12-15 14:05'
  },
  {
    id: 'r2',
    activityId: 'a1',
    groupId: 'g1',
    userId: 'u2',
    name: '李小雅',
    mobile: '139****5678',
    status: 'approved',
    registeredAt: '2025-12-14 13:15',
    approvedAt: '2025-12-14 13:15',
    checkinStatus: 'checked',
    checkinTime: '2025-12-15 14:12'
  },
  {
    id: 'r3',
    activityId: 'a1',
    groupId: 'g2',
    userId: 'u3',
    name: '王小文',
    mobile: '136****9012',
    status: 'approved',
    registeredAt: '2025-12-14 14:00',
    approvedAt: '2025-12-14 14:00',
    checkinStatus: 'pending',
    checkinTime: null
  },
  {
    id: 'r4',
    activityId: 'a1b',
    groupId: null, // 无分组活动
    userId: 'u4',
    name: '赵小海',
    mobile: '137****3456',
    status: 'approved',
    registeredAt: '2025-12-15 10:00',
    approvedAt: '2025-12-15 10:00',
    checkinStatus: 'pending',
    checkinTime: null
  }
];

// 签到记录
const checkinRecords = [
  {
    id: 'c1',
    activityId: 'a1',
    userId: 'u1',
    registrationId: 'r1',
    latitude: 39.9356,
    longitude: 116.4483,
    address: '北京市朝阳区三里屯太古里南区',
    checkinTime: '2025-12-15 18:05',
    isLate: false,
    isValid: true,
    distance: 25
  },
  {
    id: 'c2',
    activityId: 'a1',
    userId: 'u2',
    registrationId: 'r2',
    latitude: 39.9352,
    longitude: 116.4479,
    address: '北京市朝阳区三里屯太古里南区',
    checkinTime: '2025-12-15 18:12',
    isLate: false,
    isValid: true,
    distance: 48
  }
];

module.exports = {
  activities,
  participants,
  registrations,
  checkinRecords
};