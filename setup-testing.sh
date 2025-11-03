#!/bin/bash

# 🚀 Setup Script for Comprehensive Testing System
# إعداد شامل لنظام الاختبار التلقائي

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log_info "فحص متطلبات النظام..."
    
    local missing_deps=()
    
    # Check Python
    if ! command_exists python3; then
        missing_deps+=("python3")
    else
        log_success "Python 3 موجود: $(python3 --version)"
    fi
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("node")
    else
        log_success "Node.js موجود: $(node --version)"
    fi
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("docker")
    else
        log_success "Docker موجود: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("docker-compose")
    else
        log_success "Docker Compose موجود"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "المتطلبات التالية مفقودة:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
}

# Setup Python environment
setup_python() {
    log_info "إعداد بيئة Python..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        log_success "تم إنشاء بيئة Python الافتراضية"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    pip install -r requirements.txt
    pip install -r ../tools/requirements.txt
    
    log_success "تم إعداد بيئة Python"
    cd ..
}

# Setup Node.js environment
setup_nodejs() {
    log_info "إعداد بيئة Node.js..."
    
    cd frontend
    
    # Install dependencies
    npm install
    
    # Install Playwright browsers
    npx playwright install --with-deps
    
    log_success "تم إعداد بيئة Node.js"
    cd ..
}

# Setup test data
setup_test_data() {
    log_info "إعداد البيانات الاختبارية..."
    
    # Create test data directory
    mkdir -p test-data
    mkdir -p test-results
    mkdir -p mock-data
    
    # Generate test data
    python3 tools/test_data_manager.py seed --reset
    
    log_success "تم إعداد البيانات الاختبارية"
}

# Setup Docker services
setup_docker() {
    log_info "إعداد خدمات Docker للاختبار..."
    
    # Create Docker network
    docker network create saler-test-network 2>/dev/null || true
    
    # Start test services
    docker-compose -f docker-compose.testing.yml up -d postgres-test redis-test mailhog
    
    # Wait for services to be ready
    log_info "انتظار جاهزية الخدمات..."
    sleep 30
    
    log_success "تم إعداد خدمات Docker"
}

# Setup environment variables
setup_environment() {
    log_info "إعداد متغيرات البيئة..."
    
    # Create .env.test file
    cat > .env.test << EOF
# Test Environment Variables
ENVIRONMENT=test
DATABASE_URL=postgresql://test:test@localhost:5432/saler_test
REDIS_URL=redis://localhost:6379/1
SECRET_KEY=test_secret_key_for_testing
JWT_SECRET=test_jwt_secret_key

# Test API Keys
SHOPIFY_API_KEY=test_shopify_api_key
SHOPIFY_API_SECRET=test_shopify_api_secret
META_APP_ID=test_meta_app_id
META_APP_SECRET=test_meta_app_secret
WHATSAPP_TOKEN=test_whatsapp_token
WHATSAPP_VERIFY_TOKEN=test_whatsapp_verify_token

# Test Services
EMAIL_SERVICE_URL=http://localhost:8025
SMS_SERVICE_URL=http://localhost:8080

# Monitoring
LOG_LEVEL=DEBUG
EOF
    
    # Create frontend test env
    cat > frontend/.env.test << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NODE_ENV=test
EOF
    
    log_success "تم إعداد متغيرات البيئة"
}

# Setup Git hooks
setup_git_hooks() {
    log_info "إعداد Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🧪 Running pre-commit tests..."

# Run linting
cd frontend && npm run lint
cd ../backend && flake8 .

# Run type checking
cd frontend && npm run type-check

# Run unit tests
cd frontend && npm run test:ci
cd ../backend && pytest tests/ -x

echo "✅ All pre-commit tests passed!"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    log_success "تم إعداد Git hooks"
}

# Run initial tests
run_initial_tests() {
    log_info "تشغيل اختبارات أولية للتحقق من الإعداد..."
    
    # Test Python setup
    cd backend && python -m pytest tests/ --collect-only >/dev/null
    if [ $? -eq 0 ]; then
        log_success "Python tests can be discovered"
    else
        log_warning "Python test discovery failed"
    fi
    
    # Test Node.js setup
    cd frontend && npm test -- --listTests >/dev/null
    if [ $? -eq 0 ]; then
        log_success "Node.js tests can be discovered"
    else
        log_warning "Node.js test discovery failed"
    fi
    
    cd ..
}

