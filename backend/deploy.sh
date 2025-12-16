#!/bin/bash
# ============================================
# ActivityAssistant 自动部署脚本
# 版本: 1.0
# 适用系统: Linux (Ubuntu/CentOS)
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# 配置变量
# ============================================

APP_NAME="activity-assistant"
APP_VERSION="1.0.0"
APP_JAR="${APP_NAME}-${APP_VERSION}.jar"
APP_DIR="/app"
LOG_DIR="/var/log/${APP_NAME}"
LOG_FILE="${LOG_DIR}/application.log"

# 数据库配置（阿里云RDS）
DB_HOST="rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_NAME="activity_assistant"
DB_USERNAME="aapDBU"
DB_PASSWORD="aapDBUP@sswrd!5678"

# 应用配置
JWT_SECRET="HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG"
WECHAT_APP_ID="wx92bf60c1218c0abc"
WECHAT_APP_SECRET="9830896ed8dc4314e44b2285a9c211e4"
REDIS_HOST="47.104.94.67"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# ============================================
# 检查权限
# ============================================
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# ============================================
# 检查依赖
# ============================================
check_dependencies() {
    print_info "检查系统依赖..."

    # 检查 Java
    if ! command -v java &> /dev/null; then
        print_error "Java 未安装，请先安装 JDK 17+"
        exit 1
    fi

    # 检查 Java 版本
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | awk -F '.' '{print $1}')
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_error "Java 版本过低，需要 17+，当前版本: $JAVA_VERSION"
        exit 1
    fi

    print_info "Java 版本: $JAVA_VERSION ✓"

    # 检查 MySQL
    if ! command -v mysql &> /dev/null; then
        print_warn "MySQL 客户端未安装，跳过数据库检查"
    else
        print_info "MySQL 客户端已安装 ✓"
    fi
}

# ============================================
# 创建目录
# ============================================
create_directories() {
    print_info "创建应用目录..."

    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$APP_DIR/uploads"

    print_info "目录创建完成 ✓"
}

# ============================================
# 停止现有应用
# ============================================
stop_application() {
    print_info "检查并停止现有应用..."

    PID=$(ps aux | grep "$APP_JAR" | grep -v grep | awk '{print $2}')

    if [ -n "$PID" ]; then
        print_info "发现运行中的应用 (PID: $PID)，正在停止..."
        kill -15 "$PID"
        sleep 5

        # 强制停止
        if ps -p "$PID" > /dev/null; then
            print_warn "应用未正常停止，强制终止..."
            kill -9 "$PID"
        fi

        print_info "应用已停止 ✓"
    else
        print_info "没有运行中的应用"
    fi
}

# ============================================
# 部署应用
# ============================================
deploy_application() {
    print_info "部署应用..."

    # 检查 JAR 文件
    if [ ! -f "$APP_DIR/$APP_JAR" ]; then
        print_error "JAR 文件不存在: $APP_DIR/$APP_JAR"
        print_error "请先上传 JAR 包到 $APP_DIR 目录"
        exit 1
    fi

    print_info "JAR 文件已找到 ✓"
}

# ============================================
# 创建启动脚本
# ============================================
create_start_script() {
    print_info "创建启动脚本..."

    cat > "$APP_DIR/start.sh" <<EOF
#!/bin/bash
# ActivityAssistant 启动脚本

# 设置环境变量
export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=$DB_HOST
export DB_PORT=$DB_PORT
export DB_NAME=$DB_NAME
export DB_USERNAME=$DB_USERNAME
export DB_PASSWORD=$DB_PASSWORD
export JWT_SECRET=$JWT_SECRET
export WECHAT_APP_ID=$WECHAT_APP_ID
export WECHAT_APP_SECRET=$WECHAT_APP_SECRET
export REDIS_HOST=$REDIS_HOST
export REDIS_PORT=$REDIS_PORT
export REDIS_PASSWORD=$REDIS_PASSWORD
export ALLOWED_ORIGINS=http://47.104.94.67,https://servicewechat.com

# 启动应用
nohup java -jar \\
  -Xms512m \\
  -Xmx1024m \\
  -Dspring.profiles.active=prod \\
  -Dserver.port=8082 \\
  $APP_DIR/$APP_JAR \\
  >> $LOG_FILE 2>&1 &

echo "应用已启动，PID: \$!"
EOF

    chmod +x "$APP_DIR/start.sh"
    print_info "启动脚本已创建 ✓"
}

# ============================================
# 创建停止脚本
# ============================================
create_stop_script() {
    print_info "创建停止脚本..."

    cat > "$APP_DIR/stop.sh" <<EOF
#!/bin/bash
# ActivityAssistant 停止脚本

PID=\$(ps aux | grep "$APP_JAR" | grep -v grep | awk '{print \$2}')

if [ -z "\$PID" ]; then
    echo "应用未运行"
    exit 0
fi

echo "停止应用 (PID: \$PID)..."
kill -15 "\$PID"
sleep 5

if ps -p "\$PID" > /dev/null; then
    echo "强制停止应用..."
    kill -9 "\$PID"
fi

echo "应用已停止"
EOF

    chmod +x "$APP_DIR/stop.sh"
    print_info "停止脚本已创建 ✓"
}

