#!/bin/bash
# System Metrics Collection Script
# سكريبت جمع ميتريكس النظام

# إعداد المتغيرات
METRICS_DIR="/var/lib/prometheus/node-exporter"
LOG_FILE="/var/log/system-metrics.log"
METRICS_FILE="/tmp/system-metrics.prom"
PID_FILE="/tmp/system-metrics.pid"

# الألوان للعرض
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة التسجيل
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# دالة التحقق من الصلاحيات
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}يجب تشغيل السكريبت بصلاحيات المدير${NC}"
        exit 1
    fi
}

# جمع معلومات النظام الأساسية
collect_system_info() {
    log_message "بدء جمع معلومات النظام الأساسية..."
    
    # معلومات النواة
    echo "# TYPE system_info gauge" >> "$METRICS_FILE"
    echo "system_info_kernel_version $(uname -r | sed 's/[^0-9.]//g')" >> "$METRICS_FILE"
    echo "system_info_architecture $(uname -m)" >> "$METRICS_FILE"
    echo "system_info_hostname $(hostname)" >> "$METRICS_FILE"
    
    # وقت التشغيل
    uptime_seconds=$(cat /proc/uptime | awk '{print $1}')
    echo "system_uptime_seconds $uptime_seconds" >> "$METRICS_FILE"
    
    log_message "تم جمع معلومات النظام الأساسية"
}

# جمع ميتريكس المعالج
collect_cpu_metrics() {
    log_message "جمع ميتريكس المعالج..."
    
    # قراءة بيانات المعالج
    cpu_stats=$(cat /proc/stat)
    
    # حساب الاستخدام
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    if [[ -n "$cpu_usage" ]]; then
        echo "# TYPE system_cpu_usage_percent gauge" >> "$METRICS_FILE"
        echo "system_cpu_usage_percent $cpu_usage" >> "$METRICS_FILE"
    fi
    
    # تحميل النظام
    if [[ -f /proc/loadavg ]]; then
        load_avg=$(cat /proc/loadavg | awk '{print $1}')
        echo "# TYPE system_load_average gauge" >> "$METRICS_FILE"
        echo "system_load_average $load_avg" >> "$METRICS_FILE"
    fi
    
    # عدد المعالجات
    cpu_count=$(nproc)
    echo "# TYPE system_cpu_count gauge" >> "$METRICS_FILE"
    echo "system_cpu_count $cpu_count" >> "$METRICS_FILE"
    
    log_message "تم جمع ميتريكس المعالج"
}

# جمع ميتريكس الذاكرة
collect_memory_metrics() {
    log_message "جمع ميتريكس الذاكرة..."
    
    if [[ -f /proc/meminfo ]]; then
        # قراءة معلومات الذاكرة
        total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        available_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        free_mem=$(grep MemFree /proc/meminfo | awk '{print $2}')
        used_mem=$(($total_mem - $available_mem))
        
        # حساب النسب المئوية
        memory_usage_percent=$(echo "scale=2; ($used_mem * 100) / $total_mem" | bc)
        memory_free_percent=$(echo "scale=2; ($free_mem * 100) / $total_mem" | bc)
        
        echo "# TYPE system_memory_bytes gauge" >> "$METRICS_FILE"
        echo "system_memory_total_bytes $((total_mem * 1024))" >> "$METRICS_FILE"
        echo "system_memory_used_bytes $((used_mem * 1024))" >> "$METRICS_FILE"
        echo "system_memory_available_bytes $((available_mem * 1024))" >> "$METRICS_FILE"
        echo "system_memory_free_bytes $((free_mem * 1024))" >> "$METRICS_FILE"
        
        echo "# TYPE system_memory_usage_percent gauge" >> "$METRICS_FILE"
        echo "system_memory_usage_percent $memory_usage_percent" >> "$METRICS_FILE"
        echo "system_memory_free_percent $memory_free_percent" >> "$METRICS_FILE"
        
        # تحليل الذاكرة بالتفصيل
        if command -v smem &> /dev/null; then
            echo "# TYPE system_memory_processes gauge" >> "$METRICS_FILE"
            top_memory_processes=$(smem -r -k | head -n 5 | tail -n +2 | awk '{sum += $4} END {print sum}')
            if [[ -n "$top_memory_processes" ]]; then
                echo "system_memory_top_processes_bytes $((top_memory_processes * 1024))" >> "$METRICS_FILE"
            fi
        fi
    fi
    
    log_message "تم جمع ميتريكس الذاكرة"
}