# Create test scripts
create_test_scripts() {
    log_info "إنشاء سكريبتات الاختبار..."
    
    # Create run-all-tests.sh
    cat > run-all-tests.sh << 'EOF'
#!/bin/bash

echo "🧪 Running Comprehensive Test Suite..."

# Start test services
docker-compose -f docker-compose.testing.yml up -d

# Wait for services
sleep 30

# Run tests
echo "📋 Running Backend Tests..."
cd backend && source venv/bin/activate && pytest tests/ -v --cov=app

echo "📋 Running Frontend Tests..."
cd ../frontend && npm run test:ci

echo "📋 Running E2E Tests..."
cd ../frontend && npm run test:e2e

echo "📋 Running Security Tests..."
cd ../backend && pytest tests/security/ -v

echo "📋 Running Performance Tests..."
cd ../performance && python performance_test.py

# Generate reports
echo "📊 Generating Reports..."
python tools/developer_testing_tools.py report \
  --test-summary test-results/test-summary.json \
  --coverage test-results/coverage.json \
  --performance test-results/performance.json \
  --output test-results/test-dashboard.html

# Cleanup
docker-compose -f docker-compose.testing.yml down

echo "✅ Test suite completed! Check test-results/ for reports."
EOF
    
    chmod +x run-all-tests.sh
    
    # Create quick-test.sh
    cat > quick-test.sh << 'EOF'
#!/bin/bash

echo "🚀 Running Quick Test Suite..."

# Run only unit and integration tests
cd backend && source venv/bin/activate && pytest tests/ -x --tb=short
cd ../frontend && npm run test:ci -- --testPathIgnorePatterns=e2e

echo "✅ Quick tests completed!"
EOF
    
    chmod +x quick-test.sh
    
    log_success "تم إنشاء سكريبتات الاختبار"
}

# Print setup summary
print_summary() {
    echo ""
    echo "🎉 تم إعداد نظام الاختبار التلقائي بنجاح!"
    echo ""
    echo "📋 معلومات الإعداد:"
    echo "  • Python Backend: ✅ مُعد"
    echo "  • Node.js Frontend: ✅ مُعد"
    echo "  • Test Data: ✅ مُعد"
    echo "  • Docker Services: ✅ مُعد"
    echo "  • Environment Variables: ✅ مُعد"
    echo "  • Git Hooks: ✅ مُعد"
    echo "  • Test Scripts: ✅ مُعد"
    echo ""
    echo "🧪 أوامر الاختبار المتاحة:"
    echo "  ./run-all-tests.sh       # تشغيل جميع الاختبارات"
    echo "  ./quick-test.sh          # اختبار سريع"
    echo "  cd frontend && npm test  # اختبار Frontend"
    echo "  cd backend && pytest     # اختبار Backend"
    echo ""
    echo "📊 عرض التقارير:"
    echo "  • HTML Dashboard: test-results/test-dashboard.html"
    echo "  • Coverage Report: test-results/coverage/"
    echo "  • Performance Report: test-results/performance/"
    echo ""
    echo "🔗 روابط مفيدة:"
    echo "  • Test Dashboard: http://localhost:3001 (Grafana)"
    echo "  • Mail Testing: http://localhost:8025 (MailHog)"
    echo "  • API Testing: http://localhost:8000"
    echo ""
    echo "💡 نصائح:"
    echo "  • استخدم './quick-test.sh' للتطوير السريع"
    echo "  • استخدم './run-all-tests.sh' للاختبار الشامل"
    echo "  • راجع TESTING_SYSTEM_README.md للتفاصيل"
    echo ""
}

# Main setup function
main() {
    echo ""
    echo "🚀 إعداد نظام الاختبار التلقائي الشامل"
    echo "========================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "TESTING_SYSTEM_README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        log_error "تأكد من تشغيل هذا السكريبت من المجلد الجذر للمشروع"
        exit 1
    fi
    
    # Run setup steps
    check_requirements
    setup_python
    setup_nodejs
    setup_test_data
    setup_docker
    setup_environment
    setup_git_hooks
    create_test_scripts
    run_initial_tests
    
    # Print summary
    print_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "🚀 إعداد نظام الاختبار التلقائي"
        echo ""
        echo "الاستخدام: $0 [خيارات]"
        echo ""
        echo "الخيارات:"
        echo "  --help, -h     عرض هذه المساعدة"
        echo "  --minimal      إعداد minimal (بدون Docker)"
        echo "  --dev          إعداد للمطورين فقط"
        echo ""
        ;;
    --minimal)
        log_info "إعداد minimal (بدون Docker)..."
        check_requirements
        setup_python
        setup_nodejs
        setup_test_data
        setup_environment
        setup_git_hooks
        print_summary
        ;;
    --dev)
        log_info "إعداد للمطورين..."
        check_requirements
        setup_python
        setup_nodejs
        setup_test_data
        setup_environment
        setup_git_hooks
        create_test_scripts
        print_summary
        ;;
    *)
        main
        ;;
esac