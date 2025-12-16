@echo off
REM ============================================
REM ActivityAssistant 数据库恢复脚本 (Windows)
REM 版本: 1.0
REM 创建日期: 2025-01-30
REM 适用系统: Windows
REM ============================================

setlocal enabledelayedexpansion

REM 配置项（请根据实际环境修改）
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=

REM 备份目录
set BACKUP_DIR=backups

echo ========================================
echo ActivityAssistant 数据库恢复工具
echo ========================================
echo.

REM 检查 mysql 是否可用
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到 mysql 命令
    echo 请将 MySQL 的 bin 目录添加到系统 PATH 环境变量
    echo 例如: C:\Program Files\MySQL\MySQL Server 8.0\bin
    pause
    exit /b 1
)

REM 列出可用备份
echo ========================================
echo 可用备份列表:
echo ========================================

set INDEX=1
for /f "delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\activity_assistant_*.sql" 2^>nul') do (
    set "BACKUP_!INDEX!=%%f"
    echo [!INDEX!] %%f
    set /a INDEX+=1
)

set /a MAX_INDEX=!INDEX!-1

if %MAX_INDEX% EQU 0 (
    echo 未找到备份文件
    pause
    exit /b 1
)

echo ========================================
echo.

REM 选择备份文件
set /p BACKUP_INDEX=请选择要恢复的备份编号 (1-%MAX_INDEX%):

if !BACKUP_INDEX! LSS 1 (
    echo 错误: 无效的备份编号
    pause
    exit /b 1
)

if !BACKUP_INDEX! GTR %MAX_INDEX% (
    echo 错误: 无效的备份编号
    pause
    exit /b 1
)

set SELECTED_BACKUP=!BACKUP_%BACKUP_INDEX%!
set BACKUP_FILE=%BACKUP_DIR%\!SELECTED_BACKUP!

echo.
echo 选择的备份文件: !SELECTED_BACKUP!
echo.

REM 确认恢复操作
echo ========================================
echo 警告: 数据库恢复将覆盖现有数据!
echo ========================================
set /p CONFIRM=确定要恢复数据库吗? (yes/no):

if not "!CONFIRM!"=="yes" (
    echo 已取消恢复操作
    pause
    exit /b 0
)

REM 如果密码为空，提示输入
if "%DB_PASSWORD%"=="" (
    set /p DB_PASSWORD=请输入数据库密码:
)

echo.
echo ========================================
echo 开始恢复数据库...
echo 恢复时间: %date% %time%
echo ========================================
echo.

REM 执行恢复
mysql --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASSWORD% < "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ 恢复成功!
) else (
    echo.
    echo ✗ 恢复失败!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 恢复完成!
echo ========================================
pause
