package com.activityassistant.mapper;

import com.activityassistant.dto.response.CheckinVO;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Checkin;
import com.activityassistant.model.Registration;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 签到实体和VO转换工具
 *
 * @author Claude
 * @since 2025-11-11
 */
@Component
public class CheckinMapper {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    /**
     * Checkin转CheckinVO
     *
     * @param checkin 签到实体
     * @return CheckinVO
     */
    public CheckinVO toVO(Checkin checkin) {
        if (checkin == null) {
            return null;
        }

        // 获取用户信息
        User user = userRepository.findById(checkin.getUserId()).orElse(null);

        // 获取活动信息
        Activity activity = activityRepository.findById(checkin.getActivityId()).orElse(null);

        // 获取报名信息
        Registration registration = registrationRepository.findById(checkin.getRegistrationId()).orElse(null);

        CheckinVO.CheckinVOBuilder builder = CheckinVO.builder()
                .id(checkin.getId())
                .activityId(checkin.getActivityId())
                .userId(checkin.getUserId())
                .registrationId(checkin.getRegistrationId())
                .latitude(checkin.getLatitude())
                .longitude(checkin.getLongitude())
                .address(checkin.getAddress())
                .distance(checkin.getDistance())
                .checkinTime(checkin.getCheckinTime())
                .isLate(checkin.getIsLate())
                .isValid(checkin.getIsValid())
                .note(checkin.getNote());

        // 设置用户信息
        if (user != null) {
            builder.userNickname(user.getNickname())
                    .userAvatar(user.getAvatar());
        }

        // 设置活动信息
        if (activity != null) {
            builder.activityTitle(activity.getTitle());
        }

        // 设置报名信息
        if (registration != null) {
            builder.registrationName(registration.getName());
        }

        return builder.build();
    }
}
