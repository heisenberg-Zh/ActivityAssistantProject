package com.activityassistant.mapper;

import com.activityassistant.dto.request.CreateActivityRequest;
import com.activityassistant.dto.request.UpdateActivityRequest;
import com.activityassistant.dto.response.ActivityVO;
import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.model.Activity;
import com.activityassistant.model.User;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.repository.UserRepository;
import com.activityassistant.service.IdGeneratorService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 活动实体和VO转换工具
 *
 * @author Claude
 * @since 2025-11-10
 */
@Slf4j
@Component
public class ActivityMapper {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private IdGeneratorService idGeneratorService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Activity转ActivityVO
     *
     * @param activity  活动实体
     * @param userId    当前用户ID（用于判断是否为组织者/管理员）
     * @return ActivityVO
     */
    public ActivityVO toVO(Activity activity, String userId) {
        if (activity == null) {
            return null;
        }

        // 获取组织者信息
        User organizer = userRepository.findById(activity.getOrganizerId()).orElse(null);

        // 解析管理员列表
        List<UserSimpleVO> administratorList = parseAdministrators(activity.getAdministrators());

        ActivityVO.ActivityVOBuilder builder = ActivityVO.builder()
                .id(activity.getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .organizerId(activity.getOrganizerId())
                .type(activity.getType())
                .status(activity.getStatus())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .registerDeadline(activity.getRegisterDeadline())
                .place(activity.getPlace())
                .address(activity.getAddress())
                .latitude(activity.getLatitude())
                .longitude(activity.getLongitude())
                .checkinRadius(activity.getCheckinRadius())
                .total(activity.getTotal())
                .joined(activity.getJoined())
                .minParticipants(activity.getMinParticipants())
                .fee(activity.getFee())
                .feeType(activity.getFeeType())
                .needReview(activity.getNeedReview())
                .isPublic(activity.getIsPublic())
                .isDeleted(activity.getIsDeleted())
                .groups(activity.getGroups())
                .administrators(administratorList)
                .whitelist(activity.getWhitelist())
                .blacklist(activity.getBlacklist())
                .customFields(activity.getCustomFields())
                .scheduledPublishTime(activity.getScheduledPublishTime())
                .actualPublishTime(activity.getActualPublishTime())
                .isRecurring(activity.getIsRecurring())
                .recurringConfig(activity.getRecurringConfig())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt());

        // 设置组织者信息
        if (organizer != null) {
            builder.organizerName(organizer.getNickname())
                    .organizerAvatar(organizer.getAvatar());
        }

        // 设置当前用户与活动的关系
        if (userId != null) {
            builder.isOrganizer(userId.equals(activity.getOrganizerId()));
            // TODO: 检查是否为管理员（需要解析administrators JSON）
            builder.isAdmin(false);
            // 检查是否已报名
            builder.isRegistered(registrationRepository.existsByActivityIdAndUserId(activity.getId(), userId));
        }

        return builder.build();
    }

    /**
     * Activity转ActivityVO（不带用户关系）
     *
     * @param activity 活动实体
     * @return ActivityVO
     */
    public ActivityVO toVO(Activity activity) {
        return toVO(activity, null);
    }

    /**
     * CreateActivityRequest转Activity实体
     *
     * @param request     创建活动请求
     * @param organizerId 组织者ID
     * @return Activity
     */
    public Activity toEntity(CreateActivityRequest request, String organizerId) {
        if (request == null) {
            return null;
        }

        return Activity.builder()
                .id(idGeneratorService.generateActivityId())
                .title(request.getTitle())
                .description(request.getDescription())
                .organizerId(organizerId)
                .type(request.getType())
                .status("pending") // 初始状态为pending
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .registerDeadline(request.getRegisterDeadline())
                .place(request.getPlace())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .checkinRadius(request.getCheckinRadius() != null ? request.getCheckinRadius() : 500)
                .total(request.getTotal())
                .joined(0) // 初始已报名人数为0
                .minParticipants(request.getMinParticipants() != null ? request.getMinParticipants() : 1)
                .fee(request.getFee() != null ? request.getFee() : java.math.BigDecimal.ZERO)
                .feeType(request.getFeeType() != null ? request.getFeeType() : "free")
                .needReview(request.getNeedReview() != null ? request.getNeedReview() : false)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .isDeleted(false)
                .groups(request.getGroups())
                .administrators(null) // 初始管理员为空
                .whitelist(request.getWhitelist())
                .blacklist(request.getBlacklist())
                .customFields(request.getCustomFields())
                .scheduledPublishTime(request.getScheduledPublishTime())
                .actualPublishTime(null)
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurringGroupId(null)
                .recurringConfig(request.getRecurringConfig())
                .build();
    }

