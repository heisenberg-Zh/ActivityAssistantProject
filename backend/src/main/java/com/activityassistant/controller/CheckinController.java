package com.activityassistant.controller;

import com.activityassistant.dto.request.CreateCheckinRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.CheckinVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.CheckinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 签到控制器
 *
 * @author Claude
 * @since 2025-11-11
 */
@Slf4j
@RestController
@RequestMapping("/api/checkins")
@Tag(name = "签到管理", description = "签到相关接口")
public class CheckinController {

    @Autowired
    private CheckinService checkinService;

    /**
     * 提交签到
     *
     * @param request 创建签到请求
     * @return 签到详情
     */
    @PostMapping
    @Operation(summary = "提交签到", description = "用户签到（需验证GPS位置）")
    public ApiResponse<CheckinVO> createCheckin(@Valid @RequestBody CreateCheckinRequest request) {
        log.info("收到提交签到请求，活动ID: {}", request.getActivityId());
        String userId = SecurityUtils.getCurrentUserId();
        CheckinVO checkin = checkinService.createCheckin(request, userId);
        return ApiResponse.success(checkin, "签到成功");
    }

    /**
     * 查询活动的签到记录（组织者/管理员）
     *
     * @param activityId 活动ID
     * @param page       页码
     * @param size       每页数量
     * @return 签到记录列表（分页）
     */
    @GetMapping("/activity/{activityId}")
    @Operation(summary = "查询活动签到记录", description = "查询活动的所有签到记录（仅组织者/管理员）")
    public ApiResponse<Page<CheckinVO>> getActivityCheckins(
            @PathVariable String activityId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询活动签到记录请求，活动ID: {}", activityId);
        String userId = SecurityUtils.getCurrentUserId();
        Page<CheckinVO> checkinPage = checkinService.getActivityCheckins(activityId, page, size, userId);
        return ApiResponse.success(checkinPage);
    }

    /**
     * 查询我的签到记录
     *
     * @param page 页码
     * @param size 每页数量
     * @return 签到记录列表（分页）
     */
    @GetMapping("/my")
    @Operation(summary = "查询我的签到记录", description = "查询当前用户的所有签到记录")
    public ApiResponse<Page<CheckinVO>> getMyCheckins(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询我的签到记录请求");
        String userId = SecurityUtils.getCurrentUserId();
        Page<CheckinVO> checkinPage = checkinService.getMyCheckins(userId, page, size);
        return ApiResponse.success(checkinPage);
    }

    /**
     * 查询签到详情
     *
     * @param id 签到ID
     * @return 签到详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "查询签到详情", description = "根据签到ID查询详情")
    public ApiResponse<CheckinVO> getCheckinDetail(@PathVariable String id) {
        log.info("收到查询签到详情请求，签到ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        CheckinVO checkin = checkinService.getCheckinDetail(id, userId);
        return ApiResponse.success(checkin);
    }
}
