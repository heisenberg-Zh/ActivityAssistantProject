package com.activityassistant.util;

import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * 验证工具类
 *
 * <p>提供常用的数据验证方法。
 *
 * @author Claude
 * @since 2025-01-08
 */
public class ValidationUtil {

    // 手机号正则（中国大陆）
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    // 邮箱正则
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");

    // 身份证号正则（18位）
    private static final Pattern ID_CARD_PATTERN = Pattern.compile(
            "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$");

    /**
     * 验证手机号是否合法
     *
     * @param phone 手机号
     * @return 是否合法
     */
    public static boolean isValidPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * 验证邮箱是否合法
     *
     * @param email 邮箱
     * @return 是否合法
     */
    public static boolean isValidEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * 验证身份证号是否合法
     *
     * @param idCard 身份证号
     * @return 是否合法
     */
    public static boolean isValidIdCard(String idCard) {
        if (!StringUtils.hasText(idCard)) {
            return false;
        }
        return ID_CARD_PATTERN.matcher(idCard).matches();
    }

    /**
     * 手机号脱敏
     *
     * @param phone 手机号
     * @return 脱敏后的手机号（138****1234）
     */
    public static String maskPhone(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    /**
     * 身份证号脱敏
     *
     * @param idCard 身份证号
     * @return 脱敏后的身份证号（前6后4）
     */
    public static String maskIdCard(String idCard) {
        if (!StringUtils.hasText(idCard) || idCard.length() != 18) {
            return idCard;
        }
        return idCard.substring(0, 6) + "********" + idCard.substring(14);
    }

    /**
     * 邮箱脱敏
     *
     * @param email 邮箱
     * @return 脱敏后的邮箱
     */
    public static String maskEmail(String email) {
        if (!StringUtils.hasText(email) || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        String username = parts[0];
        if (username.length() <= 2) {
            return "*@" + parts[1];
        }
        return username.charAt(0) + "***@" + parts[1];
    }

    /**
     * 检查字符串是否为空（null 或空字符串）
     *
     * @param str 字符串
     * @return 是否为空
     */
    public static boolean isEmpty(String str) {
        return !StringUtils.hasText(str);
    }

    /**
     * 检查字符串是否非空
     *
     * @param str 字符串
     * @return 是否非空
     */
    public static boolean isNotEmpty(String str) {
        return StringUtils.hasText(str);
    }

    /**
     * 验证字符串长度是否在指定范围内
     *
     * @param str       字符串
     * @param minLength 最小长度
     * @param maxLength 最大长度
     * @return 是否在范围内
     */
    public static boolean isLengthInRange(String str, int minLength, int maxLength) {
        if (!StringUtils.hasText(str)) {
            return false;
        }
        int length = str.length();
        return length >= minLength && length <= maxLength;
    }

    /**
     * 验证数字是否在指定范围内
     *
     * @param value 数值
     * @param min   最小值
     * @param max   最大值
     * @return 是否在范围内
     */
    public static boolean isNumberInRange(Number value, Number min, Number max) {
        if (value == null) {
            return false;
        }
        double val = value.doubleValue();
        double minVal = min.doubleValue();
        double maxVal = max.doubleValue();
        return val >= minVal && val <= maxVal;
    }
}
