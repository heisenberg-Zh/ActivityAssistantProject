@echo off
REM ============================================
REM ActivityAssistant 数据库备份脚本 (Windows)
REM 版本: 1.0
REM 创建日期: 2025-01-30
REM 适用系统: Windows
REM ============================================

setlocal enabledelayedexpansion

REM 配置项（请根据实际环境修改）
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=activity_assistant
set DB_USER=root
set DB_PASSWORD=

REM 备份目录
set BACKUP_DIR=backups

REM 获取当前日期时间
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_DATE=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%
set BACKUP_FILE=%BACKUP_DIR%\activity_assistant_%BACKUP_DATE%.sql

echo ========================================
echo ActivityAssistant 数据库备份工具
echo ========================================
echo.

REM 创建备份目录
if not exist "%BACKUP_DIR%" (
    echo 创建备份目录: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

REM 检查 mysqldump 是否可用
where mysqldump >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到 mysqldump 命令
    echo 请将 MySQL 的 bin 目录添加到系统 PATH 环境变量
    echo 例如: C:\Program Files\MySQL\MySQL Server 8.0\bin
    pause
    exit /b 1
)

REM 如果密码为空，提示输入
if "%DB_PASSWORD%"=="" (
    set /p DB_PASSWORD=请输入数据库密码:
)

echo ========================================
echo 开始备份数据库: %DB_NAME%
echo 备份时间: %date% %time%
echo ========================================
echo.

REM 执行备份
mysqldump --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASSWORD% --databases %DB_NAME% --single-transaction --routines --triggers --events --add-drop-database --result-file="%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ 备份成功!
    echo 备份文件: %BACKUP_FILE%

    REM 显示文件大小
    for %%A in ("%BACKUP_FILE%") do (
        set SIZE=%%~zA
        set /a SIZE_MB=!SIZE! / 1048576
        echo 文件大小: !SIZE_MB! MB
    )

    echo.
    echo ========================================
    echo 现有备份列表:
    echo ========================================
    dir /b /o-d "%BACKUP_DIR%\activity_assistant_*.sql" 2>nul

) else (
    echo.
    echo ✗ 备份失败!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 备份完成!
echo ========================================
pause
