@echo off
REM ============================================
REM ActivityAssistant 自动部署脚本 (Windows)
REM 版本: 1.0
REM 适用系统: Windows Server 2019+
REM ============================================

setlocal enabledelayedexpansion

REM ============================================
REM 配置变量
REM ============================================

set APP_NAME=activity-assistant
set APP_VERSION=1.0.0
set APP_JAR=%APP_NAME%-%APP_VERSION%.jar
set APP_DIR=C:\app
set LOG_DIR=C:\logs\%APP_NAME%
set LOG_FILE=%LOG_DIR%\application.log

REM 数据库配置（阿里云RDS）
set DB_HOST=rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com
set DB_PORT=3306
set DB_NAME=activity_assistant
set DB_USERNAME=aapDBU
set DB_PASSWORD=aapDBUP@sswrd!5678

REM 应用配置
set JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG
set WECHAT_APP_ID=wx92bf60c1218c0abc
set WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4
set REDIS_HOST=47.104.94.67
set REDIS_PORT=6379
set REDIS_PASSWORD=

echo ========================================
echo   ActivityAssistant 自动部署脚本
echo ========================================
echo.

REM ============================================
REM 检查 Java
REM ============================================

echo [INFO] 检查 Java 环境...
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java 未安装或未配置到 PATH
    echo [ERROR] 请先安装 JDK 17+ 并配置环境变量
    pause
    exit /b 1
)

for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VERSION=%%g
)
echo [INFO] Java 版本: %JAVA_VERSION%

REM ============================================
REM 创建目录
REM ============================================

echo [INFO] 创建应用目录...
if not exist "%APP_DIR%" mkdir "%APP_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%APP_DIR%\uploads" mkdir "%APP_DIR%\uploads"
echo [INFO] 目录创建完成

REM ============================================
REM 停止现有应用
REM ============================================

echo [INFO] 检查并停止现有应用...

for /f "tokens=2" %%i in ('tasklist /fi "imagename eq java.exe" /fo list ^| findstr "PID:"') do (
    set JAVA_PID=%%i
    netstat -ano | findstr ":8082" | findstr "!JAVA_PID!" >nul
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] 发现运行中的应用 (PID: !JAVA_PID!)，正在停止...
        taskkill /PID !JAVA_PID! /F
        timeout /t 3 /nobreak >nul
        echo [INFO] 应用已停止
    )
)

REM ============================================
REM 检查 JAR 文件
REM ============================================

echo [INFO] 检查 JAR 文件...
if not exist "%APP_DIR%\%APP_JAR%" (
    echo [ERROR] JAR 文件不存在: %APP_DIR%\%APP_JAR%
    echo [ERROR] 请先将 JAR 包复制到 %APP_DIR% 目录
    pause
    exit /b 1
)
echo [INFO] JAR 文件已找到

REM ============================================
REM 创建启动脚本
REM ============================================

echo [INFO] 创建启动脚本...

echo @echo off > "%APP_DIR%\start.bat"
echo REM ActivityAssistant 启动脚本 >> "%APP_DIR%\start.bat"
echo. >> "%APP_DIR%\start.bat"
echo set SPRING_PROFILES_ACTIVE=prod >> "%APP_DIR%\start.bat"
echo set DB_HOST=%DB_HOST% >> "%APP_DIR%\start.bat"
echo set DB_PORT=%DB_PORT% >> "%APP_DIR%\start.bat"
echo set DB_NAME=%DB_NAME% >> "%APP_DIR%\start.bat"
echo set DB_USERNAME=%DB_USERNAME% >> "%APP_DIR%\start.bat"
echo set DB_PASSWORD=%DB_PASSWORD% >> "%APP_DIR%\start.bat"
echo set JWT_SECRET=%JWT_SECRET% >> "%APP_DIR%\start.bat"
echo set WECHAT_APP_ID=%WECHAT_APP_ID% >> "%APP_DIR%\start.bat"
echo set WECHAT_APP_SECRET=%WECHAT_APP_SECRET% >> "%APP_DIR%\start.bat"
echo set REDIS_HOST=%REDIS_HOST% >> "%APP_DIR%\start.bat"
echo set REDIS_PORT=%REDIS_PORT% >> "%APP_DIR%\start.bat"
echo set REDIS_PASSWORD=%REDIS_PASSWORD% >> "%APP_DIR%\start.bat"
echo set ALLOWED_ORIGINS=http://47.104.94.67,https://servicewechat.com >> "%APP_DIR%\start.bat"
echo. >> "%APP_DIR%\start.bat"
echo start /B javaw -jar -Xms512m -Xmx1024m -Dspring.profiles.active=prod -Dserver.port=8082 "%APP_DIR%\%APP_JAR%" ^>^> "%LOG_FILE%" 2^>^&1 >> "%APP_DIR%\start.bat"
echo echo 应用已启动 >> "%APP_DIR%\start.bat"

