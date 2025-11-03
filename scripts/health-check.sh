#!/bin/bash
#
# سكريبت فحص الصحة الشامل - Comprehensive Health Check Script
# فحص شامل لحالة النظام والخدمات والتطبيقات
#

set -euo pipefail

# الألوان للنص الملون
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# إعدادات الفحص
HEALTH_CHECK_CONFIG="${HEALTH_CHECK_CONFIG:-./health-check-config.json}"
REPORT_DIR="${REPORT_DIR:-./health-reports}"
LOG_FILE="${LOG_FILE:-./health-check.log}"
ALERT_THRESHOLDS_FILE="${ALERT_THRESHOLDS_FILE:-./alert-thresholds.json}"

# متغيرات النتائج
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# دوال مساعدة
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${PURPLE}========================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}========================================${NC}" | tee -a "$LOG_FILE"
}

# إنشاء مجلد التقارير
mkdir -p "$REPORT_DIR"

# دالة تسجيل الوقت
log_start_time() {
    START_TIME=$(date +%s.%N)
}

log_end_time() {
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "N/A")
    echo "$DURATION"
}

# فحص الشبكة والإنترنت
check_network_connectivity() {
    print_info "فحص الاتصال بالشبكة والإنترنت..."
    
    # فحص الاتصال بالإنترنت
    if ping -c 1 8.8.8.8 &> /dev/null; then
        print_success "الاتصال بالإنترنت: متصل"
        ((PASSED_CHECKS++))
    else
        print_error "الاتصال بالإنترنت: مفقود"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    # فحص DNS
    if nslookup google.com &> /dev/null; then
        print_success "DNS: يعمل بشكل صحيح"
        ((PASSED_CHECKS++))
    else
        print_error "DNS: مشكلة في التكوين"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# فحص موارد النظام
check_system_resources() {
    print_info "فحص موارد النظام..."
    
    # فحص استخدام المعالج
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$CPU_USAGE < 80" | bc -l) )); then
        print_success "استخدام المعالج: ${CPU_USAGE}% (طبيعي)"
        ((PASSED_CHECKS++))
    elif (( $(echo "$CPU_USAGE < 90" | bc -l) )); then
        print_warning "استخدام المعالج: ${CPU_USAGE}% (عالي)"
        ((WARNING_CHECKS++))
    else
        print_error "استخدام المعالج: ${CPU_USAGE}% (حرج)"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    # فحص استخدام الذاكرة
    MEMORY_INFO=$(free | grep Mem)
    TOTAL_MEM=$(echo $MEMORY_INFO | awk '{print $2}')
    USED_MEM=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_USAGE=$(echo "scale=2; $USED_MEM * 100 / $TOTAL_MEM" | bc -l)
    
    if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
        print_success "استخدام الذاكرة: ${MEMORY_USAGE}% (طبيعي)"
        ((PASSED_CHECKS++))
    elif (( $(echo "$MEMORY_USAGE < 90" | bc -l) )); then
        print_warning "استخدام الذاكرة: ${MEMORY_USAGE}% (عالي)"
        ((WARNING_CHECKS++))
    else
        print_error "استخدام الذاكرة: ${MEMORY_USAGE}% (حرج)"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    # فحص مساحة القرص
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "مساحة القرص: ${DISK_USAGE}% مستخدمة (طبيعي)"
        ((PASSED_CHECKS++))
    elif [ "$DISK_USAGE" -lt 90 ]; then
        print_warning "مساحة القرص: ${DISK_USAGE}% مستخدمة (عالي)"
        ((WARNING_CHECKS++))
    else
        print_error "مساحة القرص: ${DISK_USAGE}% مستخدمة (حرج)"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    # فحص العمليات المعلقة
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    CPU_CORES=$(nproc)
    
    if (( $(echo "$LOAD_AVG < $CPU_CORES" | bc -l) )); then
        print_success "متوسط الحمولة: $LOAD_AVG (طبيعي)"
        ((PASSED_CHECKS++))
    else
        print_warning "متوسط الحمولة: $LOAD_AVG (عالي)"
        ((WARNING_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# فحص خدمات Docker
check_docker_services() {
    print_info "فحص خدمات Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker: غير مثبت"
        ((FAILED_CHECKS++))
        ((TOTAL_CHECKS++))
        return
    fi
    
    # فحص حالة Docker
    if docker info &> /dev/null; then
        print_success "Docker: يعمل بشكل صحيح"
        ((PASSED_CHECKS++))
    else
        print_error "Docker: لا يعمل أو مشكلة في التكوين"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    # فحص الحاويات المهمة
    IMPORTANT_CONTAINERS=("saler-prometheus" "saler-grafana" "saler-loki" "saler-alertmanager")
    
    for container in "${IMPORTANT_CONTAINERS[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            print_success "الحاوية $container: تعمل"
            ((PASSED_CHECKS++))
        else
            print_warning "الحاوية $container: لا تعمل"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    done
}

# فحص الخدمات الشبكية
check_network_services() {
    print_info "فحص الخدمات الشبكية..."
    
    # خدمات المراقبة
    SERVICES=(
        "localhost:9090:Prometheus"
        "localhost:3000:Grafana"
        "localhost:9093:Alertmanager"
        "localhost:3100:Loki"
    )
    
    for service in "${SERVICES[@]}"; do
        HOST=$(echo $service | cut -d: -f1)
        PORT=$(echo $service | cut -d: -f2)
        NAME=$(echo $service | cut -d: -f3)
        
        if timeout 5 bash -c "echo > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
            print_success "$NAME: متاح على المنفذ $PORT"
            ((PASSED_CHECKS++))
        else
            print_warning "$NAME: غير متاح على المنفذ $PORT"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    done
    
    # فحص الخدمات الخارجية
    EXTERNAL_SERVICES=(
        "google.com:80:Google"
        "github.com:80:GitHub"
        "stackoverflow.com:80:Stack Overflow"
    )
    
    for service in "${EXTERNAL_SERVICES[@]}"; do
        HOST=$(echo $service | cut -d: -f1)
        PORT=$(echo $service | cut -d: -f2)
        NAME=$(echo $service | cut -d: -f3)
        
        if timeout 10 bash -c "echo > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
            print_success "$NAME: متاح"
            ((PASSED_CHECKS++))
        else
            print_warning "$NAME: غير متاح"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    done
}

# فحص أمن النظام
check_system_security() {
    print_info "فحص أمان النظام..."
    
    # فحص جدار الحماية
    if command -v ufw &> /dev/null; then
        UFW_STATUS=$(ufw status | grep "Status:" | awk '{print $2}')
        if [ "$UFW_STATUS" = "active" ]; then
            print_success "جدار الحماية: نشط"
            ((PASSED_CHECKS++))
        else
            print_warning "جدار الحماية: غير نشط"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
    
    # فحص التحديثات الأمنية
    if command -v apt &> /dev/null; then
        SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
        if [ "$SECURITY_UPDATES" -eq 0 ]; then
            print_success "التحديثات الأمنية: لا توجد تحديثات معلقة"
            ((PASSED_CHECKS++))
        else
            print_warning "التحديثات الأمنية: $SECURITY_UPDATES تحديث متاح"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
    
    # فحص المستخدمين المشبوهين
    SUSPICIOUS_USERS=$(who | wc -l)
    if [ "$SUSPICIOUS_USERS" -lt 5 ]; then
        print_success "المستخدمين المتصلين: $SUSPICIOUS_USERS (طبيعي)"
        ((PASSED_CHECKS++))
    else
        print_warning "المستخدمين المتصلين: $SUSPICIOUS_USERS (كثير)"
        ((WARNING_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# فحص تطبيقات الويب
check_web_applications() {
    print_info "فحص تطبيقات الويب..."
    
    # فحص تطبيقات محلية
    WEB_APPS=(
        "http://localhost:3000:Frontend"
        "http://localhost:8080:Backend API"
    )
    
    for app in "${WEB_APPS[@]}"; do
        URL=$(echo $app | cut -d: -f1-2)
        NAME=$(echo $app | cut -d: -f3)
        
        if curl -s -f "$URL" > /dev/null 2>&1; then
            print_success "$NAME: متاح ويعمل"
            ((PASSED_CHECKS++))
        else
            print_warning "$NAME: غير متاح أو مشكلة في الاستجابة"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    done
    
    # فحص أمان الشهادات
    if command -v openssl &> /dev/null; then
        # فحص شهادة محلية (إذا كانت متوفرة)
        if [ -f "/etc/ssl/certs/saler.crt" ]; then
            CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/ssl/certs/saler.crt | cut -d= -f2)
            CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo "0")
            CURRENT_EPOCH=$(date +%s)
            DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
            
            if [ "$DAYS_UNTIL_EXPIRY" -gt 30 ]; then
                print_success "شهادة SSL: صالحة لـ $DAYS_UNTIL_EXPIRY يوم"
                ((PASSED_CHECKS++))
            else
                print_warning "شهادة SSL: تنتهي خلال $DAYS_UNTIL_EXPIRY يوم"
                ((WARNING_CHECKS++))
            fi
            ((TOTAL_CHECKS++))
        fi
    fi
}

# فحص قواعد البيانات
check_databases() {
    print_info "فحص قواعد البيانات..."
    
    # فحص PostgreSQL
    if command -v psql &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            print_success "PostgreSQL: متاح ومتجاوب"
            ((PASSED_CHECKS++))
        else
            print_error "PostgreSQL: غير متاح"
            ((FAILED_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
    
    # فحص Redis
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            print_success "Redis: متاح ومتجاوب"
            ((PASSED_CHECKS++))
        else
            print_error "Redis: غير متاح"
            ((FAILED_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
    
    # فحص MySQL (إذا كان مثبتاً)
    if command -v mysql &> /dev/null; then
        if mysqladmin ping -h localhost &> /dev/null; then
            print_success "MySQL: متاح ومتجاوب"
            ((PASSED_CHECKS++))
        else
            print_warning "MySQL: غير متاح"
            ((WARNING_CHECKS++))
        fi
        ((TOTAL_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# فحص سجلات الأخطاء
check_error_logs() {
    print_info "فحص سجلات الأخطاء..."
    
    LOG_FILES=(
        "/var/log/syslog"
        "/var/log/auth.log"
        "./logs/error.log"
        "./logs/application.log"
    )
    
    for log_file in "${LOG_FILES[@]}"; do
        if [ -f "$log_file" ]; then
            # البحث عن أخطاء في آخر 100 سطر
            ERROR_COUNT=$(tail -100 "$log_file" 2>/dev/null | grep -i -c "error\|critical\|fatal" || echo "0")
            
            if [ "$ERROR_COUNT" -eq 0 ]; then
                print_success "السجل $log_file: لا توجد أخطاء حديثة"
                ((PASSED_CHECKS++))
            elif [ "$ERROR_COUNT" -lt 5 ]; then
                print_warning "السجل $log_file: $ERROR_COUNT خطأ في آخر 100 سطر"
                ((WARNING_CHECKS++))
            else
                print_error "السجل $log_file: $ERROR_COUNT خطأ في آخر 100 سطر (كثير)"
                ((FAILED_CHECKS++))
            fi
            ((TOTAL_CHECKS++))
        fi
    done
}

# إنشاء تقرير JSON
generate_json_report() {
    local report_file="$REPORT_DIR/health-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "uptime": "$(uptime -p 2>/dev/null || uptime)",
    "system_info": {
        "os": "$(uname -s)",
        "kernel": "$(uname -r)",
        "architecture": "$(uname -m)",
        "cpu_cores": $(nproc),
        "total_memory_gb": $(free -g | awk '/^Mem:/{print $2}'),
        "disk_usage_percent": $(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    },
    "health_summary": {
        "total_checks": $TOTAL_CHECKS,
        "passed_checks": $PASSED_CHECKS,
        "failed_checks": $FAILED_CHECKS,
        "warning_checks": $WARNING_CHECKS,
        "success_rate": $(echo "scale=2; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "0")
    },
    "alerts": [
EOF
    
    # إضافة التنبيهات
    if [ $FAILED_CHECKS -gt 0 ] || [ $WARNING_CHECKS -gt 0 ]; then
        local alert_count=0
        [ $FAILED_CHECKS -gt 0 ] && ((alert_count++))
        [ $WARNING_CHECKS -gt 0 ] && ((alert_count++))
        
        echo "        {" >> "$report_file"
        echo "            \"severity\": \"$([ $FAILED_CHECKS -gt 0 ] && echo "critical" || echo "warning")\"," >> "$report_file"
        echo "            \"message\": \"$([ $FAILED_CHECKS -gt 0 ] && echo "فشل في $FAILED_CHECKS فحص" || echo "تحذير في $WARNING_CHECKS فحص")\"," >> "$report_file"
        echo "            \"recommendations\": \"يرجى مراجعة السجلات واتخاذ الإجراءات اللازمة\"" >> "$report_file"
        echo "        }" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
    ],
    "recommendations": [
        "مراقبة استخدام المعالج والذاكرة بانتظام",
        "تحديث النظام والتطبيقات بشكل دوري",
        "مراجعة سجلات الأخطاء بانتظام",
        "تفعيل النسخ الاحتياطية التلقائية",
        "مراقبة مساحة القرص وتنظيفها"
    ]
}
EOF
    
    print_success "تم إنشاء تقرير JSON: $report_file"
    echo "$report_file"
}

# إنشاء تقرير نصي
generate_text_report() {
    local report_file="$REPORT_DIR/health-summary-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "تقرير فحص الصحة الشامل - شركة سالير"
        echo "================================================"
        echo "التاريخ: $(date)"
        echo "المضيف: $(hostname)"
        echo "وقت التشغيل: $(uptime -p 2>/dev/null || uptime)"
        echo ""
        echo "ملخص النتائج:"
        echo "  إجمالي الفحوصات: $TOTAL_CHECKS"
        echo "  فحوصات ناجحة: $PASSED_CHECKS"
        echo "  فحوصات فاشلة: $FAILED_CHECKS"
        echo "  تحذيرات: $WARNING_CHECKS"
        echo "  معدل النجاح: $(echo "scale=1; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "0")%"
        echo ""
        
        if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
            echo "✅ حالة النظام: ممتازة"
            echo "   جميع الفحوصات نجحت والنظام يعمل بشكل طبيعي"
        elif [ $FAILED_CHECKS -eq 0 ]; then
            echo "⚠️  حالة النظام: جيدة مع تحذيرات"
            echo "   النظام يعمل بشكل طبيعي مع بعض التحذيرات"
        elif [ $FAILED_CHECKS -lt $TOTAL_CHECKS/2 ]; then
            echo "🚨 حالة النظام: تحتاج انتباه"
            echo "   بعض الخدمات تحتاج مراجعة"
        else
            echo "🔥 حالة النظام: حرجة"
            echo "   تتطلب تدخل فوري"
        fi
        
        echo ""
        echo "التوصيات:"
        echo "• مراجعة الفحوصات الفاشلة واتخاذ الإجراءات اللازمة"
        echo "• مراقبة استخدام الموارد بانتظام"
        echo "• تحديث النظام والتطبيقات"
        echo "• تحسين إعدادات الأمان"
        echo ""
        echo "تم إنشاء هذا التقرير بواسطة سكريبت فحص الصحة الشامل"
        
    } > "$report_file"
    
    print_success "تم إنشاء تقرير نصي: $report_file"
    echo "$report_file"
}

# إرسال تنبيهات
send_alerts() {
    if [ $FAILED_CHECKS -gt 0 ]; then
        print_warning "تم اكتشاف $FAILED_CHECKS فحص فاشل - يتم إرسال تنبيه..."
        
        # هنا يمكن إضافة كود إرسال التنبيهات
        # مثال: إرسال بريد إلكتروني أو webhook
        
        return 0
    fi
}

# عرض المساعدة
show_help() {
    cat << EOF
استخدام: $0 [OPTIONS]

خيارات الفحص:
  --network       فحص الاتصال بالشبكة
  --resources     فحص موارد النظام
  --docker        فحص خدمات Docker
  --services      فحص الخدمات الشبكية
  --security      فحص أمان النظام
  --web          فحص تطبيقات الويب
  --database     فحص قواعد البيانات
  --logs         فحص سجلات الأخطاء
  --all          فحص شامل (افتراضي)
  --quick        فحص سريع (فحوصات أساسية فقط)

خيارات أخرى:
  --json          إنشاء تقرير JSON
  --text          إنشاء تقرير نصي
  --alerts        إرسال التنبيهات
  --help          عرض هذه المساعدة

أمثلة:
  $0 --all --json --text    # فحص شامل مع تقارير
  $0 --quick                # فحص سريع
  $0 --network --services   # فحص الشبكة والخدمات فقط

EOF
}

# فحص سريع
quick_health_check() {
    print_info "تشغيل فحص الصحة السريع..."
    
    # فحص أساسي فقط
    check_network_connectivity
    check_system_resources
    check_docker_services
    check_network_services
}

# فحص شامل
comprehensive_health_check() {
    print_info "تشغيل فحص الصحة الشامل..."
    
    check_network_connectivity
    check_system_resources
    check_docker_services
    check_network_services
    check_system_security
    check_web_applications
    check_databases
    check_error_logs
}

# الدالة الرئيسية
main() {
    # معالجة المعاملات
    CREATE_JSON=false
    CREATE_TEXT=false
    SEND_ALERTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --network)
                check_network_connectivity
                shift
                ;;
            --resources)
                check_system_resources
                shift
                ;;
            --docker)
                check_docker_services
                shift
                ;;
            --services)
                check_network_services
                shift
                ;;
            --security)
                check_system_security
                shift
                ;;
            --web)
                check_web_applications
                shift
                ;;
            --database)
                check_databases
                shift
                ;;
            --logs)
                check_error_logs
                shift
                ;;
            --quick)
                quick_health_check
                shift
                ;;
            --all)
                comprehensive_health_check
                shift
                ;;
            --json)
                CREATE_JSON=true
                shift
                ;;
            --text)
                CREATE_TEXT=true
                shift
                ;;
            --alerts)
                SEND_ALERTS=true
                shift
                ;;
            --help|-h)
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
    
    # إذا لم يتم تحديد فحوصات محددة، تشغيل الفحص الشامل
    if [ $TOTAL_CHECKS -eq 0 ]; then
        comprehensive_health_check
    fi
    
    # إنشاء التقارير
    JSON_REPORT=""
    TEXT_REPORT=""
    
    if [ "$CREATE_JSON" = true ]; then
        JSON_REPORT=$(generate_json_report)
    fi
    
    if [ "$CREATE_TEXT" = true ]; then
        TEXT_REPORT=$(generate_text_report)
    fi
    
    # إرسال التنبيهات إذا كان مطلوباً
    if [ "$SEND_ALERTS" = true ]; then
        send_alerts
    fi
    
    # عرض الملخص النهائي
    print_header "ملخص فحص الصحة"
    echo "📊 إجمالي الفحوصات: $TOTAL_CHECKS"
    echo "✅ فحوصات ناجحة: $PASSED_CHECKS"
    echo "❌ فحوصات فاشلة: $FAILED_CHECKS"
    echo "⚠️  تحذيرات: $WARNING_CHECKS"
    echo "📈 معدل النجاح: $(echo "scale=1; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "0")%"
    
    if [ -n "$JSON_REPORT" ]; then
        echo "📄 تقرير JSON: $JSON_REPORT"
    fi
    
    if [ -n "$TEXT_REPORT" ]; then
        echo "📝 تقرير نصي: $TEXT_REPORT"
    fi
    
    # تحديد حالة النظام النهائية
    if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
        print_success "🎉 النظام في حالة ممتازة!"
        exit 0
    elif [ $FAILED_CHECKS -eq 0 ]; then
        print_warning "⚠️  النظام يعمل بشكل جيد مع تحذيرات"
        exit 1
    else
        print_error "🚨 النظام يحتاج انتباه فوري"
        exit 2
    fi
}

# تشغيل السكريبت
main "$@"