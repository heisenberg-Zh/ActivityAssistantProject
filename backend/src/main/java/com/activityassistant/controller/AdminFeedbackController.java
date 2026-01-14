package com.activityassistant.controller;

import com.activityassistant.dto.request.UpdateFeedbackAdminRequest;
import com.activityassistant.dto.response.AdminFeedbackVO;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.AdminFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * 系统管理员 - 反馈管理接口
 */
@RestController
@RequestMapping("/api/admin/feedback")
@RequiredArgsConstructor
@Tag(name = "系统管理员-反馈管理", description = "仅系统管理员可查看/处理用户反馈")
public class AdminFeedbackController {

    private final AdminFeedbackService adminFeedbackService;

    @GetMapping
    @Operation(summary = "分页查询反馈列表", description = "支持按状态/类型/关键词过滤")
    public ApiResponse<Page<AdminFeedbackVO>> list(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword
    ) {
        String userId = SecurityUtils.getCurrentUserId();
        Page<AdminFeedbackVO> data = adminFeedbackService.list(userId, status, type, keyword, page, size);
        return ApiResponse.success(data);
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询反馈详情")
    public ApiResponse<AdminFeedbackVO> detail(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(adminFeedbackService.getDetail(userId, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新反馈状态/处理备注")
    public ApiResponse<AdminFeedbackVO> update(@PathVariable Long id, @Valid @RequestBody UpdateFeedbackAdminRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(adminFeedbackService.update(userId, id, request));
    }
}
