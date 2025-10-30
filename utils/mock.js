// utils/mock.js
const activities = [
  // 多分组活动示例 - 羽毛球活动（4个分组）
  {
    id: 'a0',
    title: '周六羽毛球联赛',
    desc: '专业场地，分4个级别组别，适合各个水平的羽毛球爱好者。欢迎报名参加，认识新球友，切磋球技！',
    date: '12月21日 09:00',
    timeRange: '12月21日 09:00-17:00',
    startTime: '2025-12-21 09:00',
    endTime: '2025-12-21 17:00',
    registerDeadline: '2025-12-20 20:00',
    place: '朝阳体育中心羽毛球馆',
    address: '北京市朝阳区朝阳公园南路8号',
    latitude: 39.9320,
    longitude: 116.4802,
    checkinRadius: 300,
    type: '运动',
    status: '即将开始',
    total: 48, // 总人数上限（所有分组之和：12+10+16+10）
    joined: 5, // 总已报名人数（当前用户u1未报名）
    minParticipants: 20,
    banner: 'green',
    fee: 0, // 默认费用（当有分组时，以各分组费用为准）
    feeType: '免费',
    needReview: false,
    organizerId: 'u5',
    organizerName: '李晓峰',
    tags: ['运动', '羽毛球', '周末', '竞技'],
    requirements: '请携带球拍、运动鞋、毛巾和饮用水',
    createdAt: '2025-12-12 16:30',
    hasGroups: true, // 标识此活动有分组
    groups: [
      {
        id: 'g1',
        name: 'A组-新手入门',
        total: 12,
        joined: 2,
        fee: 30,
        feeType: 'AA',
        requirements: '适合0-6个月球龄的新手，提供基础教学，无需球拍可免费借用',
        description: '专门为新手设计的入门课程，教练会从握拍、发球等基础动作开始教学。场地在1-3号场。活动时间：09:00-12:00',
        customFields: [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
          { id: 'custom_1', label: '球龄', required: true, desc: '请填写您打羽毛球的时长', isCustom: true },
          { id: 'custom_2', label: '是否需要借用球拍', required: true, desc: '请填写：需要/不需要', isCustom: true }
        ],
        descriptionFields: [
          { id: 'desc_1', label: '携带物品', value: '运动服、运动鞋、毛巾、水杯', isCustom: true },
          { id: 'desc_2', label: '场地说明', value: '在羽毛球馆一楼1-3号场地', isCustom: true }
        ]
      },
      {
        id: 'g2',
        name: 'B组-初级提高',
        total: 10,
        joined: 1,
        fee: 50,
        feeType: 'AA',
        requirements: '6个月-1年球龄，掌握基本技术，能完成简单对抗',
        description: '适合有一定基础的球友，通过练习和实战提升技术水平。场地在4-5号场。活动时间：09:00-12:00',
        customFields: [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
          { id: 'custom_1', label: '球龄', required: true, desc: '请填写您打羽毛球的时长', isCustom: true },
          { id: 'custom_2', label: '擅长位置', required: false, desc: '单打/双打/都可以', isCustom: true },
          { id: 'custom_3', label: 'T恤尺码', required: true, desc: 'S/M/L/XL/XXL（统一发放队服）', isCustom: true }
        ],
        descriptionFields: [
          { id: 'desc_1', label: '费用说明', value: '费用包含场地费、饮用水、队服', isCustom: true },
          { id: 'desc_2', label: '场地说明', value: '在羽毛球馆一楼4-5号场地', isCustom: true }
        ]
      },
      {
        id: 'g3',
        name: 'C组-中级竞技',
        total: 16,
        joined: 1,
        fee: 80,
        feeType: 'AA',
        requirements: '1-3年球龄，技术较为全面，有比赛经验者优先',
        description: '中级水平竞技组，采用单淘汰赛制，设冠亚季军奖励。场地在6-9号场。活动时间：13:00-17:00',
        customFields: [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
          { id: 'custom_1', label: '球龄', required: true, desc: '请填写您打羽毛球的时长', isCustom: true },
          { id: 'custom_2', label: '参赛类型', required: true, desc: '男单/女单/男双/女双/混双', isCustom: true },
          { id: 'custom_3', label: '搭档姓名', required: false, desc: '如参加双打请填写搭档姓名', isCustom: true },
          { id: 'custom_4', label: 'T恤尺码', required: true, desc: 'S/M/L/XL/XXL（统一发放队服）', isCustom: true }
        ],
        descriptionFields: [
          { id: 'desc_1', label: '奖励设置', value: '冠军：奖金500元+奖杯；亚军：奖金300元+奖牌；季军：奖金200元+奖牌', isCustom: true },
          { id: 'desc_2', label: '比赛规则', value: '采用21分制，三局两胜，单淘汰赛制', isCustom: true },
          { id: 'desc_3', label: '费用说明', value: '费用包含场地费、饮用水、队服、奖品', isCustom: true }
        ]
      },
      {
        id: 'g4',
        name: 'D组-高级邀请',
        total: 10,
        joined: 1,
        fee: 100,
        feeType: '统一收费',
        requirements: '3年以上球龄，经常参加比赛，技术水平优秀',
        description: '高级别邀请赛，邀请制参赛，采用循环赛+淘汰赛制度，奖金丰厚。场地在10-11号专业场地。活动时间：13:00-17:00',
        customFields: [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false },
          { id: 'custom_1', label: '球龄', required: true, desc: '请填写您打羽毛球的时长', isCustom: true },
          { id: 'custom_2', label: '参赛类型', required: true, desc: '男单/女单/男双/女双/混双', isCustom: true },
          { id: 'custom_3', label: '最好成绩', required: true, desc: '请简述您参加过的最好比赛成绩', isCustom: true },
          { id: 'custom_4', label: '搭档姓名', required: false, desc: '如参加双打请填写搭档姓名及联系方式', isCustom: true },
          { id: 'custom_5', label: 'T恤尺码', required: true, desc: 'S/M/L/XL/XXL（统一发放高级队服）', isCustom: true },
          { id: 'custom_6', label: '紧急联系人', required: true, desc: '请填写紧急联系人姓名和电话', isCustom: true }
        ],
        descriptionFields: [
          { id: 'desc_1', label: '奖励设置', value: '冠军：奖金2000元+奖杯+专业球拍；亚军：奖金1000元+奖牌+专业球拍；季军：奖金500元+奖牌', isCustom: true },
          { id: 'desc_2', label: '比赛规则', value: '采用21分制，三局两胜，小组循环+淘汰赛制', isCustom: true },
          { id: 'desc_3', label: '费用说明', value: '费用包含场地费、饮用水、高级队服、午餐、奖品', isCustom: true },
          { id: 'desc_4', label: '特别说明', value: '本组为邀请制，组织方会审核报名资格，请如实填写信息', isCustom: true }
        ]
      }
    ]
  },
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
  // 羽毛球活动报名记录（注意：u1是当前测试用户，未报名此活动）
  {
    id: 'r0_1',
    activityId: 'a0',
    groupId: 'g1', // A组-新手入门
    userId: 'u2',
    name: '李小雅',
    mobile: '139****5678',
    customData: { '球龄': '1个月', '是否需要借用球拍': '不需要' },
    status: 'approved',
    registeredAt: '2025-12-13 14:35',
    approvedAt: '2025-12-13 14:35',
    checkinStatus: 'pending',
    checkinTime: null
  },
  {
    id: 'r0_2',
    activityId: 'a0',
    groupId: 'g1', // A组-新手入门
    userId: 'u7',
    name: '陈晓明',
    mobile: '186****1122',
    customData: { '球龄': '3个月', '是否需要借用球拍': '需要' },
    status: 'approved',
    registeredAt: '2025-12-14 08:20',
    approvedAt: '2025-12-14 08:20',
    checkinStatus: 'pending',
    checkinTime: null
  },
  {
    id: 'r0_3',
    activityId: 'a0',
    groupId: 'g2', // B组-初级提高
    userId: 'u3',
    name: '王小文',
    mobile: '136****9012',
    customData: { '球龄': '8个月', '擅长位置': '双打', 'T恤尺码': 'L' },
    status: 'approved',
    registeredAt: '2025-12-14 09:15',
    approvedAt: '2025-12-14 09:15',
    checkinStatus: 'pending',
    checkinTime: null
  },
  {
    id: 'r0_4',
    activityId: 'a0',
    groupId: 'g3', // C组-中级竞技
    userId: 'u4',
    name: '赵小海',
    mobile: '137****3456',
    customData: { '球龄': '2年', '参赛类型': '男单', '搭档姓名': '', 'T恤尺码': 'XL' },
    status: 'approved',
    registeredAt: '2025-12-14 11:40',
    approvedAt: '2025-12-14 11:40',
    checkinStatus: 'pending',
    checkinTime: null
  },
  {
    id: 'r0_5',
    activityId: 'a0',
    groupId: 'g4', // D组-高级邀请
    userId: 'u6',
    name: '王晨',
    mobile: '134****2345',
    customData: {
      '球龄': '5年',
      '参赛类型': '男双',
      '最好成绩': '市级比赛冠军',
      '搭档姓名': '李强 139****1111',
      'T恤尺码': 'L',
      '紧急联系人': '王晨妈妈 138****9999'
    },
    status: 'approved',
    registeredAt: '2025-12-15 08:30',
    approvedAt: '2025-12-15 08:30',
    checkinStatus: 'pending',
    checkinTime: null
  },
  // 网球活动报名记录
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