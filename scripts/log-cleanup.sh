#!/bin/bash
#
# سكريبت تنظيف السجلات - Log Cleanup Script
# تنظيف وإدارة ملفات السجلات للنظام والتطبيقات
#

set -euo pipefail

# الألوان للنص الملون
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# إعدادات التنظيف
LOGS_DIR="./logs"
BACKUP_DIR="./backups/logs"
RETENTION_DAYS=30
MAX_LOG_SIZE=100M
CLEANUP_ENABLED=true
COMPRESSION_ENABLED=true
ARCHIVE_ENABLED=true

# فئات السجلات
LOG_CATEGORIES=(
    "application"
    "system"
    "security"
    "analytics"
    "access"
    "error"
    "debug"
    "performance"
)

# دوال مساعدة
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# فحص الأدوات المطلوبة
check_tools() {
    print_header "فحص الأدوات المطلوبة"
    
    # فحص zip
    if ! command -v zip &> /dev/null; then
        print_warning "zip غير متوفر. سيتم تثبيته..."
        sudo apt-get update && sudo apt-get install -y zip
    fi
    
    # فحص tar
    if ! command -v tar &> /dev/null; then
        print_error "tar غير متوفر"
        exit 1
    fi
    
    # فحص find
    if ! command -v find &> /dev/null; then
        print_error "find غير متوفر"
        exit 1
    fi
    
    # فحص date
    if ! command -v date &> /dev/null; then
        print_error "date غير متوفر"
        exit 1
    fi
    
    print_success "جميع الأدوات متوفرة"
}

# إنشاء هيكل المجلدات
create_log_structure() {
    print_header "إنشاء هيكل مجلدات السجلات"
    
    for category in "${LOG_CATEGORIES[@]}"; do
        mkdir -p "$LOGS_DIR/$category"
        mkdir -p "$BACKUP_DIR/$category"
        
        # إنشاء ملف .gitkeep لكل مجلد
        touch "$LOGS_DIR/$category/.gitkeep"
        touch "$BACKUP_DIR/$category/.gitkeep"
    done
    
    # مجلدات إضافية
    mkdir -p "$LOGS_DIR/temp"
    mkdir -p "$BACKUP_DIR/temp"
    mkdir -p "$LOGS_DIR/rotated"
    mkdir -p "$BACKUP_DIR/compressed"
    
    print_success "تم إنشاء هيكل المجلدات"
}

# فحص أحجام السجلات
check_log_sizes() {
    print_header "فحص أحجام ملفات السجلات"
    
    local total_size=0
    local large_files=0
    
    # فحص أحجام الملفات في كل فئة
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        if [ -d "$category_dir" ]; then
            local category_size=$(du -sh "$category_dir" 2>/dev/null | cut -f1)
            print_info "فئة '$category': $category_size"
            
            # البحث عن الملفات الكبيرة
            while IFS= read -r -d '' file; do
                local file_size=$(du -h "$file" | cut -f1)
                print_warning "ملف كبير: $file ($file_size)"
                ((large_files++))
            done < <(find "$category_dir" -type f -size +${MAX_LOG_SIZE} -print0 2>/dev/null)
        fi
    done
    
    # حساب إجمالي الحجم
    total_size=$(du -sh "$LOGS_DIR" 2>/dev/null | cut -f1)
    print_info "إجمالي حجم السجلات: $total_size"
    print_info "عدد الملفات الكبيرة: $large_files"
    
    return 0
}

# ضغط السجلات القديمة
compress_old_logs() {
    if [ "$COMPRESSION_ENABLED" != true ]; then
        print_info "ضغط السجلات معطل"
        return 0
    fi
    
    print_header "ضغط السجلات القديمة"
    
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        local backup_dir="$BACKUP_DIR/compressed"
        
        if [ ! -d "$category_dir" ]; then
            continue
        fi
        
        print_info "ضغط سجلات فئة: $category"
        
        # البحث عن الملفات التي لم يتم تعديلها خلال آخر 7 أيام
        find "$category_dir" -type f -name "*.log" -mtime +7 ! -name "*.gz" -print0 2>/dev/null | while IFS= read -r -d '' file; do
            local compressed_file="${file}.gz"
            
            if gzip -c "$file" > "$compressed_file"; then
                # حذف الملف الأصلي بعد الضغط الناجح
                rm "$file"
                print_success "تم ضغط: $(basename "$file")"
            else
                print_error "فشل في ضغط: $(basename "$file")"
            fi
        done
        
        # نقل الملفات المضغوطة القديمة للنسخ الاحتياطي
        find "$category_dir" -type f -name "*.gz" -mtime +30 -print0 2>/dev/null | while IFS= move -r -d '' file; do
            local filename=$(basename "$file")
            if mv "$file" "$backup_dir/$filename"; then
                print_success "تم نقل: $filename"
            else
                print_error "فشل في نقل: $filename"
            fi
        done
    done
    
    print_success "انتهى ضغط السجلات"
}

