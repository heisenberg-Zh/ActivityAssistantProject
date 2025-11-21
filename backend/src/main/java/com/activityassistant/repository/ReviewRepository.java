package com.activityassistant.repository;

import com.activityassistant.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 评价数据访问层
 *
 * @author Claude
 * @since 2025-01-20
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, String>, JpaSpecificationExecutor<Review> {

    /**
     * 根据活动ID和用户ID查询评价（查找用户对该活动的评价）
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 评价记录
     */
    Optional<Review> findByActivityIdAndUserIdAndIsDeletedFalse(String activityId, String userId);

    /**
     * 检查用户是否已评价活动
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 是否已评价
     */
    boolean existsByActivityIdAndUserIdAndIsDeletedFalse(String activityId, String userId);

    /**
     * 根据活动ID查询所有评价（分页，不包含已删除）
     *
     * @param activityId 活动ID
     * @param pageable   分页参数
     * @return 评价列表
     */
    Page<Review> findByActivityIdAndIsDeletedFalse(String activityId, Pageable pageable);

    /**
     * 根据活动ID和评分查询评价（分页，不包含已删除）
     *
     * @param activityId 活动ID
     * @param rating     评分
     * @param pageable   分页参数
     * @return 评价列表
     */
    Page<Review> findByActivityIdAndRatingAndIsDeletedFalse(String activityId, Integer rating, Pageable pageable);

    /**
     * 统计活动的总评价数（不包含已删除）
     *
     * @param activityId 活动ID
     * @return 评价总数
     */
    long countByActivityIdAndIsDeletedFalse(String activityId);

    /**
     * 统计活动各星级评价数量（不包含已删除）
     *
     * @param activityId 活动ID
     * @param rating     评分
     * @return 该星级评价数量
     */
    long countByActivityIdAndRatingAndIsDeletedFalse(String activityId, Integer rating);

    /**
     * 计算活动的平均评分（不包含已删除）
     *
     * @param activityId 活动ID
     * @return 平均评分
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.activityId = :activityId AND r.isDeleted = false")
    Double getAverageRatingByActivityId(@Param("activityId") String activityId);

    /**
     * 统计用户的评价总数（不包含已删除）
     *
     * @param userId 用户ID
     * @return 评价总数
     */
    long countByUserIdAndIsDeletedFalse(String userId);

    /**
     * 根据用户ID查询评价列表（分页，不包含已删除）
     *
     * @param userId   用户ID
     * @param pageable 分页参数
     * @return 评价列表
     */
    Page<Review> findByUserIdAndIsDeletedFalse(String userId, Pageable pageable);

    /**
     * 查询活动的所有评价（包含已删除，管理员查看用）
     *
     * @param activityId 活动ID
     * @param pageable   分页参数
     * @return 评价列表
     */
    Page<Review> findByActivityId(String activityId, Pageable pageable);
}
