#!/bin/bash
# ============================================
# 数据库Schema更新脚本
# 版本: 1.0
# 功能: 添加Activity表缺失的字段
# 执行时机: 发现500错误-报名功能异常时
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

# 数据库配置（阿里云RDS）
DB_HOST="rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_NAME="activity_assistant"
DB_USERNAME="aapDBU"
DB_PASSWORD="aapDBUP@sswrd!5678"

# 应用配置
APP_NAME="activity-assistant"

# SQL脚本路径
SQL_SCRIPT="../sql/04_add_missing_activity_fields.sql"

# ============================================
# 执行数据库迁移
# ============================================
execute_migration() {
    print_info "开始执行数据库Schema更新..."

    # 检查SQL脚本是否存在
    if [ ! -f "$SQL_SCRIPT" ]; then
        print_error "SQL脚本不存在: $SQL_SCRIPT"
        exit 1
    fi

    print_info "SQL脚本已找到 ✓"
    print_info "正在连接数据库: $DB_HOST:$DB_PORT/$DB_NAME"

    # 执行SQL脚本
    mysql -h "$DB_HOST" \
          -P "$DB_PORT" \
          -u "$DB_USERNAME" \
          -p"$DB_PASSWORD" \
          "$DB_NAME" \
          < "$SQL_SCRIPT"

    if [ $? -eq 0 ]; then
        print_info "数据库Schema更新成功 ✓"
    else
        print_error "数据库Schema更新失败"
        exit 1
    fi
}

# ============================================
# 验证字段是否已添加
# ============================================
verify_migration() {
    print_info "验证字段是否已成功添加..."

    # 查询字段
    RESULT=$(mysql -h "$DB_HOST" \
                   -P "$DB_PORT" \
                   -u "$DB_USERNAME" \
                   -p"$DB_PASSWORD" \
                   "$DB_NAME" \
                   -sse "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='activities' AND COLUMN_NAME IN ('desc', 'requirements', 'organizer_phone', 'organizer_wechat', 'image', 'has_groups')")

    if [ "$RESULT" -eq 6 ]; then
        print_info "所有6个字段均已成功添加 ✓"
    else
        print_warn "发现 $RESULT 个字段，预期6个"
        print_warn "请检查数据库表结构"
    fi
}

# ============================================
# 重启应用
# ============================================
restart_application() {
    print_info "重启应用以加载新的Schema..."

    # 检查是否使用systemd
    if systemctl is-active --quiet "$APP_NAME"; then
        print_info "通过 systemd 重启应用..."
        systemctl restart "$APP_NAME"
        sleep 5

        if systemctl is-active --quiet "$APP_NAME"; then
            print_info "应用重启成功 ✓"
        else
            print_error "应用重启失败"
            print_error "请查看日志: journalctl -u $APP_NAME -n 50"
            exit 1
        fi
    else
        print_warn "systemd 服务未运行，尝试手动重启..."

        # 查找Java进程
        PID=$(ps aux | grep "activity-assistant" | grep -v grep | awk '{print $2}')

        if [ -n "$PID" ]; then
            print_info "停止应用 (PID: $PID)..."
            kill -15 "$PID"
            sleep 5

            # 强制停止
            if ps -p "$PID" > /dev/null; then
                print_warn "强制停止应用..."
                kill -9 "$PID"
            fi
        fi

        # 启动应用
        if [ -f "/app/start.sh" ]; then
            print_info "通过启动脚本启动应用..."
            /app/start.sh
        else
            print_error "未找到启动脚本: /app/start.sh"
            print_error "请手动启动应用"
            exit 1
        fi
    fi
}

# ============================================
# 健康检查
# ============================================
health_check() {
    print_info "执行健康检查..."

    # 等待应用启动
    sleep 10

    # 检查端口
    if netstat -tlnp | grep ':8082' > /dev/null; then
        print_info "端口 8082 已监听 ✓"
    else
        print_error "端口 8082 未监听"
        exit 1
    fi

    # 健康检查
    for i in {1..30}; do
        if curl -s http://localhost:8082/actuator/health > /dev/null 2>&1; then
            print_info "应用健康检查通过 ✓"
            return 0
        fi
        sleep 2
        echo -n "."
    done

    echo ""
    print_error "健康检查超时"
    exit 1
}

# ============================================
# 主流程
# ============================================
main() {
    echo ""
    echo "========================================"
    echo "    数据库Schema更新脚本              "
    echo "========================================"
    echo ""
    echo "本脚本将执行以下操作:"
    echo "1. 连接生产数据库"
    echo "2. 执行SQL迁移脚本"
    echo "3. 验证字段是否添加成功"
    echo "4. 重启应用服务"
    echo "5. 执行健康检查"
    echo ""

    read -p "确认执行？(yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_warn "操作已取消"
        exit 0
    fi

    execute_migration
    verify_migration
    restart_application
    health_check

    echo ""
    echo "========================================"
    echo "        更新完成！                      "
    echo "========================================"
    echo ""
    echo "数据库Schema已更新:"
    echo "  ✓ desc - 活动简介"
    echo "  ✓ requirements - 报名要求"
    echo "  ✓ organizer_phone - 组织者电话"
    echo "  ✓ organizer_wechat - 组织者微信"
    echo "  ✓ image - 活动封面图片"
    echo "  ✓ has_groups - 是否启用分组"
    echo ""
    echo "应用已重启并通过健康检查"
    echo ""
    echo "下一步:"
    echo "  1. 测试报名功能是否正常"
    echo "  2. 测试编辑活动是否能保存所有字段"
    echo "  3. 查看日志确认无异常"
    echo ""
    echo "========================================"
}

# 执行主流程
main
