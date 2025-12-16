@echo off
chcp 65001 >nul
echo ========================================
echo 创建活动默认图片目录
echo ========================================
echo.

cd /d "%~dp0"

if not exist "images" (
    mkdir images
    echo ✓ 已创建 images 目录
) else (
    echo ! images 目录已存在
)

echo.
echo ========================================
echo 下一步：
echo 1. 参考 DEFAULT_IMAGES_GUIDE.md 下载6张图片
echo 2. 将图片重命名并放入 images 目录
echo 3. 运动类型图片必须突出网球元素！
echo ========================================
echo.
pause
