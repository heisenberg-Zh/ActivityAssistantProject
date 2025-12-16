#!/bin/bash
# ============================================
# ActivityAssistant 数据库备份脚本
# 版本: 1.0
# 创建日期: 2025-01-30
# 适用系统: Linux / macOS
# ============================================

# 配置项（请根据实际环境修改）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-activity_assistant}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"  # 从环境变量读取，避免硬编码密码

# 备份目录
BACKUP_DIR="./backups"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/activity_assistant_${BACKUP_DATE}.sql"

# 保留天数（超过此天数的备份将被删除）
RETENTION_DAYS=30

# ============================================
# 函数: 检查MySQL客户端
# ============================================
check_mysql_client() {
    if ! command -v mysqldump &> /dev/null; then
        echo "错误: 未找到 mysqldump 命令，请先安装 MySQL 客户端"
        exit 1
    fi
}

# ============================================
# 函数: 创建备份目录
# ============================================
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "创建备份目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# ============================================
# 函数: 执行数据库备份
# ============================================
backup_database() {
    echo "========================================"
    echo "开始备份数据库: $DB_NAME"
    echo "备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"

    # 如果密码为空，提示输入
    if [ -z "$DB_PASSWORD" ]; then
        echo "请输入数据库密码:"
        read -s DB_PASSWORD
    fi

    # 执行备份
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASSWORD" \
        --databases "$DB_NAME" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --result-file="$BACKUP_FILE"

    # 检查备份是否成功
    if [ $? -eq 0 ]; then
        echo "✓ 备份成功!"
        echo "备份文件: $BACKUP_FILE"

        # 压缩备份文件
        echo "正在压缩备份文件..."
        gzip "$BACKUP_FILE"

        if [ $? -eq 0 ]; then
            echo "✓ 压缩成功: ${BACKUP_FILE}.gz"

            # 显示文件大小
            FILE_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
            echo "文件大小: $FILE_SIZE"
        else
            echo "✗ 压缩失败"
        fi
    else
        echo "✗ 备份失败!"
        exit 1
    fi
}

# ============================================
# 函数: 清理旧备份
# ============================================
cleanup_old_backups() {
    echo "========================================"
    echo "清理超过 ${RETENTION_DAYS} 天的旧备份..."
    echo "========================================"

    find "$BACKUP_DIR" -name "activity_assistant_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

    if [ $? -eq 0 ]; then
        echo "✓ 清理完成"
    else
        echo "✗ 清理失败"
    fi
}

# ============================================
# 函数: 显示备份列表
# ============================================
list_backups() {
    echo "========================================"
    echo "现有备份列表:"
    echo "========================================"
    ls -lh "$BACKUP_DIR"/activity_assistant_*.sql.gz 2>/dev/null || echo "暂无备份文件"
}

# ============================================
# 主流程
# ============================================
main() {
    check_mysql_client
    create_backup_dir
    backup_database
    cleanup_old_backups
    list_backups

    echo "========================================"
    echo "备份完成!"
    echo "========================================"
}

# 执行主流程
main
