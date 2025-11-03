#!/bin/bash

# 🎯 Saler Development Environment Setup Script
# ==============================================
# سكريبت إعداد شامل لبيئة التطوير المتقدمة

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check system requirements with enhanced checking
check_requirements() {
    print_header "فحص متطلبات النظام المتقدمة"
    
    local errors=0
    local warnings=0
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d" " -f3 | cut -d"," -f1)
        print_success "Docker متوفر: $DOCKER_VERSION"
        
        # Check Docker daemon
        if docker info &> /dev/null; then
            print_success "Docker daemon يعمل"
        else
            print_error "Docker daemon غير متصل"
            errors=$((errors + 1))
        fi
    else
        print_error "Docker غير مثبت - مطلوب للتطوير"
        errors=$((errors + 1))
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d" " -f3 | cut -d"," -f1)
        print_success "Docker Compose متوفر: $COMPOSE_VERSION"
    elif docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | cut -d" " -f4)
        print_success "Docker Compose متوفر: $COMPOSE_VERSION"
    else
        print_error "Docker Compose غير متوفر"
        errors=$((errors + 1))
    fi
    
    # Check Python with multiple version support
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d" " -f2)
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d"." -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d"." -f2)
        
        if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 10 ]; then
            print_success "Python متوفر: $PYTHON_VERSION"
        else
            print_warning "Python $PYTHON_VERSION قد لا يكون متوافقاً مع بعض المكتبات (يفضل 3.11+)"
            warnings=$((warnings + 1))
        fi
        
        # Check pip
        if command -v pip3 &> /dev/null; then
            PIP_VERSION=$(pip3 --version | cut -d" " -f2)
            print_success "pip3 متوفر: $PIP_VERSION"
        else
            print_warning "pip3 غير متوفر"
            warnings=$((warnings + 1))
        fi
    else
        print_warning "Python 3 غير مثبت"
        warnings=$((warnings + 1))
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js متوفر: $NODE_VERSION"
        
        if command -v npm &> /dev/null; then
            NPM_VERSION=$(npm --version)
            print_success "npm متوفر: $NPM_VERSION"
        fi
    else
        print_warning "Node.js غير مثبت - مطلوب للفرونت إند"
        warnings=$((warnings + 1))
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d" " -f3)
        print_success "Git متوفر: $GIT_VERSION"
        
        # Check git hooks setup
        if [ -f ".git/hooks/pre-commit" ] && [ -x ".git/hooks/pre-commit" ]; then
            print_success "Git hooks مُعدة"
        else
            print_warning "Git hooks غير مُعدة"
            warnings=$((warnings + 1))
        fi
    else
        print_error "Git غير مثبت - مطلوب"
        errors=$((errors + 1))
    fi
    
    # Check for development tools
    local dev_tools=("curl" "jq" "tree" "htop" "nc")
    for tool in "${dev_tools[@]}"; do
        if command -v $tool &> /dev/null; then
            print_success "$tool متوفر"
        else
            print_warning "$tool غير مثبت - سيتم تثبيته لاحقاً"
        fi
    done
    
    # Memory check
    if command -v free &> /dev/null; then
        TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
        AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
        print_info "الذاكرة المتاحة: ${AVAILABLE_MEM}GB / ${TOTAL_MEM}GB"
        
        # Recommend minimum 4GB
        if (( $(echo "$AVAILABLE_MEM < 4" | bc -l) )); then
            print_warning "الذاكرة المتاحة أقل من 4GB - قد تواجه بطء في الأداء"
            warnings=$((warnings + 1))
        fi
    fi
    
    # Disk space check
    if command -v df &> /dev/null; then
        AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        print_info "المساحة المتاحة: ${AVAILABLE_SPACE}GB"
        
        if [ "$AVAILABLE_SPACE" -lt 5 ]; then
            print_warning "المساحة المتاحة أقل من 5GB - قد تحتاج لمساحة أكثر"
            warnings=$((warnings + 1))
        fi
    fi
    
    echo
    if [ $errors -gt 0 ]; then
        print_error "تم العثور على $errors أخطاء يجب حلها قبل المتابعة"
        exit 1
    elif [ $warnings -gt 0 ]; then
        print_warning "تم العثور على $warnings تحذيرات - يُنصح بحلها"
    else
        print_success "جميع المتطلبات الأساسية مُحققة"
    fi
}

