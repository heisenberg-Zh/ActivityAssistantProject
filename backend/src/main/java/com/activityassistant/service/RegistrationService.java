package com.activityassistant.service;

import com.activityassistant.dto.request.ApproveRegistrationRequest;
import com.activityassistant.dto.request.CreateRegistrationRequest;
import com.activityassistant.dto.response.RegistrationVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.mapper.RegistrationMapper;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Checkin;
import com.activityassistant.model.Registration;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.CheckinRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.activityassistant.constant.ErrorCode.*;

/**
 * 报名业务逻辑层
 *
 * @author Claude
 * @since 2025-11-11
 */
@Slf4j
@Service
public class RegistrationService {

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private RegistrationMapper registrationMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MessageService messageService;

    /**
     * 创建报名
     */
    @Transactional
    public RegistrationVO createRegistration(CreateRegistrationRequest request, String userId) {
        log.info("创建报名，用户ID: {}, 活动ID: {}", userId, request.getActivityId());

        Activity activity = activityRepository.findByIdAndIsDeletedFalse(request.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已取消，无法报名");
        }
        if ("finished".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已结束，无法报名");
        }
        if (!"published".equals(activity.getStatus()) && !"ongoing".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动未发布，无法报名");
        }

        // 黑名单校验（userId维度；不联动移除既有报名）
        if (isUserBlacklisted(activity.getBlacklist(), userId)) {
            throw new BusinessException(PERMISSION_DENIED, "您已被禁止报名此活动");
        }

        Registration existingRegistration = registrationRepository
                .findByActivityIdAndUserId(request.getActivityId(), userId)
                .orElse(null);
        if (existingRegistration != null) {
            String existingStatus = existingRegistration.getStatus();
            boolean canReapply = "rejected".equals(existingStatus) || "cancelled".equals(existingStatus);
            if (!canReapply) {
                throw new BusinessException(CONFLICT, "您已报名此活动，不能重复报名");
            }
        }

        if (activity.getRegisterDeadline() != null && LocalDateTime.now().isAfter(activity.getRegisterDeadline())) {
            throw new BusinessException(INVALID_OPERATION, "报名已截止");
        }

        Integer total = activity.getTotal();
        if (total == null || total <= 0) {
            log.error("活动ID={} 的人数上限配置异常 total={}, 无法报名", activity.getId(), total);
            throw new BusinessException(INVALID_OPERATION, "活动人数配置异常，请联系组织者处理");
        }

        long currentJoined = registrationRepository.countByActivityIdAndStatus(request.getActivityId(), "approved");
        if (currentJoined >= total) {
            throw new BusinessException(INVALID_OPERATION, "活动人数已满，无法报名");
        }

        boolean isReapply = existingRegistration != null;
        Registration registration;
        if (isReapply) {
            registration = existingRegistration;
            registration.setGroupId(request.getGroupId());
            registration.setName(request.getName());
            registration.setMobile(request.getMobile());
            registration.setCustomData(request.getCustomData());
            registration.setRegisteredAt(LocalDateTime.now());
            registration.setApprovedAt(null);
            registration.setCheckinStatus("pending");
            registration.setCheckinTime(null);
            registration.setStatus("pending");
        } else {
            registration = registrationMapper.toEntity(request, userId);
        }

        boolean needReview = Boolean.TRUE.equals(activity.getNeedReview());
        boolean isWhitelisted = needReview && userId != null && parseJsonList(activity.getWhitelist()).contains(userId);
        boolean autoApprove = !needReview || isWhitelisted;

        if (autoApprove) {
            registration.setStatus("approved");
            registration.setApprovedAt(LocalDateTime.now());
        }

        Registration savedRegistration = registrationRepository.save(registration);

        if (autoApprove) {
            Integer joined = activity.getJoined();
            activity.setJoined((joined != null ? joined : 0) + 1);

            if (savedRegistration.getGroupId() != null && activity.getGroups() != null) {
                updateGroupJoined(activity, savedRegistration.getGroupId(), 1);
            }

            activityRepository.save(activity);
        }

        log.info("报名创建成功，报名ID: {}, 状态 {}", savedRegistration.getId(), savedRegistration.getStatus());
        return registrationMapper.toVO(savedRegistration);
    }

