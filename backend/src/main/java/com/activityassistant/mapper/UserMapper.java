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
                .avatar(user.getAvatar())
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
                .avatar(user.getAvatar())
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
