package com.activityassistant.service;

import com.activityassistant.dto.response.FavoriteVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Favorite;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.FavoriteRepository;
import com.activityassistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.activityassistant.constant.ErrorCode.FAVORITE_ALREADY_EXISTS;

/**
 * 收藏服务
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    /**
     * 添加收藏
     *
     * @param userId     用户ID
     * @param activityId 活动ID
     * @return 收藏记录
     */
    @Transactional
    public Favorite addFavorite(String userId, String activityId) {
        log.info("添加收藏，userId={}, activityId={}", userId, activityId);

        // 验证活动是否存在
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 检查是否已收藏
        if (favoriteRepository.existsByUserIdAndActivityId(userId, activityId)) {
            throw new BusinessException(FAVORITE_ALREADY_EXISTS, "已收藏该活动");
        }

        // 创建收藏记录
        Favorite favorite = Favorite.builder()
                .userId(userId)
                .activityId(activityId)
                .build();

        return favoriteRepository.save(favorite);
    }

    /**
     * 取消收藏
     *
     * @param userId     用户ID
     * @param activityId 活动ID
     */
    @Transactional
    public void removeFavorite(String userId, String activityId) {
        log.info("取消收藏，userId={}, activityId={}", userId, activityId);

        // 查找收藏记录
        Favorite favorite = favoriteRepository.findByUserIdAndActivityId(userId, activityId)
                .orElseThrow(() -> new NotFoundException("收藏记录不存在"));

        favoriteRepository.delete(favorite);
    }

    /**
     * 检查是否已收藏
     *
     * @param userId     用户ID
     * @param activityId 活动ID
     * @return 是否已收藏
     */
    public boolean isFavorited(String userId, String activityId) {
        return favoriteRepository.existsByUserIdAndActivityId(userId, activityId);
    }

    /**
     * 获取我的收藏列表（分页）
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 收藏分页列表
     */
    public Page<FavoriteVO> getMyFavorites(String userId, int page, int size) {
        log.info("获取用户收藏列表，userId={}, page={}, size={}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<Favorite> favoritePage = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return favoritePage.map(this::toFavoriteVO);
    }

    /**
     * 转换为VO（包含活动信息）
     */
    private FavoriteVO toFavoriteVO(Favorite favorite) {
        Activity activity = activityRepository.findById(favorite.getActivityId())
                .orElse(null);

        if (activity == null) {
            // 活动已被删除
            return FavoriteVO.builder()
                    .id(favorite.getId())
                    .activityId(favorite.getActivityId())
                    .activityTitle("活动已删除")
                    .activityStatus("deleted")
                    .createdAt(favorite.getCreatedAt().toString())
                    .build();
        }

        // 获取组织者信息
        User organizer = userRepository.findById(activity.getOrganizerId())
                .orElse(null);

        return FavoriteVO.builder()
                .id(favorite.getId())
                .activityId(activity.getId())
                .activityTitle(activity.getTitle())
                .activityDescription(activity.getDescription())
                .activityType(activity.getType())
                .activityStatus(activity.getStatus())
                .startTime(activity.getStartTime().toString())
                .endTime(activity.getEndTime().toString())
                .place(activity.getPlace())
                .organizerId(activity.getOrganizerId())
                .organizerName(organizer != null ? organizer.getNickname() : "未知")
                .joined(activity.getJoined())
                .total(activity.getTotal())
                .createdAt(favorite.getCreatedAt().toString())
                .build();
    }
}
