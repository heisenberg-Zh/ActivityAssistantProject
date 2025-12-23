@echo off
chcp 65001 >nul
echo ========================================
echo 微信小程序主包大小检查工具
echo ========================================
echo.

echo [1/3] 检查图片文件大小...
echo.
dir /s /b images\*.jpg images\*.png 2>nul | findstr /v /i "node_modules backend .git" > temp_files.txt
for /f "delims=" %%i in (temp_files.txt) do (
    echo %%i
    dir "%%i" | findstr /r /c:"[0-9][0-9]*.*\.jpg" /c:"[0-9][0-9]*.*\.png"
)
del temp_files.txt 2>nul
echo.

echo [2/3] 计算主包预估大小...
echo （注：实际大小需在微信开发者工具中查看）
echo.

echo [3/3] 建议：
echo - 单个图片大小应 ^< 100KB
echo - 主包总大小应 ^< 1.5MB
echo - 使用 TinyPNG 压缩图片：https://tinypng.com/
echo.

echo 检查完成！
echo ========================================
pause
