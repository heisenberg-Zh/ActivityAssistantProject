-- ============================================
-- ActivityAssistant 实用SQL查询集合
-- ============================================

USE activity_assistant;

-- ============================================
-- 1. 数据概览查询
-- ============================================

-- 查看所有表的数据量
SELECT 'activities' AS table_name, COUNT(*) AS count FROM activities
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'registrations', COUNT(*) FROM registrations
UNION ALL
SELECT 'checkins', COUNT(*) FROM checkins
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;

-- 查看活动状态分布
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM activities), 2) as percentage
FROM activities
WHERE is_deleted = 0
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- 2. 活动管理查询
-- ============================================

-- 查看所有活动（简要信息）
SELECT
  id,
  title,
  status,
  type,
  start_time,
  CONCAT(joined, '/', total) as participants,
  organizer_id
FROM activities
WHERE is_deleted = 0
ORDER BY start_time DESC
LIMIT 20;

-- 查看进行中/即将开始的活动
SELECT
  id,
  title,
  status,
  start_time,
  place,
  joined,
  total,
  ROUND(joined * 100.0 / total, 1) as fill_rate
FROM activities
WHERE status IN ('published', 'ongoing')
  AND is_deleted = 0
ORDER BY start_time;

-- 查看某个活动的完整信息
SELECT * FROM activities WHERE id = 'a1'\G

-- 查看某用户创建的所有活动
SELECT
  id,
  title,
  status,
  start_time,
  joined,
  total,
  created_at
FROM activities
WHERE organizer_id = 'u1'
  AND is_deleted = 0
ORDER BY created_at DESC;

-- 查看热门活动（报名率排序）
SELECT
  id,
  title,
  type,
  joined,
  total,
  ROUND(joined * 100.0 / total, 2) as fill_rate
FROM activities
WHERE is_public = 1
  AND is_deleted = 0
  AND total > 0
  AND status IN ('published', 'ongoing')
ORDER BY fill_rate DESC
LIMIT 10;

-- ============================================
-- 3. 报名管理查询
-- ============================================

-- 查看某活动的所有报名
SELECT
  r.id,
  r.name,
  r.mobile,
  r.status,
  r.registered_at,
  r.checkin_status,
  u.nickname as user_nickname
FROM registrations r
LEFT JOIN users u ON r.user_id = u.id
WHERE r.activity_id = 'a1'
ORDER BY r.registered_at DESC;

-- 查看待审核的报名
SELECT
  r.id,
  a.title as activity_title,
  r.name,
  r.mobile,
  r.registered_at,
  u.nickname
FROM registrations r
INNER JOIN activities a ON r.activity_id = a.id
INNER JOIN users u ON r.user_id = u.id
WHERE r.status = 'pending'
  AND a.organizer_id = 'u1'
ORDER BY r.registered_at;

-- 查看某用户的报名历史
SELECT
  a.title,
  a.type,
  a.start_time,
  r.status,
  r.registered_at,
  r.checkin_status
FROM registrations r
INNER JOIN activities a ON r.activity_id = a.id
WHERE r.user_id = 'u1'
ORDER BY r.registered_at DESC;

-- 统计各活动的报名情况
SELECT
  a.id,
  a.title,
  a.status,
  COUNT(r.id) as total_registrations,
  SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected
FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id
WHERE a.is_deleted = 0
GROUP BY a.id
HAVING total_registrations > 0
ORDER BY total_registrations DESC;

-- 查看分组活动的报名分布
SELECT
  group_id,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
FROM registrations
WHERE activity_id = 'a0'
GROUP BY group_id;

-- ============================================
-- 4. 签到管理查询
-- ============================================

-- 查看某活动的签到记录
SELECT
  u.nickname,
  c.checkin_time,
  c.distance,
  c.is_late,
  c.is_valid,
  CASE
    WHEN c.is_late = 1 THEN '迟到'
    WHEN c.is_valid = 0 THEN '位置异常'
    ELSE '正常'
  END as status_text
