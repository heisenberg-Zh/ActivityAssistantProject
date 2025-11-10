package com.activityassistant.repository;

import com.activityassistant.model.Activity;
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
 * 活动数据访问层
 *
 * @author Claude
 * @since 2025-11-10
 */
@Repository
public interface ActivityRepository extends JpaRepository<Activity, String>, JpaSpecificationExecutor<Activity> {

    /**
     * 根据ID查询活动（排除已删除）
     *
     * @param id 活动ID
     * @return 活动信息
     */
    Optional<Activity> findByIdAndIsDeletedFalse(String id);

    /**
     * 根据组织者ID查询活动列表（排除已删除）
     *
     * @param organizerId 组织者ID
     * @param pageable    分页参数
     * @return 活动列表
     */
    Page<Activity> findByOrganizerIdAndIsDeletedFalse(String organizerId, Pageable pageable);

    /**
     * 根据状态查询活动列表（排除已删除）
     *
     * @param status   活动状态
     * @param pageable 分页参数
     * @return 活动列表
     */
    Page<Activity> findByStatusAndIsDeletedFalse(String status, Pageable pageable);

    /**
     * 查询公开活动列表（排除已删除）
     *
     * @param pageable 分页参数
     * @return 活动列表
     */
    Page<Activity> findByIsPublicTrueAndIsDeletedFalse(Pageable pageable);

    /**
     * 根据类型和状态查询活动（排除已删除）
     *
     * @param type     活动类型
     * @param status   活动状态
     * @param pageable 分页参数
     * @return 活动列表
     */
    Page<Activity> findByTypeAndStatusAndIsDeletedFalse(String type, String status, Pageable pageable);

    /**
     * 根据类型查询公开活动（排除已删除）
     *
     * @param type     活动类型
     * @param pageable 分页参数
     * @return 活动列表
     */
    Page<Activity> findByTypeAndIsPublicTrueAndIsDeletedFalse(String type, Pageable pageable);

    /**
     * 关键字搜索活动（标题、描述、地点）
     *
     * @param keyword  关键字
     * @param pageable 分页参数
     * @return 活动列表
     */
    @Query("SELECT a FROM Activity a WHERE a.isDeleted = false AND " +
            "(a.title LIKE %:keyword% OR a.description LIKE %:keyword% OR a.place LIKE %:keyword%)")
    Page<Activity> searchActivities(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 软删除活动
     *
     * @param id 活动ID
     * @return 影响的行数
     */
    @Modifying
    @Query("UPDATE Activity a SET a.isDeleted = true WHERE a.id = :id")
    int softDeleteById(@Param("id") String id);

    /**
     * 更新活动的已报名人数
     *
     * @param id     活动ID
     * @param joined 已报名人数
     * @return 影响的行数
     */
    @Modifying
    @Query("UPDATE Activity a SET a.joined = :joined WHERE a.id = :id")
    int updateJoinedCount(@Param("id") String id, @Param("joined") Integer joined);

    /**
     * 统计组织者创建的活动数量（排除已删除）
     *
     * @param organizerId 组织者ID
     * @return 活动数量
     */
    long countByOrganizerIdAndIsDeletedFalse(String organizerId);

    /**
     * 查询周期性活动组的所有活动
     *
     * @param recurringGroupId 周期性活动组ID
     * @return 活动列表
     */
    List<Activity> findByRecurringGroupIdAndIsDeletedFalse(String recurringGroupId);
}
