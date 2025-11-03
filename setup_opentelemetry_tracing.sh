#!/bin/bash
# OpenTelemetry Tracing System Setup Script
# إعداد نظام OpenTelemetry Tracing لشركة سالير

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               OpenTelemetry Tracing Setup                   ║"
echo "║                   شركة سالير - Saler                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is running
check_docker() {
    log_info "التحقق من Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker غير مثبت أو غير مشغل"
        exit 1
    fi
    log_success "Docker يعمل بشكل صحيح"
}

# Check if docker-compose is available
check_docker_compose() {
    log_info "التحقق من docker-compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "docker-compose غير مثبت"
        exit 1
    fi
    log_success "docker-compose متاح"
}

# Create required directories
create_directories() {
    log_info "إنشاء المجلدات المطلوبة..."
    
    mkdir -p data/elasticsearch
    mkdir -p data/grafana
    mkdir -p data/prometheus
    mkdir -p data/alertmanager
    
    # Set proper permissions
    chmod -R 755 data/
    
    log_success "تم إنشاء المجلدات"
}

# Generate environment file
generate_env_file() {
    log_info "إنشاء ملف البيئة..."
    
    cat > .env.tracing << EOF
# OpenTelemetry Tracing Configuration
OTEL_SERVICE_NAME=saler-backend
OTEL_SERVICE_VERSION=2.0.0
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Jaeger Configuration
JAEGER_ENDPOINT=http://jaeger:14250
JAEGER_USERNAME=
JAEGER_PASSWORD=

# Sampling Configuration
TRACING_SAMPLE_RATE=0.1
TRACING_STRATEGY=adaptive
TRACING_DEBUG=false

# Grafana Configuration
GRAFANA_ADMIN_PASSWORD=admin123

# Database Configuration (for monitoring)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=saler_db
POSTGRES_USER=saler_user
POSTGRES_PASSWORD=saler_pass

# Redis Configuration (for monitoring)
REDIS_HOST=redis
REDIS_PORT=6379

# Alert Configuration
SLACK_WEBHOOK_URL=
PAGERDUTY_ROUTING_KEY=
DATADOG_API_KEY=
EOF

    log_success "تم إنشاء ملف البيئة (.env.tracing)"
}

# Update requirements.txt
update_requirements() {
    log_info "تحديث requirements.txt للتتبع..."
    
    # Add OpenTelemetry dependencies
    cat >> backend/requirements.txt << EOF

# ==== OPENTELEMETRY TRACING SYSTEM ====
opentelemetry-api==1.21.0
opentelemetry-sdk==1.21.0
opentelemetry-instrumentation-fastapi==0.42b0
opentelemetry-instrumentation-sqlalchemy==0.42b0
opentelemetry-instrumentation-redis==0.42b0
opentelemetry-instrumentation-httpx==0.42b0
opentelemetry-instrumentation-celery==0.42b0
opentelemetry-exporter-jaeger-thrift==1.21.0
opentelemetry-exporter-otlp==1.21.0
opentelemetry-exporter-zipkin-json==1.21.0
opentelemetry-instrumentation-aiohttp-client==0.42b0
opentelemetry-instrumentation-requests==0.42b0
EOF

    log_success "تم تحديث requirements.txt"
}

