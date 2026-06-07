-- 网球活动统计导出（只读 SELECT）
-- 使用方式：先填写以下参数，再在 MySQL Workbench / DataGrip 中分别执行 3 段 SELECT 并导出 CSV。
-- 时间范围：2026-01-01 00:00:00 至执行时刻 NOW()。

SET @organizer_id := '';      -- 推荐填写：你的 users.id；不确定可留空并填写 @organizer_mobile 或 @organizer_nickname
SET @organizer_mobile := '';  -- 可选：你的手机号
SET @organizer_nickname := '';-- 可选：你的昵称
SET @keyword := '网球';       -- 活动过滤关键字；如标题/类型未含“网球”，可设为空字符串后人工复核

-- 1) 活动明细记录表：对齐示例 Excel 的「活动日期 / 参与人数 / 参加人员（部门-姓名-场地）」
WITH group_names AS (
    SELECT
        a.id AS activity_id,
        jt.group_id,
        jt.group_name
    FROM activities a
    LEFT JOIN JSON_TABLE(
        COALESCE(a.`groups`, JSON_ARRAY()),
        '$[*]' COLUMNS (
            group_id VARCHAR(100) PATH '$.id',
            group_name VARCHAR(200) PATH '$.name'
        )
    ) jt ON TRUE
), field_defs AS (
    SELECT
        a.id AS activity_id,
        NULL AS group_id,
        af.field_id,
        af.label
    FROM activities a
    LEFT JOIN JSON_TABLE(
        COALESCE(a.custom_fields, JSON_ARRAY()),
        '$[*]' COLUMNS (
            field_id VARCHAR(100) PATH '$.id',
            label VARCHAR(100) PATH '$.label'
        )
    ) af ON TRUE
    UNION ALL
    SELECT
        a.id AS activity_id,
        g.group_id,
        gf.field_id,
        gf.label
    FROM activities a
    LEFT JOIN JSON_TABLE(
        COALESCE(a.`groups`, JSON_ARRAY()),
        '$[*]' COLUMNS (
            group_id VARCHAR(100) PATH '$.id',
            custom_fields JSON PATH '$.customFields'
        )
    ) g ON TRUE
    LEFT JOIN JSON_TABLE(
        COALESCE(g.custom_fields, JSON_ARRAY()),
        '$[*]' COLUMNS (
            field_id VARCHAR(100) PATH '$.id',
            label VARCHAR(100) PATH '$.label'
        )
    ) gf ON TRUE
), participant_rows AS (
    SELECT
        a.id AS activity_id,
        DATE(a.start_time) AS activity_date,
        a.start_time,
        COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."所属部门"')),
            JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '所属部门' AND fd.field_id IS NOT NULL LIMIT 1), '"'))),
            ''
        ) AS department,
        COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."真实姓名"')),
            JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '真实姓名' AND fd.field_id IS NOT NULL LIMIT 1), '"'))),
            r.name,
            ''
        ) AS real_name,
        COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."场地"')),
            JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '场地' AND fd.field_id IS NOT NULL LIMIT 1), '"'))),
            gn.group_name,
            ''
        ) AS court_name,
        ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY r.approved_at, r.registered_at, r.id) AS participant_no
    FROM activities a
    JOIN users organizer ON organizer.id = a.organizer_id
    JOIN registrations r ON r.activity_id = a.id
    LEFT JOIN group_names gn ON gn.activity_id = a.id AND gn.group_id = r.group_id
    WHERE a.is_deleted = 0
      AND a.start_time >= '2026-01-01 00:00:00'
      AND a.start_time < NOW()
      AND r.status = 'approved'
      AND (@organizer_id = '' OR a.organizer_id = @organizer_id)
      AND (@organizer_id <> '' OR @organizer_mobile = '' OR organizer.mobile = @organizer_mobile)
      AND (@organizer_id <> '' OR @organizer_nickname = '' OR organizer.nickname = @organizer_nickname)
      AND (
          @keyword = ''
          OR a.title LIKE CONCAT('%', @keyword, '%')
          OR a.type LIKE CONCAT('%', @keyword, '%')
          OR a.place LIKE CONCAT('%', @keyword, '%')
          OR a.description LIKE CONCAT('%', @keyword, '%')
      )
)
SELECT
    ROW_NUMBER() OVER (ORDER BY activity_date, activity_id) AS `序号`,
    DATE_FORMAT(activity_date, '%Y年%c月%e日') AS `活动日期`,
    COUNT(*) AS `参与人数`,
    GROUP_CONCAT(
        CONCAT(participant_no, '. ', department, '-', real_name, '-', court_name)
        ORDER BY participant_no
        SEPARATOR '\n'
    ) AS `参加人员（部门-姓名-场地）`
