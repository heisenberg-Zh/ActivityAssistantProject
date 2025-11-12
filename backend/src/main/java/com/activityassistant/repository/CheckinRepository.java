package com.activityassistant.repository;

import com.activityassistant.model.Checkin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 签到数据访问层
 *
 * @author Claude
 * @since 2025-11-11
 */
@Repository
public interface CheckinRepository extends JpaRepository<Checkin, String>, JpaSpecificationExecutor<Checkin> {

    /**
     * 根据活动ID查询签到记录（分页）
     *
     * @param activityId 活动ID
     * @param pageable   分页参数
     * @return 签到记录分页列表
     */
    Page<Checkin> findByActivityId(String activityId, Pageable pageable);

    /**
     * 根据活动ID和用户ID查询签到记录
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 签到记录（可选）
     */
    Optional<Checkin> findByActivityIdAndUserId(String activityId, String userId);

    /**
     * 检查用户是否已签到某活动
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return true-已签到，false-未签到
     */
    boolean existsByActivityIdAndUserId(String activityId, String userId);

    /**
     * 统计活动的签到人数
     *
     * @param activityId 活动ID
     * @return 签到人数
     */
    long countByActivityId(String activityId);

    /**
     * 统计活动的有效签到人数
     *
     * @param activityId 活动ID
     * @param isValid    是否有效
     * @return 有效签到人数
     */
    long countByActivityIdAndIsValid(String activityId, Boolean isValid);

    /**
     * 统计活动的迟到人数
     *
     * @param activityId 活动ID
     * @param isLate     是否迟到
     * @return 迟到人数
     */
    long countByActivityIdAndIsLate(String activityId, Boolean isLate);

    /**
     * 根据用户ID查询签到记录（分页）
     *
     * @param userId   用户ID
     * @param pageable 分页参数
     * @return 签到记录分页列表
     */
    Page<Checkin> findByUserId(String userId, Pageable pageable);

    /**
     * 根据用户ID查询所有签到记录
     *
     * @param userId 用户ID
     * @return 签到记录列表
     */
    List<Checkin> findByUserId(String userId);

    /**
     * 根据报名记录ID查询签到记录
     *
     * @param registrationId 报名记录ID
     * @return 签到记录（可选）
     */
    Optional<Checkin> findByRegistrationId(String registrationId);

    /**
     * 统计用户的签到总数
     *
     * @param userId 用户ID
     * @return 签到总数
     */
    long countByUserId(String userId);

    /**
     * 统计用户的有效签到数
     *
     * @param userId  用户ID
     * @param isValid 是否有效
     * @return 有效签到数
     */
    long countByUserIdAndIsValid(String userId, Boolean isValid);

    /**
     * 统计用户的迟到次数
     *
     * @param userId 用户ID
     * @param isLate 是否迟到
     * @return 迟到次数
     */
    long countByUserIdAndIsLate(String userId, Boolean isLate);
}