    /**
     * 取消/移除报名
     *
     * @return cancelled 或 removed
     */
    @Transactional
    public String cancelRegistration(String registrationId, String userId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("报名记录不存在"));

        Activity activity = activityRepository.findById(registration.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        if ("finished".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已结束，无法取消/移除报名");
        }

        boolean isOwner = registration.getUserId().equals(userId);
        boolean isManager = isActivityManager(activity, userId);
        if (!isOwner && !isManager) {
            throw new BusinessException(PERMISSION_DENIED, "无权限操作此报名");
        }

        String targetStatus = isOwner ? "cancelled" : "removed";
        if ("cancelled".equals(registration.getStatus()) && isOwner) {
            throw new BusinessException(INVALID_OPERATION, "报名已取消");
        }
        if ("removed".equals(registration.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "报名已移除");
        }
        if ("removed".equals(registration.getStatus()) && isOwner) {
            throw new BusinessException(INVALID_OPERATION, "报名已被移除");
        }

        String oldStatus = registration.getStatus();
        String groupId = registration.getGroupId();

        registration.setStatus(targetStatus);
        registrationRepository.save(registration);

        if ("approved".equals(oldStatus)) {
            activity.setJoined(Math.max(0, activity.getJoined() - 1));
            if (groupId != null && activity.getGroups() != null) {
                updateGroupJoined(activity, groupId, -1);
            }
            activityRepository.save(activity);
        }

        log.info("报名状态已更新，报名ID: {}, oldStatus={}, newStatus={}, operatorId={}", registrationId, oldStatus, targetStatus, userId);
        return targetStatus;
    }

    /**
     * 查询某系列活动下当前用户最近一次报名记录
     */
    public RegistrationVO getLatestRegistrationBySeries(String seriesId, String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessException(PERMISSION_DENIED, "请先登录");
        }
        if (seriesId == null || seriesId.trim().isEmpty()) {
            return null;
        }

        List<String> statuses = List.of("approved", "pending");
        List<Registration> registrations = registrationRepository.findLatestBySeriesIdAndUserId(
                seriesId,
                userId,
                statuses,
                PageRequest.of(0, 1)
        );

        if (registrations == null || registrations.isEmpty()) {
            return null;
        }

