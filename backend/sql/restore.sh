#!/bin/bash
# ============================================
# ActivityAssistant 数据库恢复脚本
# 版本: 1.0
# 创建日期: 2025-01-30
# 适用系统: Linux / macOS
# ============================================

# 配置项（请根据实际环境修改）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"  # 从环境变量读取

# 备份目录
BACKUP_DIR="./backups"

# ============================================
# 函数: 检查MySQL客户端
# ============================================
check_mysql_client() {
    if ! command -v mysql &> /dev/null; then
        echo "错误: 未找到 mysql 命令，请先安装 MySQL 客户端"
        exit 1
    fi
}

# ============================================
# 函数: 列出可用备份
# ============================================
list_available_backups() {
    echo "========================================"
    echo "可用备份列表:"
    echo "========================================"

    BACKUPS=($(ls -t "$BACKUP_DIR"/activity_assistant_*.sql.gz 2>/dev/null))

    if [ ${#BACKUPS[@]} -eq 0 ]; then
        echo "未找到备份文件"
        exit 1
    fi

    local index=1
    for backup in "${BACKUPS[@]}"; do
        local filename=$(basename "$backup")
        local filesize=$(du -h "$backup" | cut -f1)
        local filetime=$(stat -c '%y' "$backup" 2>/dev/null || stat -f '%Sm' "$backup")
        echo "[$index] $filename (大小: $filesize, 时间: $filetime)"
        ((index++))
    done

    echo "========================================"
}

# ============================================
# 函数: 选择备份文件
# ============================================
select_backup_file() {
    BACKUPS=($(ls -t "$BACKUP_DIR"/activity_assistant_*.sql.gz 2>/dev/null))

    if [ -z "$1" ]; then
        echo "请选择要恢复的备份编号 (1-${#BACKUPS[@]}):"
        read BACKUP_INDEX

        if ! [[ "$BACKUP_INDEX" =~ ^[0-9]+$ ]] || [ "$BACKUP_INDEX" -lt 1 ] || [ "$BACKUP_INDEX" -gt ${#BACKUPS[@]} ]; then
            echo "错误: 无效的备份编号"
            exit 1
        fi

        SELECTED_BACKUP="${BACKUPS[$((BACKUP_INDEX-1))]}"
    else
        SELECTED_BACKUP="$1"

        if [ ! -f "$SELECTED_BACKUP" ]; then
            echo "错误: 备份文件不存在: $SELECTED_BACKUP"
            exit 1
        fi
    fi

    echo "选择的备份文件: $(basename $SELECTED_BACKUP)"
}

# ============================================
# 函数: 确认恢复操作
# ============================================
confirm_restore() {
    echo "========================================"
    echo "警告: 数据库恢复将覆盖现有数据!"
    echo "========================================"
    echo "确定要恢复数据库吗? (yes/no)"
    read CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "已取消恢复操作"
        exit 0
    fi
}

# ============================================
# 函数: 执行数据库恢复
# ============================================
restore_database() {
    echo "========================================"
    echo "开始恢复数据库..."
    echo "恢复时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"

    # 如果密码为空，提示输入
    if [ -z "$DB_PASSWORD" ]; then
        echo "请输入数据库密码:"
        read -s DB_PASSWORD
    fi

    # 解压备份文件
    echo "正在解压备份文件..."
    TEMP_SQL="${SELECTED_BACKUP%.gz}"

    gunzip -c "$SELECTED_BACKUP" > "$TEMP_SQL"

    if [ $? -ne 0 ]; then
        echo "✗ 解压失败"
        exit 1
    fi

    echo "✓ 解压成功"

    # 执行恢复
    echo "正在恢复数据库..."
    mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASSWORD" \
        < "$TEMP_SQL"

    # 检查恢复是否成功
    if [ $? -eq 0 ]; then
        echo "✓ 恢复成功!"
    else
        echo "✗ 恢复失败!"
        rm -f "$TEMP_SQL"
        exit 1
    fi

    # 删除临时文件
    rm -f "$TEMP_SQL"
    echo "✓ 清理临时文件完成"
}

# ============================================
# 主流程
# ============================================
main() {
    check_mysql_client
    list_available_backups
    select_backup_file "$1"
    confirm_restore
    restore_database

    echo "========================================"
    echo "恢复完成!"
    echo "========================================"
}

# 执行主流程
# 用法: ./restore.sh [备份文件路径]
main "$1"