# جمع ميتريكس القرص
collect_disk_metrics() {
    log_message "جمع ميتريكس القرص..."
    
    # معلومات القرص العامة
    if command -v df &> /dev/null; then
        echo "# TYPE system_disk_usage_percent gauge" >> "$METRICS_FILE"
        echo "# TYPE system_disk_bytes gauge" >> "$METRICS_FILE"
        
        while read -r filesystem size used avail capacity mountpoint; do
            if [[ "$filesystem" != "Filesystem" && "$capacity" != "Use%" ]]; then
                capacity_num=$(echo "$capacity" | sed 's/%//')
                echo "system_disk_usage_percent{mountpoint=\"$mountpoint\"} $capacity_num" >> "$METRICS_FILE"
                
                # تحويل إلى بايت
                size_bytes=$(numfmt --from=iec "$size")
                used_bytes=$(numfmt --from=iec "$used")
                avail_bytes=$(numfmt --from=iec "$avail")
                
                echo "system_disk_total_bytes{mountpoint=\"$mountpoint\"} $size_bytes" >> "$METRICS_FILE"
                echo "system_disk_used_bytes{mountpoint=\"$mountpoint\"} $used_bytes" >> "$METRICS_FILE"
                echo "system_disk_available_bytes{mountpoint=\"$mountpoint\"} $avail_bytes" >> "$METRICS_FILE"
            fi
        done < <(df -h --output=source,size,used,avail,pcent,target)
    fi
    
    # I/O القرص
    if [[ -f /proc/diskstats ]]; then
        echo "# TYPE system_disk_io gauge" >> "$METRICS_FILE"
        
        while read -r major minor device reads_completed reads_merged sectors_read read_time writes_completed writes_merged sectors_written write_time io_in_progress io_time weighted_io_time; do
            if [[ "$device" =~ ^(sd[a-z]|hd[a-z]|nvme[0-9]n1)$ ]]; then
                echo "system_disk_reads_total{device=\"$device\"} $reads_completed" >> "$METRICS_FILE"
                echo "system_disk_read_bytes_total{device=\"$device\"} $((sectors_read * 512))" >> "$METRICS_FILE"
                echo "system_disk_writes_total{device=\"$device\"} $writes_completed" >> "$METRICS_FILE"
                echo "system_disk_write_bytes_total{device=\"$device\"} $((sectors_written * 512))" >> "$METRICS_FILE"
                echo "system_disk_io_time_seconds{device=\"$device\"} $((io_time / 1000))" >> "$METRICS_FILE"
                echo "system_disk_weighted_io_time_seconds{device=\"$device\"} $((weighted_io_time / 1000))" >> "$METRICS_FILE"
            fi
        done < /proc/diskstats
    fi
    
    log_message "تم جمع ميتريكس القرص"
}

# جمع ميتريكس الشبكة
collect_network_metrics() {
    log_message "جمع ميتريكس الشبكة..."
    
    if [[ -f /proc/net/dev ]]; then
        echo "# TYPE system_network_bytes gauge" >> "$METRICS_FILE"
        echo "# TYPE system_network_packets gauge" >> "$METRICS_FILE"
        echo "# TYPE system_network_errors gauge" >> "$METRICS_FILE"
        
        while read -r interface bytes_received packets_received errs_receive drops_receive bytes_transmitted packets_transmitted errs_transmit drops_transmit; do
            interface=$(echo "$interface" | sed 's/://')
            
            # تخطي واجهات غير مرغوبة
            if [[ "$interface" =~ ^(lo|docker|br-|veth) ]]; then
                continue
            fi
            
            echo "system_network_bytes_received_total{interface=\"$interface\"} $bytes_received" >> "$METRICS_FILE"
            echo "system_network_bytes_transmitted_total{interface=\"$interface\"} $bytes_transmitted" >> "$METRICS_FILE"
            echo "system_network_packets_received_total{interface=\"$interface\"} $packets_received" >> "$METRICS_FILE"
            echo "system_network_packets_transmitted_total{interface=\"$interface\"} $packets_transmitted" >> "$METRICS_FILE"
            echo "system_network_errors_received_total{interface=\"$interface\"} $errs_receive" >> "$METRICS_FILE"
            echo "system_network_errors_transmitted_total{interface=\"$interface\"} $errs_transmit" >> "$METRICS_FILE"
            echo "system_network_drops_received_total{interface=\"$interface\"} $drops_receive" >> "$METRICS_FILE"
            echo "system_network_drops_transmitted_total{interface=\"$interface\"} $drops_transmit" >> "$METRICS_FILE"
        done < /proc/net/dev
    fi
    
    # الاتصالات النشطة
    if command -v ss &> /dev/null; then
        echo "# TYPE system_network_connections gauge" >> "$METRICS_FILE"
        
        established=$(ss -t state established | wc -l)
        listening=$(ss -t state listening | wc -l)
        
        echo "system_network_connections_established $((established - 1))" >> "$METRICS_FILE"
        echo "system_network_connections_listening $((listening - 1))" >> "$METRICS_FILE"
    fi
    
    log_message "تم جمع ميتريكس الشبكة"
}

