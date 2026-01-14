package com.activityassistant.service;

import com.activityassistant.dto.response.RegisteredUserVO;
import com.activityassistant.dto.response.BlacklistEntryVO;
import com.activityassistant.dto.response.BlacklistUpdateResultVO;
import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.dto.response.WhitelistUpdateResultVO;
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
    public List<RegisteredUserVO> getRegisteredUsers(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        // 查询 pending + approved 的报名记录（用于自动审核、白/黑名单选择）
        List<Registration> registrations = new ArrayList<>();
        registrations.addAll(registrationRepository.findByActivityIdAndStatus(
                activityId,
                "pending",
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent());
        registrations.addAll(registrationRepository.findByActivityIdAndStatus(
                activityId,
                "approved",
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent());

        if (registrations.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取所有报名用户的ID
        List<String> userIds = registrations.stream()
                .map(Registration::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<String, User> userById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 按报名时间倒序（最近的在前）
        registrations.sort(Comparator.comparing(Registration::getRegisteredAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        return registrations.stream()
                .map(r -> {
                    User user = userById.get(r.getUserId());
                    return RegisteredUserVO.builder()
                            .userId(r.getUserId())
                            .nickname(user != null ? user.getNickname() : "未知用户")
                            .avatar(user != null ? user.getAvatar() : "")
                            .phone(user != null ? user.getPhone() : null)
                            .registrationStatus(r.getStatus())
                            .registrationId(r.getId())
                            .registeredAt(r.getRegisteredAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ============================================
    // 白名单管理
    // ============================================

    /**
     * 获取白名单列表
     */
    public List<UserSimpleVO> getWhitelist(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> whitelist = parseJsonList(activity.getWhitelist());
        if (whitelist.isEmpty()) {
            return Collections.emptyList();
        }

        List<UserSimpleVO> result = new ArrayList<>();
        for (String key : whitelist) {
            if (key == null || key.isBlank()) {
                continue;
            }

            Optional<User> userOpt = userRepository.findById(key);
            if (userOpt.isEmpty()) {
                // 兼容历史：白名单可能存手机号
                userOpt = userRepository.findByPhone(key);
            }

            if (userOpt.isPresent()) {
                result.add(toUserSimpleVO(userOpt.get()));
            } else {
                // 兜底展示（避免前端列表空白）
                result.add(UserSimpleVO.builder()
                        .id(key)
                        .nickname("未知用户")
                        .avatar("")
                        .phone(key)
                        .build());
            }
        }

        return result;
    }

    /**
     * 批量添加白名单
     */
    @Transactional
    public WhitelistUpdateResultVO addToWhitelist(String activityId, List<String> phones, List<String> userIds, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> whitelist = parseJsonList(activity.getWhitelist());
        Set<String> whitelistSet = new HashSet<>(whitelist);

        List<String> targetUserIds = new ArrayList<>();
        List<String> unresolvedPhones = new ArrayList<>();

        // 添加手机号（仅当手机号已绑定到某个用户，解析为 userId；不直接按手机号做自动审核，避免可伪造）
        if (phones != null && !phones.isEmpty()) {
            for (String phone : phones) {
                if (phone == null || phone.isBlank()) {
                    continue;
                }
                userRepository.findByPhone(phone.trim())
                        .map(User::getId)
                        .ifPresentOrElse(
                                targetUserIds::add,
                                () -> unresolvedPhones.add(phone.trim())
                        );
            }
        }

        // 添加用户ID（白名单主键：userId）
        if (userIds != null && !userIds.isEmpty()) {
            userIds.stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(targetUserIds::add);
        }

        int before = whitelistSet.size();
        for (String uid : targetUserIds) {
            whitelistSet.add(uid);
        }
        int after = whitelistSet.size();
        int addedCount = Math.max(0, after - before);
        int alreadyExistsCount = Math.max(0, targetUserIds.size() - addedCount);

        activity.setWhitelist(toJsonString(new ArrayList<>(whitelistSet)));
        activityRepository.save(activity);

        // 若活动需要审核：本次新增/选择的白名单用户，自动通过其 pending 报名（受名额限制）
        int autoApprovedCount = 0;
        int autoApproveSkippedBecauseFullCount = 0;
        if (Boolean.TRUE.equals(activity.getNeedReview()) && !targetUserIds.isEmpty()) {
            AutoApproveResult autoApprove = autoApprovePendingRegistrations(activity, targetUserIds);
            autoApprovedCount = autoApprove.approvedCount;
            autoApproveSkippedBecauseFullCount = autoApprove.skippedBecauseFullCount;
        }

        log.info("批量添加白名单成功，activityId={}, added={}, autoApproved={}, skippedFull={}", activityId, addedCount, autoApprovedCount, autoApproveSkippedBecauseFullCount);

        return WhitelistUpdateResultVO.builder()
                .targetUserIds(targetUserIds)
                .addedCount(addedCount)
                .alreadyExistsCount(alreadyExistsCount)
                .unresolvedPhones(unresolvedPhones)
                .autoApprovedCount(autoApprovedCount)
                .autoApproveSkippedBecauseFullCount(autoApproveSkippedBecauseFullCount)
                .build();
    }

    /**
     * 从白名单移除
     */
    @Transactional
    public void removeFromWhitelist(String activityId, String phone, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<String> whitelist = parseJsonList(activity.getWhitelist());
        boolean removed = whitelist.remove(phone);

        // 兼容：若传入手机号，但白名单实际存 userId，则尝试手机号 -> userId
        if (!removed && phone != null && !phone.isBlank()) {
            String key = phone.trim();
            Optional<User> userOpt = userRepository.findByPhone(key);
            if (userOpt.isPresent()) {
                removed = whitelist.remove(userOpt.get().getId());
            }
        }

        if (!removed) {
            throw new NotFoundException("该用户不在白名单中");
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
    public List<BlacklistEntryVO> getBlacklist(String activityId, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<Map<String, Object>> entries = parseBlacklistEntries(activity.getBlacklist());
        if (entries.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> userIds = entries.stream()
                .map(e -> e.get("userId"))
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());

        Map<String, User> userById = userIds.isEmpty()
                ? Collections.emptyMap()
                : userRepository.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        return entries.stream()
                .map(e -> {
                    String userId = e.get("userId") != null ? String.valueOf(e.get("userId")) : null;
                    if (userId == null || userId.isBlank()) {
                        // 兜底：兼容历史仅存 phone 的条目，避免前端 key 为空
                        userId = e.get("phone") != null ? String.valueOf(e.get("phone")) : null;
                    }
                    User user = userId != null ? userById.get(userId) : null;

                    String expiresAt = null;
                    Object expiresAtObj = e.get("expiresAt");
                    if (expiresAtObj != null) {
                        expiresAt = String.valueOf(expiresAtObj);
                    } else if (e.get("expiryTime") != null) {
                        expiresAt = String.valueOf(e.get("expiryTime"));
                    }

                    Boolean isActive = true;
                    Object activeObj = e.get("isActive");
                    if (activeObj instanceof Boolean) {
                        isActive = (Boolean) activeObj;
                    } else if (activeObj != null) {
                        isActive = Boolean.parseBoolean(String.valueOf(activeObj));
                    }

                    return BlacklistEntryVO.builder()
                            .userId(userId)
                            .nickname(user != null ? user.getNickname() : "未知用户")
                            .avatar(user != null ? user.getAvatar() : "")
                            .phone(user != null ? user.getPhone() : null)
                            .reason(e.get("reason") != null ? String.valueOf(e.get("reason")) : "")
                            .isActive(isActive)
                            .expiresAt(expiresAt)
                            .addedAt(e.get("addedAt") != null ? String.valueOf(e.get("addedAt")) : "")
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 批量添加黑名单
     */
    @Transactional
    public BlacklistUpdateResultVO addToBlacklist(String activityId, List<String> userIds, List<String> phones, String reason, Integer expiryDays, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<Map<String, Object>> blacklist = parseBlacklistEntries(activity.getBlacklist());

        // 以 userId 去重
        Map<String, Map<String, Object>> byUserId = new LinkedHashMap<>();
        for (Map<String, Object> entry : blacklist) {
            if (entry == null) continue;
            Object uid = entry.get("userId");
            if (uid == null) continue;
            String key = String.valueOf(uid).trim();
            if (key.isEmpty()) continue;
            byUserId.putIfAbsent(key, entry);
        }

        List<String> targetUserIds = new ArrayList<>();
        List<String> unresolvedPhones = new ArrayList<>();

        if (userIds != null && !userIds.isEmpty()) {
            userIds.stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(targetUserIds::add);
        }

        // 兼容：允许按手机号添加，但最终落库为 userId（手机号必须已绑定账号）
        if (phones != null && !phones.isEmpty()) {
            for (String phone : phones) {
                if (phone == null || phone.isBlank()) continue;
                String p = phone.trim();
                userRepository.findByPhone(p)
                        .map(User::getId)
                        .ifPresentOrElse(
                                targetUserIds::add,
                                () -> unresolvedPhones.add(p)
                        );
            }
        }

        List<String> distinctTargetUserIds = targetUserIds.stream().distinct().collect(Collectors.toList());

        LocalDateTime expiryTime = null;
        if (expiryDays != null && expiryDays > 0) {
            expiryTime = LocalDateTime.now().plusDays(expiryDays);
        }

        int before = byUserId.size();
        LocalDateTime now = LocalDateTime.now();
        for (String uid : distinctTargetUserIds) {
            if (uid == null || uid.isBlank()) continue;
            if (byUserId.containsKey(uid)) {
                continue;
            }
            Map<String, Object> entry = new HashMap<>();
            entry.put("userId", uid);
            entry.put("reason", reason);
            entry.put("addedAt", now.toString());
            entry.put("isActive", true);
            if (expiryTime != null) {
                entry.put("expiresAt", expiryTime.toString());
            }
            byUserId.put(uid, entry);
        }
        int after = byUserId.size();
        int addedCount = Math.max(0, after - before);
        int alreadyExistsCount = Math.max(0, distinctTargetUserIds.size() - addedCount);

        activity.setBlacklist(toJsonString(new ArrayList<>(byUserId.values())));
        activityRepository.save(activity);

        log.info("批量添加黑名单成功，activityId={}, added={}", activityId, addedCount);

        return BlacklistUpdateResultVO.builder()
                .targetUserIds(distinctTargetUserIds)
                .addedCount(addedCount)
                .alreadyExistsCount(alreadyExistsCount)
                .unresolvedPhones(unresolvedPhones)
                .build();
    }

    /**
     * 从黑名单移除
     */
    @Transactional
    public void removeFromBlacklist(String activityId, String phone, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<Map<String, Object>> blacklist = parseBlacklistEntries(activity.getBlacklist());

        String key = phone != null ? phone.trim() : "";
        String userId = key;
        // 若传入手机号，尝试解析为 userId
        if (!key.isEmpty() && key.matches("^1[3-9]\\d{9}$")) {
            userId = userRepository.findByPhone(key).map(User::getId).orElse(key);
        }

        final String finalUserId = userId;
        boolean removed = blacklist.removeIf(entry -> finalUserId.equals(String.valueOf(entry.get("userId"))));

        if (!removed) {
            throw new NotFoundException("该用户不在黑名单中");
        }

        activity.setBlacklist(toJsonString(blacklist));
        activityRepository.save(activity);

        log.info("从黑名单移除成功，activityId={}, key={}", activityId, phone);
    }

    /**
     * 切换黑名单启用/禁用
     */
    @Transactional
    public void toggleBlacklistActive(String activityId, String key, String currentUserId) {
        Activity activity = getActivityAndCheckPermission(activityId, currentUserId);

        List<Map<String, Object>> blacklist = parseBlacklistEntries(activity.getBlacklist());
        if (blacklist.isEmpty()) {
            throw new NotFoundException("黑名单为空");
        }

        String input = key != null ? key.trim() : "";
        String userId = input;
        if (!input.isEmpty() && input.matches("^1[3-9]\\d{9}$")) {
            userId = userRepository.findByPhone(input).map(User::getId).orElse(input);
        }

        boolean updated = false;
        for (Map<String, Object> entry : blacklist) {
            if (entry == null) continue;
            if (!userId.equals(String.valueOf(entry.get("userId")))) continue;

            Boolean isActive = true;
            Object activeObj = entry.get("isActive");
            if (activeObj instanceof Boolean) {
                isActive = (Boolean) activeObj;
            } else if (activeObj != null) {
                isActive = Boolean.parseBoolean(String.valueOf(activeObj));
            }

            entry.put("isActive", !isActive);
            updated = true;
            break;
        }

        if (!updated) {
            throw new NotFoundException("该用户不在黑名单中");
        }

        activity.setBlacklist(toJsonString(blacklist));
        activityRepository.save(activity);
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
                .phone(user.getPhone())
                .build();
    }

    private static class AutoApproveResult {
        private final int approvedCount;
        private final int skippedBecauseFullCount;

        private AutoApproveResult(int approvedCount, int skippedBecauseFullCount) {
            this.approvedCount = approvedCount;
            this.skippedBecauseFullCount = skippedBecauseFullCount;
        }
    }

    /**
     * 白名单自动通过 pending 报名（受名额限制）
     */
    private AutoApproveResult autoApprovePendingRegistrations(Activity activity, List<String> userIds) {
        if (activity == null || userIds == null || userIds.isEmpty()) {
            return new AutoApproveResult(0, 0);
        }

        Integer total = activity.getTotal();
        if (total == null || total <= 0) {
            return new AutoApproveResult(0, 0);
        }

        long currentApproved = registrationRepository.countByActivityIdAndStatus(activity.getId(), "approved");
        int available = total - (int) currentApproved;
        if (available <= 0) {
            return new AutoApproveResult(0, 0);
        }

        List<String> distinctUserIds = userIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        if (distinctUserIds.isEmpty()) {
            return new AutoApproveResult(0, 0);
        }

        // 查询这些用户在该活动下 pending 的报名记录（按报名时间升序，先报名先通过）
        List<Registration> pendingRegs = registrationRepository.findByActivityIdAndStatusAndUserIdIn(
                activity.getId(),
                "pending",
                distinctUserIds
        );
        if (pendingRegs == null || pendingRegs.isEmpty()) {
            return new AutoApproveResult(0, 0);
        }

        pendingRegs.sort(Comparator.comparing(Registration::getRegisteredAt, Comparator.nullsLast(Comparator.naturalOrder())));

        LocalDateTime now = LocalDateTime.now();
        List<Registration> toApprove = new ArrayList<>();
        Map<String, Integer> groupDelta = new HashMap<>();
        for (Registration r : pendingRegs) {
            if (available <= 0) {
                break;
            }
            r.setStatus("approved");
            r.setApprovedAt(now);
            toApprove.add(r);
            available--;

            if (r.getGroupId() != null && !r.getGroupId().isBlank()) {
                groupDelta.merge(r.getGroupId(), 1, Integer::sum);
            }
        }

        if (!toApprove.isEmpty()) {
            registrationRepository.saveAll(toApprove);

            int oldJoined = activity.getJoined() != null ? activity.getJoined() : 0;
            activity.setJoined(oldJoined + toApprove.size());
            applyGroupJoinedDelta(activity, groupDelta);
            activityRepository.save(activity);
        }

        int skippedFull = Math.max(0, pendingRegs.size() - toApprove.size());
        return new AutoApproveResult(toApprove.size(), skippedFull);
    }

    private void applyGroupJoinedDelta(Activity activity, Map<String, Integer> groupDelta) {
        if (activity == null || groupDelta == null || groupDelta.isEmpty()) {
            return;
        }
        if (activity.getGroups() == null || activity.getGroups().isBlank()) {
            return;
        }

        try {
            List<Map<String, Object>> groups = objectMapper.readValue(
                    activity.getGroups(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            boolean updated = false;
            for (Map<String, Object> group : groups) {
                if (group == null) continue;
                Object id = group.get("id");
                if (id == null) continue;
                String gid = String.valueOf(id);
                Integer delta = groupDelta.get(gid);
                if (delta == null || delta == 0) continue;

                Integer current = null;
                Object joinedObj = group.get("joined");
                if (joinedObj instanceof Integer) {
                    current = (Integer) joinedObj;
                } else if (joinedObj instanceof Number) {
                    current = ((Number) joinedObj).intValue();
                } else if (joinedObj != null) {
                    try {
                        current = Integer.parseInt(String.valueOf(joinedObj));
                    } catch (Exception ignored) {}
                }
                if (current == null) current = 0;

                group.put("joined", Math.max(0, current + delta));
                updated = true;
            }

            if (updated) {
                activity.setGroups(objectMapper.writeValueAsString(groups));
            }
        } catch (Exception e) {
            log.error("更新分组joined失败，活动ID={}", activity.getId(), e);
        }
    }

    /**
     * 解析黑名单JSON（兼容历史格式）
     */
    private List<Map<String, Object>> parseBlacklistEntries(String json) {
        if (json == null || json.trim().isEmpty() || "null".equalsIgnoreCase(json.trim())) {
            return new ArrayList<>();
        }

        try {
            var root = objectMapper.readTree(json);
            if (!root.isArray()) {
                return new ArrayList<>();
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (var node : root) {
                if (node == null || node.isNull()) continue;
                if (node.isObject()) {
                    Map<String, Object> entry = objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {});

                    // 兼容：历史字段 expiryTime -> expiresAt
                    if (!entry.containsKey("expiresAt") && entry.containsKey("expiryTime")) {
                        entry.put("expiresAt", entry.get("expiryTime"));
                    }
                    // 兼容：缺省 isActive=true
                    if (!entry.containsKey("isActive")) {
                        entry.put("isActive", true);
                    }

                    // 若没有 userId，但有 phone，尝试迁移为 userId（仅用于管理展示/后续删除）
                    if (!entry.containsKey("userId") && entry.get("phone") != null) {
                        String phone = String.valueOf(entry.get("phone")).trim();
                        userRepository.findByPhone(phone).map(User::getId).ifPresent(uid -> entry.put("userId", uid));
                    }

                    result.add(entry);
                } else if (node.isTextual()) {
                    // 极端兼容：若存的是 ["u123", "u456"]
                    String userId = node.asText();
                    if (userId != null && !userId.isBlank()) {
                        Map<String, Object> entry = new HashMap<>();
                        entry.put("userId", userId.trim());
                        entry.put("isActive", true);
                        entry.put("addedAt", "");
                        entry.put("reason", "");
                        result.add(entry);
                    }
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("黑名单JSON解析失败，返回空列表，json={}", json);
            return new ArrayList<>();
        }
    }
}
