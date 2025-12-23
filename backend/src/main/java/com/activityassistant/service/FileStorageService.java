package com.activityassistant.service;

import com.activityassistant.constant.ErrorCode;
import com.activityassistant.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 文件存储服务
 * 处理文件的上传、存储和访问
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@Service
public class FileStorageService {

    // 从配置文件读取上传目录路径
    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    // 从配置文件读取访问URL前缀
    @Value("${app.upload.url-prefix:/uploads}")
    private String urlPrefix;

    // 从配置文件读取服务器基础URL
    @Value("${app.upload.base-url:http://localhost:8082}")
    private String baseUrl;

    // 允许的图片文件类型
    private static final String[] ALLOWED_IMAGE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };

    // 文件大小限制：5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * 存储头像文件
     *
     * @param file 上传的文件
     * @return 文件访问URL
     */
    public String storeAvatarFile(MultipartFile file) {
        return storeFile(file, "avatars");
    }

    /**
     * 存储通用图片文件
     *
     * @param file 上传的文件
     * @return 文件访问URL
     */
    public String storeImageFile(MultipartFile file) {
        return storeFile(file, "images");
    }

    /**
     * 存储文件的通用方法
     *
     * @param file 上传的文件
     * @param subDirectory 子目录名称
     * @return 文件访问URL
     */
    private String storeFile(MultipartFile file, String subDirectory) {
        // 1. 验证文件
        validateFile(file);

        try {
            // 2. 确保上传目录存在
            Path uploadDir = Paths.get(uploadPath, subDirectory);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                log.info("创建上传目录: {}", uploadDir.toAbsolutePath());
            }

            // 3. 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // 4. 保存文件
            Path targetPath = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("文件保存成功: {}", targetPath.toAbsolutePath());

            // 5. 返回完整的访问URL
            String fileUrl = baseUrl + urlPrefix + "/" + subDirectory + "/" + uniqueFilename;
            log.info("文件访问URL（完整）: {}", fileUrl);

            return fileUrl;

        } catch (IOException e) {
            log.error("文件保存失败", e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, "文件保存失败: " + e.getMessage());
        }
    }

    /**
     * 验证文件
     */
    private void validateFile(MultipartFile file) {
        // 检查文件是否为空
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAM, "文件不能为空");
        }

        // 检查文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE,
                    "文件大小超过限制（最大5MB）");
        }

        // 检查文件类型
        String contentType = file.getContentType();
        boolean isAllowedType = false;
        for (String allowedType : ALLOWED_IMAGE_TYPES) {
            if (allowedType.equals(contentType)) {
                isAllowedType = true;
                break;
            }
        }

        if (!isAllowedType) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的文件类型，仅支持: jpeg, jpg, png, gif, webp");
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return ".jpg"; // 默认扩展名
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex);
        }

        return ".jpg"; // 默认扩展名
    }
}