# جمع ميتريكس العمليات
collect_process_metrics() {
    log_message "جمع ميتريكس العمليات..."
    
    # عدد العمليات
    process_count=$(ps aux | wc -l)
    echo "# TYPE system_processes gauge" >> "$METRICS_FILE"
    echo "system_process_count $process_count" >> "$METRICS_FILE"
    
    # العمليات الأكثر استهلاكاً للمعالج
    if command -v ps &> /dev/null; then
        echo "# TYPE system_process_cpu gauge" >> "$METRICS_FILE"
        while IFS= read -r line; do
            pid=$(echo "$line" | awk '{print $2}')
            cpu=$(echo "$line" | awk '{print $3}')
            cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
            
            if [[ -n "$pid" && "$cpu" != "CPU" ]]; then
                echo "system_process_cpu_percent{pid=\"$pid\",command=\"$cmd\"} $cpu" >> "$METRICS_FILE"
            fi
        done < <(ps aux --sort=-%cpu | head -n 10)
        
        # العمليات الأكثر استهلاكاً للذاكرة
        echo "# TYPE system_process_memory gauge" >> "$METRICS_FILE"
        while IFS= read -r line; do
            pid=$(echo "$line" | awk '{print $2}')
            mem=$(echo "$line" | awk '{print $4}')
            cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
            
            if [[ -n "$pid" && "$mem" != "MEM" ]]; then
                echo "system_process_memory_percent{pid=\"$pid\",command=\"$cmd\"} $mem" >> "$METRICS_FILE"
            fi
        done < <(ps aux --sort=-%mem | head -n 10)
    fi
    
    log_message "تم جمع ميتريكس العمليات"
}

# جمع ميتريكس الأمان
collect_security_metrics() {
    log_message "جمع ميتريكس الأمان..."
    
    # محاولات الدخول
    if [[ -f /var/log/auth.log ]]; then
        echo "# TYPE system_security_attempts gauge" >> "$METRICS_FILE"
        
        failed_logins=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l)
        accepted_logins=$(grep "Accepted password" /var/log/auth.log 2>/dev/null | wc -l)
        
        echo "system_security_failed_logins_total $failed_logins" >> "$METRICS_FILE"
        echo "system_security_accepted_logins_total $accepted_logins" >> "$METRICS_FILE"
    fi
    
    # المنافذ المفتوحة
    if command -v ss &> /dev/null; then
        echo "# TYPE system_security_open_ports gauge" >> "$METRICS_FILE"
        
        open_ports=$(ss -tulpn | grep LISTEN | awk '{print $5}' | cut -d: -f2 | sort -u | wc -l)
        echo "system_security_open_ports_total $open_ports" >> "$METRICS_FILE"
        
        # المنافذ الخطرة
        dangerous_ports=(21 22 23 25 53 80 110 143 443 993 995)
        dangerous_count=0
        
        for port in "${dangerous_ports[@]}"; do
            if ss -tulpn | grep -q ":$port "; then
                ((dangerous_count++))
            fi
        done
        
        echo "system_security_dangerous_ports_total $dangerous_count" >> "$METRICS_FILE"
    fi
    
    log_message "تم جمع ميتريكس الأمان"
}

# تنظيف الملفات القديمة
cleanup_old_files() {
    log_message "تنظيف الملفات القديمة..."
    
    # حذف ملفات الميتريكس الأقدم من ساعة
    find /tmp -name "system-metrics-*.prom" -type f -mmin +60 -delete
    
    # ضغط ملفات السجل القديمة
    if [[ -f "$LOG_FILE" ]]; then
        if [[ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt 10485760 ]]; then  # 10MB
            gzip "$LOG_FILE"
        fi
    fi
}