    /**
     * 用UpdateActivityRequest更新Activity实体
     *
     * @param activity 原活动实体
     * @param request  更新请求
     */
    public void updateEntity(Activity activity, UpdateActivityRequest request) {
        if (request == null || activity == null) {
            return;
        }

        if (request.getTitle() != null) {
            activity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            activity.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            activity.setType(request.getType());
        }
        if (request.getStartTime() != null) {
            activity.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            activity.setEndTime(request.getEndTime());
        }
        if (request.getRegisterDeadline() != null) {
            activity.setRegisterDeadline(request.getRegisterDeadline());
        }
        if (request.getPlace() != null) {
            activity.setPlace(request.getPlace());
        }
        if (request.getAddress() != null) {
            activity.setAddress(request.getAddress());
        }
        if (request.getLatitude() != null) {
            activity.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            activity.setLongitude(request.getLongitude());
        }
        if (request.getCheckinRadius() != null) {
            activity.setCheckinRadius(request.getCheckinRadius());
        }
        if (request.getTotal() != null) {
            activity.setTotal(request.getTotal());
        }
        if (request.getMinParticipants() != null) {
            activity.setMinParticipants(request.getMinParticipants());
        }
        if (request.getFee() != null) {
            activity.setFee(request.getFee());
        }
        if (request.getFeeType() != null) {
            activity.setFeeType(request.getFeeType());
        }
        if (request.getNeedReview() != null) {
            activity.setNeedReview(request.getNeedReview());
        }
        if (request.getIsPublic() != null) {
            activity.setIsPublic(request.getIsPublic());
        }
        if (request.getGroups() != null) {
            activity.setGroups(request.getGroups());
        }
        if (request.getWhitelist() != null) {
            activity.setWhitelist(request.getWhitelist());
        }
        if (request.getBlacklist() != null) {
            activity.setBlacklist(request.getBlacklist());
        }
        if (request.getCustomFields() != null) {
            activity.setCustomFields(request.getCustomFields());
        }
    }

    /**
     * 解析管理员JSON字符串为UserSimpleVO列表
     *
     * @param administratorsJson 管理员ID列表的JSON字符串
     * @return UserSimpleVO列表
     */
    private List<UserSimpleVO> parseAdministrators(String administratorsJson) {
        if (administratorsJson == null || administratorsJson.trim().isEmpty() || "null".equals(administratorsJson)) {
            return Collections.emptyList();
        }

        try {
            // 解析JSON字符串为用户ID列表
            List<String> adminIds = objectMapper.readValue(administratorsJson, new TypeReference<List<String>>() {});

            if (adminIds == null || adminIds.isEmpty()) {
                return Collections.emptyList();
            }

            // 查询用户信息并转换为UserSimpleVO
            List<User> users = userRepository.findAllById(adminIds);

            return users.stream()
                    .map(user -> UserSimpleVO.builder()
                            .id(user.getId())
                            .nickname(user.getNickname())
                            .avatar(user.getAvatar())
                            .phone(user.getPhone())
                            .build())
                    .collect(Collectors.toList());
        } catch (JsonProcessingException e) {
            log.warn("解析管理员列表JSON失败: {}", administratorsJson, e);
            return Collections.emptyList();
        }
    }
}
