package com.activityassistant.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 微信登录响应
 * 微信API返回格式
 *
 * @author Claude
 * @since 2025-12-03
 */
@Data
public class WeChatLoginResponse {

    /**
     * 用户唯一标识（OpenID）
     */
    @JsonProperty("openid")
    private String openid;

    /**
     * 会话密钥
     */
    @JsonProperty("session_key")
    private String sessionKey;

    /**
     * 用户在开放平台的唯一标识符（UnionID）
     * 在满足UnionID下发条件的情况下会返回
     */
    @JsonProperty("unionid")
    private String unionid;

    /**
     * 错误码
     * 0: 请求成功
     * -1: 系统繁忙
     * 40029: code无效
     * 45011: 频率限制
     */
    @JsonProperty("errcode")
    private Integer errcode;

    /**
     * 错误信息
     */
    @JsonProperty("errmsg")
    private String errmsg;

    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return errcode == null || errcode == 0;
    }
}
