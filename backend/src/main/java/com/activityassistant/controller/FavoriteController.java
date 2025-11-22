package com.activityassistant.controller;

import com.activityassistant.dto.request.FavoriteRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.FavoriteVO;
import com.activityassistant.model.Favorite;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 收藏控制器
 * 处理收藏相关接口
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "收藏接口", description = "收藏管理相关接口")
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * 添加收藏
     *
     * @param request 收藏请求（包含activityId）
     * @return 成功响应
     */
    @PostMapping
    @Operation(summary = "添加收藏", description = "将活动添加到我的收藏")
    public ApiResponse<Void> addFavorite(@RequestBody FavoriteRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        log.info("添加收藏，userId={}, activityId={}", userId, request.getActivityId());

        favoriteService.addFavorite(userId, request.getActivityId());
        return ApiResponse.success(null, "收藏成功");
    }

    /**
     * 取消收藏
     *
     * @param activityId 活动ID
     * @return 成功响应
     */
    @DeleteMapping("/{activityId}")
    @Operation(summary = "取消收藏", description = "从我的收藏中移除活动")
    public ApiResponse<Void> removeFavorite(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String userId = SecurityUtils.getCurrentUserId();
        log.info("取消收藏，userId={}, activityId={}", userId, activityId);

        favoriteService.removeFavorite(userId, activityId);
        return ApiResponse.success(null, "取消收藏成功");
    }

    /**
     * 检查是否已收藏
     *
     * @param activityId 活动ID
     * @return 是否已收藏
     */
    @GetMapping("/check")
    @Operation(summary = "检查是否已收藏", description = "检查指定活动是否已收藏")
    public ApiResponse<Map<String, Boolean>> checkFavorited(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @RequestParam String activityId) {

        String userId = SecurityUtils.getCurrentUserId();
        boolean favorited = favoriteService.isFavorited(userId, activityId);

        Map<String, Boolean> result = new HashMap<>();
        result.put("favorited", favorited);
        return ApiResponse.success(result);
    }

    /**
     * 获取我的收藏列表（分页）
     *
     * @param page 页码（从0开始）
     * @param size 每页数量
     * @return 收藏分页列表
     */
    @GetMapping("/my")
    @Operation(summary = "获取我的收藏列表", description = "获取当前用户的收藏列表，支持分页")
    public ApiResponse<Page<FavoriteVO>> getMyFavorites(
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "每页数量", example = "20")
            @RequestParam(value = "size", defaultValue = "20") int size) {

        String userId = SecurityUtils.getCurrentUserId();
        log.info("获取用户收藏列表，userId={}, page={}, size={}", userId, page, size);

        Page<FavoriteVO> favorites = favoriteService.getMyFavorites(userId, page, size);
        return ApiResponse.success(favorites);
    }
}