# Install development tools
install_dev_tools() {
    print_header "تثبيت أدوات التطوير"
    
    print_step "تثبيت أدوات إضافية..."
    
    # Define tools to install
    local tools=()
    
    # OS-specific installation
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        tools=("curl" "jq" "tree" "htop" "nc" "netstat-nat" "iproute2" "telnet" "wget")
        
        # Check if we have apt
        if command -v apt &> /dev/null; then
            print_info "تثبيت الأدوات باستخدام apt..."
            sudo apt update -qq
            sudo apt install -y "${tools[@]}"
        elif command -v yum &> /dev/null; then
            print_info "تثبيت الأدوات باستخدام yum..."
            sudo yum install -y "${tools[@]}"
        elif command -v brew &> /dev/null; then
            print_info "تثبيت الأدوات باستخدام brew..."
            brew install "${tools[@]}"
        else
            print_warning "مدير حزم غير مدعوم - سيتم تخطي تثبيت الأدوات الإضافية"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command -v brew &> /dev/null; then
            print_info "تثبيت Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        tools=("curl" "jq" "tree" "htop" "nc" "wget")
        print_info "تثبيت الأدوات باستخدام brew..."
        brew install "${tools[@]}"
    fi
    
    print_success "تم تثبيت أدوات التطوير"
}

# Setup Git hooks and pre-commit
setup_git_hooks() {
    print_header "إعداد Git Hooks و Pre-commit"
    
    if [ -d ".git" ]; then
        print_step "إنشاء pre-commit hook..."
        
        # Create pre-commit script
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for Saler project
echo "🔍 Running pre-commit checks..."

# Check for Python syntax errors
echo "Checking Python syntax..."
find . -name "*.py" -type f | while read file; do
    if ! python3 -m py_compile "$file"; then
        echo "❌ Syntax error in $file"
        exit 1
    fi
done

# Check for Node.js syntax errors
echo "Checking JavaScript/TypeScript syntax..."
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | head -10 | while read file; do
    if command -v node &> /dev/null; then
        node --check "$file" || {
            echo "❌ Syntax error in $file"
            exit 1
        }
    fi
done

# Check for TODO/FIXME comments in production code
echo "Checking for TODO/FIXME comments..."
if grep -r -n "TODO\|FIXME" backend/app/ --include="*.py" | grep -v "^.*test.*"; then
    echo "⚠️  Found TODO/FIXME comments in production code"
fi

# Check environment files are not committed
echo "Checking for sensitive files..."
if grep -r "\.env$" .gitignore > /dev/null 2>&1; then
    echo "✅ .env files are ignored"
else
    echo "⚠️  Consider adding .env files to .gitignore"
fi

echo "✅ Pre-commit checks passed!"
EOF
        
        chmod +x .git/hooks/pre-commit
        print_success "تم إعداد Git pre-commit hook"
    else
        print_warning "Not a Git repository - skipping Git hooks setup"
    fi
}

# Create development environment files
create_dev_env_files() {
    print_header "إنشاء ملفات بيئة التطوير"
    
    # Global .env.example
    cat > .env.example << 'EOF'
# ===================================
# Saler Development Environment
# ===================================

# Database Configuration
DATABASE_URL=postgresql://saler_user:saler_password@localhost:5432/saler_dev
POSTGRES_DB=saler_dev
POSTGRES_USER=saler_user
POSTGRES_PASSWORD=saler_password

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# Application Settings
SECRET_KEY=development-secret-key-change-in-production-please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# API Keys (Add your keys)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Messaging Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
ULTRAMSG_API_KEY=your-ultramsg-key
ULTRAMSG_INSTANCE_ID=your-instance-id

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring & Analytics
ENABLE_METRICS=true
ENABLE_TRACING=true
SENTRY_DSN=your-sentry-dsn-here

# Development Settings
DEBUG=true
LOG_LEVEL=DEBUG
ENVIRONMENT=development

# API Configuration
API_RATE_LIMIT_PER_MINUTE=1000
MAX_BATCH_SIZE=100
MAX_CONCURRENT_REQUESTS=50

# Feature Flags
ENABLE_REAL_TIME_SCORING=true
ENABLE_AI_PREDICTIONS=true
ENABLE_AB_TESTING=false

# Security Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ALLOWED_HOSTS=localhost,127.0.0.1
SESSION_SECRET_KEY=your-session-secret-key
EOF
    
    print_success "تم إنشاء .env.example"
    
    # Create .env.local for local development
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        print_info "تم إنشاء .env.local (تعديل المفاتيح حسب الحاجة)"
    else
        print_info ".env.local موجود بالفعل"
    fi
    
    # Create docker-compose override for development
    cat > docker-compose.override.yml << 'EOF'
# Development override for docker-compose
# This file is loaded automatically by docker-compose up

version: '3.8'

services:
  # Enhanced development services
  postgres:
    environment:
      POSTGRES_DB: saler_dev
      POSTGRES_USER: saler_user
      POSTGRES_PASSWORD: saler_password
    ports:
      - "5432:5432"  # Only for development
    
  redis:
    ports:
      - "6379:6379"  # Only for development
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

  backend:
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
      - ENVIRONMENT=development
      - DATABASE_URL=postgresql://saler_user:saler_password@postgres:5432/saler_dev
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./backend:/app
      - ./logs:/app/logs
      - ./dev-data:/app/dev-data
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug

  worker:
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
    volumes:
      - ./backend:/app
      - ./logs:/app/logs

  frontend:
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
      - NEXT_PUBLIC_DEBUG=true
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev

  # Development-only services
  mailhog:
    image: mailhog/mailhog
    container_name: saler-mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    profiles:
      - development

  # Monitoring for development
  prometheus:
    image: prom/prometheus
    container_name: saler-prometheus-dev
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./dev-data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    profiles:
      - monitoring

  grafana:
    image: grafana/grafana
    container_name: saler-grafana-dev
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./dev-data/grafana:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    profiles:
      - monitoring

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local

networks:
  default:
    name: saler-dev-network
    driver: bridge
EOF
    
    print_success "تم إنشاء docker-compose.override.yml"
}

