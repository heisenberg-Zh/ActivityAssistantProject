-- ============================================
-- 报名500错误诊断SQL脚本
-- 版本: 1.0
-- 功能: 检查可能导致报名失败的数据问题
-- ============================================

USE activity_assistant;

-- ============================================
-- 1. 检查活动表的字段类型是否匹配
-- ============================================
SELECT
    '=== 活动表字段类型检查 ===' AS info;

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'activity_assistant'
    AND TABLE_NAME = 'activities'
    AND COLUMN_NAME IN (
        'total', 'joined', 'min_participants',
        'desc', 'requirements', 'organizer_phone',
        'organizer_wechat', 'image', 'has_groups'
    )
ORDER BY
    ORDINAL_POSITION;

-- ============================================
-- 2. 检查是否有total字段为NULL或异常的活动
-- ============================================
SELECT
    '=== 检查total字段异常的活动 ===' AS info;

SELECT
    id,
    title,
    status,
    total,
    joined,
    min_participants,
    is_deleted
FROM
    activities
WHERE
    is_deleted = FALSE
    AND (total IS NULL OR total <= 0 OR total > 10000);

-- 如果上面查询有结果，说明有活动的total字段异常

-- ============================================
-- 3. 检查是否有joined字段为NULL或异常的活动
-- ============================================
SELECT
    '=== 检查joined字段异常的活动 ===' AS info;

SELECT
    id,
    title,
    status,
    total,
    joined,
    is_deleted
FROM
    activities
WHERE
    is_deleted = FALSE
    AND (joined IS NULL OR joined < 0 OR joined > total);

-- ============================================
-- 4. 检查报名表是否正常
-- ============================================
SELECT
    '=== 报名表结构检查 ===' AS info;

DESCRIBE registrations;

-- ============================================
-- 5. 检查最近的报名记录
-- ============================================
SELECT
    '=== 最近10条报名记录 ===' AS info;

SELECT
    r.id AS registration_id,
    r.activity_id,
    a.title AS activity_title,
    r.user_id,
    r.status AS registration_status,
    a.status AS activity_status,
    a.total,
    a.joined,
    r.created_at
FROM
    registrations r
LEFT JOIN
    activities a ON r.activity_id = a.id
ORDER BY
    r.created_at DESC
LIMIT 10;

-- ============================================
-- 6. 检查是否有状态为published但total为异常值的活动
-- ============================================
SELECT
    '=== 检查可报名但配置异常的活动 ===' AS info;

SELECT
    id,
    title,
    status,
    total,
    joined,
    min_participants,
    register_deadline,
    need_review
FROM
    activities
WHERE
    is_deleted = FALSE
    AND status IN ('published', 'ongoing')
    AND (
        total IS NULL
        OR total <= 0
        OR total > 10000
        OR joined IS NULL
        OR joined < 0
        OR joined > total
    );

-- ============================================
-- 7. 检查是否有新增字段为NULL的活动（可能导致问题）
-- ============================================
SELECT
    '=== 检查新增字段的数据情况 ===' AS info;

SELECT
    COUNT(*) AS total_activities,
    SUM(CASE WHEN `desc` IS NULL THEN 1 ELSE 0 END) AS desc_null_count,
    SUM(CASE WHEN requirements IS NULL THEN 1 ELSE 0 END) AS requirements_null_count,
    SUM(CASE WHEN organizer_phone IS NULL THEN 1 ELSE 0 END) AS phone_null_count,
    SUM(CASE WHEN organizer_wechat IS NULL THEN 1 ELSE 0 END) AS wechat_null_count,
    SUM(CASE WHEN image IS NULL THEN 1 ELSE 0 END) AS image_null_count,
    SUM(CASE WHEN has_groups IS NULL THEN 1 ELSE 0 END) AS has_groups_null_count
FROM
    activities
WHERE
    is_deleted = FALSE;

-- ============================================
-- 8. 查询特定活动的详细信息（请替换 'A20251215000004' 为实际活动ID）
-- ============================================
SELECT
    '=== 具体活动详细信息（请根据报错修改活动ID） ===' AS info;

-- 从截图中看到活动ID是 A20251215000004，查询这个活动的详细信息
SELECT
    *
FROM
    activities
WHERE
    id = 'A20251215000004';

-- 查询这个活动的报名情况
SELECT
    '=== 活动 A20251215000004 的报名情况 ===' AS info;

SELECT
    id,
    user_id,
    status,
    group_id,
    created_at,
    approved_at
FROM
    registrations
WHERE
    activity_id = 'A20251215000004'
ORDER BY
    created_at DESC;

-- ============================================
-- 9. 检查数据库表的字符集和排序规则
-- ============================================
SELECT
    '=== 表字符集检查 ===' AS info;

SELECT
    TABLE_NAME,
    TABLE_COLLATION,
    ENGINE
FROM
    INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_SCHEMA = 'activity_assistant'
    AND TABLE_NAME IN ('activities', 'registrations', 'users');

-- ============================================
-- 完成提示
-- ============================================
SELECT '✅ 诊断查询完成！请根据上述结果排查问题' AS status;
