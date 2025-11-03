#!/bin/bash

# AI Lead Scoring System Setup Script
# ===================================
# سكريبت إعداد شامل لنظام التقييم الذكي

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Functions for colored output
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

# Check system requirements
check_requirements() {
    print_header "فحص متطلبات النظام"
    
    # Check Python version
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d" " -f2)
        print_success "Python متوفر: $PYTHON_VERSION"
        
        # Check if Python 3.11+
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d"." -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d"." -f2)
        
        if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
            print_success "Python version meets requirements (3.11+)"
        else
            print_error "Python 3.11+ مطلوب. الإصدار الحالي: $PYTHON_VERSION"
            exit 1
        fi
    else
        print_error "Python 3 غير مثبت"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js متوفر: $NODE_VERSION"
    else
        print_warning "Node.js غير مثبت - مطلوب للفرونت إند"
    fi
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        POSTGRES_VERSION=$(psql --version | cut -d" " -f3)
        print_success "PostgreSQL متوفر: $POSTGRES_VERSION"
    else
        print_warning "PostgreSQL غير مثبت"
    fi
    
    # Check Redis
    if command -v redis-server &> /dev/null; then
        print_success "Redis متوفر"
    else
        print_warning "Redis غير مثبت - مطلوب للتخزين المؤقت"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker متوفر"
    else
        print_warning "Docker غير مثبت"
    fi
}

# Setup Python environment
setup_python() {
    print_header "إعداد بيئة Python"
    
    cd backend
    
    # Create virtual environment
    print_step "إنشاء بيئة افتراضية..."
    python3 -m venv venv
    
    # Activate virtual environment
    source venv/bin/activate
    print_success "تم تفعيل البيئة الافتراضية"
    
    # Upgrade pip
    print_step "تحديث pip..."
    pip install --upgrade pip
    
    # Install requirements
    print_step "تثبيت المتطلبات..."
    if [ -f "requirements-ai-scoring.txt" ]; then
        pip install -r requirements-ai-scoring.txt
    else
        print_error "ملف requirements-ai-scoring.txt غير موجود"
        exit 1
    fi
    
    print_success "تم تثبيت متطلبات Python"
    
    cd ..
}

