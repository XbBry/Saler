#!/bin/bash

# 🚀 Quick Init Script for Saler SaaS Platform
# ============================================
# سكريبت تهيئة سريع لمشروع Saler SaaS Platform

set -euo pipefail

# الألوان
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# دوال الطباعة
print_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}🔹 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# فحص المتطلبات
check_requirements() {
    print_header "فحص المتطلبات الأساسية"
    
    # فحص Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon لا يعمل. يرجى تشغيل Docker."
        exit 1
    fi
    
    print_success "Docker: مثبت ويعمل"
    
    # فحص Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose غير مثبت. يرجى تثبيت Docker Compose."
        exit 1
    fi
    
    print_success "Docker Compose: مثبت"
    
    # فحص Git
    if ! command -v git &> /dev/null; then
        print_warning "Git غير مثبت"
    else
        print_success "Git: مثبت"
    fi
}

# إنشاء المجلدات المطلوبة
create_directories() {
    print_header "إنشاء المجلدات المطلوبة"
    
    local dirs=(
        "logs"
        "backups"
        "tmp"
        "docs/generated"
        "coverage"
        "reports"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_step "تم إنشاء: $dir"
        else
            print_step "موجود بالفعل: $dir"
        fi
    done
    
    print_success "تم إنشاء جميع المجلدات"
}

# إعداد ملف .env
setup_env_file() {
    print_header "إعداد ملف .env"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "تم إنشاء ملف .env من .env.example"
            print_warning "يرجى تحديث ملف .env بالقيم المناسبة"
        else
            cat > .env << 'EOL'
# بيئة التطوير
ENV=development
DEBUG=true

# قاعدة البيانات
DATABASE_URL=postgresql://saler_user:saler_password@localhost:5432/saler
DB_NAME=saler
DB_USER=saler_user
DB_PASSWORD=saler_password

# Redis
REDIS_URL=redis://localhost:6379/0

# الخادم الخلفي
SECRET_KEY=your-super-secret-key-change-in-production
BACKEND_PORT=8000

# واجهة المستخدم
NEXT_PUBLIC_API_URL=http://localhost:8000
FRONTEND_PORT=3000

# AI / ML
OPENAI_API_KEY=your-openai-api-key

# الرسائل
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
ULTRAMSG_API_KEY=your-ultramsg-api-key

# المراقبة
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
EOL
            print_success "تم إنشاء ملف .env أساسي"
        fi
    else
        print_step "ملف .env موجود بالفعل"
    fi
}

# بناء الصور Docker
build_docker_images() {
    print_header "بناء صور Docker"
    
    print_step "بناء صورة Backend..."
    docker build -t saler/backend:latest backend/
    
    print_step "بناء صورة Frontend..."
    docker build -t saler/frontend:latest frontend/
    
    print_success "تم بناء جميع الصور بنجاح"
}

# تشغيل الخدمات
start_services() {
    print_header "تشغيل الخدمات"
    
    print_step "بدء تشغيل PostgreSQL و Redis..."
    docker-compose up -d postgres redis
    
    print_step "انتظار قاعدة البيانات..."
    sleep 10
    
    print_step "تشغيل الخادم الخلفي..."
    docker-compose up -d backend
    
    print_step "تشغيل واجهة المستخدم..."
    docker-compose up -d frontend
    
    print_success "تم تشغيل جميع الخدمات"
}

# فحص صحة النظام
health_check() {
    print_header "فحص صحة النظام"
    
    # انتظار الخدمات
    print_step "انتظار جاهزية الخدمات..."
    sleep 15
    
    # فحص Backend
    if curl -sf http://localhost:8000/health &> /dev/null; then
        print_success "Backend API: يعمل"
    else
        print_warning "Backend API: غير متاح بعد"
    fi
    
    # فحص Frontend
    if curl -sf http://localhost:3000 &> /dev/null; then
        print_success "Frontend: يعمل"
    else
        print_warning "Frontend: غير متاح بعد"
    fi
    
    # فحص PostgreSQL
    if docker-compose exec -T postgres pg_isready -U saler &> /dev/null; then
        print_success "PostgreSQL: يعمل"
    else
        print_warning "PostgreSQL: غير متاح بعد"
    fi
    
    # فحص Redis
    if docker-compose exec -T redis redis-cli ping &> /dev/null | grep -q "PONG"; then
        print_success "Redis: يعمل"
    else
        print_warning "Redis: غير متاح بعد"
    fi
}

# عرض معلومات النظام
show_system_info() {
    print_header "معلومات النظام"
    
    echo -e "${GREEN}🎉 تم إعداد نظام Saler SaaS بنجاح!${NC}\n"
    
    echo -e "${CYAN}📍 الروابط المهمة:${NC}"
    echo -e "  • Backend API: ${BLUE}http://localhost:8000${NC}"
    echo -e "  • API Documentation: ${BLUE}http://localhost:8000/docs${NC}"
    echo -e "  • Frontend Dashboard: ${BLUE}http://localhost:3000${NC}"
    
    echo -e "\n${CYAN}🔧 أوامر مفيدة:${NC}"
    echo -e "  • عرض حالة النظام: ${YELLOW}make status${NC}"
    echo -e "  • عرض السجلات: ${YELLOW}make logs${NC}"
    echo -e "  • إيقاف النظام: ${YELLOW}make down${NC}"
    echo -e "  • إعادة تشغيل: ${YELLOW}make restart${NC}"
    echo -e "  • فحص صحي: ${YELLOW}make health-check${NC}"
    
    echo -e "\n${CYAN}📚 وثائق مفيدة:${NC}"
    echo -e "  • دليل Makefile: ${GREEN}MAKEFILE_GUIDE.md${NC}"
    echo -e "  • README الرئيسي: ${GREEN}README.md${NC}"
    
    echo -e "\n${PURPLE}💡 نصائح:${NC}"
    echo -e "  • استخدم ${YELLOW}make help${NC} لعرض جميع الأوامر"
    echo -e "  • استخدم ${YELLOW}make info${NC} لعرض معلومات النظام"
    echo -e "  • استخدم ${YELLOW}scripts/validate-setup.sh${NC} لفحص صحة النظام"
}

# عرض المساعدة
show_help() {
    echo -e "${PURPLE}سكريبت التهيئة السريع${NC}"
    echo ""
    echo "الاستخدام:"
    echo "  $0 [options]"
    echo ""
    echo "الخيارات:"
    echo "  --build-only    بناء الصور فقط"
    echo "  --start-only    تشغيل الخدمات فقط"
    echo "  --skip-health   تخطي فحص الصحة"
    echo "  --help          عرض هذه المساعدة"
    echo ""
}

# Main execution
main() {
    local build_only=false
    local start_only=false
    local skip_health=false
    
    # معالجة المعاملات
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --start-only)
                start_only=true
                shift
                ;;
            --skip-health)
                skip_health=true
                shift
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
    
    print_header "تهيئة مشروع Saler SaaS Platform"
    echo -e "${BLUE}مرحباً بك في مشروع Saler SaaS Platform!${NC}"
    echo -e "${BLUE}سيتم تهيئة النظام للعمل خلال دقائق...${NC}"
    
    if [ "$build_only" = false ] && [ "$start_only" = false ]; then
        check_requirements
        create_directories
        setup_env_file
    fi
    
    if [ "$start_only" = false ]; then
        build_docker_images
    fi
    
    if [ "$build_only" = false ]; then
        start_services
    fi
    
    if [ "$skip_health" = false ]; then
        health_check
    fi
    
    show_system_info
    
    print_success "تم التهيئة بنجاح! 🚀"
}

# تشغيل السكريبت
main "$@"