FROM participant_rows
GROUP BY activity_id, activity_date
ORDER BY activity_date, activity_id;

-- 2) 个人出勤汇总统计表：对齐示例 Excel 的「姓名 / 所属部门 / 累计参加场次」
WITH group_names AS (
    SELECT a.id AS activity_id, jt.group_id, jt.group_name
    FROM activities a
    LEFT JOIN JSON_TABLE(COALESCE(a.`groups`, JSON_ARRAY()), '$[*]' COLUMNS (group_id VARCHAR(100) PATH '$.id', group_name VARCHAR(200) PATH '$.name')) jt ON TRUE
), field_defs AS (
    SELECT a.id AS activity_id, NULL AS group_id, af.field_id, af.label
    FROM activities a
    LEFT JOIN JSON_TABLE(COALESCE(a.custom_fields, JSON_ARRAY()), '$[*]' COLUMNS (field_id VARCHAR(100) PATH '$.id', label VARCHAR(100) PATH '$.label')) af ON TRUE
    UNION ALL
    SELECT a.id AS activity_id, g.group_id, gf.field_id, gf.label
    FROM activities a
    LEFT JOIN JSON_TABLE(COALESCE(a.`groups`, JSON_ARRAY()), '$[*]' COLUMNS (group_id VARCHAR(100) PATH '$.id', custom_fields JSON PATH '$.customFields')) g ON TRUE
    LEFT JOIN JSON_TABLE(COALESCE(g.custom_fields, JSON_ARRAY()), '$[*]' COLUMNS (field_id VARCHAR(100) PATH '$.id', label VARCHAR(100) PATH '$.label')) gf ON TRUE
), participant_rows AS (
    SELECT
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."所属部门"')), JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '所属部门' AND fd.field_id IS NOT NULL LIMIT 1), '"'))), '') AS department,
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."真实姓名"')), JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '真实姓名' AND fd.field_id IS NOT NULL LIMIT 1), '"'))), r.name, '') AS real_name,
        a.id AS activity_id
    FROM activities a
    JOIN users organizer ON organizer.id = a.organizer_id
    JOIN registrations r ON r.activity_id = a.id
    LEFT JOIN group_names gn ON gn.activity_id = a.id AND gn.group_id = r.group_id
    WHERE a.is_deleted = 0
      AND a.start_time >= '2026-01-01 00:00:00'
      AND a.start_time < NOW()
      AND r.status = 'approved'
      AND (@organizer_id = '' OR a.organizer_id = @organizer_id)
      AND (@organizer_id <> '' OR @organizer_mobile = '' OR organizer.mobile = @organizer_mobile)
      AND (@organizer_id <> '' OR @organizer_nickname = '' OR organizer.nickname = @organizer_nickname)
      AND (@keyword = '' OR a.title LIKE CONCAT('%', @keyword, '%') OR a.type LIKE CONCAT('%', @keyword, '%') OR a.place LIKE CONCAT('%', @keyword, '%') OR a.description LIKE CONCAT('%', @keyword, '%'))
)
SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT activity_id) DESC, real_name, department) AS `排名`,
    real_name AS `姓名`,
    department AS `所属部门`,
    COUNT(DISTINCT activity_id) AS `累计参加场次`
FROM participant_rows
GROUP BY real_name, department
ORDER BY `累计参加场次` DESC, `姓名`, `所属部门`;

