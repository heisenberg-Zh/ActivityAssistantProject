package com.activityassistant.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI 配置类
 *
 * <p>生成在线 API 文档，方便前端开发和接口测试
 * 访问地址：http://localhost:8080/swagger-ui.html
 *
 * @author Claude
 * @since 2025-01-08
 */
@Configuration
public class SwaggerConfig {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${server.port}")
    private String serverPort;

    /**
     * 配置 OpenAPI 文档信息
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // 服务器配置
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("本地开发环境"),
                        new Server()
                                .url("https://api.yourdomain.com")
                                .description("生产环境（待部署）")
                ))

                // 项目信息
                .info(new Info()
                        .title("ActivityAssistant API 文档")
                        .description("活动助手微信小程序后端接口文档\n\n" +
                                "**核心功能**：\n" +
                                "- 微信登录认证\n" +
                                "- 活动管理（创建、编辑、删除）\n" +
                                "- 报名管理（报名、审核、取消）\n" +
                                "- 签到管理（GPS 定位签到）\n" +
                                "- 数据统计（报名统计、签到率）\n\n" +
                                "**技术栈**：Java 17 + Spring Boot 3.2 + MySQL 8.0")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("项目负责人")
                                .email("support@activityassistant.com")
                                .url("https://github.com/yourusername/ActivityAssistant"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))

                // JWT 认证配置
                .components(new Components()
                        .addSecuritySchemes("Bearer Token", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("请在下方输入JWT Token（登录接口返回），无需添加 'Bearer ' 前缀")))

                // 全局应用 JWT 认证（除了登录接口）
                .addSecurityItem(new SecurityRequirement().addList("Bearer Token"));
    }
}
