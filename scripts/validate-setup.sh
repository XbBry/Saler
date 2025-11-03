#!/bin/bash

# 🔍 Validate Setup Script for Saler SaaS Platform
# ===============================================
# Script للتحقق من صحة إعدادات النظام والتأكد من جاهزية العمل

set -euo pipefail

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# متغيرات التحقق
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# دوال الطباعة الملونة
print_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    local cmd="$1"
    local description="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v "$cmd" &> /dev/null; then
        local version=$(command -v "$cmd" 2>/dev/null | xargs "$cmd" --version 2>/dev/null | head -1 || echo "مثبت")
        print_success "$description: $version"
    else
        print_error "$description: غير مثبت"
    fi
}

check_directory() {
    local dir="$1"
    local description="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -d "$dir" ]; then
        print_success "$description: موجود"
    else
        print_error "$description: غير موجود"
    fi
}

check_file() {
    local file="$1"
    local description="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        print_success "$description: موجود"
    else
        print_warning "$description: غير موجود"
    fi
}

check_port() {
    local port="$1"
    local service="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if nc -z localhost "$port" 2>/dev/null; then
        print_warning "$service: المنفذ $port مستخدم"
    else
        print_success "$service: المنفذ $port متاح"
    fi
}

check_docker_service() {
    local service="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
        print_success "Docker $service: يعمل"
    else
        print_warning "Docker $service: غير مشغل"
    fi
}

# فحص المتطلبات الأساسية
check_system_requirements() {
    print_header "فحص متطلبات النظام الأساسية"
    
    # فحص Docker
    check_command "docker" "Docker"
    check_command "docker-compose" "Docker Compose"
    
    # فحص Docker daemon
    if docker info &>/dev/null; then
        print_success "Docker daemon: يعمل"
    else
        print_error "Docker daemon: لا يعمل"
    fi
    
    # فحص Python
    check_command "python3" "Python 3"
    
    # فحص Node.js
    check_command "node" "Node.js"
    check_command "npm" "npm"
    
    # فحص Git
    check_command "git" "Git"
    
    # فحص curl
    check_command "curl" "curl"
    
    # فحص nc (netcat)
    check_command "nc" "netcat"
}

# فحص بنية المشروع
check_project_structure() {
    print_header "فحص بنية المشروع"
    
    # فحص المجلدات الأساسية
    check_directory "backend" "مجلد الخادم الخلفي"
    check_directory "frontend" "مجلد واجهة المستخدم"
    check_directory "scripts" "مجلد السكريبتات"
    check_directory "k8s" "مجلد Kubernetes"
    check_directory "monitoring" "مجلد المراقبة"
    
    # فحص الملفات الأساسية
    check_file "Makefile" "ملف Makefile"
    check_file "docker-compose.yml" "ملف Docker Compose"
    check_file ".env.example" "ملف متغيرات البيئة النموذجية"
    check_file "README.md" "ملف README"
    
    # فحص ملفات Backend
    check_file "backend/requirements.txt" "ملف متطلبات Backend"
    check_file "backend/Dockerfile" "ملف Docker Backend"
    check_directory "backend/app" "مجلد تطبيق Backend"
    
    # فحص ملفات Frontend
    check_file "frontend/package.json" "ملف package.json للفرونت إند"
    check_file "frontend/Dockerfile" "ملف Docker Frontend"
    check_directory "frontend/src" "مجلد كود Frontend"
}

# فحص إعدادات Docker
check_docker_config() {
    print_header "فحص إعدادات Docker"
    
    # فحص Docker daemon
    if systemctl is-active --quiet docker 2>/dev/null; then
        print_success "Docker service: يعمل"
    else
        print_warning "Docker service: لا يعمل أو غير متوفر"
    fi
    
    # فحص Docker images
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker images | grep -q "saler"; then
        print_success "Docker images: توجد صور للمشروع"
    else
        print_warning "Docker images: لا توجد صور للمشروع"
    fi
    
    # فحص Docker volumes
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker volume ls | grep -q "saler"; then
        print_success "Docker volumes: توجد volumes للمشروع"
    else
        print_warning "Docker volumes: لا توجد volumes للمشروع"
    fi
}

# فحص المنافذ
check_ports() {
    print_header "فحص المنافذ"
    
    check_port 8000 "Backend API"
    check_port 3000 "Frontend"
    check_port 5432 "PostgreSQL"
    check_port 6379 "Redis"
    check_port 9090 "Prometheus"
    check_port 3001 "Grafana"
}

# فحص البيئة
check_environment() {
    print_header "فحص إعدادات البيئة"
    
    # فحص ملف .env
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f ".env" ]; then
        print_success "ملف .env: موجود"
        
        # فحص متغيرات مهمة
        if grep -q "DATABASE_URL" .env 2>/dev/null; then
            print_success "DATABASE_URL: محدد"
        else
            print_warning "DATABASE_URL: غير محدد"
        fi
        
        if grep -q "SECRET_KEY" .env 2>/dev/null; then
            print_success "SECRET_KEY: محدد"
        else
            print_warning "SECRET_KEY: غير محدد"
        fi
    else
        print_warning "ملف .env: غير موجود"
    fi
    
    # فحص متغيرات النظام
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -n "${ENV:-}" ]; then
        print_success "ENV: محدد ($ENV)"
    else
        print_warning "ENV: غير محدد (سيتم استخدام development)"
    fi
}

# فحص حالة Docker services
check_docker_services() {
    print_header "فحص حالة خدمات Docker"
    
    # تحقق من وجود docker-compose.yml
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "docker-compose.yml" ]; then
        print_success "docker-compose.yml: موجود"
        
        # فحص حالة الخدمات
        check_docker_service "postgres"
        check_docker_service "redis"
        check_docker_service "backend"
        check_docker_service "frontend"
    else
        print_error "docker-compose.yml: غير موجود"
    fi
}

