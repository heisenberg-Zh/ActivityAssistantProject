package com.activityassistant.mapper;

import com.activityassistant.dto.request.CreateRegistrationRequest;
import com.activityassistant.dto.response.RegistrationVO;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Registration;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.UserRepository;
import com.activityassistant.service.IdGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 报名实体和VO转换工具
 *
 * @author Claude
 * @since 2025-11-11
 */
@Component
public class RegistrationMapper {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private IdGeneratorService idGeneratorService;

    /**
     * Registration转RegistrationVO
     *
     * @param registration 报名实体
     * @return RegistrationVO
     */
    public RegistrationVO toVO(Registration registration) {
        if (registration == null) {
            return null;
        }

        // 获取用户信息
        User user = userRepository.findById(registration.getUserId()).orElse(null);

        // 获取活动信息
        Activity activity = activityRepository.findById(registration.getActivityId()).orElse(null);

        RegistrationVO.RegistrationVOBuilder builder = RegistrationVO.builder()
                .id(registration.getId())
                .activityId(registration.getActivityId())
                .groupId(registration.getGroupId())
                .userId(registration.getUserId())
                .name(registration.getName())
                .mobile(registration.getMobile())
                .customData(registration.getCustomData())
                .status(registration.getStatus())
                .registeredAt(registration.getRegisteredAt())
                .approvedAt(registration.getApprovedAt())
                .checkinStatus(registration.getCheckinStatus())
                .checkinTime(registration.getCheckinTime());

        // 设置用户信息
        if (user != null) {
            builder.userNickname(user.getNickname())
                    .userAvatar(user.getAvatar());
        }

        // 设置活动信息
        if (activity != null) {
            builder.activityTitle(activity.getTitle());
        }

        // TODO: 设置分组名称（需要解析activity的groups JSON）
        builder.groupName(null);

        return builder.build();
    }

    /**
     * CreateRegistrationRequest转Registration实体
     *
     * @param request 创建报名请求
     * @param userId  用户ID
     * @return Registration
     */
    public Registration toEntity(CreateRegistrationRequest request, String userId) {
        if (request == null) {
            return null;
        }

        return Registration.builder()
                .id(idGeneratorService.generateRegistrationId())
                .activityId(request.getActivityId())
                .groupId(request.getGroupId())
                .userId(userId)
                .name(request.getName())
                .mobile(request.getMobile())
                .customData(request.getCustomData())
                .status("pending") // 初始状态为待审核
                .checkinStatus("pending") // 初始签到状态为待签到
                .build();
    }
}
