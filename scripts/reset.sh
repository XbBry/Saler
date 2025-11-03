#!/bin/bash

# 🧹 Saler Environment Reset & Cleanup Script
# =============================================
# سكريبت إعادة تعيين وتنظيف بيئة التطوير

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

# Stop all services
stop_all_services() {
    print_step "إيقاف جميع الخدمات..."
    if [ -f "docker-compose.yml" ]; then
        docker-compose down 2>/dev/null || true
        docker-compose --profile development down 2>/dev/null || true
        docker-compose --profile monitoring down 2>/dev/null || true
    fi
    print_success "تم إيقاف الخدمات"
}

# Clean Docker resources
clean_docker() {
    print_step "تنظيف موارد Docker..."
    
    # Stop and remove containers
    print_info "إزالة الحاويات..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    # Remove networks
    print_info "إزالة الشبكات..."
    docker network prune -f 2>/dev/null || true
    
    # Remove unused volumes (optional)
    print_info "إزالة الحجم غير المستخدمة..."
    docker volume prune -f 2>/dev/null || true
    
    # Remove unused images
    print_info "إزالة الصور غير المستخدمة..."
    docker image prune -af 2>/dev/null || true
    
    # Clean up build cache
    print_info "تنظيف ذاكرة التخزين المؤقت..."
    docker builder prune -af 2>/dev/null || true
    
    print_success "تم تنظيف موارد Docker"
}

