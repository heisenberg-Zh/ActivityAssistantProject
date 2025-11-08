package com.activityassistant.constant;

/**
 * 应用常量
 *
 * @author Claude
 * @since 2025-01-08
 */
public class AppConstants {

    // ============================================
    // JWT 相关常量
    // ============================================
    public static final String JWT_HEADER = "Authorization";
    public static final String JWT_PREFIX = "Bearer ";
    public static final String JWT_CLAIM_USER_ID = "userId";
    public static final String JWT_CLAIM_ROLE = "role";

    // ============================================
    // 活动状态
    // ============================================
    public static final String ACTIVITY_STATUS_PENDING = "pending";         // 草稿
    public static final String ACTIVITY_STATUS_PUBLISHED = "published";     // 已发布
    public static final String ACTIVITY_STATUS_ONGOING = "ongoing";         // 进行中
    public static final String ACTIVITY_STATUS_FINISHED = "finished";       // 已结束
    public static final String ACTIVITY_STATUS_CANCELLED = "cancelled";     // 已取消

    // ============================================
    // 活动类型
    // ============================================
    public static final String ACTIVITY_TYPE_SPORTS = "运动";
    public static final String ACTIVITY_TYPE_GATHERING = "聚会";
    public static final String ACTIVITY_TYPE_TRAINING = "培训";
    public static final String ACTIVITY_TYPE_OUTDOOR = "户外";

    // ============================================
    // 费用类型
    // ============================================
    public static final String FEE_TYPE_FREE = "免费";
    public static final String FEE_TYPE_AA = "AA";
    public static final String FEE_TYPE_UNIFORM = "统一";

    // ============================================
    // 报名状态
    // ============================================
    public static final String REGISTRATION_STATUS_PENDING = "pending";     // 待审核
    public static final String REGISTRATION_STATUS_APPROVED = "approved";   // 已通过
    public static final String REGISTRATION_STATUS_REJECTED = "rejected";   // 已拒绝
    public static final String REGISTRATION_STATUS_CANCELLED = "cancelled"; // 已取消

    // ============================================
    // 签到状态
    // ============================================
    public static final String CHECKIN_STATUS_PENDING = "pending";   // 未签到
    public static final String CHECKIN_STATUS_CHECKED = "checked";   // 已签到
    public static final String CHECKIN_STATUS_LATE = "late";         // 迟到

    // ============================================
    // 用户角色
    // ============================================
    public static final String ROLE_USER = "user";               // 普通用户
    public static final String ROLE_ORGANIZER = "organizer";     // 组织者
    public static final String ROLE_ADMIN = "admin";             // 管理员
    public static final String ROLE_SUPER_ADMIN = "super_admin"; // 超级管理员

    // ============================================
    // 消息类型
    // ============================================
    public static final String MESSAGE_TYPE_REGISTRATION = "registration";  // 报名通知
    public static final String MESSAGE_TYPE_APPROVAL = "approval";          // 审核通知
    public static final String MESSAGE_TYPE_REMINDER = "reminder";          // 活动提醒
    public static final String MESSAGE_TYPE_UPDATE = "update";              // 活动更新
    public static final String MESSAGE_TYPE_SYSTEM = "system";              // 系统消息

    // ============================================
    // 默认值
    // ============================================
    public static final int DEFAULT_CHECKIN_RADIUS = 500;   // 默认签到范围（米）
    public static final int DEFAULT_PAGE_SIZE = 20;         // 默认分页大小
    public static final int MAX_PAGE_SIZE = 100;            // 最大分页大小

    // ============================================
    // 时间格式
    // ============================================
    public static final String DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String TIME_FORMAT = "HH:mm:ss";

    // ============================================
    // 开发模式快速登录 Code
    // ============================================
    public static final String DEV_MODE_LOGIN_CODE = "test_code_dev";
    public static final String DEV_MODE_USER_ID = "u1";
}
