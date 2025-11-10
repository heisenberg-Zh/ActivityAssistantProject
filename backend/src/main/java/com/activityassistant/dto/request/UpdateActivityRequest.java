package com.activityassistant.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 更新活动请求DTO
 *
 * @author Claude
 * @since 2025-11-10
 */
@Data
public class UpdateActivityRequest {

    /**
     * 活动标题
     */
    @Size(max = 200, message = "活动标题长度不能超过200个字符")
    private String title;

    /**
     * 活动描述
     */
    private String description;

    /**
     * 活动类型：运动/聚会/培训/户外
     */
    private String type;

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 报名截止时间
     */
    private LocalDateTime registerDeadline;

    /**
     * 地点名称
     */
    private String place;

    /**
     * 详细地址
     */
    private String address;

    /**
     * 纬度
     */
    @DecimalMin(value = "-90.0", message = "纬度范围:-90~90")
    @DecimalMax(value = "90.0", message = "纬度范围:-90~90")
    private BigDecimal latitude;

    /**
     * 经度
     */
    @DecimalMin(value = "-180.0", message = "经度范围:-180~180")
    @DecimalMax(value = "180.0", message = "经度范围:-180~180")
    private BigDecimal longitude;

    /**
     * 签到范围（米）
     */
    @Min(value = 50, message = "签到范围至少50米")
    @Max(value = 5000, message = "签到范围最多5000米")
    private Integer checkinRadius;

    /**
     * 总人数上限
     */
    @Min(value = 1, message = "总人数上限至少为1")
    @Max(value = 10000, message = "总人数上限最多为10000")
    private Integer total;

    /**
     * 最小人数
     */
    @Min(value = 1, message = "最小人数至少为1")
    private Integer minParticipants;

    /**
     * 费用
     */
    @DecimalMin(value = "0.0", message = "费用不能为负数")
    private BigDecimal fee;

    /**
     * 费用类型：free/AA/uniform
     */
    private String feeType;

    /**
     * 是否需要审核
     */
    private Boolean needReview;

    /**
     * 是否公开
     */
    private Boolean isPublic;

    /**
     * 分组数据（JSON字符串）
     */
    private String groups;

    /**
     * 白名单（JSON字符串）
     */
    private String whitelist;

    /**
     * 黑名单（JSON字符串）
     */
    private String blacklist;

    /**
     * 自定义字段（JSON字符串）
     */
    private String customFields;
}