# Clean project data
clean_project_data() {
    print_step "تنظيف بيانات المشروع..."
    
    # Clean logs
    if [ -d "logs" ]; then
        print_info "تنظيف سجلات التطبيق..."
        find logs/ -name "*.log" -delete 2>/dev/null || true
        find logs/ -name "*.log.*" -delete 2>/dev/null || true
    fi
    
    # Clean dev data
    if [ -d "dev-data" ]; then
        print_info "تنظيف بيانات التطوير..."
        rm -rf dev-data/database/* 2>/dev/null || true
        rm -rf dev-data/redis/* 2>/dev/null || true
        rm -rf dev-data/prometheus/* 2>/dev/null || true
        rm -rf dev-data/grafana/* 2>/dev/null || true
        rm -rf dev-data/uploads/* 2>/dev/null || true
        
        # Keep backups directory
        if [ -d "dev-data/backups" ]; then
            print_info "الاحتفاظ بنسخ احتياطية..."
            ls -la dev-data/backups/
        fi
    fi
    
    # Clean Python cache
    print_info "تنظيف ذاكرة Python المؤقتة..."
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    find . -name "*.pyo" -delete 2>/dev/null || true
    
    # Clean Node.js cache
    print_info "تنظيف ذاكرة Node.js المؤقتة..."
    if [ -d "frontend" ]; then
        cd frontend
        rm -rf node_modules/.cache 2>/dev/null || true
        rm -rf .next 2>/dev/null || true
        cd ..
    fi
    
    # Clean IDE cache
    print_info "تنظيف ذاكرة IDE..."
    rm -rf .vscode/settings.json 2>/dev/null || true
    rm -rf .idea/workspace.xml 2>/dev/null || true
    
    # Clean PID files
    print_info "تنظيف ملفات PID..."
    rm -f backend.pid frontend.pid *.pid 2>/dev/null || true
    
    # Clean other temporary files
    print_info "تنظيف الملفات المؤقتة..."
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
    find . -name "Thumbs.db" -delete 2>/dev/null || true
    
    print_success "تم تنظيف بيانات المشروع"
}

# Reset environment files
reset_env_files() {
    print_step "إعادة تعيين ملفات البيئة..."
    
    # Reset .env.local if it exists
    if [ -f ".env.local" ]; then
        print_info "إعادة تعيين .env.local..."
        cp .env.example .env.local 2>/dev/null || true
        print_success "تم إعادة تعيين .env.local"
    fi
    
    # Clean docker volumes if requested
    if [[ "$*" == *"--reset-data"* ]]; then
        print_warning "سيتم حذف جميع البيانات!"
        read -p "هل أنت متأكد؟ (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_step "حذف البيانات..."
            docker-compose down -v 2>/dev/null || true
            print_success "تم حذف جميع البيانات"
        fi
    fi
}

# Recreate project structure
recreate_structure() {
    print_step "إعادة إنشاء بنية المشروع..."
    
    local dirs=(
        "logs"
        "dev-data"
        "dev-data/database"
        "dev-data/redis"
        "dev-data/prometheus"
        "dev-data/grafana"
        "dev-data/uploads"
        "dev-data/backups"
        "scripts/tests"
        "scripts/ci"
        "docs/development"
        "docs/guides"
        "docs/api"
        "docs/architecture"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_info "تم إنشاء مجلد: $dir"
        fi
    done
    
    # Create .gitkeep files
    find dev-data -type d -empty -exec touch {}/.gitkeep \; 2>/dev/null || true
    
    print_success "تم إعادة إنشاء بنية المشروع"
}

# Clean IDE configurations
clean_ide_configs() {
    print_step "إعادة تعيين إعدادات IDE..."
    
    # Remove VS Code user settings (keep project settings)
    if [ -d ".vscode" ]; then
        print_info "إعادة تعيين إعدادات VS Code..."
        # Keep project-specific settings, remove user settings
        rm -f .vscode/*.log 2>/dev/null || true
    fi
    
    # Clean JetBrains IDE caches
    if [ -d ".idea" ]; then
        print_info "إعادة تعيين إعدادات JetBrains..."
        rm -rf .idea/workspace.xml 2>/dev/null || true
        rm -rf .idea/tasks.xml 2>/dev/null || true
        rm -rf .idea/usage.statistics.xml 2>/dev/null || true
        rm -rf .idea/dictionaries 2>/dev/null || true
    fi
    
    print_success "تم إعادة تعيين إعدادات IDE"
}

# Clean Git hooks
clean_git_hooks() {
    print_step "إعادة تعيين Git hooks..."
    
    if [ -d ".git/hooks" ]; then
        # Backup existing hooks
        if [ -f ".git/hooks/pre-commit" ]; then
            mv .git/hooks/pre-commit .git/hooks/pre-commit.backup 2>/dev/null || true
        fi
        
        # Remove custom hooks but keep samples
        for hook in .git/hooks/pre-*; do
            if [ -f "$hook" ] && [ "$hook" != ".git/hooks/pre-commit.sample" ]; then
                rm "$hook" 2>/dev/null || true
            fi
        done
        
        print_success "تم إعادة تعيين Git hooks"
    fi
}

# Reset database
reset_database() {
    print_step "إعادة تعيين قاعدة البيانات..."
    
    # Stop services first
    stop_all_services
    sleep 2
    
    # Remove database volumes
    print_info "حذف أحجام قاعدة البيانات..."
    docker-compose down -v 2>/dev/null || true
    
    # Clean database files
    rm -rf dev-data/database/* 2>/dev/null || true
    
    # Recreate structure
    mkdir -p dev-data/database
    
    print_success "تم إعادة تعيين قاعدة البيانات"
}

# Full system reset
full_reset() {
    print_header "إعادة تعيين شامل للنظام"
    
    print_warning "سيتم حذف جميع البيانات والإعدادات!"
    echo "هذا الإجراء سيؤدي إلى:"
    echo "  • حذف جميع البيانات في قاعدة البيانات"
    echo "  • حذف جميع السجلات والملفات المؤقتة"
    echo "  • إعادة تعيين إعدادات IDE"
    echo "  • إعادة تعيين ملفات البيئة"
    echo "  • تنظيف موارد Docker"
    
    read -p "هل أنت متأكد من المتابعة؟ (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "تم إلغاء إعادة التعيين الشامل"
        return
    fi
    
    # Execute full reset
    stop_all_services
    clean_docker
    clean_project_data
    reset_env_files --reset-data
    clean_ide_configs
    clean_git_hooks
    recreate_structure
    
    print_header "تم إعادة التعيين الشامل بنجاح!"
    echo -e "${GREEN}🎉 النظام جاهز للإعداد من جديد${NC}"
    echo ""
    echo -e "${BLUE}الخطوات التالية:${NC}"
    echo -e "  1. ${YELLOW}شغل: ./scripts/setup.sh${NC}"
    echo -e "  2. ${YELLOW}أضف المفاتيح في .env.local${NC}"
    echo -e "  3. ${YELLOW}ابدأ التطوير: ./scripts/dev.sh${NC}"
}

# Show cleanup statistics
show_stats() {
    print_header "إحصائيات التنظيف"
    
    # Disk usage before/after
    if command -v du &> /dev/null; then
        local total_size=$(du -sh . 2>/dev/null | cut -f1)
        print_info "حجم المشروع الحالي: $total_size"
    fi
    
    # Docker stats
    if command -v docker &> /dev/null; then
        local containers=$(docker ps -a --format "{{.Names}}" | wc -l)
        local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | wc -l)
        local volumes=$(docker volume ls --format "{{.Name}}" | wc -l)
        
        print_info "الحاويات: $containers"
        print_info "الصور: $images"
        print_info "الأحجام: $volumes"
    fi
    
    # Log files count
    if [ -d "logs" ]; then
        local log_count=$(find logs/ -name "*.log" 2>/dev/null | wc -l)
        local log_size=$(du -sh logs/ 2>/dev/null | cut -f1)
        print_info "عدد ملفات السجل: $log_count (الحجم: $log_size)"
    fi
}

# Help function
show_help() {
    echo -e "${PURPLE}Saler Environment Reset & Cleanup${NC}\n"
    echo "الاستخدام:"
    echo "  $0 [command] [options]\n"
    echo "الأوامر:"
    echo "  clean               - تنظيف عادي (سجلات + ملفات مؤقتة)"
    echo "  full                - تنظيف شامل (بيانات + إعدادات)"
    echo "  docker              - تنظيف موارد Docker فقط"
    echo "  database            - إعادة تعيين قاعدة البيانات"
    echo "  structure           - إعادة إنشاء بنية المشروع"
    echo "  ide                 - إعادة تعيين إعدادات IDE"
    echo "  git                 - إعادة تعيين Git hooks"
    echo "  stats               - عرض إحصائيات التنظيف"
    echo "  help                - عرض هذه المساعدة\n"
    
    echo -e "${BLUE}أمثلة:${NC}"
    echo "  $0 clean"
    echo "  $0 full"
    echo "  $0 docker"
    echo "  $0 database"
}

# Main function
main() {
    case "${1:-clean}" in
        "clean")
            print_header "تنظيف البيئة"
            stop_all_services
            clean_project_data
            reset_env_files
            show_stats
            print_success "تم التنظيف بنجاح"
            ;;
        "full")
            full_reset
            ;;
        "docker")
            print_header "تنظيف Docker"
            stop_all_services
            clean_docker
            print_success "تم تنظيف Docker بنجاح"
            ;;
        "database")
            print_header "إعادة تعيين قاعدة البيانات"
            reset_database
            print_success "تم إعادة تعيين قاعدة البيانات"
            ;;
        "structure")
            print_header "إعادة إنشاء بنية المشروع"
            recreate_structure
            print_success "تم إعادة إنشاء البنية"
            ;;
        "ide")
            print_header "إعادة تعيين IDE"
            clean_ide_configs
            print_success "تم إعادة تعيين IDE"
            ;;
        "git")
            print_header "إعادة تعيين Git"
            clean_git_hooks
            print_success "تم إعادة تعيين Git hooks"
            ;;
        "stats")
            show_stats
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