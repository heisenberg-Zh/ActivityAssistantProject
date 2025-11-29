package com.activityassistant.service;

import com.activityassistant.dto.request.ApproveRegistrationRequest;
import com.activityassistant.dto.request.CreateRegistrationRequest;
import com.activityassistant.dto.response.RegistrationVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.mapper.RegistrationMapper;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Registration;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.RegistrationRepository;
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

import java.util.List;
import java.util.Map;

import java.time.LocalDateTime;

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
    private RegistrationMapper registrationMapper;

    /**
     * 创建报名
     *
     * @param request 创建报名请求
     * @param userId  用户ID
     * @return 报名详情
     */
    @Transactional
    public RegistrationVO createRegistration(CreateRegistrationRequest request, String userId) {
        log.info("创建报名，用户ID: {}, 活动ID: {}", userId, request.getActivityId());

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(request.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 检查活动状态 - 只有已发布(published)和进行中(ongoing)的活动可以报名
        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已取消，无法报名");
        }

        if ("finished".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已结束，无法报名");
        }

        if (!"published".equals(activity.getStatus()) && !"ongoing".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动未发布，无法报名");
        }

        // 检查是否已报名
        if (registrationRepository.existsByActivityIdAndUserId(request.getActivityId(), userId)) {
            throw new BusinessException(CONFLICT, "您已报名此活动，不能重复报名");
        }

        // 检查报名截止时间
        if (activity.getRegisterDeadline() != null && LocalDateTime.now().isAfter(activity.getRegisterDeadline())) {
            throw new BusinessException(INVALID_OPERATION, "报名已截止");
        }

        // 检查人数限制
        // 【修复】增加对total字段的有效性检查
        Integer total = activity.getTotal();
        if (total == null || total <= 0) {
            log.error("活动ID={} 的人数上限配置异常: total={}, 无法报名", activity.getId(), total);
            throw new BusinessException(INVALID_OPERATION, "活动人数配置异常，请联系组织者处理");
        }

        long currentJoined = registrationRepository.countByActivityIdAndStatus(request.getActivityId(), "approved");
        if (currentJoined >= total) {
            throw new BusinessException(INVALID_OPERATION, "活动人数已满，无法报名");
        }

        // 创建报名记录
        Registration registration = registrationMapper.toEntity(request, userId);

        // 如果活动不需要审核，自动通过
        if (!activity.getNeedReview()) {
            registration.setStatus("approved");
            registration.setApprovedAt(LocalDateTime.now());
        }

        // 保存报名记录
        Registration savedRegistration = registrationRepository.save(registration);

        // 更新活动的已报名人数
        if (!activity.getNeedReview()) {
            activity.setJoined(activity.getJoined() + 1);

            // 【修复】如果报名关联了分组，同时更新分组的 joined 字段
            if (savedRegistration.getGroupId() != null && activity.getGroups() != null) {
                updateGroupJoined(activity, savedRegistration.getGroupId(), 1);
            }

            activityRepository.save(activity);
        }

        log.info("报名创建成功，报名ID: {}, 状态: {}", savedRegistration.getId(), savedRegistration.getStatus());

        return registrationMapper.toVO(savedRegistration);
    }

    /**
     * 取消报名
     *
     * @param registrationId 报名ID
     * @param userId         用户ID
     */
    @Transactional
    public void cancelRegistration(String registrationId, String userId) {
        log.info("取消报名，报名ID: {}, 用户ID: {}", registrationId, userId);

        // 查询报名记录
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("报名记录不存在"));

        // 权限校验：只有报名者本人可以取消
        if (!registration.getUserId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权取消此报名");
        }

        // 检查报名状态
        if ("cancelled".equals(registration.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "报名已取消");
        }

        // 检查活动状态
        Activity activity = activityRepository.findById(registration.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        if ("finished".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已结束，无法取消报名");
        }

        // 更新报名状态
        String oldStatus = registration.getStatus();
        String groupId = registration.getGroupId();
        registration.setStatus("cancelled");
        registrationRepository.save(registration);

        // 如果原状态是已通过，需要减少活动的已报名人数
        if ("approved".equals(oldStatus)) {
            activity.setJoined(Math.max(0, activity.getJoined() - 1));

            // 【修复】如果报名关联了分组，同时减少分组的 joined 字段
            if (groupId != null && activity.getGroups() != null) {
                updateGroupJoined(activity, groupId, -1);
            }

            activityRepository.save(activity);
        }

        log.info("报名取消成功，报名ID: {}", registrationId);
    }

    /**
     * 查询活动的报名列表（组织者/管理员）
     *
     * @param activityId 活动ID
     * @param status     报名状态（可选）
     * @param page       页码
     * @param size       每页数量
     * @param userId     当前用户ID
     * @return 报名列表（分页）
     */
    public Page<RegistrationVO> getActivityRegistrations(String activityId, String status, Integer page, Integer size, String userId) {
        log.info("查询活动报名列表，活动ID: {}, 状态: {}, 用户ID: {}", activityId, status, userId);

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 判断是否是组织者
        boolean isOrganizer = userId != null && activity.getOrganizerId().equals(userId);

        // 构建分页和排序
        Sort sort = Sort.by(Sort.Direction.DESC, "registeredAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        // 查询数据
        Page<Registration> registrationPage;

        if (isOrganizer) {
            // 组织者可以查看所有报名记录
            if (status != null && !status.isEmpty()) {
                registrationPage = registrationRepository.findByActivityIdAndStatus(activityId, status, pageable);
            } else {
                registrationPage = registrationRepository.findByActivityId(activityId, pageable);
            }
        } else {
            // 非组织者（包括未登录用户）只能查看已通过的报名
            registrationPage = registrationRepository.findByActivityIdAndStatus(activityId, "approved", pageable);
            log.info("非组织者访问，只返回已通过的报名列表");
        }

        // 转换为VO
        return registrationPage.map(registrationMapper::toVO);
    }

    /**
     * 查询用户的报名列表
     *
     * @param userId 用户ID
     * @param status 报名状态（可选）
     * @param page   页码
     * @param size   每页数量
     * @return 报名列表（分页）
     */
    public Page<RegistrationVO> getUserRegistrations(String userId, String status, Integer page, Integer size) {
        log.info("查询用户报名列表，用户ID: {}, 状态: {}", userId, status);

        // 构建分页和排序
        Sort sort = Sort.by(Sort.Direction.DESC, "registeredAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        // 查询数据
        Page<Registration> registrationPage;
        if (status != null && !status.isEmpty()) {
            registrationPage = registrationRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            registrationPage = registrationRepository.findByUserId(userId, pageable);
        }

        // 转换为VO
        return registrationPage.map(registrationMapper::toVO);
    }

    /**
     * 查询报名详情
     *
     * @param registrationId 报名ID
     * @param userId         当前用户ID
     * @return 报名详情
     */
    public RegistrationVO getRegistrationDetail(String registrationId, String userId) {
        log.info("查询报名详情，报名ID: {}, 用户ID: {}", registrationId, userId);

        // 查询报名记录
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("报名记录不存在"));

        // 查询活动
        Activity activity = activityRepository.findById(registration.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 权限校验：报名者本人或活动组织者可以查看
        if (!registration.getUserId().equals(userId) && !activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权查看此报名详情");
        }

        return registrationMapper.toVO(registration);
    }

    /**
     * 审核报名
     *
     * @param registrationId 报名ID
     * @param request        审核请求
     * @param userId         当前用户ID
     * @return 报名详情
     */
    @Transactional
    public RegistrationVO approveRegistration(String registrationId, ApproveRegistrationRequest request, String userId) {
        log.info("审核报名，报名ID: {}, 审核结果: {}", registrationId, request.getApproved());

        // 查询报名记录
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("报名记录不存在"));

        // 查询活动
        Activity activity = activityRepository.findById(registration.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 权限校验：只有组织者可以审核报名
        if (!activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权审核此报名");
        }

        // 检查报名状态
        if (!"pending".equals(registration.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "只能审核待审核状态的报名");
        }

        // 如果通过审核，检查人数限制
        if (request.getApproved()) {
            // 【修复】增加对total字段的有效性检查
            Integer total = activity.getTotal();
            if (total == null || total <= 0) {
                log.error("活动ID={} 的人数上限配置异常: total={}, 无法通过报名", activity.getId(), total);
                throw new BusinessException(INVALID_OPERATION, "活动人数配置异常，请联系组织者处理");
            }

            long currentJoined = registrationRepository.countByActivityIdAndStatus(registration.getActivityId(), "approved");
            if (currentJoined >= total) {
                throw new BusinessException(INVALID_OPERATION, "活动人数已满，无法通过报名");
            }

            // 更新报名状态
            registration.setStatus("approved");
            registration.setApprovedAt(LocalDateTime.now());

            // 更新活动的已报名人数
            activity.setJoined(activity.getJoined() + 1);

            // 【修复】如果报名关联了分组，同时更新分组的 joined 字段
            if (registration.getGroupId() != null && activity.getGroups() != null) {
                updateGroupJoined(activity, registration.getGroupId(), 1);
            }

            activityRepository.save(activity);
        } else {
            // 拒绝报名
            registration.setStatus("rejected");
        }

        // 保存报名记录
        Registration updatedRegistration = registrationRepository.save(registration);

        log.info("报名审核完成，报名ID: {}, 新状态: {}", registrationId, registration.getStatus());

        return registrationMapper.toVO(updatedRegistration);
    }

    /**
     * 检查用户是否已报名活动
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 是否已报名
     */
    public boolean isUserRegistered(String activityId, String userId) {
        return registrationRepository.existsByActivityIdAndUserId(activityId, userId);
    }

    /**
     * 更新分组的已报名人数
     *
     * @param activity 活动对象
     * @param groupId  分组ID
     * @param delta    增量（+1 表示增加，-1 表示减少）
     */
    private void updateGroupJoined(Activity activity, String groupId, int delta) {
        try {
            String groupsJson = activity.getGroups();
            if (groupsJson == null || groupsJson.isEmpty()) {
                return;
            }

            // 解析 groups JSON
            ObjectMapper objectMapper = new ObjectMapper();
            List<Map<String, Object>> groups = objectMapper.readValue(
                    groupsJson,
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            // 查找目标分组并更新 joined 字段
            boolean updated = false;
            for (Map<String, Object> group : groups) {
                if (groupId.equals(group.get("id"))) {
                    // 获取当前 joined 值
                    Integer currentJoined = (Integer) group.get("joined");
                    if (currentJoined == null) {
                        currentJoined = 0;
                    }

                    // 更新 joined
                    int newJoined = Math.max(0, currentJoined + delta);
                    group.put("joined", newJoined);

                    log.info("更新分组 {} 的 joined: {} -> {}", groupId, currentJoined, newJoined);
                    updated = true;
                    break;
                }
            }

            if (updated) {
                // 序列化回 JSON 并更新到 activity
                String updatedGroupsJson = objectMapper.writeValueAsString(groups);
                activity.setGroups(updatedGroupsJson);
            } else {
                log.warn("未找到分组ID: {} 在活动 {} 的 groups 中", groupId, activity.getId());
            }

        } catch (Exception e) {
            log.error("更新分组 joined 失败，活动ID: {}, 分组ID: {}", activity.getId(), groupId, e);
            // 不抛出异常，避免影响主流程
        }
    }
}
