package com.activityassistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ActivityAssistant 后端应用主入口
 *
 * <p>功能说明：
 * <ul>
 *   <li>活动管理系统后端服务</li>
 *   <li>为微信小程序提供 RESTful API</li>
 *   <li>支持活动创建、报名、签到、统计等功能</li>
 * </ul>
 *
 * @author Claude
 * @version 1.0.0
 * @since 2025-01-08
 */
@SpringBootApplication
@EnableJpaAuditing  // 启用 JPA 审计功能（自动填充 createdAt、updatedAt）
@EnableAsync        // 启用异步任务支持
@EnableScheduling   // 启用定时任务支持
public class ActivityApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActivityApplication.class, args);
        System.out.println("\n" +
                "========================================\n" +
                "  ActivityAssistant 后端服务启动成功！\n" +
                "  API 文档地址: http://localhost:8082/swagger-ui.html\n" +
                "  健康检查: http://localhost:8082/actuator/health\n" +
                "========================================\n");
    }
}
