package com.activityassistant.repository;

import com.activityassistant.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 用户数据访问层
 *
 * @author Claude
 * @since 2025-01-08
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * 根据OpenID查找用户
     *
     * @param openid 微信OpenID
     * @return 用户信息
     */
    Optional<User> findByOpenid(String openid);

    /**
     * 根据手机号查找用户
     *
     * @param phone 手机号
     * @return 用户信息
     */
    Optional<User> findByPhone(String phone);

    /**
     * 检查OpenID是否存在
     *
     * @param openid 微信OpenID
     * @return 是否存在
     */
    boolean existsByOpenid(String openid);

    /**
     * 检查手机号是否存在（排除指定用户）
     *
     * @param phone  手机号
     * @param userId 排除的用户ID
     * @return 是否存在
     */
    boolean existsByPhoneAndIdNot(String phone, String userId);
}