FROM checkins c
INNER JOIN users u ON c.user_id = u.id
WHERE c.activity_id = 'a1'
ORDER BY c.checkin_time;

-- 查看未签到的已报名用户
SELECT
  r.name,
  r.mobile,
  r.registered_at,
  u.nickname
FROM registrations r
INNER JOIN users u ON r.user_id = u.id
LEFT JOIN checkins c ON r.id = c.registration_id
WHERE r.activity_id = 'a1'
  AND r.status = 'approved'
  AND c.id IS NULL;

-- 统计各活动的签到情况
SELECT
  a.id,
  a.title,
  a.start_time,
  COUNT(DISTINCT r.id) as registered,
  COUNT(DISTINCT c.id) as checkedin,
  COUNT(DISTINCT CASE WHEN c.is_late = 1 THEN c.id END) as late,
  ROUND(COUNT(DISTINCT c.id) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0), 2) as checkin_rate
FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id AND r.status = 'approved'
LEFT JOIN checkins c ON r.id = c.registration_id
WHERE a.status = 'finished'
  AND a.is_deleted = 0
GROUP BY a.id
ORDER BY a.start_time DESC
LIMIT 10;

-- 查看迟到签到记录
SELECT
  a.title,
  u.nickname,
  c.checkin_time,
  a.start_time,
  TIMESTAMPDIFF(MINUTE, a.start_time, c.checkin_time) as minutes_late
FROM checkins c
INNER JOIN users u ON c.user_id = u.id
INNER JOIN activities a ON c.activity_id = a.id
WHERE c.is_late = 1
ORDER BY c.checkin_time DESC;

-- ============================================
-- 5. 用户统计查询
-- ============================================

-- 用户活跃度统计
SELECT
  u.id,
  u.nickname,
  u.mobile,
  COUNT(DISTINCT a.id) as created_activities,
  COUNT(DISTINCT r.id) as joined_activities,
  COUNT(DISTINCT c.id) as checkin_count,
  MAX(r.registered_at) as last_registration,
  MAX(c.checkin_time) as last_checkin
FROM users u
LEFT JOIN activities a ON u.id = a.organizer_id AND a.is_deleted = 0
LEFT JOIN registrations r ON u.id = r.user_id
LEFT JOIN checkins c ON u.id = c.user_id
GROUP BY u.id
ORDER BY (created_activities + joined_activities) DESC;

-- 用户签到率统计
SELECT
  u.id,
  u.nickname,
  COUNT(DISTINCT r.id) as total_registrations,
  COUNT(DISTINCT CASE WHEN r.checkin_status IN ('checked', 'late') THEN r.id END) as checkin_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN r.checkin_status IN ('checked', 'late') THEN r.id END) * 100.0 /
    NULLIF(COUNT(DISTINCT r.id), 0),
    2
  ) as checkin_rate
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id AND r.status = 'approved'
GROUP BY u.id
HAVING total_registrations > 0
ORDER BY checkin_rate DESC;

-- ============================================
-- 6. 数据分析查询
-- ============================================

-- 活动类型统计
SELECT
  type,
  COUNT(*) as activity_count,
  SUM(joined) as total_participants,
  ROUND(AVG(joined * 100.0 / NULLIF(total, 0)), 2) as avg_fill_rate
FROM activities
WHERE is_deleted = 0 AND total > 0
GROUP BY type
ORDER BY activity_count DESC;

-- 月度活动趋势（最近6个月）
SELECT
  DATE_FORMAT(start_time, '%Y-%m') as month,
  COUNT(*) as activity_count,
  SUM(joined) as total_participants,
  COUNT(DISTINCT organizer_id) as active_organizers,
  ROUND(AVG(joined * 100.0 / NULLIF(total, 0)), 2) as avg_fill_rate
