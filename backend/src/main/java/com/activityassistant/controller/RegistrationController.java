package com.activityassistant.controller;

import com.activityassistant.dto.request.ApproveRegistrationRequest;
import com.activityassistant.dto.request.CreateRegistrationRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.RegistrationVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 报名控制器
 *
 * @author Claude
 * @since 2025-11-11
 */
@Slf4j
@RestController
@RequestMapping("/api/registrations")
@Tag(name = "报名管理", description = "报名相关接口")
public class RegistrationController {

    @Autowired
    private RegistrationService registrationService;

    /**
     * 创建报名
     *
     * @param request 创建报名请求
     * @return 报名详情
     */
    @PostMapping
    @Operation(summary = "创建报名", description = "用户报名参加活动")
    public ApiResponse<RegistrationVO> createRegistration(@Valid @RequestBody CreateRegistrationRequest request) {
        log.info("收到创建报名请求，活动ID: {}", request.getActivityId());
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.createRegistration(request, userId);
        return ApiResponse.success(registration);
    }

    /**
     * 取消报名
     *
     * @param id 报名ID
     * @return 成功消息
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "取消报名", description = "取消已报名的活动")
    public ApiResponse<String> cancelRegistration(@PathVariable String id) {
        log.info("收到取消报名请求，报名ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        registrationService.cancelRegistration(id, userId);
        return ApiResponse.success("报名取消成功");
    }

    /**
     * 查询活动的报名列表（组织者/管理员）
     *
     * @param activityId 活动ID
     * @param status     报名状态（可选）
     * @param page       页码
     * @param size       每页数量
     * @return 报名列表（分页）
     */
    @GetMapping("/activity/{activityId}")
    @Operation(summary = "查询活动报名列表", description = "查询活动的所有报名记录（仅组织者）")
    public ApiResponse<Page<RegistrationVO>> getActivityRegistrations(
            @PathVariable String activityId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询活动报名列表请求，活动ID: {}, 状态: {}", activityId, status);
        String userId = SecurityUtils.getCurrentUserId();
        Page<RegistrationVO> registrationPage = registrationService.getActivityRegistrations(
                activityId, status, page, size, userId);
        return ApiResponse.success(registrationPage);
    }

    /**
     * 查询我的报名列表
     *
     * @param status 报名状态（可选）
     * @param page   页码
     * @param size   每页数量
     * @return 报名列表（分页）
     */
    @GetMapping("/my")
    @Operation(summary = "查询我的报名列表", description = "查询当前用户的所有报名记录")
    public ApiResponse<Page<RegistrationVO>> getMyRegistrations(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询我的报名列表请求");
        String userId = SecurityUtils.getCurrentUserId();
        Page<RegistrationVO> registrationPage = registrationService.getUserRegistrations(
                userId, status, page, size);
        return ApiResponse.success(registrationPage);
    }

    /**
     * 查询报名详情
     *
     * @param id 报名ID
     * @return 报名详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "查询报名详情", description = "根据报名ID查询详情")
    public ApiResponse<RegistrationVO> getRegistrationDetail(@PathVariable String id) {
        log.info("收到查询报名详情请求，报名ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.getRegistrationDetail(id, userId);
        return ApiResponse.success(registration);
    }

    /**
     * 审核报名
     *
     * @param id      报名ID
     * @param request 审核请求
     * @return 报名详情
     */
    @PutMapping("/{id}/approve")
    @Operation(summary = "审核报名", description = "审核报名申请（仅组织者/管理员）")
    public ApiResponse<RegistrationVO> approveRegistration(
            @PathVariable String id,
            @Valid @RequestBody ApproveRegistrationRequest request) {
        log.info("收到审核报名请求，报名ID: {}, 审核结果: {}", id, request.getApproved());
        String userId = SecurityUtils.getCurrentUserId();
        RegistrationVO registration = registrationService.approveRegistration(id, request, userId);
        return ApiResponse.success(registration);
    }
}
