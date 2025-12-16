@echo off
REM ============================================
REM 数据库Schema更新脚本 (Windows版本)
REM 版本: 1.0
REM 功能: 添加Activity表缺失的字段
REM 执行时机: 发现500错误-报名功能异常时
REM ============================================

setlocal enabledelayedexpansion

REM ============================================
REM 配置变量
REM ============================================

set DB_HOST=rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com
set DB_PORT=3306
set DB_NAME=activity_assistant
set DB_USERNAME=aapDBU
set DB_PASSWORD=aapDBUP@sswrd!5678

set SQL_SCRIPT=..\sql\04_add_missing_activity_fields.sql

REM ============================================
REM 检查MySQL客户端
REM ============================================

echo ========================================
echo     数据库Schema更新脚本 (Windows)
echo ========================================
echo.

where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] MySQL客户端未找到！
    echo.
    echo 请安装MySQL客户端或将mysql.exe路径添加到系统PATH中
    echo.
    echo 常见路径:
    echo   C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo   C:\xampp\mysql\bin
    echo.
    pause
    exit /b 1
)

echo [信息] MySQL客户端已找到 √
echo.

REM ============================================
REM 检查SQL脚本
REM ============================================

if not exist "%SQL_SCRIPT%" (
    echo [错误] SQL脚本不存在: %SQL_SCRIPT%
    pause
    exit /b 1
)

echo [信息] SQL脚本已找到 √
echo.

REM ============================================
REM 确认执行
REM ============================================

echo 本脚本将执行以下操作:
echo 1. 连接生产数据库 %DB_HOST%
echo 2. 执行SQL迁移脚本
echo 3. 添加6个缺失的字段到activities表
echo.

set /p confirm="确认执行? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo [警告] 操作已取消
    pause
    exit /b 0
)

echo.

REM ============================================
REM 执行数据库迁移
REM ============================================

echo [信息] 开始执行数据库Schema更新...
echo [信息] 正在连接数据库: %DB_HOST%:%DB_PORT%/%DB_NAME%
echo.

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -p%DB_PASSWORD% %DB_NAME% < "%SQL_SCRIPT%"

if %errorlevel% neq 0 (
    echo.
    echo [错误] 数据库Schema更新失败
    echo.
    echo 可能的原因:
    echo   1. 数据库连接失败
    echo   2. SQL脚本语法错误
    echo   3. 权限不足
    echo.
    pause
    exit /b 1
)

echo.
echo [信息] 数据库Schema更新成功 √
echo.

REM ============================================
REM 验证字段
REM ============================================

echo [信息] 验证字段是否已成功添加...

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -p%DB_PASSWORD% %DB_NAME% -sse "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='%DB_NAME%' AND TABLE_NAME='activities' AND COLUMN_NAME IN ('desc', 'requirements', 'organizer_phone', 'organizer_wechat', 'image', 'has_groups')" > temp_count.txt

set /p FIELD_COUNT=<temp_count.txt
del temp_count.txt

if "%FIELD_COUNT%"=="6" (
    echo [信息] 所有6个字段均已成功添加 √
) else (
    echo [警告] 发现 %FIELD_COUNT% 个字段，预期6个
    echo [警告] 请检查数据库表结构
)

echo.

REM ============================================
REM 完成提示
REM ============================================

echo ========================================
echo        Schema更新完成！
echo ========================================
echo.
echo 数据库Schema已更新:
echo   √ desc - 活动简介
echo   √ requirements - 报名要求
echo   √ organizer_phone - 组织者电话
echo   √ organizer_wechat - 组织者微信
echo   √ image - 活动封面图片
echo   √ has_groups - 是否启用分组
echo.
echo 下一步操作:
echo   1. SSH登录到生产服务器 (47.104.94.67)
echo   2. 重启后端应用服务
echo      命令: systemctl restart activity-assistant
echo   3. 查看应用日志确认启动成功
echo      命令: journalctl -u activity-assistant -f
echo   4. 测试报名功能是否正常
echo.
echo ========================================
echo.

pause
