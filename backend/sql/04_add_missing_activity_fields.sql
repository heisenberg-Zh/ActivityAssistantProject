-- ============================================
-- 添加Activity实体缺失的字段
-- 版本: 1.1
-- 执行日期: 2025-12-15
-- 说明: 添加活动简介、联系方式、报名要求、图片、分组标识等字段
-- ============================================

USE activity_assistant;

-- 检查并添加字段（使用存储过程避免重复添加）
DELIMITER //

-- 1. 添加活动简介（desc）字段
DROP PROCEDURE IF EXISTS add_column_if_not_exists //
CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    -- desc字段（注意：desc是MySQL保留关键字，必须用反引号包裹）
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
        AND TABLE_NAME = 'activities'
        AND COLUMN_NAME = 'desc'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN `desc` VARCHAR(500) NULL COMMENT '活动简介'
        AFTER title;
        SELECT 'Added column: desc' AS result;
    ELSE
        SELECT 'Column desc already exists' AS result;
    END IF;

    -- requirements字段
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
        AND TABLE_NAME = 'activities'
        AND COLUMN_NAME = 'requirements'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN `requirements` TEXT NULL COMMENT '报名要求'
        AFTER description;
        SELECT 'Added column: requirements' AS result;
    ELSE
        SELECT 'Column requirements already exists' AS result;
    END IF;

    -- organizer_phone字段
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
        AND TABLE_NAME = 'activities'
        AND COLUMN_NAME = 'organizer_phone'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN `organizer_phone` VARCHAR(20) NULL COMMENT '组织者联系电话'
        AFTER organizer_id;
        SELECT 'Added column: organizer_phone' AS result;
    ELSE
        SELECT 'Column organizer_phone already exists' AS result;
    END IF;

    -- organizer_wechat字段
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
        AND TABLE_NAME = 'activities'
        AND COLUMN_NAME = 'organizer_wechat'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN `organizer_wechat` VARCHAR(50) NULL COMMENT '组织者微信号'
        AFTER organizer_phone;
        SELECT 'Added column: organizer_wechat' AS result;
    ELSE
        SELECT 'Column organizer_wechat already exists' AS result;
    END IF;

    -- image字段
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
        AND TABLE_NAME = 'activities'
        AND COLUMN_NAME = 'image'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN `image` VARCHAR(500) NULL COMMENT '活动封面图片URL'
        AFTER organizer_wechat;
        SELECT 'Added column: image' AS result;
    ELSE
        SELECT 'Column image already exists' AS result;
    END IF;

    -- has_groups字段
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
        AND TABLE_NAME = 'activities'
        AND COLUMN_NAME = 'has_groups'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN `has_groups` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否启用分组'
        AFTER image;
        SELECT 'Added column: has_groups' AS result;
    ELSE
        SELECT 'Column has_groups already exists' AS result;
    END IF;
END //

DELIMITER ;

-- 执行存储过程
CALL add_column_if_not_exists();

-- 删除存储过程
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- 查看更新后的表结构
DESCRIBE activities;

-- 验证字段添加成功
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'activity_assistant'
    AND TABLE_NAME = 'activities'
    AND COLUMN_NAME IN ('desc', 'requirements', 'organizer_phone', 'organizer_wechat', 'image', 'has_groups')
ORDER BY
    ORDINAL_POSITION;

-- 完成提示
SELECT '✅ 数据库迁移完成！新增字段已添加到activities表' AS status;