# Setup IDE configurations
setup_ide_configs() {
    print_header "إعداد IDE Configurations"
    
    # Create .vscode/settings.json
    mkdir -p .vscode
    cat > .vscode/settings.json << 'EOF'
{
  // Editor settings
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  },
  "editor.rulers": [88, 120],
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  
  // Python settings
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "python.formatting.provider": "black",
  "python.sortImports.args": ["--profile", "black"],
  
  // TypeScript/JavaScript settings
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "javascript.format.enable": true,
  "javascript.format.indent": 2,
  
  // JSON settings
  "json.schemas": [
    {
      "fileMatch": ["package.json"],
      "url": "https://json.schemastore.org/package.json"
    }
  ],
  
  // Git settings
  "git.ignoreLimitWarning": true,
  "git.autofetch": true,
  
  // Files to exclude
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/venv": true,
    "**/.env.local": true,
    "**/logs": true,
    "**/dev-data": true
  },
  
  // Search settings
  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true,
    "**/logs": true,
    "**/dev-data": true,
    "**/.next": true,
    "**/*.log": true
  },
  
  // Terminal settings
  "terminal.integrated.env.linux": {
    "PYTHONPATH": "${workspaceFolder}/backend"
  },
  "terminal.integrated.env.osx": {
    "PYTHONPATH": "${workspaceFolder}/backend"
  },
  "terminal.integrated.env.windows": {
    "PYTHONPATH": "${workspaceFolder}\\backend"
  }
}
EOF

    # Create .vscode/extensions.json
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    // Python development
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "ms-python.mypy-type-checker",
    
    // JavaScript/TypeScript/React
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    
    // Database
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg",
    "ms-ossdata.vscode-postgresql",
    
    // Development tools
    "ms-vscode.vscode-yaml",
    "redhat.vscode-xml",
    "dotjoshjohnson.xml",
    "ms-vscode.vscode-markdown",
    
    // Git and collaboration
    "eamodio.gitlens",
    "github.vscode-pull-request-github",
    
    // Docker and containers
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker",
    
    // API and testing
    "humao.rest-client",
    "ms-vscode.vscode-testing-explorer",
    
    // Code quality
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    
    // Productivity
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one",
    "christian-kohler.path-intellisense"
  ]
}
EOF

    # Create .vscode/launch.json for debugging
    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/venv/bin/uvicorn",
      "args": [
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload"
      ],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    },
    {
      "name": "Python: Tests",
      "type": "python",
      "request": "launch",
      "module": "pytest",
      "args": [
        "${workspaceFolder}/backend/tests",
        "-v"
      ],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    },
    {
      "name": "Node.js: Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": [
        "dev"
      ],
      "cwd": "${workspaceFolder}/frontend",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "runtimeArgs": [
        "--require",
        "source-map-support/register"
      ]
    },
    {
      "name": "Docker: Attach to Backend",
      "type": "docker",
      "request": "attach",
      "platform": "python",
      "containerName": "saler-backend",
      "remoteServerName": "salер-backend"
    }
  ]
}
EOF

    # Create .vscode/tasks.json
    cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Setup Development",
      "type": "shell",
      "command": "./scripts/setup.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start Development Environment",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "cd backend && python -m pytest",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Lint Code",
      "type": "shell",
      "command": "cd backend && python -m flake8 . && cd ../frontend && npm run lint",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Clean Up",
      "type": "shell",
      "command": "./scripts/reset.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