# أرشفة السجلات المهمة
archive_important_logs() {
    if [ "$ARCHIVE_ENABLED" != true ]; then
        print_info "أرشفة السجلات معطلة"
        return 0
    fi
    
    print_header "أرشفة السجلات المهمة"
    
    local current_date=$(date +%Y%m%d_%H%M%S)
    local archive_name="saler_logs_archive_$current_date.tar.gz"
    local archive_path="$BACKUP_DIR/$archive_name"
    
    # إنشاء أرشيف للسجلات المهمة (آخر 7 أيام)
    tar -czf "$archive_path" \
        --exclude="*.gz" \
        --exclude="temp/*" \
        -C "$LOGS_DIR" \
        . 2>/dev/null || print_warning "فشل في إنشاء الأرشيف"
    
    if [ -f "$archive_path" ]; then
        local archive_size=$(du -h "$archive_path" | cut -f1)
        print_success "تم إنشاء أرشيف: $archive_name ($archive_size)"
        
        # التحقق من سلامة الأرشيف
        if tar -tzf "$archive_path" >/dev/null 2>&1; then
            print_success "الأرشيف سليم"
        else
            print_error "الأرشيف تالف، سيتم حذفه"
            rm "$archive_path"
        fi
    else
        print_error "فشل في إنشاء الأرشيف"
    fi
}

