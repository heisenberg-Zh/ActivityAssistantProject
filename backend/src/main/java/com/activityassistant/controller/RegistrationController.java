package com.activityassistant.controller;

import com.activityassistant.dto.request.ApproveRegistrationRequest;
import com.activityassistant.dto.request.CreateRegistrationRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.RegistrationVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.AppFeatureConfigService;
import com.activityassistant.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

/**
 * 报名相关接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/registrations")
@Tag(name = "报名管理", description = "报名相关接口")
public class RegistrationController {

    private static final String REVIEW_MODE_REGISTER_MESSAGE = "审核模式已开启，当前版本暂不开放在线报名";
    private static final String REVIEW_MODE_REGISTRATION_MESSAGE = "审核模式已开启，暂不展示报名信息";

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private AppFeatureConfigService appFeatureConfigService;

    @PostMapping
    @Operation(summary = "创建报名", description = "用户报名参加活动")
    public ApiResponse<RegistrationVO> createRegistration(@Valid @RequestBody CreateRegistrationRequest request) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_REGISTER_MESSAGE);
        }
        log.info("收到创建报名请求，活动ID: {}", request.getActivityId());
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.createRegistration(request, userId);
        return ApiResponse.success(registration);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "取消/移除报名", description = "报名者取消报名；创建者或管理员移除报名")
    public ApiResponse<String> cancelOrRemoveRegistration(@PathVariable String id) {
        log.info("收到取消/移除报名请求，报名ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        String action = registrationService.cancelRegistration(id, userId);
        String message = "removed".equals(action) ? "已移除报名" : "已取消报名";
        return ApiResponse.success(message);
    }

    @GetMapping("/activity/{activityId}")
    @Operation(summary = "查询活动报名列表", description = "创建者/管理员查看活动报名信息")
    public ApiResponse<Page<RegistrationVO>> getActivityRegistrations(
            @PathVariable String activityId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_REGISTRATION_MESSAGE);
        }
        log.info("收到查询活动报名列表请求，活动ID: {}, 状态: {}", activityId, status);
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        Page<RegistrationVO> registrationPage = registrationService.getActivityRegistrations(activityId, status, page, size, userId);
        return ApiResponse.success(registrationPage);
    }

    @GetMapping("/series/{seriesId}/latest")
    @Operation(summary = "查询系列活动最新报名", description = "查询当前用户在系列活动中的最近一次报名信息")
    public ApiResponse<RegistrationVO> getLatestRegistrationBySeries(@PathVariable String seriesId) {
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.getLatestRegistrationBySeries(seriesId, userId);
        return ApiResponse.success(registration);
    }

    @GetMapping("/my")
    @Operation(summary = "查询我的报名列表", description = "查询当前用户的报名记录")
    public ApiResponse<Page<RegistrationVO>> getMyRegistrations(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        log.info("收到查询我的报名列表请求");
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId == null) {
            return ApiResponse.success(new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), 0));
        }
        Page<RegistrationVO> registrationPage = registrationService.getUserRegistrations(userId, status, page, size);
        return ApiResponse.success(registrationPage);
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询报名详情", description = "报名者本人或创建者/管理员可查看报名详情")
    public ApiResponse<RegistrationVO> getRegistrationDetail(@PathVariable String id) {
        log.info("收到查询报名详情请求，报名ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.getRegistrationDetail(id, userId);
        return ApiResponse.success(registration);
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "审核报名", description = "创建者或管理员审核报名申请")
    public ApiResponse<RegistrationVO> approveRegistration(
            @PathVariable String id,
            @Valid @RequestBody ApproveRegistrationRequest request
    ) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_REGISTRATION_MESSAGE);
        }
        log.info("收到审核报名请求，报名ID: {}, 审核结果: {}", id, request.getApproved());
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.approveRegistration(id, request, userId);
        return ApiResponse.success(registration);
    }
}