FROM activities
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
  AND is_deleted = 0
GROUP BY DATE_FORMAT(start_time, '%Y-%m')
ORDER BY month;

-- 活动时段分析
SELECT
  CASE
    WHEN HOUR(start_time) BETWEEN 6 AND 11 THEN '上午'
    WHEN HOUR(start_time) BETWEEN 12 AND 17 THEN '下午'
    WHEN HOUR(start_time) BETWEEN 18 AND 23 THEN '晚上'
    ELSE '凌晨'
  END as time_period,
  COUNT(*) as activity_count,
  ROUND(AVG(joined * 100.0 / NULLIF(total, 0)), 2) as avg_fill_rate
FROM activities
WHERE is_deleted = 0 AND total > 0
GROUP BY time_period
ORDER BY activity_count DESC;

-- ============================================
-- 7. 数据完整性检查
-- ============================================

-- 检查孤立的报名记录
SELECT
  r.id,
  r.activity_id,
  r.user_id,
  'activity not found' as issue
FROM registrations r
LEFT JOIN activities a ON r.activity_id = a.id
WHERE a.id IS NULL;

-- 检查孤立的签到记录
SELECT
  c.id,
  c.registration_id,
  'registration not found' as issue
FROM checkins c
LEFT JOIN registrations r ON c.registration_id = r.id
WHERE r.id IS NULL;

-- 检查活动人数不一致
SELECT
  a.id,
  a.title,
  a.joined as stored_count,
  COUNT(r.id) as actual_count,
  (a.joined - COUNT(r.id)) as difference
FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id AND r.status = 'approved'
WHERE a.is_deleted = 0
GROUP BY a.id
HAVING difference != 0;

-- 检查重复报名
SELECT
  activity_id,
  user_id,
  COUNT(*) as count
FROM registrations
GROUP BY activity_id, user_id
HAVING count > 1;

-- ============================================
-- 8. 性能分析查询
-- ============================================

-- 查看表大小
SELECT
  TABLE_NAME,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS Size_MB,
  TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'activity_assistant'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- 查看索引使用情况
SELECT
  TABLE_NAME,
  INDEX_NAME,
  SEQ_IN_INDEX,
  COLUMN_NAME,
  CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'activity_assistant'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- 9. 数据清理（谨慎使用）
-- ============================================

-- 删除指定活动（软删除）
-- UPDATE activities SET is_deleted = 1 WHERE id = 'activity_id';

-- 清空测试数据（物理删除，谨慎！）
-- DELETE FROM checkins WHERE activity_id LIKE 'test%';
-- DELETE FROM registrations WHERE activity_id LIKE 'test%';
-- DELETE FROM activities WHERE id LIKE 'test%';

-- 清空所有数据（非常危险！）
-- TRUNCATE TABLE messages;
-- TRUNCATE TABLE checkins;
-- TRUNCATE TABLE registrations;
-- TRUNCATE TABLE activities;
-- TRUNCATE TABLE users;

-- ============================================
-- 10. 常用更新操作
-- ============================================

-- 批量更新活动状态
-- UPDATE activities
-- SET status = 'finished'
-- WHERE end_time < NOW()
--   AND status = 'ongoing';

-- 修复活动人数
-- UPDATE activities a
-- SET a.joined = (
--   SELECT COUNT(*)
--   FROM registrations r
--   WHERE r.activity_id = a.id AND r.status = 'approved'
-- )
-- WHERE a.is_deleted = 0;

-- 批量标记缺席
-- UPDATE registrations r
-- INNER JOIN activities a ON r.activity_id = a.id
-- SET r.checkin_status = 'absent'
-- WHERE a.status = 'finished'
--   AND r.status = 'approved'
--   AND r.checkin_status = 'pending'
--   AND NOT EXISTS (
--     SELECT 1 FROM checkins c WHERE c.registration_id = r.id
--   );

-- ============================================
-- END
-- ============================================
