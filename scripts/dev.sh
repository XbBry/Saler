#!/bin/bash

# 🎯 Saler Development Environment Manager
# =========================================
# مدير بيئة التطوير المتقدم - تشغيل وإيقاف وإدارة جميع الخدمات

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "\n${PURPLE}=======================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=======================================${NC}\n"
}

print_step() {
    echo -e "${BLUE}🔹 $1${NC}"
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

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Load environment variables
load_env() {
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    elif [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    else
        print_warning "ملف البيئة غير موجود - سيتم استخدام الإعدادات الافتراضية"
    fi
}

# Check Docker and services
check_docker() {
    print_step "فحص Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker غير مثبت"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon غير متصل"
        return 1
    fi
    
    print_success "Docker يعمل"
    return 0
}

# Start core services
start_core_services() {
    print_header "تشغيل الخدمات الأساسية"
    
    print_step "بدء تشغيل قاعدة البيانات والذاكرة المؤقتة..."
    
    # Start only core services first
    docker-compose up -d postgres redis
    
    # Wait for services to be ready
    print_info "انتظار جاهزية الخدمات..."
    sleep 10
    
    # Check health
    if docker-compose ps postgres redis | grep -q "Up"; then
        print_success "الخدمات الأساسية تعمل"
    else
        print_error "فشل في بدء تشغيل الخدمات الأساسية"
        return 1
    fi
}

# Start all services
start_all_services() {
    print_header "تشغيل جميع خدمات التطوير"
    
    print_step "بدء تشغيل جميع الخدمات..."
    
    # Start with core services
    docker-compose up -d postgres redis
    
    # Wait for core services
    sleep 8
    
    # Start backend and worker
    docker-compose up -d backend worker
    
    # Wait a bit more
    sleep 5
    
    # Start frontend
    docker-compose up -d frontend
    
    print_info "انتظار بدء جميع الخدمات..."
    sleep 15
    
    # Start development GUI tools if needed
    if [[ "$*" == *"--with-gui"* ]] || [[ "$*" == *"--gui"* ]]; then
        print_step "تشغيل أدوات GUI التطوير..."
        docker-compose --profile development up -d pgadmin redis-commander mailhog
    fi
    
    # Start monitoring if requested
    if [[ "$*" == *"--monitoring"* ]] || [[ "$*" == *"--mon"* ]]; then
        print_step "تشغيل أدوات المراقبة..."
        docker-compose --profile monitoring up -d prometheus grafana
    fi
}

# Show service status
show_status() {
    print_header "حالة الخدمات"
    
    load_env
    
    if ! check_docker; then
        print_error "Docker غير متاح"
        return 1
    fi
    
    echo -e "${BLUE}📊 حالة الخدمات:${NC}\n"
    
    # Check each service
    local services=("postgres" "redis" "backend" "worker" "frontend" "pgadmin" "redis-commander" "mailhog" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
            print_success "$service: يعمل"
        elif docker-compose ps "$service" 2>/dev/null | grep -q "Exited"; then
            print_error "$service: متوقف"
        else
            print_warning "$service: غير معرف"
        fi
    done
    
    echo
    print_info "🔗 الروابط المهمة:"
    echo -e "  • Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  • Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "  • API Documentation: ${GREEN}http://localhost:8000/docs${NC}"
    
    if docker-compose ps pgadmin 2>/dev/null | grep -q "Up"; then
        echo -e "  • pgAdmin: ${GREEN}http://localhost:8080${NC}"
    fi
    
    if docker-compose ps redis-commander 2>/dev/null | grep -q "Up"; then
        echo -e "  • Redis Commander: ${GREEN}http://localhost:8081${NC}"
    fi
    
    if docker-compose ps mailhog 2>/dev/null | grep -q "Up"; then
        echo -e "  • MailHog: ${GREEN}http://localhost:8025${NC}"
    fi
    
    if docker-compose ps prometheus 2>/dev/null | grep -q "Up"; then
        echo -e "  • Prometheus: ${GREEN}http://localhost:9090${NC}"
    fi
    
    if docker-compose ps grafana 2>/dev/null | grep -q "Up"; then
        echo -e "  • Grafana: ${GREEN}http://localhost:3001 (admin/admin)${NC}"
    fi
}

# Show logs
show_logs() {
    local service=${1:-}
    local lines=${2:-50}
    
    print_header "عرض السجلات"
    
    if [ -n "$service" ]; then
        print_step "عرض سجلات $service (آخر $lines سطر)..."
        docker-compose logs --tail=$lines -f "$service"
    else
        print_step "عرض سجلات جميع الخدمات (آخر $lines سطر)..."
        docker-compose logs --tail=$lines -f
    fi
}

# Stop services
stop_services() {
    print_header "إيقاف الخدمات"
    
    print_step "إيقاف جميع الخدمات..."
    docker-compose down
    
    # Clean up networks
    docker network prune -f >/dev/null 2>&1 || true
    
    print_success "تم إيقاف جميع الخدمات"
}

# Restart services
restart_services() {
    print_header "إعادة تشغيل الخدمات"
    
    print_step "إيقاف الخدمات..."
    docker-compose down
    
    print_step "انتظار 3 ثوان..."
    sleep 3
    
    print_step "تشغيل الخدمات..."
    start_all_services "$@"
}

# Rebuild services
rebuild_services() {
    print_header "إعادة بناء الخدمات"
    
    print_step "إيقاف الخدمات..."
    docker-compose down
    
    print_step "إعادة بناء الصور..."
    docker-compose build --no-cache
    
    print_step "تشغيل الخدمات..."
    start_all_services "$@"
}

# Clean up everything
clean_all() {
    print_header "تنظيف شامل"
    
    print_warning "سيتم حذف جميع البيانات والتكوينات!"
    read -p "هل أنت متأكد؟ (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "تم إلغاء التنظيف"
        return
    fi
    
    print_step "إيقاف الخدمات..."
    docker-compose down -v
    
    print_step "حذف الصور..."
    docker system prune -af --volumes
    
    print_step "حذف البيانات المحلية..."
    rm -rf dev-data/* logs/* 2>/dev/null || true
    rm -f .env.local backend.pid frontend.pid
    
    print_success "تم التنظيف الشامل"
}

# Database operations
database_op() {
    local action=$1
    
    case $action in
        "backup")
            print_header "نسخ احتياطي لقاعدة البيانات"
            local backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"
            
            print_step "إنشاء نسخة احتياطية: $backup_name"
            docker-compose exec -T postgres pg_dump -U saler_user saler > "dev-data/backups/$backup_name"
            
            if [ -f "dev-data/backups/$backup_name" ]; then
                print_success "تم إنشاء النسخة الاحتياطية: $backup_name"
                ls -la "dev-data/backups/"
            else
                print_error "فشل في إنشاء النسخة الاحتياطية"
            fi
            ;;
        "restore")
            local backup_file=$2
            if [ -z "$backup_file" ]; then
                print_error "حدد ملف النسخة الاحتياطية"
                return 1
            fi
            
            print_header "استعادة قاعدة البيانات"
            print_warning "سيتم استبدال البيانات الحالية!"
            read -p "هل أنت متأكد؟ (y/N): " -n 1 -r
            echo
            
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "تم إلغاء الاستعادة"
                return
            fi
            
            print_step "استعادة من: $backup_file"
            docker-compose exec -T postgres psql -U saler_user saler < "dev-data/backups/$backup_file"
            print_success "تم استعادة قاعدة البيانات"
            ;;
        "reset")
            print_header "إعادة تعيين قاعدة البيانات"
            print_warning "سيتم حذف جميع البيانات!"
            read -p "هل أنت متأكد؟ (y/N): " -n 1 -r
            echo
            
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "تم إلغاء الإعادة"
                return
            fi
            
            print_step "إعادة تعيين قاعدة البيانات..."
            docker-compose exec postgres psql -U saler_user -c "DROP DATABASE IF EXISTS saler;"
            docker-compose exec postgres psql -U saler_user -c "CREATE DATABASE saler;"
            
            # Run migrations
            print_step "تشغيل الهجرات..."
            docker-compose exec backend python -m alembic upgrade head
            
            print_success "تم إعادة تعيين قاعدة البيانات"
            ;;
        *)
            echo "الأوامر المتاحة: backup, restore, reset"
            ;;
    esac
}

# Show help
show_help() {
    echo -e "${PURPLE}Saler Development Environment Manager${NC}\n"
    echo "الاستخدام:"
    echo "  $0 [command] [options]\n"
    echo "الأوامر:"
    echo "  start               - تشغيل جميع خدمات التطوير"
    echo "  start --with-gui    - تشغيل مع أدوات GUI التطوير"
    echo "  start --monitoring  - تشغيل مع أدوات المراقبة"
    echo "  stop                - إيقاف جميع الخدمات"
    echo "  restart             - إعادة تشغيل جميع الخدمات"
    echo "  rebuild             - إعادة بناء وتشغيل الخدمات"
    echo "  status              - عرض حالة الخدمات"
    echo "  logs [service]      - عرض السجلات (خدمة محددة أو جميع الخدمات)"
    echo "  clean               - تنظيف شامل (بيانات + صور)"
    echo "  db backup           - إنشاء نسخة احتياطية لقاعدة البيانات"
    echo "  db restore <file>   - استعادة قاعدة البيانات من نسخة احتياطية"
    echo "  db reset            - إعادة تعيين قاعدة البيانات"
    echo "  help                - عرض هذه المساعدة\n"
    
    echo -e "${BLUE}أمثلة:${NC}"
    echo "  $0 start --with-gui --monitoring"
    echo "  $0 logs backend"
    echo "  $0 db backup"
    echo "  $0 db restore backup_20231201_143022.sql"
}

# Main function
main() {
    load_env
    
    case "${1:-start}" in
        "start")
            if ! check_docker; then
                print_error "Docker مطلوب للتشغيل"
                exit 1
            fi
            start_all_services "$@"
            sleep 5
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services "$@"
            ;;
        "rebuild")
            rebuild_services "$@"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2" "${3:-50}"
            ;;
        "clean")
            clean_all
            ;;
        "db")
            database_op "$2" "$3"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "أمر غير معروف: $1"
            echo "استخدم '$0 help' للمساعدة"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"