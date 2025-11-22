package com.activityassistant.controller;

import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.MessageVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 消息控制器
 * 处理消息相关接口
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "消息接口", description = "消息管理相关接口")
public class MessageController {

    private final MessageService messageService;

    /**
     * 获取我的消息列表（分页）
     *
     * @param page     页码（从0开始）
     * @param size     每页数量
     * @param category 消息类别（可选：all, publish, system, activity, signup）
     * @return 消息分页列表
     */
    @GetMapping("/my")
    @Operation(summary = "获取我的消息列表", description = "获取当前用户的消息列表，支持分页和分类筛选")
    public ApiResponse<Page<MessageVO>> getMyMessages(
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "每页数量", example = "20")
            @RequestParam(value = "size", defaultValue = "20") int size,
            @Parameter(description = "消息类别（可选）", example = "all")
            @RequestParam(value = "category", required = false) String category) {

        String userId = SecurityUtils.getCurrentUserId();
        log.info("获取用户消息列表，userId={}, page={}, size={}, category={}", userId, page, size, category);

        Page<MessageVO> messages = messageService.getMyMessages(userId, page, size, category);
        return ApiResponse.success(messages);
    }

    /**
     * 标记消息为已读
     *
     * @param messageId 消息ID
     * @return 成功响应
     */
    @PutMapping("/{messageId}/read")
    @Operation(summary = "标记消息为已读", description = "将指定消息标记为已读状态")
    public ApiResponse<Void> markAsRead(
            @Parameter(description = "消息ID", example = "msg001")
            @PathVariable String messageId) {

        String userId = SecurityUtils.getCurrentUserId();
        log.info("标记消息为已读，messageId={}, userId={}", messageId, userId);

        messageService.markAsRead(messageId, userId);
        return ApiResponse.success(null, "标记成功");
    }

    /**
     * 批量标记所有消息为已读
     *
     * @return 成功响应
     */
    @PutMapping("/mark-all-read")
    @Operation(summary = "批量标记所有消息为已读", description = "将当前用户的所有未读消息标记为已读")
    public ApiResponse<Void> markAllAsRead() {
        String userId = SecurityUtils.getCurrentUserId();
        log.info("批量标记所有消息为已读，userId={}", userId);

        int count = messageService.markAllAsRead(userId);
        return ApiResponse.success(null, "已标记" + count + "条消息为已读");
    }

    /**
     * 删除消息
     *
     * @param messageId 消息ID
     * @return 成功响应
     */
    @DeleteMapping("/{messageId}")
    @Operation(summary = "删除消息", description = "删除指定的消息")
    public ApiResponse<Void> deleteMessage(
            @Parameter(description = "消息ID", example = "msg001")
            @PathVariable String messageId) {

        String userId = SecurityUtils.getCurrentUserId();
        log.info("删除消息，messageId={}, userId={}", messageId, userId);

        messageService.deleteMessage(messageId, userId);
        return ApiResponse.success(null, "删除成功");
    }

    /**
     * 获取未读消息数量
     *
     * @return 未读消息数量
     */
    @GetMapping("/unread-count")
    @Operation(summary = "获取未读消息数量", description = "获取当前用户的未读消息数量")
    public ApiResponse<Long> getUnreadCount() {
        String userId = SecurityUtils.getCurrentUserId();
        long count = messageService.getUnreadCount(userId);
        return ApiResponse.success(count);
    }
}