-- 3) 报名参加情况明细：用于复核每个人每场活动的审核/打卡状态
WITH group_names AS (
    SELECT a.id AS activity_id, jt.group_id, jt.group_name
    FROM activities a
    LEFT JOIN JSON_TABLE(COALESCE(a.`groups`, JSON_ARRAY()), '$[*]' COLUMNS (group_id VARCHAR(100) PATH '$.id', group_name VARCHAR(200) PATH '$.name')) jt ON TRUE
), field_defs AS (
    SELECT a.id AS activity_id, NULL AS group_id, af.field_id, af.label
    FROM activities a
    LEFT JOIN JSON_TABLE(COALESCE(a.custom_fields, JSON_ARRAY()), '$[*]' COLUMNS (field_id VARCHAR(100) PATH '$.id', label VARCHAR(100) PATH '$.label')) af ON TRUE
    UNION ALL
    SELECT a.id AS activity_id, g.group_id, gf.field_id, gf.label
    FROM activities a
    LEFT JOIN JSON_TABLE(COALESCE(a.`groups`, JSON_ARRAY()), '$[*]' COLUMNS (group_id VARCHAR(100) PATH '$.id', custom_fields JSON PATH '$.customFields')) g ON TRUE
    LEFT JOIN JSON_TABLE(COALESCE(g.custom_fields, JSON_ARRAY()), '$[*]' COLUMNS (field_id VARCHAR(100) PATH '$.id', label VARCHAR(100) PATH '$.label')) gf ON TRUE
)
SELECT
    DATE_FORMAT(a.start_time, '%Y-%m-%d') AS `活动日期`,
    a.title AS `活动标题`,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."所属部门"')), JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '所属部门' AND fd.field_id IS NOT NULL LIMIT 1), '"'))), '') AS `所属部门`,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."真实姓名"')), JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '真实姓名' AND fd.field_id IS NOT NULL LIMIT 1), '"'))), r.name, '') AS `真实姓名`,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."昵称"')), JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '昵称' AND fd.field_id IS NOT NULL LIMIT 1), '"'))), u.nickname, '') AS `昵称`,
    COALESCE(r.mobile, u.mobile, '') AS `手机号`,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, '$."场地"')), JSON_UNQUOTE(JSON_EXTRACT(r.custom_data, CONCAT('$."', (SELECT fd.field_id FROM field_defs fd WHERE fd.activity_id = a.id AND (fd.group_id = r.group_id OR fd.group_id IS NULL) AND fd.label = '场地' AND fd.field_id IS NOT NULL LIMIT 1), '"'))), gn.group_name, '') AS `场地`,
    CASE r.status WHEN 'approved' THEN '已通过' WHEN 'pending' THEN '待审核' WHEN 'rejected' THEN '已拒绝' WHEN 'cancelled' THEN '已取消' WHEN 'removed' THEN '已移除' ELSE r.status END AS `审核状态`,
    CASE WHEN r.checkin_status IN ('checked', 'late') THEN '已打卡' ELSE '未打卡' END AS `是否已打卡`,
    CASE r.checkin_status WHEN 'late' THEN '迟到' WHEN 'checked' THEN '正常' WHEN 'pending' THEN '未打卡' ELSE r.checkin_status END AS `打卡状态`,
    DATE_FORMAT(r.registered_at, '%Y-%m-%d %H:%i:%s') AS `报名时间`,
    DATE_FORMAT(r.checkin_time, '%Y-%m-%d %H:%i:%s') AS `打卡时间`
FROM activities a
JOIN users organizer ON organizer.id = a.organizer_id
JOIN registrations r ON r.activity_id = a.id
LEFT JOIN users u ON u.id = r.user_id
LEFT JOIN group_names gn ON gn.activity_id = a.id AND gn.group_id = r.group_id
WHERE a.is_deleted = 0
  AND a.start_time >= '2026-01-01 00:00:00'
  AND a.start_time < NOW()
  AND (@organizer_id = '' OR a.organizer_id = @organizer_id)
  AND (@organizer_id <> '' OR @organizer_mobile = '' OR organizer.mobile = @organizer_mobile)
  AND (@organizer_id <> '' OR @organizer_nickname = '' OR organizer.nickname = @organizer_nickname)
  AND (@keyword = '' OR a.title LIKE CONCAT('%', @keyword, '%') OR a.type LIKE CONCAT('%', @keyword, '%') OR a.place LIKE CONCAT('%', @keyword, '%') OR a.description LIKE CONCAT('%', @keyword, '%'))
ORDER BY a.start_time, r.approved_at, r.registered_at, r.id;
