package com.activityassistant.mapper;

import com.activityassistant.dto.response.UserVO;
import com.activityassistant.model.User;
import org.springframework.stereotype.Component;

/**
 * 用户实体和VO转换工具
 *
 * @author Claude
 * @since 2025-01-08
 */
@Component
public class UserMapper {

    private String normalizeAvatar(String avatar) {
        if (avatar == null) {
            return null;
        }
        String trimmed = avatar.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        // 兼容历史默认头像路径（文件不存在会导致前端空白）
        if ("/default_avatar.png".equals(trimmed)) {
            return "/activityassistant_avatar_01.png";
        }
        return trimmed;
    }

    /**
     * User转UserVO（脱敏处理）
     *
     * @param user 用户实体
     * @return UserVO
     */
    public UserVO toVO(User user) {
        if (user == null) {
            return null;
        }

        return UserVO.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .avatar(normalizeAvatar(user.getAvatar()))
                .phone(maskPhone(user.getPhone()))
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * User转UserVO（不脱敏，用于本人查看自己信息）
     *
     * @param user 用户实体
     * @return UserVO
     */
    public UserVO toVOWithFullInfo(User user) {
        if (user == null) {
            return null;
        }

        return UserVO.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .avatar(normalizeAvatar(user.getAvatar()))
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * 手机号脱敏：138****8000
     *
     * @param phone 原始手机号
     * @return 脱敏后的手机号
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