# عرض ملخص سريع
display_summary() {
    echo -e "${BLUE}=== ملخص ميتريكس النظام ===${NC}"
    
    if [[ -f "$METRICS_FILE" ]]; then
        echo -e "عدد الميتريكس المجمعة: ${GREEN}$(wc -l < "$METRICS_FILE")${NC}"
        echo -e "حجم الملف: ${GREEN}$(du -h "$METRICS_FILE" | cut -f1)${NC}"
        echo -e "آخر تحديث: ${GREEN}$(date)${NC}"
    fi
    
    # عرض تنبيهات سريعة
    if [[ -f "$METRICS_FILE" ]]; then
        cpu_usage=$(grep "system_cpu_usage_percent " "$METRICS_FILE" | awk '{print $2}')
        memory_usage=$(grep "system_memory_usage_percent " "$METRICS_FILE" | awk '{print $2}')
        
        if [[ -n "$cpu_usage" ]] && [[ $(echo "$cpu_usage > 80" | bc -l) -eq 1 ]]; then
            echo -e "${YELLOW}⚠️  تحذير: استخدام المعالج عالي: $cpu_usage%${NC}"
        fi
        
        if [[ -n "$memory_usage" ]] && [[ $(echo "$memory_usage > 85" | bc -l) -eq 1 ]]; then
            echo -e "${YELLOW}⚠️  تحذير: استخدام الذاكرة عالي: $memory_usage%${NC}"
        fi
    fi
}

# تحديث بيانات الميتريكس
update_metrics() {
    log_message "تحديث ميتريكس النظام..."
    
    # إنشاء ملف ميتريكس جديد
    cat > "$METRICS_FILE" << EOF
# System Metrics - ميتريكس النظام
# Generated at: $(date)
# System: $(uname -a)

EOF
    
    # جمع جميع الميتريكس
    collect_system_info
    collect_cpu_metrics
    collect_memory_metrics
    collect_disk_metrics
    collect_network_metrics
    collect_process_metrics
    collect_security_metrics
    
    log_message "انتهى تحديث الميتريكس"
}

# إدارة الخدمة
manage_service() {
    case "$1" in
        start)
            if [[ -f "$PID_FILE" ]]; then
                echo -e "${YELLOW}الخدمة تعمل بالفعل${NC}"
                return 1
            fi
            
            log_message "بدء خدمة جمع الميتريكس..."
            
            # بدء السكريبت في الخلفية
            (
                while true; do
                    update_metrics
                    display_summary
                    sleep 60  # جمع كل دقيقة
                done
            ) &
            
            echo $! > "$PID_FILE"
            echo -e "${GREEN}تم بدء الخدمة بنجاح (PID: $(cat "$PID_FILE"))${NC}"
            ;;
            
        stop)
            if [[ -f "$PID_FILE" ]]; then
                pid=$(cat "$PID_FILE")
                kill "$pid" 2>/dev/null
                rm -f "$PID_FILE"
                log_message "تم إيقاف الخدمة"
                echo -e "${GREEN}تم إيقاف الخدمة${NC}"
            else
                echo -e "${RED}الخدمة لا تعمل${NC}"
            fi
            ;;
            
        status)
            if [[ -f "$PID_FILE" ]]; then
                pid=$(cat "$PID_FILE")
                if ps -p "$pid" > /dev/null 2>&1; then
                    echo -e "${GREEN}الخدمة تعمل (PID: $pid)${NC}"
                else
                    echo -e "${RED}الخدمة لا تعمل (ملف PID موجود)${NC}"
                    rm -f "$PID_FILE"
                fi
            else
                echo -e "${RED}الخدمة لا تعمل${NC}"
            fi
            ;;
            
        restart)
            manage_service stop
            sleep 2
            manage_service start
            ;;
            
        *)
            echo "الاستخدام: $0 {start|stop|status|restart}"
            exit 1
            ;;
    esac
}

# الدالة الرئيسية
main() {
    echo -e "${BLUE}=== System Metrics Collector ===${NC}"
    echo -e "${BLUE}=== جامع ميتريكس النظام ===${NC}"
    
    # التحقق من الصلاحيات
    check_permissions
    
    # إنشاء المجلدات المطلوبة
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$METRICS_FILE")"
    
    # معالجة الأوامر
    case "${1:-}" in
        service)
            manage_service "${2:-start}"
            ;;
        update)
            update_metrics
            display_summary
            ;;
        cleanup)
            cleanup_old_files
            ;;
        help|--help|-h)
            echo "الاستخدام:"
            echo "  $0 [update|service {start|stop|status|restart}|cleanup|help]"
            echo ""
            echo "الأوامر:"
            echo "  update    - تحديث الميتريكس مرة واحدة"
            echo "  service   - إدارة الخدمة الدورية"
            echo "  cleanup   - تنظيف الملفات القديمة"
            echo "  help      - عرض هذه المساعدة"
            ;;
        *)
            update_metrics
            display_summary
            ;;
    esac
}

# تنفيذ الدالة الرئيسية
main "$@"