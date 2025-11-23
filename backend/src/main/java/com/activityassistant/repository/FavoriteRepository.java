package com.activityassistant.repository;

import com.activityassistant.model.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 收藏数据访问层
 *
 * @author Claude
 * @since 2025-01-22
 */
@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /**
     * 根据用户ID和活动ID查找收藏记录
     *
     * @param userId     用户ID
     * @param activityId 活动ID
     * @return 收藏记录（可能不存在）
     */
    Optional<Favorite> findByUserIdAndActivityId(String userId, String activityId);

    /**
     * 检查是否已收藏
     *
     * @param userId     用户ID
     * @param activityId 活动ID
     * @return 是否已收藏
     */
    boolean existsByUserIdAndActivityId(String userId, String activityId);

    /**
     * 根据用户ID和活动ID删除收藏
     *
     * @param userId     用户ID
     * @param activityId 活动ID
     */
    void deleteByUserIdAndActivityId(String userId, String activityId);

    /**
     * 根据用户ID查找收藏列表（分页）
     *
     * @param userId   用户ID
     * @param pageable 分页参数
     * @return 收藏分页列表
     */
    Page<Favorite> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * 根据活动ID删除所有收藏（活动删除时级联删除）
     *
     * @param activityId 活动ID
     */
    void deleteByActivityId(String activityId);

    /**
     * 根据用户ID删除所有收藏
     *
     * @param userId 用户ID
     */
    void deleteByUserId(String userId);

    /**
     * 统计活动被收藏次数
     *
     * @param activityId 活动ID
     * @return 收藏次数
     */
    long countByActivityId(String activityId);
}