EOF

    print_success "تم إعداد VS Code configurations"
    
    # Create JetBrains IDE configurations
    mkdir -p .idea
    cat > .idea/saler.iml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<module type="PYTHON_MODULE" version="4">
  <component name="NewModuleRootManager">
    <content url="file://$MODULE_DIR$">
      <sourceFolder url="file://$MODULE_DIR$/backend" isTestSource="false" />
      <sourceFolder url="file://$MODULE_DIR$/frontend" isTestSource="false" />
      <excludeFolder url="file://$MODULE_DIR$/venv" />
      <excludeFolder url="file://$MODULE_DIR$/node_modules" />
      <excludeFolder url="file://$MODULE_DIR$/logs" />
      <excludeFolder url="file://$MODULE_DIR$/dev-data" />
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
  <component name="PyDocumentationSettings">
    <option name="format" value="GOOGLE" />
    <option name="myDocStringFormat" value="Google" />
  </component>
  <component name="TestRunnerService">
    <option name="PROJECT_TEST_RUNNER" value="pytest" />
  </component>
</module>
EOF

    print_success "تم إعداد JetBrains IDE configurations"
}

# Create project structure directories
create_project_structure() {
    print_header "إنشاء بنية المشروع"
    
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
        "frontend/.next"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_info "تم إنشاء مجلد: $dir"
        fi
    done
    
    # Create .gitkeep files for empty directories
    find dev-data -type d -empty -exec touch {}/.gitkeep \;
    
    print_success "تم إنشاء بنية المشروع"
}

# Main setup function
main_setup() {
    print_header "بدء إعداد بيئة التطوير المتقدمة"
    
    echo "مرحباً بك في إعداد بيئة التطوير المتقدمة لنظام Saler SaaS"
    echo "سيتم إعداد جميع الأدوات والإعدادات اللازمة للتطوير الفعال"
    echo ""
    
    # Run setup steps
    check_requirements
    create_project_structure
    install_dev_tools
    setup_git_hooks
    create_dev_env_files
    setup_ide_configs
    
    print_header "تم الإعداد بنجاح!"
    
    echo -e "${GREEN}🎉 تمت إعداد بيئة التطوير بنجاح!${NC}\n"
    
    echo -e "${BLUE}📋 الخطوات التالية:${NC}"
    echo -e "  1. ${YELLOW}قم بتعديل ملف .env.local بالمفاتيح المطلوبة${NC}"
    echo -e "  2. ${YELLOW}شغل الخدمات باستخدام: ./scripts/dev.sh${NC}"
    echo -e "  3. ${YELLOW}تأكد من أن جميع الخدمات تعمل بشكل صحيح${NC}"
    
    echo -e "\n${BLUE}🔧 أوامر مفيدة:${NC}"
    echo -e "  • بدء التطوير: ${GREEN}./scripts/dev.sh${NC}"
    echo -e "  • إيقاف الخدمات: ${GREEN}./scripts/dev.sh stop${NC}"
    echo -e "  • إعادة تشغيل: ${GREEN}./scripts/dev.sh restart${NC}"
    echo -e "  • فحص الصحة: ${GREEN}./scripts/health-check.sh${NC}"
    echo -e "  • تنظيف البيئة: ${GREEN}./scripts/reset.sh${NC}"
    
    echo -e "\n${BLUE}🌐 الروابط المهمة:${NC}"
    echo -e "  • Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  • Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "  • API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  • pgAdmin: ${GREEN}http://localhost:8080${NC}"
    echo -e "  • Redis Commander: ${GREEN}http://localhost:8081${NC}"
    echo -e "  • MailHog: ${GREEN}http://localhost:8025${NC}"
    
    echo -e "\n${BLUE}📚 الوثائق:${NC}"
    echo -e "  • دليل البدء السريع: ${GREEN}docs/development/quick-start.md${NC}"
    echo -e "  • دليل التطوير: ${GREEN}docs/development/workflow-guide.md${NC}"
    echo -e "  • دليل استكشاف الأخطاء: ${GREEN}docs/development/troubleshooting.md${NC}"
    
    echo -e "\n${PURPLE}💡 نصائح:${NC}"
    echo -e "  • راجع ملف .env.example لجميع المتغيرات المتاحة"
    echo -e "  • استخدم VS Code مع الإضافات المُوصى بها"
    echo -e "  • تأكد من تشغيل Git hooks للفحص التلقائي"
    echo -e "  • راجع السجلات في مجلد logs/ عند الحاجة"
}

# Help function
show_help() {
    echo -e "${PURPLE}Saler Development Environment Setup${NC}\n"
    echo "الاستخدام:"
    echo "  $0 [command]\n"
    echo "الأوامر:"
    echo "  setup      - إعداد بيئة التطوير كاملة (افتراضي)"
    echo "  tools      - تثبيت أدوات التطوير فقط"
    echo "  ide        - إعداد IDE configurations فقط"
    echo "  git        - إعداد Git hooks فقط"
    echo "  structure  - إنشاء بنية المشروع فقط"
    echo "  help       - عرض هذه المساعدة\n"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        main_setup
        ;;
    "tools")
        install_dev_tools
        ;;
    "ide")
        setup_ide_configs
        ;;
    "git")
        setup_git_hooks
        ;;
    "structure")
        create_project_structure
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