# Setup database
setup_database() {
    print_header "إعداد قاعدة البيانات"
    
    read -p "أدخل اسم قاعدة البيانات [lead_scoring_db]: " DB_NAME
    DB_NAME=${DB_NAME:-lead_scoring_db}
    
    read -p "أدخل مستخدم PostgreSQL [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -s -p "أدخل كلمة مرور PostgreSQL: " DB_PASSWORD
    echo
    
    read -p "أدخل عنوان PostgreSQL [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "أدخل منفذ PostgreSQL [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    # Create database
    print_step "إنشاء قاعدة البيانات..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    
    # Run migrations
    print_step "تشغيل هجرات قاعدة البيانات..."
    cd backend
    
    # Set environment variables
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    
    # Run migration script
    python3 -c "
import sys
sys.path.append('.')
from app.migrations.create_ai_lead_scoring_tables import get_complete_migration
migration = get_complete_migration()
print(migration['migration'])
" > migration.sql
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migration.sql
    
    # Insert seed data
    print_step "إدراج البيانات الأولية..."
    python3 -c "
import sys
sys.path.append('.')
from app.migrations.create_ai_lead_scoring_tables import get_complete_migration
seed_data = get_complete_migration()['seed_data']
print(seed_data)
" > seed_data.sql
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed_data.sql
    
    print_success "تم إعداد قاعدة البيانات"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_header "إعداد واجهة المستخدم"
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Install dependencies
        print_step "تثبيت تبعيات npm..."
        npm install
        
        # Create environment file
        print_step "إنشاء ملف المتغيرات..."
        cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
EOL
        
        print_success "تم إعداد واجهة المستخدم"
        
        cd ..
    else
        print_warning "مجلد frontend غير موجود"
    fi
}

# Create environment files
setup_env_files() {
    print_header "إعداد ملفات المتغيرات"
    
    # Backend .env
    if [ -d "backend" ]; then
        print_step "إنشاء ملف .env للـ Backend..."
        cat > backend/.env << EOL
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/lead_scoring_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Scoring Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000

# Model Configuration
SCORING_MODEL_VERSION=v2.0.0
ENABLE_REAL_TIME=true
ENABLE_AB_TESTING=true
CACHE_TTL=300

# Performance Settings
MAX_BATCH_SIZE=1000
MAX_CONCURRENT_REQUESTS=100
RATE_LIMIT_PER_MINUTE=1000

# Monitoring
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true

# Development
DEBUG=true
LOG_LEVEL=INFO
EOL
        print_success "تم إنشاء backend/.env"
    fi
    
    # Frontend .env.local already created in setup_frontend
}

# Start services
start_services() {
    print_header "تشغيل الخدمات"
    
    print_step "بدء تشغيل Redis..."
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes
        print_success "تم تشغيل Redis"
    else
        print_warning "Redis غير مثبت - تجاهل"
    fi
    
    print_step "بدء تشغيل Backend..."
    cd backend
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../backend.pid
        print_success "تم تشغيل Backend على http://localhost:8000"
    else
        print_error "بيئة Python الافتراضية غير موجودة"
    fi
    cd ..
    
    print_step "بدء تشغيل Frontend..."
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../frontend.pid
        print_success "تم تشغيل Frontend على http://localhost:3000"
        cd ..
    else
        print_warning "Frontend غير مكتمل - تجاهل"
    fi
}

# Show status and URLs
show_status() {
    print_header "حالة النظام"
    
    echo -e "${GREEN}🎉 تم إعداد نظام AI Lead Scoring بنجاح!${NC}\n"
    
    echo -e "${BLUE}📍 الروابط المهمة:${NC}"
    echo -e "  • Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "  • API Documentation: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  • Frontend Dashboard: ${GREEN}http://localhost:3000${NC}"
    
    echo -e "\n${BLUE}🔧 أوامر مفيدة:${NC}"
    echo -e "  • إيقاف الخدمات: ${YELLOW}./stop-services.sh${NC}"
    echo -e "  • إعادة تشغيل: ${YELLOW}./setup.sh restart${NC}"
    echo -e "  • عرض السجلات: ${YELLOW}tail -f backend/logs/app.log${NC}"
    
    echo -e "\n${BLUE}📚 الوثائق:${NC}"
    echo -e "  • README: ${GREEN}AI_LEAD_SCORING_README.md${NC}"
    echo -e "  • تقرير الإنجاز: ${GREEN}AI_LEAD_SCORING_COMPLETION_REPORT.md${NC}"
    
    echo -e "\n${PURPLE}💡 نصائح:${NC}"
    echo -e "  • تأكد من تشغيل PostgreSQL و Redis"
    echo -e "  • تحقق من ملف .env للإعدادات"
    echo -e "  • استخدم /docs لاستكشاف API"
}

# Stop services
stop_services() {
    print_header "إيقاف الخدمات"
    
    # Stop backend
    if [ -f "backend.pid" ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            rm backend.pid
            print_success "تم إيقاف Backend"
        else
            print_warning "Backend غير مشغل"
        fi
    fi
    
    # Stop frontend
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            rm frontend.pid
            print_success "تم إيقاف Frontend"
        else
            print_warning "Frontend غير مشغل"
        fi
    fi
    
    # Stop Redis
    if command -v redis-cli &> /dev/null; then
        redis-cli shutdown
        print_success "تم إيقاف Redis"
    fi
}

# Main installation function
install_system() {
    print_header "بدء إعداد نظام AI Lead Scoring"
    
    echo "سيتم إعداد نظام التقييم الذكي للعملاء المحتملين"
    echo "يرجى التأكد من تثبيت Python 3.11+ و Node.js و PostgreSQL"
    
    read -p "هل تريد المتابعة؟ (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "تم إلغاء الإعداد"
        exit 1
    fi
    
    # Run setup steps
    check_requirements
    setup_python
    setup_env_files
    setup_database
    setup_frontend
    
    read -p "هل تريد تشغيل الخدمات الآن؟ (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
        sleep 5  # Wait for services to start
        show_status
    else
        echo -e "\n${YELLOW}يمكنك تشغيل الخدمات لاحقاً باستخدام:${NC}"
        echo -e "${GREEN}./setup.sh start${NC}"
    fi
}

# Restart function
restart_system() {
    print_header "إعادة تشغيل النظام"
    
    stop_services
    sleep 2
    start_services
    sleep 5
    show_status
}

# Help function
show_help() {
    echo -e "${PURPLE}AI Lead Scoring Setup Script${NC}\n"
    echo "الاستخدام:"
    echo "  $0 [command]\n"
    echo "الأوامر:"
    echo "  install     - إعداد النظام كاملاً"
    echo "  start       - تشغيل الخدمات"
    echo "  stop        - إيقاف الخدمات"
    echo "  restart     - إعادة تشغيل"
    echo "  status      - عرض حالة النظام"
    echo "  help        - عرض هذه المساعدة"
    echo ""
}

# Status function
show_system_status() {
    print_header "حالة النظام"
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d" " -f2)
        print_success "Python: $PYTHON_VERSION"
    else
        print_error "Python: غير مثبت"
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js: $NODE_VERSION"
    else
        print_error "Node.js: غير مثبت"
    fi
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL: متوفر"
    else
        print_error "PostgreSQL: غير مثبت"
    fi
    
    # Check Redis
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            print_success "Redis: متصل"
        else
            print_warning "Redis: غير متصل"
        fi
    else
        print_error "Redis: غير مثبت"
    fi
    
    # Check if services are running
    if [ -f "backend.pid" ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_success "Backend: يعمل (PID: $BACKEND_PID)"
        else
            print_warning "Backend: متوقف"
        fi
    else
        print_warning "Backend: غير مشغل"
    fi
    
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_success "Frontend: يعمل (PID: $FRONTEND_PID)"
        else
            print_warning "Frontend: متوقف"
        fi
    else
        print_warning "Frontend: غير مشغل"
    fi
}

# Main script logic
case "${1:-install}" in
    "install")
        install_system
        ;;
    "start")
        start_services
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_system
        ;;
    "status")
        show_system_status
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}أمر غير معروف: $1${NC}"
        echo "استخدم '$0 help' للمساعدة"
        exit 1
        ;;
esac
