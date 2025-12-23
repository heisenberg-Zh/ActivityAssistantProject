package com.activityassistant.config;

import com.activityassistant.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 配置
 * 配置认证、授权、CORS等安全策略
 *
 * @author Claude
 * @since 2025-01-08
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * 允许的CORS来源（从配置文件读取）
     * 开发环境：* （允许所有）
     * 生产环境：具体的域名列表
     */
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * 安全过滤链配置
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 禁用CSRF（使用JWT不需要CSRF保护）
                .csrf(AbstractHttpConfigurer::disable)

                // 配置CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 配置Session管理（无状态，使用JWT）
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 配置授权规则
                .authorizeHttpRequests(auth -> auth
                        // 公开接口（不需要认证）
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/health").permitAll()

                        // Swagger文档（开发环境允许访问）
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()

                        // 静态资源
                        .requestMatchers("/static/**", "/public/**", "/favicon.ico").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/uploads/**").permitAll()

                        // 活动相关公开接口（游客可浏览）
                        .requestMatchers(HttpMethod.GET, "/api/activities").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/activities/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/activities/*/participants").permitAll()

                        // 报名相关公开接口（未登录返回有限信息）
                        .requestMatchers(HttpMethod.GET, "/api/registrations/my").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/registrations/activity/*").permitAll()

                        // 用户信息公开接口（游客可查看他人公开信息，脱敏）
                        .requestMatchers(HttpMethod.GET, "/api/user/*").permitAll()

                        // 消息相关接口（游客可访问，未登录返回空列表）
                        .requestMatchers("/api/messages/**").permitAll()

                        // 数据修复接口（仅开发环境临时使用）
                        .requestMatchers("/api/admin/data-fix/**").permitAll()

                        // 其他所有接口都需要认证
                        .anyRequest().authenticated()
                )

                // 添加JWT过滤器
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS配置
     * 允许前端跨域访问
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 允许的源（从配置文件读取，支持多个域名用逗号分隔）
        // 开发环境：* （允许所有）
        // 生产环境：https://yourdomain.com,https://www.yourdomain.com
        List<String> allowedOriginsList = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(allowedOriginsList);

        // 允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // 允许的请求头
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "X-Auth-Token",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "X-User-Id"
        ));

        // 允许携带凭证
        configuration.setAllowCredentials(true);

        // 暴露的响应头
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "X-Auth-Token"
        ));

        // 预检请求的缓存时间（秒）
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