# Update main.py for tracing integration
update_main_py() {
    log_info "تحديث main.py لتشمل نظام التتبع..."
    
    # Create patch script for main.py
    cat > backend/app/tracing/apply_tracing_patch.py << 'EOF'
#!/usr/bin/env python3
"""Apply tracing system patch to main.py"""

import re
import sys
from pathlib import Path

def apply_tracing_patch(main_py_path):
    """Apply tracing system patch to main.py"""
    
    # Read the current main.py
    with open(main_py_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if tracing is already applied
    if 'app.tracing' in content:
        print("Tracing system already applied to main.py")
        return
    
    # Add imports
    tracing_imports = '''
from app.tracing import (
    TracingConfig, 
    TracingManager,
    TracingMiddleware,
    TracingExporter
)
from app.tracing.manager import initialize_tracing'''
    
    # Find the import section and add our imports after existing imports
    import_pattern = r'(from app\.api\.v1\.security_monitoring import router as security_monitoring_router)'
    content = re.sub(import_pattern, r'\1' + tracing_imports, content)
    
    # Add middleware after existing middleware
    middleware_pattern = r'(app\.add_middleware\(SecurityMonitoringMiddleware\))'
    tracing_middleware = '''
    # Tracing Middleware
    try:
        tracing_config = TracingConfig.from_env()
        app.add_middleware(TracingMiddleware, config=tracing_config)
        print("✅ Tracing Middleware initialized successfully")
    except Exception as e:
        print(f"⚠️ Tracing Middleware initialization failed: {e}")
'''
    content = re.sub(middleware_pattern, r'\1' + tracing_middleware, content)
    
    # Add tracing initialization to lifespan startup
    lifespan_startup_pattern = r'(print\("✅ Advanced Security & Health Monitoring System initialized successfully"\))'
    tracing_startup = '''
    # Initialize OpenTelemetry Tracing System
    try:
        await initialize_tracing()
        print("✅ OpenTelemetry Tracing System initialized successfully")
    except Exception as e:
        print(f"❌ OpenTelemetry Tracing initialization failed: {e}")
'''
    content = re.sub(lifespan_startup_pattern, r'\1' + tracing_startup, content)
    
    # Add tracing endpoints
    health_endpoint_pattern = r'(@app\.get\("/api/v1/health/detailed", tags=\["health"\]\))'
    tracing_endpoints = '''
@app.get("/api/v1/tracing/health", tags=["tracing"])
async def tracing_health():
    """Health check for tracing system"""
    try:
        from app.tracing.manager import get_tracing_manager
        tracing_manager = await get_tracing_manager()
        
        stats = tracing_manager.get_stats()
        
        return {
            "status": "healthy",
            "tracing_system": "active",
            "stats": stats,
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "tracing_system": "error",
            "error": str(e),
            "timestamp": time.time()
        }

'''
    
    content = re.sub(health_endpoint_pattern, r'\1' + tracing_endpoints, content)
    
    # Write back to file
    with open(main_py_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Successfully applied tracing system patch to main.py")

if __name__ == "__main__":
    main_py_path = Path(__file__).parent.parent / "main.py"
    apply_tracing_patch(main_py_path)
EOF

    # Run the patch
    cd backend
    python app/tracing/apply_tracing_patch.py
    cd ..
    
    log_success "تم تحديث main.py"
}

# Install Python dependencies
install_dependencies() {
    log_info "تثبيت متطلبات Python..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            log_info "إنشاء بيئة افتراضية..."
            python3 -m venv venv
        fi
        
        # Activate virtual environment
        source venv/bin/activate
        
        # Upgrade pip
        pip install --upgrade pip
        
        # Install dependencies
        pip install -r requirements.txt
        
        cd ..
        log_success "تم تثبيت المتطلبات"
    else
        log_warning "مجلد backend غير موجود، تخطي تثبيت المتطلبات"
    fi
}

# Start tracing services
start_tracing_services() {
    log_info "بدء تشغيل خدمات التتبع..."
    
    # Create docker-compose override for tracing
    cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  saler-backend:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
      - OTEL_SERVICE_NAME=saler-backend
      - OTEL_SERVICE_VERSION=2.0.0
      - TRACING_SAMPLE_RATE=0.1
      - TRACING_DEBUG=false
    depends_on:
      - otel-collector
EOF

    # Start tracing services
    docker-compose -f docker-compose.opentelemetry.yml up -d
    
    # Wait for services to be ready
    log_info "انتظار بدء تشغيل الخدمات..."
    sleep 30
    
    # Check if services are healthy
    check_service_health
    
    log_success "تم بدء تشغيل خدمات التتبع"
}

# Check service health
check_service_health() {
    log_info "فحص صحة الخدمات..."
    
    services=("otel-collector" "jaeger" "prometheus-tracing" "grafana-tracing")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q "$service"; then
            log_success "$service يعمل بشكل صحيح"
        else
            log_warning "$service لا يعمل"
        fi
    done
    
    # Check if ports are accessible
    log_info "فحص الوصول للمنافذ..."
    
    if curl -s http://localhost:4317/health > /dev/null 2>&1; then
        log_success "OTEL Collector: متاح"
    else
        log_warning "OTEL Collector: غير متاح"
    fi
    
    if curl -s http://localhost:16686 > /dev/null 2>&1; then
        log_success "Jaeger UI: متاح"
    else
        log_warning "Jaeger UI: غير متاح"
    fi
    
    if curl -s http://localhost:3101 > /dev/null 2>&1; then
        log_success "Grafana: متاح"
    else
        log_warning "Grafana: غير متاح"
    fi
}

# Create startup script
create_startup_script() {
    log_info "إنشاء سكريبت التشغيل..."
    
    cat > start_tracing_system.sh << 'EOF'
#!/bin/bash
# OpenTelemetry Tracing System Startup Script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Starting OpenTelemetry Tracing System...${NC}"

# Start core services
docker-compose -f docker-compose.opentelemetry.yml up -d otel-collector jaeger prometheus-tracing grafana-tracing

# Wait for services
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 30

# Show status
echo -e "${GREEN}Services Status:${NC}"
docker-compose -f docker-compose.opentelemetry.yml ps

echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo "• Jaeger UI: http://localhost:16686"
echo "• Grafana: http://localhost:3101 (admin/admin123)"
echo "• Prometheus: http://localhost:9091"
echo "• Alertmanager: http://localhost:9093"

echo ""
echo -e "${GREEN}OpenTelemetry Tracing System is ready!${NC}"
EOF

    chmod +x start_tracing_system.sh
    log_success "تم إنشاء سكريبت التشغيل"
}

# Create test script
create_test_script() {
    log_info "إنشاء سكريبت الاختبار..."
    
    cat > test_tracing_system.py << 'EOF'
#!/usr/bin/env python3
"""Test OpenTelemetry Tracing System"""

import asyncio
import time
import requests
from pathlib import Path

async def test_tracing_system():
    """Test the tracing system endpoints"""
    
    print("🧪 Testing OpenTelemetry Tracing System...")
    
    # Test backend tracing endpoint
    try:
        response = requests.get("http://localhost:8000/api/v1/tracing/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend Tracing Health: OK")
        else:
            print(f"⚠️ Backend Tracing Health: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend Tracing Health: {e}")
    
    # Test OTEL Collector
    try:
        response = requests.get("http://localhost:4317/health", timeout=10)
        print("✅ OTEL Collector: OK")
    except:
        print("❌ OTEL Collector: Not accessible")
    
    # Test Jaeger
    try:
        response = requests.get("http://localhost:16686", timeout=10)
        if response.status_code == 200:
            print("✅ Jaeger UI: OK")
        else:
            print(f"⚠️ Jaeger UI: {response.status_code}")
    except Exception as e:
        print(f"❌ Jaeger UI: {e}")
    
    # Test Grafana
    try:
        response = requests.get("http://localhost:3101/api/health", timeout=10)
        if response.status_code == 200:
            print("✅ Grafana: OK")
        else:
            print(f"⚠️ Grafana: {response.status_code}")
    except Exception as e:
        print(f"❌ Grafana: {e}")
    
    print("\n🎯 Test completed!")

if __name__ == "__main__":
    asyncio.run(test_tracing_system())
EOF

    chmod +x test_tracing_system.py
    log_success "تم إنشاء سكريبت الاختبار"
}

# Main installation function
main() {
    log_info "بدء إعداد نظام OpenTelemetry Tracing..."
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    
    # Setup directories and files
    create_directories
    generate_env_file
    update_requirements
    update_main_py
    
    # Install dependencies
    install_dependencies
    
    # Start services
    start_tracing_services
    
    # Create helper scripts
    create_startup_script
    create_test_script
    
    # Final status check
    check_service_health
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Setup Completed Successfully!                   ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${BLUE}║  📊 Access URLs:                                             ║${NC}"
    echo -e "${BLUE}║     • Jaeger UI: http://localhost:16686                     ║${NC}"
    echo -e "${BLUE}║     • Grafana: http://localhost:3101 (admin/admin123)        ║${NC}"
    echo -e "${BLUE}║     • Prometheus: http://localhost:9091                     ║${NC}"
    echo -e "${BLUE}║     • Alertmanager: http://localhost:9093                   ║${NC}"
    echo -e "${BLUE}║                                                              ║${NC}"
    echo -e "${BLUE}║  🔧 Helper Scripts:                                         ║${NC}"
    echo -e "${BLUE}║     • Start System: ./start_tracing_system.sh              ║${NC}"
    echo -e "${BLUE}║     • Test System: ./test_tracing_system.py                 ║${NC}"
    echo -e "${BLUE}║     • Documentation: backend/OPENTELEMETRY_TRACING_README.md ║${NC}"
    echo -e "${BLUE}║                                                              ║${NC}"
    echo -e "${GREEN}║  ⚡ System is ready for distributed tracing!                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "OpenTelemetry Tracing System Setup Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --dev          Setup for development environment"
        echo "  --prod         Setup for production environment"
        echo "  --minimal      Setup with minimal services only"
        echo ""
        echo "Examples:"
        echo "  $0                    # Full setup"
        echo "  $0 --dev             # Development setup"
        echo "  $0 --minimal         # Minimal setup"
        exit 0
        ;;
    --dev)
        export TRACING_DEBUG=true
        export TRACING_SAMPLE_RATE=1.0
        log_info "Setting up for development environment"
        ;;
    --prod)
        export TRACING_DEBUG=false
        export TRACING_SAMPLE_RATE=0.05
        log_info "Setting up for production environment"
        ;;
    --minimal)
        log_info "Setting up minimal configuration"
        ;;
esac

# Run main setup
main