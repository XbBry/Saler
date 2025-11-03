#!/bin/bash

# 🚀 Saler PostgreSQL Production Setup Script
# إعداد PostgreSQL للإنتاج - سكريبت التشغيل السريع

set -e

# الألوان للعرض
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # بدون لون

# إعدادات المشروع
PROJECT_NAME="saler"
POSTGRES_USER="saler_user"
POSTGRES_DB="saler"
POSTGRES_CONTAINER="${PROJECT_NAME}_postgres"
REDIS_CONTAINER="${PROJECT_NAME}_redis"

# دوال المساعدة
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${PURPLE}"
    echo "=================================================="
    echo "🚀 SALER POSTGRESQL PRODUCTION SETUP"
    echo "إعداد PostgreSQL للإنتاج"
    echo "=================================================="
    echo -e "${NC}"
}

check_requirements() {
    log_info "فحص المتطلبات..."
    
    # فحص Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker غير مثبت!"
        exit 1
    fi
    
    # فحص Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose غير مثبت!"
        exit 1
    fi
    
    log_success "جميع المتطلبات متوفرة"
}

generate_secure_passwords() {
    log_info "إنشاء كلمات مرور آمنة..."
    
    # إنشاء كلمات مرور آمنة
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SECRET_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-40)
    
    log_success "تم إنشاء كلمات المرور الآمنة"
    log_info "كلمة مرور PostgreSQL: $POSTGRES_PASSWORD"
    log_info "كلمة مرور Redis: $REDIS_PASSWORD"
}

setup_environment() {
    log_info "إعداد ملفات البيئة..."
    
    # نسخ ملفات البيئة إذا لم تكن موجودة
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "تم إنشاء ملف .env"
    else
        log_warning "ملف .env موجود بالفعل"
    fi
    
    # إنشاء ملف .env.database إذا لم يكن موجوداً
    if [ ! -f .env.database ]; then
        cp .env.database .env.database
        log_success "تم إنشاء ملف .env.database"
    else
        log_warning "ملف .env.database موجود بالفعل"
    fi
    
    # تحديث كلمات المرور في ملف .env
    if command -v sed &> /dev/null; then
        sed -i.bak "s/saler_password/$POSTGRES_PASSWORD/g" .env
        sed -i.bak "s/saler_redis_password/$REDIS_PASSWORD/g" .env
        sed -i.bak "s/your-secret-key-change-in-production-min-32-chars/$SECRET_KEY/g" .env
        log_success "تم تحديث كلمات المرور في ملف .env"
    else
        log_warning "sed غير متوفر - يرجى تحديث كلمات المرور يدوياً"
    fi
}

create_directories() {
    log_info "إنشاء المجلدات المطلوبة..."
    
    # إنشاء مجلدات البيانات
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/prometheus
    mkdir -p data/grafana
    mkdir -p data/pgadmin
    mkdir -p backups
    
    # تعيين الصلاحيات
    chmod -R 755 data/
    chmod 755 backups/
    
    log_success "تم إنشاء المجلدات"
}

setup_ssl_certificates() {
    log_info "إعداد شهادات SSL..."
    
    mkdir -p docker/ssl
    
    if [ ! -f docker/ssl/server.crt ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout docker/ssl/server.key \
            -out docker/ssl/server.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        log_success "تم إنشاء شهادات SSL"
    else
        log_warning "شهادات SSL موجودة بالفعل"
    fi
}

start_services() {
    log_info "بدء تشغيل الخدمات..."
    
    # بناء وتشغيل الخدمات
    docker-compose build --no-cache
    docker-compose up -d postgres redis
    
    # انتظار جاهزية الخدمات
    log_info "انتظار جاهزية قاعدة البيانات..."
    sleep 30
    
    # فحص حالة الخدمات
    if docker-compose ps | grep -q "Up"; then
        log_success "تم بدء تشغيل الخدمات بنجاح"
    else
        log_error "فشل في بدء تشغيل الخدمات"
        docker-compose logs
        exit 1
    fi
}

verify_installation() {
    log_info "التحقق من التثبيت..."
    
    # فحص PostgreSQL
    if docker-compose exec postgres pg_isready -U saler_user -d saler > /dev/null 2>&1; then
        log_success "PostgreSQL يعمل بشكل صحيح"
    else
        log_error "PostgreSQL لا يعمل"
        return 1
    fi
    
    # فحص Redis
    if docker-compose exec redis redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        log_success "Redis يعمل بشكل صحيح"
    else
        log_error "Redis لا يعمل"
        return 1
    fi
    
    log_success "جميع الخدمات تعمل بشكل صحيح"
}

show_service_info() {
    echo -e "\n${GREEN}=================================================="
    echo -e "🎉 تم إعداد PostgreSQL بنجاح!"
    echo -e "==================================================${NC}\n"
    
    echo -e "${CYAN}📊 PostgreSQL:${NC}"
    echo -e "   العنوان: ${YELLOW}localhost:5432${NC}"
    echo -e "   قاعدة البيانات: ${YELLOW}$POSTGRES_DB${NC}"
    echo -e "   المستخدم: ${YELLOW}$POSTGRES_USER${NC}"
    echo -e "   كلمة المرور: ${YELLOW}$POSTGRES_PASSWORD${NC}"
    
    echo -e "\n${CYAN}🔄 Redis:${NC}"
    echo -e "   العنوان: ${YELLOW}localhost:6379${NC}"
    echo -e "   كلمة المرور: ${YELLOW}$REDIS_PASSWORD${NC}"
    
    echo -e "\n${CYAN}🔗 روابط المراقبة:${NC}"
    echo -e "   PgAdmin: ${YELLOW}http://localhost:5050${NC}"
    echo -e "   Redis Insight: ${YELLOW}http://localhost:8001${NC}"
    echo -e "   Prometheus: ${YELLOW}http://localhost:9090${NC}"
    echo -e "   Grafana: ${YELLOW}http://localhost:3001${NC}"
    
    echo -e "\n${CYAN}🛠️ أوامر مفيدة:${NC}"
    echo -e "   عرض السجلات: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   إيقاف الخدمات: ${YELLOW}docker-compose down${NC}"
    echo -e "   إعادة تشغيل: ${YELLOW}docker-compose restart${NC}"
    echo -e "   النسخ الاحتياطي: ${YELLOW}docker-compose --profile backup up postgres-backup${NC}"
}

main() {
    print_banner
    
    # تأكيد التثبيت
    read -p "هل تريد المتابعة مع إعداد PostgreSQL للإنتاج؟ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "تم إلغاء التثبيت"
        exit 0
    fi
    
    # تنفيذ خطوات التثبيت
    check_requirements
    generate_secure_passwords
    setup_environment
    create_directories
    setup_ssl_certificates
    start_services
    verify_installation
    show_service_info
    
    log_success "🎉 تم إعداد PostgreSQL للإنتاج بنجاح!"
    echo -e "\n${GREEN}للمزيد من المعلومات، راجع ملف POSTGRESQL_PRODUCTION_SETUP.md${NC}\n"
}

# معالجة الإشارات
trap 'log_error "تم إيقاف التثبيت"; exit 1' INT TERM

# تشغيل السكريبت الرئيسي
main "$@"