package com.activityassistant.service;

import com.activityassistant.dto.request.ActivityQueryRequest;
import com.activityassistant.dto.request.CreateActivityRequest;
import com.activityassistant.dto.request.UpdateActivityRequest;
import com.activityassistant.dto.response.ActivityVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.mapper.ActivityMapper;
import com.activityassistant.model.Activity;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.activityassistant.constant.ErrorCode.*;

/**
 * 活动业务逻辑层
 *
 * @author Claude
 * @since 2025-11-10
 */
@Slf4j
@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityMapper activityMapper;

    /**
     * 创建活动
     *
     * @param request     创建活动请求
     * @param organizerId 组织者ID
     * @return 活动详情
     */
    @Transactional
    public ActivityVO createActivity(CreateActivityRequest request, String organizerId) {
        log.info("创建活动，组织者ID: {}, 标题: {}", organizerId, request.getTitle());

        // 验证用户是否存在
        if (!userRepository.existsById(organizerId)) {
            throw new NotFoundException("用户不存在");
        }

        // 验证时间有效性
        validateActivityTime(request.getStartTime(), request.getEndTime(), request.getRegisterDeadline());

        // 创建活动实体
        Activity activity = activityMapper.toEntity(request, organizerId);

        // 保存活动
        Activity savedActivity = activityRepository.save(activity);

        log.info("活动创建成功，活动ID: {}", savedActivity.getId());

        // 转换为VO返回
        return activityMapper.toVO(savedActivity, organizerId);
    }

    /**
     * 查询活动列表（支持筛选、搜索、分页）
     *
     * @param queryRequest 查询条件
     * @param userId       当前用户ID
     * @return 活动列表（分页）
     */
    public Page<ActivityVO> getActivityList(ActivityQueryRequest queryRequest, String userId) {
        log.info("查询活动列表，条件: {}", queryRequest);

        // 构建分页和排序
        Sort sort = buildSort(queryRequest.getSortBy(), queryRequest.getSortDirection());
        Pageable pageable = PageRequest.of(queryRequest.getPage(), queryRequest.getSize(), sort);

        // 构建查询条件
        Specification<Activity> spec = buildSpecification(queryRequest, userId);

        // 查询数据
        Page<Activity> activityPage = activityRepository.findAll(spec, pageable);

        // 转换为VO
        return activityPage.map(activity -> activityMapper.toVO(activity, userId));
    }

    /**
     * 查询活动详情
     *
     * @param activityId 活动ID
     * @param userId     当前用户ID
     * @return 活动详情
     */
    public ActivityVO getActivityDetail(String activityId, String userId) {
        log.info("查询活动详情，活动ID: {}, 用户ID: {}", activityId, userId);

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 检查私密活动的访问权限
        if (!activity.getIsPublic()) {
            checkPrivateActivityAccess(activity, userId);
        }

        return activityMapper.toVO(activity, userId);
    }

    /**
     * 更新活动
     *
     * @param activityId 活动ID
     * @param request    更新请求
     * @param userId     当前用户ID
     * @return 活动详情
     */
    @Transactional
    public ActivityVO updateActivity(String activityId, UpdateActivityRequest request, String userId) {
        log.info("更新活动，活动ID: {}, 用户ID: {}", activityId, userId);

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 权限校验：只有组织者可以修改活动
        if (!activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权修改此活动");
        }

        // 验证时间有效性（如果有更新时间）
        LocalDateTime startTime = request.getStartTime() != null ? request.getStartTime() : activity.getStartTime();
        LocalDateTime endTime = request.getEndTime() != null ? request.getEndTime() : activity.getEndTime();
        LocalDateTime registerDeadline = request.getRegisterDeadline() != null ?
                request.getRegisterDeadline() : activity.getRegisterDeadline();
        validateActivityTime(startTime, endTime, registerDeadline);

        // 更新活动信息
        activityMapper.updateEntity(activity, request);

        // 保存更新
        Activity updatedActivity = activityRepository.save(activity);

        log.info("活动更新成功，活动ID: {}", activityId);

        return activityMapper.toVO(updatedActivity, userId);
    }

    /**
     * 删除活动（软删除）
     *
     * @param activityId 活动ID
     * @param userId     当前用户ID
     */
    @Transactional
    public void deleteActivity(String activityId, String userId) {
        log.info("删除活动，活动ID: {}, 用户ID: {}", activityId, userId);

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 权限校验：只有组织者可以删除活动
        if (!activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权删除此活动");
        }

        // 软删除
        activity.setIsDeleted(true);
        activityRepository.save(activity);

        log.info("活动删除成功，活动ID: {}", activityId);
    }

    /**
     * 发布活动
     *
     * @param activityId 活动ID
     * @param userId     当前用户ID
     * @return 活动详情
     */
    @Transactional
    public ActivityVO publishActivity(String activityId, String userId) {
        log.info("发布活动，活动ID: {}, 用户ID: {}", activityId, userId);

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 权限校验
        if (!activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权发布此活动");
        }

        // 检查状态
        if ("published".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已发布");
        }

        // 更新状态
        activity.setStatus("published");
        activity.setActualPublishTime(LocalDateTime.now());
        activityRepository.save(activity);

        log.info("活动发布成功，活动ID: {}", activityId);

        return activityMapper.toVO(activity, userId);
    }

    /**
     * 取消活动
     *
     * @param activityId 活动ID
     * @param userId     当前用户ID
     * @return 活动详情
     */
    @Transactional
    public ActivityVO cancelActivity(String activityId, String userId) {
        log.info("取消活动，活动ID: {}, 用户ID: {}", activityId, userId);

        // 查询活动
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 权限校验
        if (!activity.getOrganizerId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "无权取消此活动");
        }

        // 检查状态
        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已取消");
        }
        if ("finished".equals(activity.getStatus())) {
            throw new BusinessException(INVALID_OPERATION, "活动已结束，无法取消");
        }

        // 更新状态
        activity.setStatus("cancelled");
        activityRepository.save(activity);

        log.info("活动取消成功，活动ID: {}", activityId);

        return activityMapper.toVO(activity, userId);
    }

    /**
     * 检查用户是否有权限访问私密活动
     *
     * @param activity 活动实体
     * @param userId   用户ID
     */
    private void checkPrivateActivityAccess(Activity activity, String userId) {
        if (userId == null) {
            throw new BusinessException(PERMISSION_DENIED, "私密活动需要登录访问");
        }

        // 组织者可以访问
        if (activity.getOrganizerId().equals(userId)) {
            return;
        }

        // TODO: 检查白名单（需要解析whitelist JSON）
        // 暂时拒绝访问
        throw new BusinessException(PERMISSION_DENIED, "无权访问此私密活动");
    }

    /**
     * 验证活动时间的有效性
     *
     * @param startTime        开始时间
     * @param endTime          结束时间
     * @param registerDeadline 报名截止时间
     */
    private void validateActivityTime(LocalDateTime startTime, LocalDateTime endTime, LocalDateTime registerDeadline) {
        if (startTime == null || endTime == null) {
            throw new BusinessException(INVALID_PARAMETER, "活动开始时间和结束时间不能为空");
        }

        // 结束时间必须晚于开始时间
        if (!endTime.isAfter(startTime)) {
            throw new BusinessException(INVALID_PARAMETER, "活动结束时间必须晚于开始时间");
        }

        // 报名截止时间必须早于开始时间
        if (registerDeadline != null && !registerDeadline.isBefore(startTime)) {
            throw new BusinessException(INVALID_PARAMETER, "报名截止时间必须早于活动开始时间");
        }
    }

    /**
     * 构建排序规则
     *
     * @param sortBy        排序字段
     * @param sortDirection 排序方向
     * @return Sort对象
     */
    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ?
                Sort.Direction.DESC : Sort.Direction.ASC;

        // 映射排序字段
        String field = switch (sortBy) {
            case "createdAt" -> "createdAt";
            case "joined" -> "joined";
            default -> "startTime";
        };

        return Sort.by(direction, field);
    }

    /**
     * 构建查询条件
     *
     * @param queryRequest 查询请求
     * @param userId       当前用户ID
     * @return Specification
     */
    private Specification<Activity> buildSpecification(ActivityQueryRequest queryRequest, String userId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 排除已删除
            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            // 按类型筛选
            if (queryRequest.getType() != null && !queryRequest.getType().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("type"), queryRequest.getType()));
            }

            // 按状态筛选
            if (queryRequest.getStatus() != null && !queryRequest.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), queryRequest.getStatus()));
            }

            // 按公开/私密筛选
            if (queryRequest.getIsPublic() != null) {
                predicates.add(criteriaBuilder.equal(root.get("isPublic"), queryRequest.getIsPublic()));
            } else {
                // 默认只显示公开活动（除非指定了组织者）
                if (queryRequest.getOrganizerId() == null) {
                    predicates.add(criteriaBuilder.isTrue(root.get("isPublic")));
                }
            }

            // 按组织者筛选
            if (queryRequest.getOrganizerId() != null && !queryRequest.getOrganizerId().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("organizerId"), queryRequest.getOrganizerId()));
            }

            // 关键字搜索（标题、描述、地点）
            if (queryRequest.getKeyword() != null && !queryRequest.getKeyword().isEmpty()) {
                String keyword = "%" + queryRequest.getKeyword() + "%";
                Predicate titleLike = criteriaBuilder.like(root.get("title"), keyword);
                Predicate descLike = criteriaBuilder.like(root.get("description"), keyword);
                Predicate placeLike = criteriaBuilder.like(root.get("place"), keyword);
                predicates.add(criteriaBuilder.or(titleLike, descLike, placeLike));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
