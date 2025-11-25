package com.activityassistant.service;

import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Registration;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.activityassistant.constant.ErrorCode.*;

/**
 * 活动管理服务
 * 处理管理员、白名单、黑名单等管理功能
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityManagementService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final ObjectMapper objectMapper;

    // ============================================
    // 管理员管理
    // ============================================

    /**
     * 获取活动管理员列表
     */
    public List<UserSimpleVO> getAdministrators(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> adminIds = parseJsonList(activity.getAdministrators());
        if (adminIds.isEmpty()) {
            return Collections.emptyList();
        }

        return userRepository.findAllById(adminIds).stream()
                .map(this::toUserSimpleVO)
                .collect(Collectors.toList());
    }

    /**
     * 添加管理员
     */
    @Transactional
    public void addAdministrator(String activityId, String userId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        // 验证用户是否存在
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("用户不存在");
        }

        // 组织者不能被添加为管理员（组织者默认有所有权限）
        if (activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(INVALID_OPERATION, "组织者不能被添加为管理员");
        }

        List<String> adminIds = parseJsonList(activity.getAdministrators());
        if (adminIds.contains(userId)) {
            throw new BusinessException(INVALID_OPERATION, "该用户已是管理员");
        }

        adminIds.add(userId);
        activity.setAdministrators(toJsonString(adminIds));
        activityRepository.save(activity);

        log.info("添加管理员成功，activityId={}, userId={}, operatorId={}", activityId, userId, currentUserId);
    }

    /**
     * 移除管理员
     */
    @Transactional
    public void removeAdministrator(String activityId, String userId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> adminIds = parseJsonList(activity.getAdministrators());
        if (!adminIds.remove(userId)) {
            throw new NotFoundException("该用户不是管理员");
        }

        activity.setAdministrators(toJsonString(adminIds));
        activityRepository.save(activity);

        log.info("移除管理员成功，activityId={}, userId={}, operatorId={}", activityId, userId, currentUserId);
    }

    // ============================================
    // 已报名用户管理
    // ============================================

    /**
     * 获取活动已报名用户列表（用于白名单/黑名单选择添加）
     */
    public List<UserSimpleVO> getRegisteredUsers(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        // 查询所有已通过审核的报名记录
        List<Registration> registrations = registrationRepository.findByActivityIdAndStatus(
                activityId,
                "approved",
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        if (registrations.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取所有报名用户的ID
        List<String> userIds = registrations.stream()
                .map(Registration::getUserId)
                .distinct()
                .collect(Collectors.toList());

        // 批量查询用户信息并转换为VO
        return userRepository.findAllById(userIds).stream()
                .map(this::toUserSimpleVO)
                .collect(Collectors.toList());
    }

    // ============================================
    // 白名单管理
    // ============================================

    /**
     * 获取白名单列表
     */
    public List<String> getWhitelist(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);
        return parseJsonList(activity.getWhitelist());
    }

    /**
     * 批量添加白名单
     */
    @Transactional
    public void addToWhitelist(String activityId, List<String> phones, List<String> userIds, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> whitelist = parseJsonList(activity.getWhitelist());
        Set<String> whitelistSet = new HashSet<>(whitelist);

        // 添加手机号
        if (phones != null && !phones.isEmpty()) {
            whitelistSet.addAll(phones);
        }

        // 添加用户ID（通过用户ID查找手机号）
        if (userIds != null && !userIds.isEmpty()) {
            List<User> users = userRepository.findAllById(userIds);
            users.stream()
                    .map(User::getPhone)
                    .filter(Objects::nonNull)
                    .forEach(whitelistSet::add);
        }

        activity.setWhitelist(toJsonString(new ArrayList<>(whitelistSet)));
        activityRepository.save(activity);

        log.info("批量添加白名单成功，activityId={}, count={}", activityId, whitelistSet.size() - whitelist.size());
    }

    /**
     * 从白名单移除
     */
    @Transactional
    public void removeFromWhitelist(String activityId, String phone, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> whitelist = parseJsonList(activity.getWhitelist());
        if (!whitelist.remove(phone)) {
            throw new NotFoundException("该手机号不在白名单中");
        }

        activity.setWhitelist(toJsonString(whitelist));
        activityRepository.save(activity);

        log.info("从白名单移除成功，activityId={}, phone={}", activityId, phone);
    }

    // ============================================
    // 黑名单管理
    // ============================================

    /**
     * 获取黑名单列表
     */
    public List<Map<String, Object>> getBlacklist(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);
        return parseJsonMapList(activity.getBlacklist());
    }

    /**
     * 批量添加黑名单
     */
    @Transactional
    public void addToBlacklist(String activityId, List<String> phones, String reason, Integer expiryDays, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<Map<String, Object>> blacklist = parseJsonMapList(activity.getBlacklist());

        LocalDateTime expiryTime = null;
        if (expiryDays != null && expiryDays > 0) {
            expiryTime = LocalDateTime.now().plusDays(expiryDays);
        }

        for (String phone : phones) {
            // 检查是否已在黑名单中
            boolean exists = blacklist.stream()
                    .anyMatch(entry -> phone.equals(entry.get("phone")));

            if (!exists) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("phone", phone);
                entry.put("reason", reason);
                entry.put("addedAt", LocalDateTime.now().toString());
                if (expiryTime != null) {
                    entry.put("expiryTime", expiryTime.toString());
                }
                blacklist.add(entry);
            }
        }

        activity.setBlacklist(toJsonString(blacklist));
        activityRepository.save(activity);

        log.info("批量添加黑名单成功，activityId={}, count={}", activityId, phones.size());
    }

    /**
     * 从黑名单移除
     */
    @Transactional
    public void removeFromBlacklist(String activityId, String phone, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<Map<String, Object>> blacklist = parseJsonMapList(activity.getBlacklist());
        boolean removed = blacklist.removeIf(entry -> phone.equals(entry.get("phone")));

        if (!removed) {
            throw new NotFoundException("该手机号不在黑名单中");
        }

        activity.setBlacklist(toJsonString(blacklist));
        activityRepository.save(activity);

        log.info("从黑名单移除成功，activityId={}, phone={}", activityId, phone);
    }

    // ============================================
    // 工具方法
    // ============================================

    /**
     * 获取活动并检查权限（仅组织者或管理员）
     */
    private Activity getActivityAndCheckPermission(String activityId, String currentUserId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 检查权限：必须是组织者或管理员
        boolean isOrganizer = activity.getOrganizerId().equals(currentUserId);
        boolean isAdmin = parseJsonList(activity.getAdministrators()).contains(currentUserId);

        if (!isOrganizer && !isAdmin) {
            throw new BusinessException(PERMISSION_DENIED, "无权限操作");
        }

        return activity;
    }

    /**
     * 解析JSON数组为List<String>
     */
    private List<String> parseJsonList(String json) {
        if (json == null || json.trim().isEmpty() || "null".equals(json)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.warn("JSON解析失败，返回空列表，json={}", json);
            return new ArrayList<>();
        }
    }

    /**
     * 解析JSON数组为List<Map<String, Object>>
     */
    private List<Map<String, Object>> parseJsonMapList(String json) {
        if (json == null || json.trim().isEmpty() || "null".equals(json)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (JsonProcessingException e) {
            log.warn("JSON解析失败，返回空列表，json={}", json);
            return new ArrayList<>();
        }
    }

    /**
     * 转换对象为JSON字符串
     */
    private String toJsonString(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("JSON序列化失败", e);
            throw new BusinessException(SYSTEM_ERROR, "数据处理失败");
        }
    }

    /**
     * 转换User为UserSimpleVO
     */
    private UserSimpleVO toUserSimpleVO(User user) {
        return UserSimpleVO.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .build();
    }
}
