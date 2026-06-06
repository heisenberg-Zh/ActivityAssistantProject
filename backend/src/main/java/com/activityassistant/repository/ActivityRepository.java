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
import java.time.LocalDateTime;

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
     * 统计组织者创建的活动数量（包括已删除）
     *
     * @param organizerId 组织者ID
     * @return 活动数量
     */
    long countByOrganizerId(String organizerId);

    /**
     * 查询组织者创建的所有活动（包括已删除）
     * 用于统计用户获得的评价等场景
     *
     * @param organizerId 组织者ID
     * @return 活动列表
     */
    List<Activity> findByOrganizerId(String organizerId);

    /**
     * 查询周期性活动组的所有活动
     *
     * @param recurringGroupId 周期性活动组ID
     * @return 活动列表
     */
    List<Activity> findByRecurringGroupIdAndIsDeletedFalse(String recurringGroupId);

    /**
     * 查询“我管理的”活动：当前用户在 administrators(JSON数组) 中
     * MySQL JSON 示例：administrators = ["u1","u2"]
     */
    @Query(
            value = """
                    SELECT *
                    FROM activities a
                    WHERE a.is_deleted = false
                      AND a.organizer_id <> :userId
                      AND a.administrators IS NOT NULL
                      AND JSON_CONTAINS(a.administrators, JSON_QUOTE(:userId))
                    ORDER BY a.created_at DESC
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM activities a
                    WHERE a.is_deleted = false
                      AND a.organizer_id <> :userId
                      AND a.administrators IS NOT NULL
                      AND JSON_CONTAINS(a.administrators, JSON_QUOTE(:userId))
                    """,
            nativeQuery = true
    )
    Page<Activity> findManagedActivities(@Param("userId") String userId, Pageable pageable);

    /**
     * Export activities created or managed by current user within optional created time range.
     */
    @Query(
            value = """
                    SELECT DISTINCT a.*
                    FROM activities a
                    WHERE a.is_deleted = false
                      AND (
                        a.organizer_id = :userId
                        OR (a.administrators IS NOT NULL AND JSON_CONTAINS(a.administrators, JSON_QUOTE(:userId)))
                      )
                      AND (:startTime IS NULL OR a.created_at >= :startTime)
                      AND (:endTime IS NULL OR a.created_at < :endTime)
                    ORDER BY a.created_at DESC, a.id ASC
                    """,
            nativeQuery = true
    )
    List<Activity> findExportableActivities(@Param("userId") String userId,
                                            @Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime);

    /**
     * 首页活动查询（含公开 + 与用户相关的私密活动）
     */
    @Query(
            value = """
                    SELECT DISTINCT a.*
                    FROM activities a
                    LEFT JOIN registrations r
                      ON a.id = r.activity_id
                     AND r.user_id = :userId
                     AND r.status IN ('approved','pending')
                    WHERE a.is_deleted = false
                      AND a.status = :status
                      AND a.end_time >= :endAfter
                      AND (
                        a.is_public = true
                        OR (
                          a.is_public = false
                          AND (
                            a.organizer_id = :userId
                            OR (a.administrators IS NOT NULL AND JSON_CONTAINS(a.administrators, JSON_QUOTE(:userId)))
                            OR r.id IS NOT NULL
                          )
                        )
                      )
                    ORDER BY a.start_time ASC
                    """,
            countQuery = """
                    SELECT COUNT(DISTINCT a.id)
                    FROM activities a
                    LEFT JOIN registrations r
                      ON a.id = r.activity_id
                     AND r.user_id = :userId
                     AND r.status IN ('approved','pending')
                    WHERE a.is_deleted = false
                      AND a.status = :status
                      AND a.end_time >= :endAfter
                      AND (
                        a.is_public = true
                        OR (
                          a.is_public = false
                          AND (
                            a.organizer_id = :userId
                            OR (a.administrators IS NOT NULL AND JSON_CONTAINS(a.administrators, JSON_QUOTE(:userId)))
                            OR r.id IS NOT NULL
                          )
                        )
                      )
                    """,
            nativeQuery = true
    )
    Page<Activity> findHomeActivities(@Param("userId") String userId,
                                      @Param("status") String status,
                                      @Param("endAfter") LocalDateTime endAfter,
                                      Pageable pageable);

    /**
     * 首页公开活动查询
     */
    @Query(
            value = """
                    SELECT a.*
                    FROM activities a
                    WHERE a.is_deleted = false
                      AND a.status = :status
                      AND a.is_public = true
                      AND a.end_time >= :endAfter
                    ORDER BY a.start_time ASC
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM activities a
                    WHERE a.is_deleted = false
                      AND a.status = :status
                      AND a.is_public = true
                      AND a.end_time >= :endAfter
                    """,
            nativeQuery = true
    )
    Page<Activity> findHomePublicActivities(@Param("status") String status,
                                            @Param("endAfter") LocalDateTime endAfter,
                                            Pageable pageable);

    /**
     * 按时间范围查询活动（用于定时通知）
     */
    List<Activity> findByIsDeletedFalseAndStartTimeBetween(LocalDateTime from, LocalDateTime to);

    /**
     * 按时间范围查询活动（用于定时通知）
     */
    List<Activity> findByIsDeletedFalseAndEndTimeBetween(LocalDateTime from, LocalDateTime to);

    /**
     * 按时间范围查询活动（用于定时通知）
     */
    List<Activity> findByIsDeletedFalseAndRegisterDeadlineBetween(LocalDateTime from, LocalDateTime to);
}