        return registrationMapper.toVO(registrations.get(0), true);
    }

    /**
     * 查询活动报名列表（分页）
     *
     * - 管理者（创建者/活动内管理员）：可查看所有报名记录（含敏感字段）
     * - 非管理者/未登录：仅可查看已通过的报名记录（且不返回敏感字段）
     */
    public Page<RegistrationVO> getActivityRegistrations(String activityId, String status, Integer page, Integer size, String userId) {
        log.info("查询活动报名列表，活动ID: {}, 状态 {}, 用户ID: {}", activityId, status, userId);

        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        boolean isManager = isActivityManager(activity, userId);
        Sort sort = Sort.by(Sort.Direction.DESC, "registeredAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Registration> registrationPage;
        if (isManager) {
            if (status != null && !status.isEmpty()) {
                registrationPage = registrationRepository.findByActivityIdAndStatus(activityId, status, pageable);
            } else {
                registrationPage = registrationRepository.findByActivityId(activityId, pageable);
            }
        } else {
            registrationPage = registrationRepository.findByActivityIdAndStatus(activityId, "approved", pageable);
        }

        boolean includeSensitive = isManager;

        boolean activityHasCoords = activity.getLatitude() != null && activity.getLongitude() != null;
        List<String> checkedUserIds = registrationPage.getContent().stream()
                .filter(r -> "checked".equals(r.getCheckinStatus()) || "late".equals(r.getCheckinStatus()))
                .map(Registration::getUserId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Checkin> checkinByUserId = Collections.emptyMap();
        if (!checkedUserIds.isEmpty()) {
            checkinByUserId = checkinRepository.findByActivityIdAndUserIdIn(activityId, checkedUserIds).stream()
                    .collect(Collectors.toMap(Checkin::getUserId, c -> c, (a, b) -> a));
        }

        Map<String, Checkin> finalCheckinByUserId = checkinByUserId;
        return registrationPage.map(reg -> {
            RegistrationVO vo = registrationMapper.toVO(reg, includeSensitive);
            Checkin checkin = finalCheckinByUserId.get(reg.getUserId());
            if (checkin != null) {
                vo.setCheckinValid(checkin.getIsValid());
                vo.setCheckinDistance(activityHasCoords ? checkin.getDistance() : null);
            }
            return vo;
        });
    }

    /**
     * 查询用户的报名列表（分页）
     */
    public Page<RegistrationVO> getUserRegistrations(String userId, String status, Integer page, Integer size) {
        log.info("查询用户报名列表，用户ID: {}, 状态 {}", userId, status);

        Sort sort = Sort.by(Sort.Direction.DESC, "registeredAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Registration> registrationPage;
        if (status != null && !status.isEmpty()) {
            registrationPage = registrationRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            registrationPage = registrationRepository.findByUserId(userId, pageable);
        }

        return registrationPage.map(registrationMapper::toVO);
    }

    /**
     * 查询报名详情
     */
    public RegistrationVO getRegistrationDetail(String registrationId, String userId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("报名记录不存在"));

        Activity activity = activityRepository.findById(registration.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        boolean isOwner = registration.getUserId().equals(userId);
        boolean isManager = isActivityManager(activity, userId);
        if (!isOwner && !isManager) {
            throw new BusinessException(PERMISSION_DENIED, "无权查看此报名详情");
        }

        RegistrationVO vo = registrationMapper.toVO(registration, true);

        Checkin checkin = checkinRepository.findByActivityIdAndUserId(activity.getId(), registration.getUserId()).orElse(null);
        if (checkin != null) {
            vo.setCheckinValid(checkin.getIsValid());
            boolean activityHasCoords = activity.getLatitude() != null && activity.getLongitude() != null;
            vo.setCheckinDistance(activityHasCoords ? checkin.getDistance() : null);
        }

        return vo;
    }

    /**
     * 审核报名（创建者/活动内管理员）
     */
    @Transactional
    public RegistrationVO approveRegistration(String registrationId, ApproveRegistrationRequest request, String userId) {
        log.info("审核报名，报名ID: {}, 审核结果: {}", registrationId, request.getApproved());

        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("报名记录不存在"));

        Activity activity = activityRepository.findById(registration.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        if (!isActivityManager(activity, userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权审核此报名");
        }

        if (!"pending".equals(registration.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "只能审核待审核状态的报名");
        }

        if (request.getApproved()) {
            Integer total = activity.getTotal();
            if (total == null || total <= 0) {
                log.error("活动ID={} 的人数上限配置异常 total={}, 无法通过报名", activity.getId(), total);
                throw new BusinessException(INVALID_OPERATION, "活动人数配置异常，请联系组织者处理");
            }

            long currentJoined = registrationRepository.countByActivityIdAndStatus(registration.getActivityId(), "approved");
            if (currentJoined >= total) {
                throw new BusinessException(INVALID_OPERATION, "活动人数已满，无法通过报名");
            }

            registration.setStatus("approved");
            registration.setApprovedAt(LocalDateTime.now());

            activity.setJoined(activity.getJoined() + 1);
            if (registration.getGroupId() != null && activity.getGroups() != null) {
                updateGroupJoined(activity, registration.getGroupId(), 1);
            }
            activityRepository.save(activity);
        } else {
            registration.setStatus("rejected");
        }

        Registration updatedRegistration = registrationRepository.save(registration);
        log.info("报名审核完成，报名ID: {}, 新状态 {}", registrationId, registration.getStatus());
        // 审核结果消息通知（不受 notifyUsers 开关影响）
        try {
            boolean approved = Boolean.TRUE.equals(request.getApproved());
            String type = approved ? "signup_approved" : "signup_rejected";
            String title = approved ? "报名审核通过" : "报名审核未通过";

            String checkinPart = Boolean.TRUE.equals(activity.getNeedCheckin())
                    ? "如需签到：开始前30分钟开放，至活动结束。"
                    : "本活动无需签到。";

            String notePart = "";
            if (!approved) {
                String note = request.getNote();
                if (note != null && !note.isBlank()) {
                    notePart = "\n原因：" + note.trim();
                }
            }

            String content = String.format(
                    "活动《%s》报名审核结果：%s。\n时间：%s - %s\n地点：%s%s\n%s%s",
                    activity.getTitle(),
                    approved ? "已通过" : "未通过",
                    activity.getStartTime(),
                    activity.getEndTime(),
                    activity.getPlace() == null ? "" : activity.getPlace(),
                    activity.getAddress() == null ? "" : ("（" + activity.getAddress() + "）"),
                    checkinPart,
                    notePart
            );

            messageService.createMessage(registration.getUserId(), type, title, content, activity.getId());
        } catch (Exception e) {
            log.warn("send audit result message failed: {}", e.getMessage());
        }

        return registrationMapper.toVO(updatedRegistration);
    }

    /**
     * 检查用户是否已报名活动
     */
    public boolean isUserRegistered(String activityId, String userId) {
        return registrationRepository.existsByActivityIdAndUserId(activityId, userId);
    }

    private boolean isActivityManager(Activity activity, String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return false;
        }
        if (activity.getOrganizerId() != null && activity.getOrganizerId().equals(userId)) {
            return true;
        }
        return parseJsonList(activity.getAdministrators()).contains(userId);
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.trim().isEmpty() || "null".equalsIgnoreCase(json.trim())) {
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
     * 更新分组的已报名人数
     */
    private void updateGroupJoined(Activity activity, String groupId, int delta) {
        try {
            String groupsJson = activity.getGroups();
            if (groupsJson == null || groupsJson.isEmpty()) {
                return;
            }

            List<Map<String, Object>> groups = objectMapper.readValue(
                    groupsJson,
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            boolean updated = false;
            for (Map<String, Object> group : groups) {
                if (groupId.equals(group.get("id"))) {
                    Integer currentJoined = (Integer) group.get("joined");
                    if (currentJoined == null) {
                        currentJoined = 0;
                    }

                    int newJoined = Math.max(0, currentJoined + delta);
                    group.put("joined", newJoined);
                    updated = true;
                    break;
                }
            }

            if (updated) {
                activity.setGroups(objectMapper.writeValueAsString(groups));
            } else {
                log.warn("未找到分组ID: {} 在活动 {} 的groups中", groupId, activity.getId());
            }
        } catch (Exception e) {
            log.error("更新分组joined失败，活动ID: {}, 分组ID: {}", activity.getId(), groupId, e);
        }
    }

    /**
     * 判断用户是否在黑名单中（userId维度；考虑过期与启用状态）
     */
    private boolean isUserBlacklisted(String blacklistJson, String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return false;
        }
        if (blacklistJson == null || blacklistJson.trim().isEmpty() || "null".equalsIgnoreCase(blacklistJson.trim())) {
            return false;
        }

        try {
            var root = objectMapper.readTree(blacklistJson);
            if (!root.isArray()) {
                return false;
            }

            LocalDateTime now = LocalDateTime.now();

            for (var node : root) {
                if (node == null || node.isNull() || !node.isObject()) {
                    continue;
                }

                String uid = node.hasNonNull("userId") ? node.get("userId").asText(null) : null;
                if (uid == null || !uid.equals(userId)) {
                    continue;
                }

                boolean isActive = !node.has("isActive") || node.get("isActive").asBoolean(true);
                if (!isActive) {
                    continue;
                }

                String expiresAt = null;
                if (node.hasNonNull("expiresAt")) {
                    expiresAt = node.get("expiresAt").asText(null);
                } else if (node.hasNonNull("expiryTime")) {
                    expiresAt = node.get("expiryTime").asText(null);
                }

                if (expiresAt != null && !expiresAt.isBlank()) {
                    try {
                        LocalDateTime expiry = LocalDateTime.parse(expiresAt);
                        if (now.isAfter(expiry)) {
                            continue;
                        }
                    } catch (Exception ignored) {
                        // 解析失败则不按过期处理（保守：仍视为生效）
                    }
                }

                return true;
            }
        } catch (Exception e) {
            log.warn("黑名单JSON解析失败，忽略黑名单校验，err={}", e.getMessage());
        }

        return false;
    }
}
