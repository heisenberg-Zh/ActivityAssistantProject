package com.activityassistant.service;

import com.activityassistant.dto.WeChatLoginResponse;
import com.activityassistant.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

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

    private final RestTemplate restTemplate;

    /**
     * 构造函数
     * 配置 RestTemplate 支持 text/plain 类型的 JSON 响应（微信 API 返回 Content-Type: text/plain）
     */
    public WeChatService() {
        this.restTemplate = new RestTemplate();

        // 添加支持 text/plain 的 JSON 转换器
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(Arrays.asList(
            MediaType.APPLICATION_JSON,
            MediaType.TEXT_PLAIN  // 支持微信 API 的 text/plain 响应
        ));

        this.restTemplate.getMessageConverters().add(0, converter);
    }

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

        // ============================================
        // 生产环境：调用微信API获取真实OpenID
        // ============================================
        log.info("生产环境：调用微信API获取OpenID");

        try {
            // 构建微信API URL
            String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                appId, appSecret, code
            );

            log.debug("调用微信API: {}", url.replace(appSecret, "***"));

            // 调用微信API
            WeChatLoginResponse response = restTemplate.getForObject(url, WeChatLoginResponse.class);

            // 检查响应
            if (response == null) {
                log.error("微信API返回空响应");
                throw new BusinessException(5002, "微信登录失败：服务器无响应");
            }

            log.info("微信API响应: errcode={}, errmsg={}, openid存在={}",
                response.getErrcode(), response.getErrmsg(), response.getOpenid() != null);

            // 检查是否成功
            if (response.isSuccess() && response.getOpenid() != null) {
                log.info("微信登录成功，openid={}", response.getOpenid());
                return response.getOpenid();
            } else {
                // 微信API返回错误
                String errorMsg = response.getErrmsg() != null ? response.getErrmsg() : "未知错误";
                Integer errorCode = response.getErrcode() != null ? response.getErrcode() : -1;

                log.error("微信登录失败：errcode={}, errmsg={}", errorCode, errorMsg);

                // 根据错误码返回友好提示
                String userMessage = switch (errorCode) {
                    case 40029 -> "登录code无效，请重新授权登录";
                    case 45011 -> "登录请求过于频繁，请稍后重试";
                    case 40163 -> "微信配置错误，请联系管理员";
                    case -1 -> "微信服务繁忙，请稍后重试";
                    default -> "微信登录失败：" + errorMsg;
                };

                throw new BusinessException(5002, userMessage);
            }

        } catch (BusinessException e) {
            // 业务异常直接抛出
            throw e;
        } catch (Exception e) {
            // 其他异常（网络错误、超时等）
            log.error("调用微信API失败", e);
            throw new BusinessException(5001, "微信登录失败，网络连接异常，请检查网络后重试");
        }
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