# ============================================
# 创建 systemd 服务
# ============================================
create_systemd_service() {
    print_info "创建 systemd 服务..."

    cat > "/etc/systemd/system/${APP_NAME}.service" <<EOF
[Unit]
Description=Activity Assistant Application
After=syslog.target network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/java -jar \\
  -Xms512m \\
  -Xmx1024m \\
  -Dspring.profiles.active=prod \\
  -Dserver.port=8082 \\
  $APP_DIR/$APP_JAR
SuccessExitStatus=143
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE
Restart=always
RestartSec=10

# 环境变量
Environment="DB_HOST=$DB_HOST"
Environment="DB_PORT=$DB_PORT"
Environment="DB_NAME=$DB_NAME"
Environment="DB_USERNAME=$DB_USERNAME"
Environment="DB_PASSWORD=$DB_PASSWORD"
Environment="JWT_SECRET=$JWT_SECRET"
Environment="WECHAT_APP_ID=$WECHAT_APP_ID"
Environment="WECHAT_APP_SECRET=$WECHAT_APP_SECRET"
Environment="REDIS_HOST=$REDIS_HOST"
Environment="REDIS_PORT=$REDIS_PORT"
Environment="REDIS_PASSWORD=$REDIS_PASSWORD"
Environment="ALLOWED_ORIGINS=http://47.104.94.67,https://servicewechat.com"

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    print_info "systemd 服务已创建 ✓"
}

# ============================================
# 启动应用
# ============================================
start_application() {
    print_info "启动应用..."

    # 方式 1: 使用 systemd（推荐）
    if [ -f "/etc/systemd/system/${APP_NAME}.service" ]; then
        systemctl start "$APP_NAME"
        systemctl enable "$APP_NAME"
        print_info "应用已通过 systemd 启动 ✓"
    else
        # 方式 2: 使用启动脚本
        "$APP_DIR/start.sh"
        print_info "应用已通过脚本启动 ✓"
    fi

    sleep 5
}

# ============================================
# 验证部署
# ============================================
verify_deployment() {
    print_info "验证部署..."

    # 检查进程
    PID=$(ps aux | grep "$APP_JAR" | grep -v grep | awk '{print $2}')
    if [ -z "$PID" ]; then
        print_error "应用启动失败"
        print_error "请查看日志: tail -f $LOG_FILE"
        exit 1
    fi

    print_info "应用进程 PID: $PID ✓"

    # 检查端口
    sleep 3
    if netstat -tlnp | grep ':8082' > /dev/null; then
        print_info "端口 8082 已监听 ✓"
    else
        print_warn "端口 8082 未监听，应用可能仍在启动中..."
    fi

    # 等待应用完全启动
    print_info "等待应用完全启动（最多60秒）..."
    for i in {1..60}; do
        if curl -s http://localhost:8082/actuator/health > /dev/null 2>&1; then
            print_info "应用健康检查通过 ✓"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
}

# ============================================
# 显示部署信息
# ============================================
show_deployment_info() {
    echo ""
    echo "========================================"
    echo "        部署完成！                      "
    echo "========================================"
    echo ""
    echo "应用名称: $APP_NAME"
    echo "应用版本: $APP_VERSION"
    echo "应用目录: $APP_DIR"
    echo "日志文件: $LOG_FILE"
    echo ""
    echo "常用命令:"
    echo "  启动应用: systemctl start $APP_NAME"
    echo "  停止应用: systemctl stop $APP_NAME"
    echo "  重启应用: systemctl restart $APP_NAME"
    echo "  查看状态: systemctl status $APP_NAME"
    echo "  查看日志: tail -f $LOG_FILE"
    echo "  或使用: journalctl -u $APP_NAME -f"
    echo ""
    echo "健康检查:"
    echo "  curl http://localhost:8082/actuator/health"
    echo ""
    echo "API 地址:"
    echo "  http://47.104.94.67:8082"
    echo ""
    echo "========================================"
}

# ============================================
# 主流程
# ============================================
main() {
    echo ""
    echo "========================================"
    echo "  ActivityAssistant 自动部署脚本      "
    echo "========================================"
    echo ""

    # 检查数据库密码
    if [ -z "$DB_PASSWORD" ]; then
        print_error "数据库密码未设置！"
        print_error "请编辑脚本，设置 DB_PASSWORD 变量"
        exit 1
    fi

    check_root
    check_dependencies
    create_directories
    stop_application
    deploy_application
    create_start_script
    create_stop_script
    create_systemd_service
    start_application
    verify_deployment
    show_deployment_info
}

# 执行主流程
main
