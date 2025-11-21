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
     * 开发环境：所有code都返回模拟OpenID（支持微信授权登录测试）
     * 生产环境：调用微信API获取真实OpenID
     *
     * @param code 微信登录code
     * @return OpenID
     */
    public String getOpenIdByCode(String code) {
        log.info("收到微信登录请求，code={}, mockLoginEnabled={}", code, mockLoginEnabled);

        // 开发环境模拟登录（所有code都返回模拟OpenID）
        if (mockLoginEnabled) {
            log.info("开发环境模拟登录，返回模拟OpenID");

            // 支持多个测试用户
            if ("test_code_dev".equals(code)) {
                return "mock_openid_u1"; // 默认测试用户
            } else if ("test_code_organizer".equals(code)) {
                return "openid_u1"; // 组织者用户
            } else {
                // 其他所有code（包括真实的微信code）都返回mock_openid_u1
                log.info("开发环境：将真实微信code转换为模拟OpenID");
                return "mock_openid_u1";
            }
        }

        // 生产环境：调用微信API
        // URL: https://api.weixin.qq.com/sns/jscode2session
        // 参数: appid, secret, js_code, grant_type=authorization_code
        // 返回: { "openid": "xxx", "session_key": "xxx", "unionid": "xxx" }

        log.warn("生产环境微信登录尚未实现，code={}", code);

        // TODO: 实现真实的微信登录逻辑
        /*
        try {
            String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                appId, appSecret, code
            );

            // 调用微信API
            RestTemplate restTemplate = new RestTemplate();
            WeChatLoginResponse response = restTemplate.getForObject(url, WeChatLoginResponse.class);

            if (response != null && response.getOpenid() != null) {
                return response.getOpenid();
            } else {
                throw new BusinessException(5002, "微信登录失败：" + response.getErrmsg());
            }
        } catch (Exception e) {
            log.error("调用微信API失败", e);
            throw new BusinessException(5001, "微信登录失败，请稍后重试");
        }
        */

        throw new BusinessException(5001, "微信登录功能未启用，请在配置文件中设置 app.wechat.mock-login-enabled=true");
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