# فحص صحة الخدمات
check_service_health() {
    print_header "فحص صحة الخدمات"
    
    # فحص Backend health
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if curl -sf http://localhost:8000/health &>/dev/null; then
        print_success "Backend API: يعمل"
    else
        print_warning "Backend API: غير متصل"
    fi
    
    # فحص Frontend health
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if curl -sf http://localhost:3000 &>/dev/null; then
        print_success "Frontend: يعمل"
    else
        print_warning "Frontend: غير متصل"
    fi
    
    # فحص PostgreSQL
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker-compose exec -T postgres pg_isready -U saler &>/dev/null; then
        print_success "PostgreSQL: يعمل"
    else
        print_warning "PostgreSQL: غير متصل"
    fi
    
    # فحص Redis
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker-compose exec -T redis redis-cli ping &>/dev/null | grep -q "PONG"; then
        print_success "Redis: يعمل"
    else
        print_warning "Redis: غير متصل"
    fi
}

# فحص الذاكرة والمساحة
check_system_resources() {
    print_header "فحص موارد النظام"
    
    # فحص الذاكرة
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local memory_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$memory_gb" -ge 4 ]; then
        print_success "الذاكرة: ${memory_gb}GB (كافية)"
    elif [ "$memory_gb" -ge 2 ]; then
        print_warning "الذاكرة: ${memory_gb}GB (مقبولة)"
    else
        print_error "الذاكرة: ${memory_gb}GB (غير كافية)"
    fi
    
    # فحص مساحة القرص
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        print_success "مساحة القرص: ${disk_usage}% مستخدم (جيد)"
    elif [ "$disk_usage" -lt 90 ]; then
        print_warning "مساحة القرص: ${disk_usage}% مستخدم (مقبول)"
    else
        print_error "مساحة القرص: ${disk_usage}% مستخدم (غير كافي)"
    fi
}

# فحص التحديثات
check_updates() {
    print_header "فحص التحديثات المتاحة"
    
    # فحص تحديثات npm
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if command -v npm &>/dev/null && [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        if cd frontend && npm outdated &>/dev/null; then
            print_warning "تحديثات npm متوفرة"
        else
            print_success "npm packages محدثة"
        fi
    else
        print_info "npm: غير متوفر أو frontend غير موجود"
    fi
    
    # فحص تحديثات pip
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if command -v pip &>/dev/null && [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
        if pip list --outdated &>/dev/null; then
            print_warning "تحديثات pip متوفرة"
        else
            print_success "Python packages محدثة"
        fi
    else
        print_info "pip: غير متوفر أو backend غير موجود"
    fi
}

# تلخيص النتائج
summarize_results() {
    print_header "ملخص فحص النظام"
    
    echo -e "${BLUE}إحصائيات الفحص:${NC}"
    echo -e "  إجمالي الفحوصات: ${CYAN}$TOTAL_CHECKS${NC}"
    echo -e "  ناجحة: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "  تحذيرات: ${YELLOW}$WARNING_CHECKS${NC}"
    echo -e "  فاشلة: ${RED}$FAILED_CHECKS${NC}"
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "  معدل النجاح: ${CYAN}$success_rate%${NC}"
    
    echo -e "\n${PURPLE}توصيات:${NC}"
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo -e "${RED}❗ توجد مشاكل حرجة تحتاج لحل فوري${NC}"
    elif [ $WARNING_CHECKS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  توجد تحذيرات تحتاج للاهتمام${NC}"
    else
        echo -e "${GREEN}✅ النظام جاهز للعمل!${NC}"
    fi
    
    echo -e "\n${CYAN}أوامر مفيدة:${NC}"
    echo -e "  ${BLUE}make help${NC} - عرض جميع الأوامر"
    echo -e "  ${BLUE}make setup${NC} - إعداد النظام"
    echo -e "  ${BLUE}make dev${NC} - تشغيل بيئة التطوير"
    echo -e "  ${BLUE}make health-check${NC} - فحص صحة النظام"
}

# عرض المساعدة
show_help() {
    echo -e "${PURPLE}سكريبت فحص صحة النظام${NC}"
    echo ""
    echo "الاستخدام:"
    echo "  $0 [options]"
    echo ""
    echo "الخيارات:"
    echo "  --quick       فحص سريع"
    echo "  --full        فحص شامل"
    echo "  --docker      فحص Docker فقط"
    echo "  --services    فحص الخدمات فقط"
    echo "  --resources   فحص الموارد فقط"
    echo "  --help        عرض هذه المساعدة"
    echo ""
}

# تنظيف المؤقتات
cleanup() {
    # هنا يمكن إضافة منطق التنظيف إذا لزم الأمر
    true
}

# Main execution
main() {
    local quick_mode=false
    
    # معالجة المعاملات
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                quick_mode=true
                shift
                ;;
            --full)
                quick_mode=false
                shift
                ;;
            --docker)
                check_system_requirements
                check_docker_config
                check_docker_services
                summarize_results
                exit 0
                ;;
            --services)
                check_docker_services
                check_service_health
                summarize_results
                exit 0
                ;;
            --resources)
                check_system_resources
                check_updates
                summarize_results
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}خيار غير معروف: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # إعداد trap للتنظيف
    trap cleanup EXIT
    
    print_header "فحص صحة نظام Saler SaaS Platform"
    echo -e "${BLUE}بدء الفحص الشامل...${NC}"
    
    # فحص شامل
    check_system_requirements
    check_project_structure
    check_docker_config
    check_ports
    check_environment
    check_docker_services
    check_service_health
    check_system_resources
    check_updates
    
    # عرض التلخيص
    summarize_results
}

# تشغيل السكريبت
main "$@"