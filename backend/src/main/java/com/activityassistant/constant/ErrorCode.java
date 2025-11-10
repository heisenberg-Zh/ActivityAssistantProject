package com.activityassistant.constant;

/**
 * 错误码常量
 *
 * <p>定义所有业务错误码，确保前后端错误码一致。
 *
 * <p>错误码规则：
 * <ul>
 *   <li>0：成功</li>
 *   <li>400-499：HTTP 标准错误码</li>
 *   <li>1xxx：用户相关错误</li>
 *   <li>2xxx：活动相关错误</li>
 *   <li>3xxx：报名相关错误</li>
 *   <li>4xxx：签到相关错误</li>
 *   <li>5xxx：系统错误</li>
 * </ul>
 *
 * @author Claude
 * @since 2025-01-08
 */
public class ErrorCode {

    // ============================================
    // 通用错误码（0-999）
    // ============================================
    public static final int SUCCESS = 0;
    public static final int BAD_REQUEST = 400;
    public static final int UNAUTHORIZED = 401;
    public static final int FORBIDDEN = 403;
    public static final int NOT_FOUND = 404;
    public static final int CONFLICT = 409;
    public static final int TOO_MANY_REQUESTS = 429;
    public static final int INTERNAL_SERVER_ERROR = 500;

    // 业务通用错误码（900-999）
    public static final int INVALID_PARAMETER = 900;
    public static final int PERMISSION_DENIED = 901;
    public static final int INVALID_OPERATION = 902;

    // ============================================
    // 用户相关错误码（1000-1999）
    // ============================================
    public static final int USER_NOT_FOUND = 1001;
    public static final int USER_ALREADY_EXISTS = 1002;
    public static final int USER_INVALID_CREDENTIALS = 1003;
    public static final int USER_ACCOUNT_DISABLED = 1004;
    public static final int USER_INVALID_PHONE = 1005;
    public static final int PHONE_ALREADY_EXISTS = 1006;

    // ============================================
    // 活动相关错误码（2000-2999）
    // ============================================
    public static final int ACTIVITY_NOT_FOUND = 2001;
    public static final int ACTIVITY_FULL = 2002;
    public static final int ACTIVITY_REGISTRATION_CLOSED = 2003;
    public static final int ACTIVITY_NOT_IN_TIME_RANGE = 2004;
    public static final int ACTIVITY_INSUFFICIENT_PARTICIPANTS = 2005;
    public static final int ACTIVITY_ALREADY_STARTED = 2006;
    public static final int ACTIVITY_ALREADY_FINISHED = 2007;
    public static final int ACTIVITY_ALREADY_CANCELLED = 2008;
    public static final int ACTIVITY_PERMISSION_DENIED = 2009;
    public static final int ACTIVITY_INVALID_STATUS = 2010;
    public static final int ACTIVITY_GROUP_NOT_FOUND = 2011;
    public static final int ACTIVITY_GROUP_FULL = 2012;

    // ============================================
    // 报名相关错误码（3000-3999）
    // ============================================
    public static final int REGISTRATION_NOT_FOUND = 3001;
    public static final int REGISTRATION_ALREADY_EXISTS = 3002;
    public static final int REGISTRATION_ALREADY_CANCELLED = 3003;
    public static final int REGISTRATION_CANNOT_CANCEL = 3004;
    public static final int REGISTRATION_PENDING_APPROVAL = 3005;
    public static final int REGISTRATION_REJECTED = 3006;
    public static final int REGISTRATION_INVALID_CUSTOM_FIELDS = 3007;
    public static final int REGISTRATION_IN_BLACKLIST = 3008;
    public static final int REGISTRATION_NOT_IN_WHITELIST = 3009;

    // ============================================
    // 签到相关错误码（4000-4999）
    // ============================================
    public static final int CHECKIN_NOT_REGISTERED = 4001;
    public static final int CHECKIN_OUT_OF_RANGE = 4002;
    public static final int CHECKIN_OUT_OF_TIME = 4003;
    public static final int CHECKIN_ALREADY_CHECKED = 4004;
    public static final int CHECKIN_INVALID_LOCATION = 4005;

    // ============================================
    // 微信相关错误码（5000-5999）
    // ============================================
    public static final int WECHAT_CODE_INVALID = 5001;
    public static final int WECHAT_SESSION_EXPIRED = 5002;
    public static final int WECHAT_API_ERROR = 5003;

    // ============================================
    // 系统错误码（9000-9999）
    // ============================================
    public static final int SYSTEM_ERROR = 9000;
    public static final int DATABASE_ERROR = 9001;
    public static final int NETWORK_ERROR = 9002;
    public static final int FILE_UPLOAD_ERROR = 9003;
}
