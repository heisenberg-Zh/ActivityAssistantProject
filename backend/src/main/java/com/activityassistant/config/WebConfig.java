package com.activityassistant.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置类
 * 配置静态资源访问路径
 *
 * @author Claude
 * @since 2025-01-22
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 从配置文件读取上传目录路径
    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    // 从配置文件读取访问URL前缀
    @Value("${app.upload.url-prefix:/uploads}")
    private String urlPrefix;

    /**
     * 配置静态资源处理器
     * 将 /uploads/** 映射到实际的文件系统路径
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置上传文件的访问路径
        registry.addResourceHandler(urlPrefix + "/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
