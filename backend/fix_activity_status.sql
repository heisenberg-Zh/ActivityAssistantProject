-- ==========================================
-- 修复活动状态 - 将中文状态转换为英文枚举
-- ==========================================

USE activity_assistant;

SET NAMES utf8mb4;

-- 状态映射：
-- "预发布" -> "pending" (待发布)
-- "即将开始" -> "published" (已发布，可以报名)
-- "进行中" -> "ongoing" (进行中，可以报名)
-- "已结束" -> "finished" (已结束，不可报名)
-- "已取消" -> "cancelled" (已取消，不可报名)

UPDATE activities SET status = 'pending' WHERE status = _utf8mb4'预发布' COLLATE utf8mb4_unicode_ci;
UPDATE activities SET status = 'published' WHERE status = _utf8mb4'即将开始' COLLATE utf8mb4_unicode_ci;
UPDATE activities SET status = 'ongoing' WHERE status = _utf8mb4'进行中' COLLATE utf8mb4_unicode_ci;
UPDATE activities SET status = 'finished' WHERE status = _utf8mb4'已结束' COLLATE utf8mb4_unicode_ci;
UPDATE activities SET status = 'cancelled' WHERE status = _utf8mb4'已取消' COLLATE utf8mb4_unicode_ci;

-- 显示更新结果
SELECT
    '状态修复完成' AS message,
    COUNT(*) AS total_activities,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
    SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) AS ongoing_count,
    SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished_count,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
FROM activities;
