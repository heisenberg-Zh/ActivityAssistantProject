package com.activityassistant.service;

import com.activityassistant.dto.request.CreateCheckinRequest;
import com.activityassistant.dto.response.CheckinVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.mapper.CheckinMapper;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Checkin;
import com.activityassistant.model.Registration;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.CheckinRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.util.ActivityStatusUtils;
import com.activityassistant.util.DistanceUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static com.activityassistant.constant.ErrorCode.*;

/**
 * 签到业务逻辑层
 *
 * @author Claude
 * @since 2025-11-11
 */
@Slf4j
@Service
public class CheckinService {

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private CheckinMapper checkinMapper;

    @Autowired
    private IdGeneratorService idGeneratorService;

    /**
     * 创建签到（GPS位置验证）
     *
     * @param request 创建签到请求
     * @param userId  用户ID
     * @return 签到详情
     */
    @Transactional
    public CheckinVO createCheckin(CreateCheckinRequest request, String userId) {
        log.info("创建签到，用户: {}, 活动: {}", userId, request.getActivityId());

        // 1. 验证活动是否存在
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new BusinessException(NOT_FOUND, "活动不存在"));

        // 2. 验证活动是否可以签到（动态判断：开始前30分钟到结束时间）
        if (!ActivityStatusUtils.canCheckin(activity)) {
            String statusText = ActivityStatusUtils.getActivityStatusText(activity);
            log.warn("活动 {} 不在签到时间窗口内，当前状态: {}，无法签到", activity.getId(), statusText);
            throw new BusinessException(INVALID_OPERATION,
                String.format("活动不在签到时间窗口内，当前活动状态：%s", statusText));
        }
        log.info("活动 {} 在签到时间窗口内，允许签到", activity.getId());

        // 3. 验证是否已报名
        Registration registration = registrationRepository.findByActivityIdAndUserId(
                request.getActivityId(), userId)
                .orElseThrow(() -> new BusinessException(INVALID_OPERATION, "未报名，无法签到"));

        // 4. 验证报名状态（必须是已通过）
        if (!"approved".equals(registration.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "报名未通过审核，无法签到");
        }

        // 5. 防止重复签到
        if (checkinRepository.existsByActivityIdAndUserId(request.getActivityId(), userId)) {
            throw new BusinessException(CONFLICT, "您已签到，不能重复签到");
        }

        // 6. 计算签到位置与活动地点的距离
        int distance = 0;
        boolean isValid = true;
        String note = null;

        if (activity.getLatitude() != null && activity.getLongitude() != null) {
            distance = (int) DistanceUtil.calculateDistance(
                    request.getLatitude().doubleValue(),
                    request.getLongitude().doubleValue(),
                    activity.getLatitude().doubleValue(),
                    activity.getLongitude().doubleValue()
            );

            // 验证距离是否在签到范围内
            if (distance > activity.getCheckinRadius()) {
                isValid = false;
                note = String.format("签到位置距离活动地点%d米，超出允许范围%d米",
                        distance, activity.getCheckinRadius());
                log.warn("签到位置超出范围，用户: {}, 活动: {}, 距离: {}米", userId, activity.getId(), distance);
            }
        }

        // 7. 判断是否迟到（活动开始时间后30分钟内为迟到）
        boolean isLate = false;
        LocalDateTime now = LocalDateTime.now();
        if (activity.getStartTime() != null && now.isAfter(activity.getStartTime())) {
            long minutesLate = ChronoUnit.MINUTES.between(activity.getStartTime(), now);
            if (minutesLate <= 30) {
                isLate = true;
            } else if (minutesLate > 30) {
                // 超过30分钟也标记为迟到，但记录在备注中
                isLate = true;
                note = (note != null ? note + "; " : "") +
                        String.format("迟到%d分钟", minutesLate);
            }
        }

        // 8. 创建签到记录
        Checkin checkin = Checkin.builder()
                .id(idGeneratorService.generateCheckinId())
                .activityId(request.getActivityId())
                .userId(userId)
                .registrationId(registration.getId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .distance(distance)
                .isLate(isLate)
                .isValid(isValid)
                .note(note)
                .build();

        Checkin savedCheckin = checkinRepository.save(checkin);

        // 9. 更新报名记录的签到状态
        if (isLate) {
            registration.setCheckinStatus("late");
        } else {
            registration.setCheckinStatus("checked");
        }
        registration.setCheckinTime(savedCheckin.getCheckinTime());
        registrationRepository.save(registration);

        log.info("签到成功，用户: {}, 活动: {}, 距离: {}米, 迟到: {}, 有效: {}",
                userId, activity.getId(), distance, isLate, isValid);

        return checkinMapper.toVO(savedCheckin);
    }

    /**
     * 查询活动的签到记录（组织者/管理员）
     *
     * @param activityId 活动ID
     * @param page       页码
     * @param size       每页数量
     * @param userId     当前用户ID
     * @return 签到记录分页列表
     */
    public Page<CheckinVO> getActivityCheckins(String activityId, Integer page, Integer size, String userId) {
        log.info("查询活动签到记录，活动: {}, 用户: {}", activityId, userId);

        // 1. 验证活动是否存在
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(NOT_FOUND, "活动不存在"));

        // 2. 验证权限（只有组织者和管理员可以查看）
        if (!activity.getOrganizerId().equals(userId)) {
            // TODO: 检查是否为管理员（需要解析administrators JSON）
            throw new BusinessException(PERMISSION_DENIED, "无权查看此活动的签到记录");
        }

        // 3. 查询签到记录（按签到时间倒序）
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkinTime"));
        Page<Checkin> checkinPage = checkinRepository.findByActivityId(activityId, pageable);

        // 4. 转换为VO
        return checkinPage.map(checkinMapper::toVO);
    }

    /**
     * 查询我的签到记录
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 签到记录分页列表
     */
    public Page<CheckinVO> getMyCheckins(String userId, Integer page, Integer size) {
        log.info("查询我的签到记录，用户: {}", userId);

        // 查询签到记录（按签到时间倒序）
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkinTime"));
        Page<Checkin> checkinPage = checkinRepository.findByUserId(userId, pageable);

        // 转换为VO
        return checkinPage.map(checkinMapper::toVO);
    }

    /**
     * 查询签到详情
     *
     * @param id     签到ID
     * @param userId 当前用户ID
     * @return 签到详情
     */
    public CheckinVO getCheckinDetail(String id, String userId) {
        log.info("查询签到详情，签到ID: {}, 用户: {}", id, userId);

        // 查询签到记录
        Checkin checkin = checkinRepository.findById(id)
                .orElseThrow(() -> new BusinessException(NOT_FOUND, "签到记录不存在"));

        // 验证权限（只有本人或组织者可以查看）
        if (!checkin.getUserId().equals(userId)) {
            Activity activity = activityRepository.findById(checkin.getActivityId())
                    .orElseThrow(() -> new BusinessException(NOT_FOUND, "活动不存在"));
            if (!activity.getOrganizerId().equals(userId)) {
                // TODO: 检查是否为管理员
                throw new BusinessException(PERMISSION_DENIED, "无权查看此签到记录");
            }
        }

        return checkinMapper.toVO(checkin);
    }
}
