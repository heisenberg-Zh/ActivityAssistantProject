package com.activityassistant.repository;

import com.activityassistant.model.Registration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 报名数据访问层
 *
 * @author Claude
 * @since 2025-11-11
 */
@Repository
public interface RegistrationRepository extends JpaRepository<Registration, String>, JpaSpecificationExecutor<Registration> {

    /**
     * 根据活动ID和用户ID查询报名记录
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 报名记录
     */
    Optional<Registration> findByActivityIdAndUserId(String activityId, String userId);

    /**
     * 检查用户是否已报名活动
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 是否已报名
     */
    boolean existsByActivityIdAndUserId(String activityId, String userId);

    /**
     * 根据活动ID查询报名列表（分页）
     *
     * @param activityId 活动ID
     * @param pageable   分页参数
     * @return 报名列表
     */
    Page<Registration> findByActivityId(String activityId, Pageable pageable);

    /**
     * 根据活动ID和状态查询报名列表
     *
     * @param activityId 活动ID
     * @param status     报名状态
     * @param pageable   分页参数
     * @return 报名列表
     */
    Page<Registration> findByActivityIdAndStatus(String activityId, String status, Pageable pageable);

    /**
     * 根据用户ID查询报名列表（分页）
     *
     * @param userId   用户ID
     * @param pageable 分页参数
     * @return 报名列表
     */
    Page<Registration> findByUserId(String userId, Pageable pageable);

    /**
     * 根据用户ID和状态查询报名列表
     *
     * @param userId   用户ID
     * @param status   报名状态
     * @param pageable 分页参数
     * @return 报名列表
     */
    Page<Registration> findByUserIdAndStatus(String userId, String status, Pageable pageable);

    /**
     * 统计活动的报名人数（按状态）
     *
     * @param activityId 活动ID
     * @param status     报名状态
     * @return 报名人数
     */
    long countByActivityIdAndStatus(String activityId, String status);

    /**
     * 统计活动的总报名人数
     *
     * @param activityId 活动ID
     * @return 报名人数
     */
    long countByActivityId(String activityId);

    /**
     * 统计用户的报名次数
     *
     * @param userId 用户ID
     * @return 报名次数
     */
    long countByUserId(String userId);

    /**
     * 根据活动ID和分组ID查询报名列表
     *
     * @param activityId 活动ID
     * @param groupId    分组ID
     * @param pageable   分页参数
     * @return 报名列表
     */
    Page<Registration> findByActivityIdAndGroupId(String activityId, String groupId, Pageable pageable);

    /**
     * 统计分组的报名人数
     *
     * @param activityId 活动ID
     * @param groupId    分组ID
     * @return 报名人数
     */
    long countByActivityIdAndGroupId(String activityId, String groupId);

    /**
     * 批量更新报名状态
     *
     * @param ids    报名ID列表
     * @param status 新状态
     * @return 影响的行数
     */
    @Modifying
    @Query("UPDATE Registration r SET r.status = :status WHERE r.id IN :ids")
    int batchUpdateStatus(@Param("ids") List<String> ids, @Param("status") String status);

    /**
     * 删除活动的所有报名记录
     *
     * @param activityId 活动ID
     * @return 影响的行数
     */
    @Modifying
    @Query("DELETE FROM Registration r WHERE r.activityId = :activityId")
    int deleteByActivityId(@Param("activityId") String activityId);
}
