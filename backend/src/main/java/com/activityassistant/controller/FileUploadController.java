package com.activityassistant.controller;

import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传控制器
 * 处理文件上传相关接口
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "文件上传接口", description = "文件上传管理相关接口")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    /**
     * 上传头像
     *
     * @param file 头像文件
     * @return 头像访问URL
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传头像", description = "上传用户头像文件，返回访问URL")
    public ApiResponse<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file) {

        log.info("接收到头像上传请求，文件名: {}, 大小: {} bytes",
                file.getOriginalFilename(), file.getSize());

        // 调用文件存储服务保存文件
        String fileUrl = fileStorageService.storeAvatarFile(file);

        log.info("头像上传成功，访问URL: {}", fileUrl);

        // 返回文件访问URL
        Map<String, String> result = new HashMap<>();
        result.put("url", fileUrl);

        return ApiResponse.success(result);
    }

    /**
     * 上传通用图片
     *
     * @param file 图片文件
     * @return 图片访问URL
     */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传图片", description = "上传通用图片文件，返回访问URL")
    public ApiResponse<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {

        log.info("接收到图片上传请求，文件名: {}, 大小: {} bytes",
                file.getOriginalFilename(), file.getSize());

        // 调用文件存储服务保存文件
        String fileUrl = fileStorageService.storeImageFile(file);

        log.info("图片上传成功，访问URL: {}", fileUrl);

        // 返回文件访问URL
        Map<String, String> result = new HashMap<>();
        result.put("url", fileUrl);

        return ApiResponse.success(result);
    }
}
