package com.activityassistant.service;

import com.activityassistant.constant.ErrorCode;
import com.activityassistant.dto.request.UpdateUserRequest;
import com.activityassistant.dto.response.LoginResponse;
import com.activityassistant.dto.response.UserVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.exception.UnauthorizedException;
import com.activityassistant.mapper.UserMapper;
import com.activityassistant.model.User;
import com.activityassistant.repository.UserRepository;
import com.activityassistant.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 用户服务
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final WeChatService weChatService;
    private final JwtUtil jwtUtil;

    /**
     * 微信登录
     * 流程：
     * 1. 通过code获取OpenID
     * 2. 检查用户是否存在，不存在则自动注册
     * 3. 更新最后登录时间
     * 4. 生成JWT Token并返回
     *
     * @param code 微信登录code
     * @return 登录响应（包含Token和用户信息）
     */
    @Transactional
    public LoginResponse login(String code) {
        log.info("开始处理微信登录，code={}", code);

        // 1. 获取OpenID
        String openid = weChatService.getOpenIdByCode(code);
        log.info("获取到OpenID: {}", openid);

        // 2. 查找或创建用户
        User user = userRepository.findByOpenid(openid)
                .orElseGet(() -> registerNewUser(openid));

        // 3. 更新最后登录时间（简化版，直接更新实体）
        user.setUpdatedAt(LocalDateTime.now());

        // 5. 生成Token
        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        log.info("用户登录成功，userId={}, role={}", user.getId(), user.getRole());

        // 6. 返回登录响应
        return LoginResponse.builder()
                .token(token)
                .userInfo(userMapper.toVOWithFullInfo(user)) // 登录时返回完整信息
                .build();
    }

    /**
     * 注册新用户
     *
     * @param openid 微信OpenID
     * @return 新用户
     */
    private User registerNewUser(String openid) {
        log.info("OpenID不存在，注册新用户: {}", openid);

        String userId = "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        User newUser = User.builder()
                .id(userId)
                .openid(openid)
                .nickname("用户" + userId.substring(1, 7)) // 默认昵称
                .avatar("/default_avatar.png")
                .role("user")
                .build();

        return userRepository.save(newUser);
    }

    /**
     * 获取用户信息（本人查看自己的信息，不脱敏）
     *
     * @param userId 用户ID（从Token中获取）
     * @return 用户信息
     */
    public UserVO getUserProfile(String userId) {
        User user = getUserById(userId);
        return userMapper.toVOWithFullInfo(user);
    }

    /**
     * 获取用户信息（查看他人信息，需要脱敏）
     *
     * @param userId 用户ID
     * @return 用户信息（脱敏）
     */
    public UserVO getUserInfo(String userId) {
        User user = getUserById(userId);
        return userMapper.toVO(user);
    }

    /**
     * 更新用户信息
     *
     * @param userId  用户ID（从Token中获取）
     * @param request 更新请求
     * @return 更新后的用户信息
     */
    @Transactional
    public UserVO updateUserProfile(String userId, UpdateUserRequest request) {
        User user = getUserById(userId);

        // 更新允许修改的字段
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getPhone() != null) {
            // 检查手机号是否已被其他用户使用
            if (userRepository.existsByPhoneAndIdNot(request.getPhone(), userId)) {
                throw new BusinessException(ErrorCode.PHONE_ALREADY_EXISTS, "该手机号已被其他用户绑定");
            }
            user.setPhone(request.getPhone());
        }

        User savedUser = userRepository.save(user);
        log.info("用户信息更新成功，userId={}", userId);

        return userMapper.toVOWithFullInfo(savedUser);
    }

    /**
     * 根据ID获取用户（不存在则抛出异常）
     *
     * @param userId 用户ID
     * @return 用户实体
     */
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("用户不存在"));
    }

    /**
     * 检查用户是否存在
     *
     * @param userId 用户ID
     * @return 是否存在
     */
    public boolean existsById(String userId) {
        return userRepository.existsById(userId);
    }
}
