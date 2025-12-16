-- ============================================
-- ActivityAssistant 数据库优化脚本
-- 版本: 1.0
-- 创建日期: 2025-01-30
-- 说明: 数据库性能优化、额外索引、视图等
-- ============================================

USE activity_assistant;

-- ============================================
-- 1. 复合索引优化
-- ============================================

-- 活动表: 常用查询组合索引
-- 查询未删除的公开活动（按状态和时间）
CREATE INDEX IF NOT EXISTS idx_activity_query
ON activities(is_deleted, is_public, status, start_time);

-- 活动表: 组织者查询自己的活动
CREATE INDEX IF NOT EXISTS idx_organizer_status
ON activities(organizer_id, status, created_at);

-- 报名表: 用户查询自己的报名记录
CREATE INDEX IF NOT EXISTS idx_user_registrations
ON registrations(user_id, status, registered_at);

-- 报名表: 活动查询报名列表（带分组）
CREATE INDEX IF NOT EXISTS idx_activity_group_status
ON registrations(activity_id, group_id, status);

-- 消息表: 用户未读消息查询
CREATE INDEX IF NOT EXISTS idx_user_unread_messages
ON messages(user_id, is_read, created_at);

-- 评价表: 活动评价查询（未删除）
CREATE INDEX IF NOT EXISTS idx_activity_reviews
ON reviews(activity_id, is_deleted, created_at);

-- ============================================
-- 2. 全文索引（如需支持中文全文搜索）
-- ============================================

-- 注意: MySQL 5.7.6+ 支持 InnoDB 全文索引
-- 活动标题和描述全文索引（可选）
-- CREATE FULLTEXT INDEX idx_activity_fulltext
-- ON activities(title, description) WITH PARSER ngram;

-- ============================================
-- 3. 常用统计视图
-- ============================================

-- 活动统计视图：包含报名数、签到数、评价数等
CREATE OR REPLACE VIEW view_activity_statistics AS
SELECT
    a.id AS activity_id,
    a.title,
    a.organizer_id,
    a.status,
    a.start_time,
    a.end_time,
    a.total AS max_participants,
    a.joined AS registered_count,

    -- 报名统计
    COUNT(DISTINCT r.id) AS total_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'approved' THEN r.id END) AS approved_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.id END) AS pending_registrations,

    -- 签到统计
    COUNT(DISTINCT c.id) AS total_checkins,
    COUNT(DISTINCT CASE WHEN c.is_late = FALSE THEN c.id END) AS on_time_checkins,
    COUNT(DISTINCT CASE WHEN c.is_late = TRUE THEN c.id END) AS late_checkins,

    -- 评价统计
    COUNT(DISTINCT rv.id) AS total_reviews,
    AVG(CASE WHEN rv.is_deleted = FALSE THEN rv.rating END) AS average_rating

FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id
LEFT JOIN checkins c ON a.id = c.activity_id
LEFT JOIN reviews rv ON a.id = rv.activity_id
WHERE a.is_deleted = FALSE
GROUP BY a.id, a.title, a.organizer_id, a.status, a.start_time, a.end_time, a.total, a.joined;

-- 用户活动统计视图
CREATE OR REPLACE VIEW view_user_statistics AS
SELECT
    u.id AS user_id,
    u.nickname,

    -- 组织活动统计
    COUNT(DISTINCT a.id) AS organized_activities,
    COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) AS published_activities,
    COUNT(DISTINCT CASE WHEN a.status = 'finished' THEN a.id END) AS finished_activities,

    -- 参与活动统计
    COUNT(DISTINCT r.activity_id) AS participated_activities,
    COUNT(DISTINCT CASE WHEN r.status = 'approved' THEN r.activity_id END) AS approved_participations,

    -- 签到统计
    COUNT(DISTINCT c.activity_id) AS checked_in_activities,

    -- 评价统计
    COUNT(DISTINCT rv.activity_id) AS reviewed_activities

FROM users u
LEFT JOIN activities a ON u.id = a.organizer_id AND a.is_deleted = FALSE
LEFT JOIN registrations r ON u.id = r.user_id
LEFT JOIN checkins c ON u.id = c.user_id
LEFT JOIN reviews rv ON u.id = rv.user_id AND rv.is_deleted = FALSE
GROUP BY u.id, u.nickname;

-- ============================================
-- 4. 性能优化建议
-- ============================================

-- 设置 InnoDB 缓冲池大小（建议设置为服务器内存的 50-75%）
-- SET GLOBAL innodb_buffer_pool_size = 2147483648; -- 2GB

-- 启用查询缓存（MySQL 5.7 及以下版本）
-- SET GLOBAL query_cache_type = 1;
-- SET GLOBAL query_cache_size = 67108864; -- 64MB

-- ============================================
-- 5. 数据清理存储过程（可选）
-- ============================================

-- 清理过期数据的存储过程（保留最近1年数据）
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_cleanup_old_data()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '清理数据失败';
    END;

    START TRANSACTION;

    -- 清理1年前已取消的活动
    UPDATE activities
    SET is_deleted = TRUE
    WHERE status = 'cancelled'
      AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)
      AND is_deleted = FALSE;

    -- 清理1年前的已读消息
    DELETE FROM messages
    WHERE is_read = TRUE
      AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

    -- 清理已处理的反馈（1年前）
    DELETE FROM feedbacks
    WHERE status IN ('resolved', 'closed')
      AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

    COMMIT;
END$$

DELIMITER ;

-- ============================================
-- 6. 定时任务优化建议
-- ============================================

-- 建议使用 MySQL Event Scheduler 定期执行维护任务
-- 启用事件调度器
-- SET GLOBAL event_scheduler = ON;

-- 示例: 每天凌晨2点执行数据清理
-- CREATE EVENT IF NOT EXISTS event_daily_cleanup
-- ON SCHEDULE EVERY 1 DAY
-- STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
-- DO CALL sp_cleanup_old_data();

-- 示例: 每周日凌晨3点优化所有表
-- CREATE EVENT IF NOT EXISTS event_weekly_optimize
-- ON SCHEDULE EVERY 1 WEEK
-- STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 WEEK + INTERVAL 3 HOUR)
-- DO
-- BEGIN
--     OPTIMIZE TABLE users;
--     OPTIMIZE TABLE activities;
--     OPTIMIZE TABLE registrations;
--     OPTIMIZE TABLE checkins;
--     OPTIMIZE TABLE reviews;
--     OPTIMIZE TABLE messages;
--     OPTIMIZE TABLE favorites;
--     OPTIMIZE TABLE feedbacks;
-- END;

-- ============================================
-- 优化脚本执行完成
-- ============================================