echo [INFO] 启动脚本已创建

REM ============================================
REM 创建停止脚本
REM ============================================

echo [INFO] 创建停止脚本...

echo @echo off > "%APP_DIR%\stop.bat"
echo REM ActivityAssistant 停止脚本 >> "%APP_DIR%\stop.bat"
echo. >> "%APP_DIR%\stop.bat"
echo for /f "tokens=2" %%%%i in ('tasklist /fi "imagename eq java.exe" /fo list ^| findstr "PID:"') do ( >> "%APP_DIR%\stop.bat"
echo     set JAVA_PID=%%%%i >> "%APP_DIR%\stop.bat"
echo     netstat -ano ^| findstr ":8082" ^| findstr "!JAVA_PID!" ^>nul >> "%APP_DIR%\stop.bat"
echo     if !ERRORLEVEL! EQU 0 ( >> "%APP_DIR%\stop.bat"
echo         echo 停止应用 (PID: !JAVA_PID!)... >> "%APP_DIR%\stop.bat"
echo         taskkill /PID !JAVA_PID! /F >> "%APP_DIR%\stop.bat"
echo         echo 应用已停止 >> "%APP_DIR%\stop.bat"
echo         exit /b 0 >> "%APP_DIR%\stop.bat"
echo     ) >> "%APP_DIR%\stop.bat"
echo ) >> "%APP_DIR%\stop.bat"
echo echo 应用未运行 >> "%APP_DIR%\stop.bat"

echo [INFO] 停止脚本已创建

REM ============================================
REM 启动应用
REM ============================================

echo [INFO] 启动应用...
call "%APP_DIR%\start.bat"
timeout /t 5 /nobreak >nul

REM ============================================
REM 验证部署
REM ============================================

echo [INFO] 验证部署...

REM 检查进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq java.exe" /fo list ^| findstr "PID:"') do (
    set JAVA_PID=%%i
    netstat -ano | findstr ":8082" | findstr "!JAVA_PID!" >nul
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] 应用进程 PID: !JAVA_PID!
        goto :verify_success
    )
)

echo [ERROR] 应用启动失败
echo [ERROR] 请查看日志: %LOG_FILE%
pause
exit /b 1

:verify_success
echo [INFO] 端口 8082 已监听

REM 等待应用完全启动
echo [INFO] 等待应用完全启动（最多60秒）...
for /L %%i in (1,1,60) do (
    curl -s http://localhost:8082/actuator/health >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] 应用健康检查通过
        goto :deployment_complete
    )
    timeout /t 1 /nobreak >nul
    echo|set /p="."
)
echo.
echo [WARN] 应用可能仍在启动中，请稍后检查

:deployment_complete

REM ============================================
REM 显示部署信息
REM ============================================

echo.
echo ========================================
echo         部署完成！
echo ========================================
echo.
echo 应用名称: %APP_NAME%
echo 应用版本: %APP_VERSION%
echo 应用目录: %APP_DIR%
echo 日志文件: %LOG_FILE%
echo.
echo 常用命令:
echo   启动应用: %APP_DIR%\start.bat
echo   停止应用: %APP_DIR%\stop.bat
echo   查看日志: type %LOG_FILE%
echo.
echo 健康检查:
echo   curl http://localhost:8082/actuator/health
echo.
echo API 地址:
echo   http://47.104.94.67:8082
echo.
echo ========================================
echo.

pause