# تنظيف السجلات القديمة
cleanup_old_logs() {
    if [ "$CLEANUP_ENABLED" != true ]; then
        print_info "تنظيف السجلات معطل"
        return 0
    fi
    
    print_header "تنظيف السجلات القديمة (أكثر من $RETENTION_DAYS يوم)"
    
    local cleaned_count=0
    local total_size_freed=0
    
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        
        if [ ! -d "$category_dir" ]; then
            continue
        fi
        
        print_info "تنظيف فئة: $category"
        
        # البحث عن الملفات القديمة وحذفها
        while IFS= read -r -d '' file; do
            local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
            local file_size_mb=$((file_size / 1024 / 1024))
            
            if rm "$file" 2>/dev/null; then
                ((cleaned_count++))
                total_size_freed=$((total_size_freed + file_size))
                print_success "تم حذف: $(basename "$file") ($(numfmt --to=iec $file_size))"
            else
                print_error "فشل في حذف: $(basename "$file")"
            fi
        done < <(find "$category_dir" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    done
    
    # تنظيف المجلدات الفارغة
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        
        if [ -d "$category_dir" ]; then
            # حذف المجلدات الفارغة
            find "$category_dir" -type d -empty -delete 2>/dev/null || true
        fi
    done
    
    # تقرير التنظيف
    print_success "تم تنظيف $cleaned_count ملف"
    print_info "المساحة المحررة: $(numfmt --to=iec $total_size_freed)"
}

# تدوير السجلات الكبيرة
rotate_large_logs() {
    print_header "تدوير السجلات الكبيرة"
    
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        
        if [ ! -d "$category_dir" ]; then
            continue
        fi
        
        print_info "تدوير سجلات فئة: $category"
        
        # البحث عن الملفات الكبيرة وتدويرها
        find "$category_dir" -type f -size +${MAX_LOG_SIZE} ! -name "*.gz" -print0 2>/dev/null | while IFS= read -r -d '' file; do
            local filename=$(basename "$file")
            local directory=$(dirname "$file")
            local timestamp=$(date +%Y%m%d_%H%M%S)
            local rotated_file="$LOGS_DIR/rotated/${category}_${filename%.log}_${timestamp}.log"
            
            if mv "$file" "$rotated_file"; then
                # إنشاء ملف جديد فارغ
                touch "$file"
                
                # ضغط الملف المدوَّر
                if gzip "$rotated_file"; then
                    print_success "تم تدوير وضغط: $filename"
                else
                    print_warning "تم تدوير ولكن فشل في الضغط: $filename"
                fi
            else
                print_error "فشل في تدوير: $filename"
            fi
        done
    done
    
    # تنظيف الملفات المدوَّرة القديمة (أكثر من 7 أيام)
    find "$LOGS_DIR/rotated" -type f -mtime +7 -delete 2>/dev/null || true
    
    print_success "انتهى تدوير السجلات"
}

# تنظيف سجلات النظام
cleanup_system_logs() {
    print_header "تنظيف سجلات النظام"
    
    # تنظيف سجلات systemd القديمة
    if command -v journalctl &> /dev/null; then
        print_info "تنظيف سجلات systemd (آخر 7 أيام)..."
        sudo journalctl --vacuum-time=7d || print_warning "فشل في تنظيف سجلات systemd"
    fi
    
    # تنظيف ملفات السجلات المؤقتة
    local temp_logs=(
        "/tmp/*.log"
        "/var/tmp/*.log"
        "/var/log/tmp/*.log"
    )
    
    for pattern in "${temp_logs[@]}"; do
        find $pattern -type f -mtime +1 -delete 2>/dev/null || true
    done
    
    # تنظيف سجلات Docker
    if command -v docker &> /dev/null; then
        print_info "تنظيف سجلات Docker..."
        docker system prune -f --volumes 2>/dev/null || print_warning "فشل في تنظيف Docker"
    fi
    
    # تنظيف سجلات package managers
    sudo apt-get clean 2>/dev/null || true
    sudo yum clean all 2>/dev/null || true
    
    print_success "انتهى تنظيف سجلات النظام"
}

# تحليل استخدام المساحة
analyze_disk_usage() {
    print_header "تحليل استخدام المساحة"
    
    # عرض استخدام المساحة حسب الفئات
    print_info "استخدام المساحة حسب الفئات:"
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        if [ -d "$category_dir" ]; then
            local size=$(du -sh "$category_dir" 2>/dev/null | cut -f1)
            local files=$(find "$category_dir" -type f | wc -l)
            print_info "  $category: $size ($files ملف)"
        fi
    done
    
    # عرض أكبر 10 ملفات
    print_info "أكبر 10 ملفات سجل:"
    find "$LOGS_DIR" -type f -exec du -h {} + 2>/dev/null | sort -hr | head -10 | while IFS= read -r line; do
        print_info "  $line"
    done
    
    # إحصائيات النسخ الاحتياطية
    if [ -d "$BACKUP_DIR" ]; then
        local backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        local backup_count=$(find "$BACKUP_DIR" -type f | wc -l)
        print_info "النسخ الاحتياطية: $backup_size ($backup_count ملف)"
    fi
}

# إنشاء تقرير التنظيف
generate_cleanup_report() {
    print_header "إنشاء تقرير التنظيف"
    
    local report_file="$LOGS_DIR/cleanup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
تقرير تنظيف السجلات - $(date)

==================================================
إعدادات التنظيف
==================================================
مدة الاحتفاظ: $RETENTION_DAYS يوم
الحد الأقصى لحجم الملف: $MAX_LOG_SIZE
تفعيل التنظيف: $CLEANUP_ENABLED
تفعيل الضغط: $COMPRESSION_ENABLED
تفعيل الأرشفة: $ARCHIVE_ENABLED

==================================================
إحصائيات المساحة
==================================================
إجمالي حجم السجلات: $(du -sh "$LOGS_DIR" | cut -f1)
حجم النسخ الاحتياطية: $(du -sh "$BACKUP_DIR" | cut -f1)

==================================================
عدد الملفات حسب الفئة
==================================================
EOF

    # إضافة إحصائيات كل فئة
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        if [ -d "$category_dir" ]; then
            local file_count=$(find "$category_dir" -type f | wc -l)
            local compressed_count=$(find "$category_dir" -name "*.gz" | wc -l)
            local category_size=$(du -sh "$category_dir" 2>/dev/null | cut -f1)
            
            echo "$category:" >> "$report_file"
            echo "  إجمالي الملفات: $file_count" >> "$report_file"
            echo "  الملفات المضغوطة: $compressed_count" >> "$report_file"
            echo "  حجم الفئة: $category_size" >> "$report_file"
            echo "" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

==================================================
أكبر الملفات
==================================================
EOF

    # إضافة أكبر الملفات
    find "$LOGS_DIR" -type f -exec du -h {} + 2>/dev/null | sort -hr | head -20 >> "$report_file"
    
    echo "" >> "$report_file"
    echo "تم إنشاء التقرير في: $report_file" >> "$report_file"
    
    print_success "تم إنشاء التقرير: $(basename "$report_file")"
}

# جدولة التنظيف التلقائي
schedule_auto_cleanup() {
    print_header "إعداد التنظيف التلقائي"
    
    # إنشاء ملف cron
    local cron_file="$SCRIPTS_DIR/log_cleanup_cron"
    cat > "$cron_file" << EOF
# تنظيف السجلات التلقائي لشركة سالير
# تنظيف يومي في الساعة 2:00 صباحاً
0 2 * * * $(pwd)/scripts/log-cleanup.sh daily >> $(pwd)/logs/cleanup_cron.log 2>&1

# تنظيف أسبوعي مكثف يوم الأحد في الساعة 3:00 صباحاً
0 3 * * 0 $(pwd)/scripts/log-cleanup.sh weekly >> $(pwd)/logs/cleanup_cron.log 2>&1

# تنظيف شهري مكثف في اليوم الأول من كل شهر في الساعة 4:00 صباحاً
0 4 1 * * $(pwd)/scripts/log-cleanup.sh monthly >> $(pwd)/logs/cleanup_cron.log 2>&1
EOF
    
    # إضافة مهام cron
    print_info "هل تريد إضافة مهام cron للتنظيف التلقائي؟ (y/N)"
    read -p "اختر: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # إضافة المهام لـ crontab
        (crontab -l 2>/dev/null; cat "$cron_file") | crontab -
        print_success "تم إضافة مهام cron للتنظيف التلقائي"
    else
        print_info "تم إنشاء ملف cron في: $cron_file"
        print_info "يمكنك إضافته يدوياً بـ: crontab $cron_file"
    fi
    
    # إنشاء systemd timer إذا كان متوفراً
    if command -v systemctl &> /dev/null; then
        local timer_dir="/etc/systemd/system"
        local service_file="saler-log-cleanup.service"
        local timer_file="saler-log-cleanup.timer"
        
        print_info "هل تريد إنشاء systemd timer للتنظيف؟ (y/N)"
        read -p "اختر: " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # إنشاء service file
            sudo tee "$timer_dir/$service_file" > /dev/null << EOF
[Unit]
Description=Saler Log Cleanup Service
After=network.target

[Service]
Type=oneshot
ExecStart=$(pwd)/scripts/log-cleanup.sh daily
User=$(whoami)
WorkingDirectory=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

            # إنشاء timer file
            sudo tee "$timer_dir/$timer_file" > /dev/null << EOF
[Unit]
Description=Saler Log Cleanup Timer
Requires=saler-log-cleanup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

            # تفعيل الخدمات
            sudo systemctl daemon-reload
            sudo systemctl enable saler-log-cleanup.timer
            sudo systemctl start saler-log-cleanup.timer
            
            print_success "تم إعداد systemd timer للتنظيف التلقائي"
        fi
    fi
}

# عرض المساعدة
show_help() {
    cat << EOF
استخدام: $0 [OPTIONS] [COMMAND]

الأوامر:
  daily        تنظيف يومي (ضغط وتنظيف أساسي)
  weekly       تنظيف أسبوعي (ضغط وأرشفة وتنظيف شامل)
  monthly      تنظيف شهري (تنظيف مكثف ونسخ احتياطية)
  analyze      تحليل استخدام المساحة فقط
  report       إنشاء تقرير التنظيف فقط
  help         عرض هذه المساعدة

الخيارات:
  --no-cleanup       تعطيل تنظيف السجلات
  --no-compression   تعطيل ضغط السجلات
  --no-archiving     تعطيل أرشفة السجلات
  --retention DAYS   عدد أيام الاحتفاظ (افتراضي: 30)
  --max-size SIZE    الحد الأقصى لحجم الملف (افتراضي: 100M)
  --dry-run          تشغيل تجريبي بدون تنفيذ

أمثلة:
  $0 daily                           # تنظيف يومي
  $0 weekly --retention 14          # تنظيف أسبوعي مع الاحتفاظ 14 يوم
  $0 monthly --no-cleanup --archive # تنظيف شهري بدون حذف فقط ضغط وأرشفة
  $0 analyze                         # تحليل المساحة فقط

EOF
}

# تنظيف يومي
cleanup_daily() {
    print_info "بدء التنظيف اليومي"
    check_log_sizes
    compress_old_logs
    rotate_large_logs
    cleanup_system_logs
    analyze_disk_usage
    print_success "انتهى التنظيف اليومي"
}

# تنظيف أسبوعي
cleanup_weekly() {
    print_info "بدء التنظيف الأسبوعي"
    cleanup_daily
    archive_important_logs
    generate_cleanup_report
    print_success "انتهى التنظيف الأسبوعي"
}

# تنظيف شهري
cleanup_monthly() {
    print_info "بدء التنظيف الشهري"
    cleanup_weekly
    schedule_auto_cleanup
    print_success "انتهى التنظيف الشهري"
}

# التشغيل التجريبي
dry_run() {
    print_info "وضع التشغيل التجريبي - لن يتم تنفيذ أي عمليات"
    
    for category in "${LOG_CATEGORIES[@]}"; do
        local category_dir="$LOGS_DIR/$category"
        if [ -d "$category_dir" ]; then
            local old_files=$(find "$category_dir" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
            local large_files=$(find "$category_dir" -type f -size +${MAX_LOG_SIZE} ! -name "*.gz" 2>/dev/null | wc -l)
            
            print_info "فئة '$category':"
            print_info "  ملفات قديمة (أكثر من $RETENTION_DAYS يوم): $old_files"
            print_info "  ملفات كبيرة (أكثر من $MAX_LOG_SIZE): $large_files"
        fi
    done
}

# تحليل المساحة فقط
analyze_only() {
    analyze_disk_usage
    check_log_sizes
}

# تقرير فقط
report_only() {
    generate_cleanup_report
}

# معالجة المعاملات
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            daily)
                CLEANUP_ENABLED=true
                COMPRESSION_ENABLED=true
                ARCHIVE_ENABLED=false
                shift
                ;;
            weekly)
                CLEANUP_ENABLED=true
                COMPRESSION_ENABLED=true
                ARCHIVE_ENABLED=true
                shift
                ;;
            monthly)
                CLEANUP_ENABLED=true
                COMPRESSION_ENABLED=true
                ARCHIVE_ENABLED=true
                shift
                ;;
            analyze)
                CLEANUP_ENABLED=false
                COMPRESSION_ENABLED=false
                ARCHIVE_ENABLED=false
                shift
                analyze_only
                exit 0
                ;;
            report)
                CLEANUP_ENABLED=false
                COMPRESSION_ENABLED=false
                ARCHIVE_ENABLED=false
                shift
                report_only
                exit 0
                ;;
            --no-cleanup)
                CLEANUP_ENABLED=false
                shift
                ;;
            --no-compression)
                COMPRESSION_ENABLED=false
                shift
                ;;
            --no-archiving)
                ARCHIVE_ENABLED=false
                shift
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --max-size)
                MAX_LOG_SIZE="$2"
                shift 2
                ;;
            --dry-run)
                dry_run
                exit 0
                ;;
            help|--help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "خيار غير معروف: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# الدالة الرئيسية
main() {
    # معالجة المعاملات
    parse_arguments "$@"
    
    print_header "سكريبت تنظيف السجلات - شركة سالير"
    
    check_tools
    create_log_structure
    
    # تحديد نوع التنظيف
    if [ $# -eq 0 ]; then
        print_info "لم يتم تحديد أمر. سيتم تشغيل التنظيف اليومي"
        cleanup_daily
    else
        case $1 in
            daily)
                cleanup_daily
                ;;
            weekly)
                cleanup_weekly
                ;;
            monthly)
                cleanup_monthly
                ;;
            *)
                print_error "أمر غير معروف: $1"
                show_help
                exit 1
                ;;
        esac
    fi
    
    print_success "انتهى السكريبت بنجاح! 🎉"
}

# التحقق من وجود المجلدات المطلوبة
if [ ! -d "$LOGS_DIR" ]; then
    print_warning "مجلد السجلات غير موجود. سيتم إنشاؤه."
    mkdir -p "$LOGS_DIR"
fi

# تشغيل السكريبت الرئيسي
main "$@"