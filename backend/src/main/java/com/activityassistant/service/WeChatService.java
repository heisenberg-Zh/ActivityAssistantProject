package com.activityassistant.service;

import com.activityassistant.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 微信服务
 * 处理微信小程序登录相关逻辑
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@Service
public class WeChatService {

    @Value("${app.wechat.app-id}")
    private String appId;

    @Value("${app.wechat.app-secret}")
    private String appSecret;

    @Value("${app.wechat.mock-login-enabled:false}")
    private boolean mockLoginEnabled;

    /**
     * 通过code获取微信OpenID
     * 开发环境：如果code="test_code_dev"，则返回模拟OpenID
     * 生产环境：调用微信API获取真实OpenID
     *
     * @param code 微信登录code
     * @return OpenID
     */
    public String getOpenIdByCode(String code) {
        // 开发环境模拟登录
        if (mockLoginEnabled && "test_code_dev".equals(code)) {
            log.info("开发环境模拟登录，返回模拟OpenID");
            return "mock_openid_u1"; // 对应测试数据中的第一个用户
        }

        // 生产环境：调用微信API
        // URL: https://api.weixin.qq.com/sns/jscode2session
        // 参数: appid, secret, js_code, grant_type=authorization_code
        // 返回: { "openid": "xxx", "session_key": "xxx", "unionid": "xxx" }

        // TODO: 实现真实的微信登录逻辑（后续接入真实环境时实现）
        log.warn("生产环境微信登录尚未实现，请配置mock-login-enabled=true");
        throw new BusinessException(5001, "微信登录功能未启用，请联系管理员");
    }

    /**
     * 验证手机号（微信手机号快速验证）
     * 开发环境：暂不实现
     * 生产环境：调用微信API验证
     *
     * @param code 手机号验证code
     * @return 手机号
     */
    public String getPhoneNumber(String code) {
        // TODO: 实现微信手机号验证
        throw new BusinessException(5003, "手机号验证功能暂未开放");
    }
}
