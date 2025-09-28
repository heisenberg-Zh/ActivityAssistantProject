// utils/mock.js
const activities = [
  {
    id: 'a1',
    title: '周末聚餐活动',
    desc: '邀约伙伴一起享受美食时光，畅聊生活与工作心得。',
    date: '12月15日 18:00',
    timeRange: '12月15日 18:00-21:00',
    place: '海底捞火锅（朝阳店）',
    type: '聚会',
    status: '进行中',
    total: 12,
    joined: 8,
    banner: 'pink'
  },
  {
    id: 'a2',
    title: '产品设计沙龙',
    desc: '学习最新的产品设计趋势和优秀案例分享。',
    date: '12月18日 14:00',
    timeRange: '12月18日 14:00-17:00',
    place: '创新大厅',
    type: '培训',
    status: '即将开始',
    total: 20,
    joined: 15,
    banner: 'blue'
  },
  {
    id: 'a3',
    title: '周末登山活动',
    desc: '感受自然风光，锻炼身体，适合亲友共同参与。',
    date: '12月20日 08:00',
    timeRange: '12月20日 08:00-16:00',
    place: '密云山地公园',
    type: '户外',
    status: '即将开始',
    total: 10,
    joined: 6,
    banner: 'green'
  },
  {
    id: 'a4',
    title: '城市摄影漫步',
    desc: '与摄影爱好者一起探索冬日城市的光影故事。',
    date: '12月12日 15:00',
    timeRange: '12月12日 15:00-18:00',
    place: '国贸三期集合',
    type: '户外',
    status: '已结束',
    total: 18,
    joined: 18,
    banner: 'purple'
  }
];

const participants = [
  { id: 'u1', name: '张小北', avatar: '/activityassistant_avatar_01.png' },
  { id: 'u2', name: '李小雅', avatar: '/activityassistant_avatar_02.png' },
  { id: 'u3', name: '王小文', avatar: '/activityassistant_avatar_03.png' },
  { id: 'u4', name: '赵小海', avatar: '/activityassistant_avatar_04.png' }
];

module.exports = { activities, participants };