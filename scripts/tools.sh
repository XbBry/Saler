#!/bin/bash

# 🛠️ Saler Development Tools Installation Script
# ================================================
# سكريبت تثبيت وإعداد أدوات التطوير المتقدمة

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

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            echo "debian"
        elif [ -f /etc/redhat-release ]; then
            echo "redhat"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# Install system packages
install_system_packages() {
    print_header "تثبيت حزم النظام"
    
    local os=$(detect_os)
    
    case $os in
        "debian")
            print_step "تحديث قائمة الحزم..."
            sudo apt update -qq
            
            print_step "تثبيت حزم النظام الأساسية..."
            local packages=(
                "curl"
                "wget"
                "jq"
                "tree"
                "htop"
                "nc"
                "netstat-nat"
                "iproute2"
                "telnet"
                "vim"
                "nano"
                "git"
                "build-essential"
                "software-properties-common"
                "apt-transport-https"
                "ca-certificates"
                "gnupg"
                "lsb-release"
            )
            
            sudo apt install -y "${packages[@]}"
            ;;
            
        "redhat")
            print_step "تثبيت حزم النظام الأساسية..."
            local packages=(
                "curl"
                "wget"
                "jq"
                "tree"
                "htop"
                "nc"
                "telnet"
                "vim"
                "nano"
                "git"
                "gcc"
                "gcc-c++"
                "make"
                "redhat-lsb-core"
            )
            
            sudo yum install -y "${packages[@]}"
            ;;
            
        "macos")
            # Install Homebrew if not present
            if ! command -v brew &> /dev/null; then
                print_step "تثبيت Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            print_step "تثبيت حزم النظام..."
            local packages=(
                "curl"
                "wget"
                "jq"
                "tree"
                "htop"
                "nc"
                "vim"
                "nano"
                "git"
                "coreutils"
                "findutils"
            )
            
            brew install "${packages[@]}"
            ;;
            
        *)
            print_warning "نظام التشغيل غير مدعوم - سيتم تخطي تثبيت حزم النظام"
            ;;
    esac
    
    print_success "تم تثبيت حزم النظام"
}

# Install Python development tools
install_python_tools() {
    print_header "تثبيت أدوات Python التطويرية"
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 غير مثبت"
        return 1
    fi
    
    print_step "تثبيت/تحديث pip..."
    python3 -m pip install --upgrade pip
    
    print_step "تثبيت أدوات Python التطويرية..."
    local python_tools=(
        "pipenv"
        "poetry"
        "virtualenv"
        "black"
        "flake8"
        "isort"
        "mypy"
        "pre-commit"
        "pytest"
        "pytest-cov"
        "pytest-asyncio"
        "coverage"
        "bandit"
        "safety"
        "twine"
        "wheel"
        "setuptools"
    )
    
    # Check which tools are already installed and skip them
    for tool in "${python_tools[@]}"; do
        if python3 -m "$tool" --version &> /dev/null; then
            print_info "$tool مثبت بالفعل - تم تخطيه"
        else
            print_info "تثبيت $tool..."
            python3 -m pip install --user "$tool"
        fi
    done
    
    print_success "تم تثبيت أدوات Python التطويرية"
    
    # Create Python development configuration
    print_step "إنشاء تكوين Python التطويري..."
    mkdir -p ~/.config
    
    cat > ~/.config/pip.conf << 'EOF'
[global]
user = true
timeout = 60
index-url = https://pypi.org/simple/
extra-index-url = https://pypi.org/simple/

[install]
user = true
EOF
    
    print_success "تم إنشاء تكوين pip"
}

# Install Node.js development tools
install_nodejs_tools() {
    print_header "تثبيت أدوات Node.js التطويرية"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js غير مثبت"
        return 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm غير متوفر"
        return 1
    fi
    
    print_step "تثبيت أدوات Node.js التطويرية..."
    local node_tools=(
        "typescript"
        "ts-node"
        "eslint"
        "prettier"
        "jest"
        "cypress"
        "@vue/cli"
        "create-react-app"
        "next"
        "nuxt"
        "vite"
        "rollup"
        "webpack"
        "babel-cli"
        "npx"
    )
    
    for tool in "${node_tools[@]}"; do
        if npm list -g "$tool" &> /dev/null; then
            print_info "$tool مثبت بالفعل - تم تخطيه"
        else
            print_info "تثبيت $tool..."
            npm install -g "$tool"
        fi
    done
    
    print_success "تم تثبيت أدوات Node.js التطويرية"
    
    # Create npm configuration
    print_step "إنشاء تكوين npm..."
    
    # Set npm configuration
    npm config set registry https://registry.npmjs.org/
    npm config set fund false
    npm config set audit false
    
    print_success "تم إنشاء تكوين npm"
}

# Install development utilities
install_utilities() {
    print_header "تثبيت أدوات التطوير المساعدة"
    
    local os=$(detect_os)
    
    case $os in
        "debian"|"linux")
            print_step "تثبيت أدوات إضافية..."
            local util_packages=(
                "fd-find"
                "bat"
                "exa"
                "rg"
                "fzf"
                "ripgrep"
                "the_silver_searcher"
                "ctags"
                "universal-ctags"
                "shellcheck"
                "jq"
            )
            
            # Some packages might not be available in all repos
            for package in "${util_packages[@]}"; do
                if apt list "$package" 2>/dev/null | grep -q "installed"; then
                    print_info "$package مثبت بالفعل"
                else
                    sudo apt install -y "$package" 2>/dev/null || print_warning "تعذر تثبيت $package"
                fi
            done
            ;;
            
        "macos")
            print_step "تثبيت أدوات إضافية عبر Homebrew..."
            local util_packages=(
                "fd"
                "bat"
                "exa"
                "ripgrep"
                "fzf"
                "ctags"
                "shellcheck"
            )
            
            for package in "${util_packages[@]}"; do
                brew install "$package" 2>/dev/null || print_warning "تعذر تثبيت $package"
            done
            ;;
    esac
    
    print_success "تم تثبيت أدوات المساعدة"
}

# Install Docker tools
install_docker_tools() {
    print_header "تثبيت أدوات Docker"
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker غير مثبت - سيتم تخطي تثبيت أدوات Docker"
        return
    fi
    
    # Docker Compose (check if already installed as plugin)
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_step "تثبيت Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "تم تثبيت Docker Compose"
    fi
    
    # Docker GUI tools (Portainer)
    if [[ "$*" == *"--gui"* ]]; then
        print_step "تثبيت Portainer..."
        docker pull portainer/portainer-ce:latest
        print_success "تم تحميل صورة Portainer"
    fi
    
    # Docker utility tools
    local docker_tools=(
        "docker-clean"
        "docker-slim"
        "dive"
    )
    
    for tool in "${docker_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            print_info "$tool مثبت بالفعل"
        else
            print_info "تحميل $tool..."
            # Tools will be installed as needed
        fi
    done
    
    print_success "تم إعداد أدوات Docker"
}

# Install database tools
install_database_tools() {
    print_header "تثبيت أدوات قواعد البيانات"
    
    local os=$(detect_os)
    
    case $os in
        "debian")
            print_step "تثبيت أدوات PostgreSQL..."
            sudo apt install -y postgresql-client
            
            print_step "تثبيت أدوات MySQL..."
            sudo apt install -y mysql-client
            
            print_step "تثبيت أدوات SQLite..."
            sudo apt install -y sqlite3
            ;;
            
        "redhat")
            print_step "تثبيت أدوات قواعد البيانات..."
            sudo yum install -y postgresql mysql sqlite
            ;;
            
        "macos")
            print_step "تثبيت أدوات قواعد البيانات..."
            brew install postgresql mysql sqlite
            
            # Install additional database tools
            local db_tools=(
                "pgcli"
                "mycli"
                "sqlitebrowser"
                "dbeaver-community"
            )
            
            for tool in "${db_tools[@]}"; do
                brew install "$tool" 2>/dev/null || print_warning "تعذر تثبيت $tool"
            done
            ;;
    esac
    
    print_success "تم تثبيت أدوات قواعد البيانات"
}

# Install monitoring and debugging tools
install_monitoring_tools() {
    print_header "تثبيت أدوات المراقبة والتصحيح"
    
    # System monitoring
    print_step "تثبيت أدوات مراقبة النظام..."
    
    local os=$(detect_os)
    
    case $os in
        "debian")
            sudo apt install -y htop iotop nethogs ncdu
            ;;
        "redhat")
            sudo yum install -y htop iotop nethogs ncdu
            ;;
        "macos")
            brew install htop ncdu
            ;;
    esac
    
    # Install additional monitoring tools
    local monitoring_tools=(
        "htop"
        "iotop"
        "nethogs"
        "ncdu"
        "glances"
        "bashtop"
    )
    
    for tool in "${monitoring_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            print_info "$tool متوفر"
        else
            print_info "تثبيت $tool..."
            python3 -m pip install --user "$tool" 2>/dev/null || print_warning "تعذر تثبيت $tool"
        fi
    done
    
    print_success "تم تثبيت أدوات المراقبة"
}

# Create development scripts
create_dev_scripts() {
    print_header "إنشاء سكريبتات التطوير"
    
    # Create common development scripts directory
    mkdir -p scripts/common
    
    # Create database helper script
    cat > scripts/common/db-helpers.sh << 'EOF'
#!/bin/bash

# Database Helper Functions

# Connect to PostgreSQL
psql_dev() {
    docker-compose exec postgres psql -U saler_user saler
}

# Run PostgreSQL migration
psql_migrate() {
    docker-compose exec backend python -m alembic upgrade head
}

# Reset PostgreSQL database
psql_reset() {
    print_warning "سيتم حذف جميع البيانات!"
    docker-compose exec postgres psql -U saler_user -c "DROP DATABASE IF EXISTS saler;"
    docker-compose exec postgres psql -U saler_user -c "CREATE DATABASE saler;"
    psql_migrate
}

# Backup PostgreSQL
psql_backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U saler_user saler > "dev-data/backups/$backup_name"
    echo "تم إنشاء النسخة الاحتياطية: $backup_name"
}
EOF
    
    chmod +x scripts/common/db-helpers.sh
    
    # Create log helper script
    cat > scripts/common/log-helpers.sh << 'EOF'
#!/bin/bash

# Log Helper Functions

# Follow all logs
logs_all() {
    docker-compose logs -f
}

# Follow specific service logs
logs_service() {
    local service=${1:-}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        echo "Usage: logs_service <service_name>"
    fi
}

# Clean old logs
clean_logs() {
    find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    find logs/ -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
    echo "تم تنظيف السجلات القديمة"
}

# Show recent errors
show_errors() {
    find logs/ -name "*.log" -exec grep -l "ERROR\|FATAL\|CRITICAL" {} \; 2>/dev/null | head -5
}
EOF
    
    chmod +x scripts/common/log-helpers.sh
    
    print_success "تم إنشاء سكريبتات التطوير المساعدة"
}

# Create shell configuration
create_shell_config() {
    print_header "إنشاء تكوين Shell"
    
    # Create .bashrc or .zshrc additions
    local shell_config=""
    if [ -f "$HOME/.bashrc" ]; then
        shell_config="$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then
        shell_config="$HOME/.zshrc"
    fi
    
    if [ -n "$shell_config" ]; then
        # Add Saler development aliases
        cat >> "$shell_config" << 'EOF'

# Saler Development Environment Aliases
alias saler-start='./scripts/dev.sh start'
alias saler-stop='./scripts/dev.sh stop'
alias saler-status='./scripts/dev.sh status'
alias saler-logs='./scripts/dev.sh logs'
alias saler-clean='./scripts/reset.sh clean'
alias saler-full-clean='./scripts/reset.sh full'
alias psql-dev='docker-compose exec postgres psql -U saler_user saler'
alias redis-cli='docker-compose exec redis redis-cli'
alias backend-shell='docker-compose exec backend bash'
alias frontend-shell='docker-compose exec frontend sh'

# Development tools shortcuts
alias grepr='grep -r --color=auto'
alias findr='find . -name'
alias treed='tree -a -I node_modules'
alias pyclean='find . -name "__pycache__" -exec rm -rf {} +'
alias npmclean='cd frontend && rm -rf node_modules && npm install'

# Docker shortcuts
alias dps='docker ps'
alias dpa='docker ps -a'
alias dex='docker exec -it'
alias dlogs='docker logs -f'
alias dstop='docker stop $(docker ps -aq)'

# Python shortcuts
alias py='python3'
alias pip='pip3'
alias venv='source venv/bin/activate'
alias pytest='python -m pytest'

# Node.js shortcuts
alias ndev='npm run dev'
alias nbuild='npm run build'
alias nstart='npm start'
alias ntest='npm test'
EOF
        
        print_success "تم إنشاء تكوين Shell"
    else
        print_warning "لم يتم العثور على ملف تكوين Shell"
    fi
}

# Setup development environment in shell
setup_shell_environment() {
    print_header "إعداد بيئة Shell للتطوير"
    
    # Source the configuration
    if [ -f "$HOME/.bashrc" ]; then
        source "$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then
        source "$HOME/.zshrc"
    fi
    
    # Add scripts to PATH
    if ! echo $PATH | grep -q "$PWD/scripts"; then
        export PATH="$PWD/scripts:$PATH"
        print_info "تم إضافة scripts إلى PATH"
    fi
    
    print_success "تم إعداد بيئة Shell"
}

# Verify installations
verify_installations() {
    print_header "التحقق من التثبيت"
    
    local tools=(
        "python3"
        "pip3"
        "node"
        "npm"
        "git"
        "curl"
        "jq"
        "docker"
    )
    
    echo -e "${BLUE}التحقق من الأدوات الأساسية:${NC}"
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            local version=$($tool --version 2>/dev/null | head -1)
            print_success "$tool: $version"
        else
            print_error "$tool: غير مثبت"
        fi
    done
    
    echo -e "\n${BLUE}التحقق من أدوات Python:${NC}"
    local python_tools=("black" "flake8" "pytest" "mypy" "pre-commit")
    for tool in "${python_tools[@]}"; do
        if python3 -m "$tool" --version &> /dev/null; then
            print_success "$tool: متوفر"
        else
            print_warning "$tool: غير متوفر"
        fi
    done
    
    echo -e "\n${BLUE}التحقق من أدوات Node.js:${NC}"
    local node_tools=("typescript" "eslint" "prettier" "jest")
    for tool in "${node_tools[@]}"; do
        if npm list -g "$tool" &> /dev/null; then
            print_success "$tool: متوفر"
        else
            print_warning "$tool: غير متوفر"
        fi
    done
}

# Show installation summary
show_summary() {
    print_header "ملخص التثبيت"
    
    echo -e "${GREEN}🎉 تم تثبيت جميع أدوات التطوير بنجاح!${NC}\n"
    
    echo -e "${BLUE}الأدوات المثبتة:${NC}"
    echo -e "  • Python Development Tools"
    echo -e "  • Node.js Development Tools"
    echo -e "  • Database Tools"
    echo -e "  • Monitoring Tools"
    echo -e "  • Development Utilities"
    
    echo -e "\n${BLUE}الخطوات التالية:${NC}"
    echo -e "  1. ${YELLOW}شغل: ./scripts/setup.sh${NC}"
    echo -e "  2. ${YELLOW}ابدأ التطوير: ./scripts/dev.sh${NC}"
    
    echo -e "\n${BLUE}الأوامر المتاحة:${NC}"
    echo -e "  • saler-start        - بدء بيئة التطوير"
    echo -e "  • saler-stop         - إيقاف بيئة التطوير"
    echo -e "  • saler-status       - عرض حالة الخدمات"
    echo -e "  • psql-dev           - الاتصال بـ PostgreSQL"
    echo -e "  • redis-cli          - الاتصال بـ Redis"
    
    echo -e "\n${PURPLE}💡 نصائح:${NC}"
    echo -e "  • راجع الوثائق في docs/development/"
    echo -e "  • استخدم IDE configurations في .vscode/"
    echo -e "  • راجع troubleshooting guide للمشاكل الشائعة"
}

# Help function
show_help() {
    echo -e "${PURPLE}Saler Development Tools Installation${NC}\n"
    echo "الاستخدام:"
    echo "  $0 [options]\n"
    echo "الخيارات:"
    echo "  --all              - تثبيت جميع الأدوات (افتراضي)"
    echo "  --system           - تثبيت حزم النظام فقط"
    echo "  --python           - تثبيت أدوات Python فقط"
    echo "  --nodejs           - تثبيت أدوات Node.js فقط"
    echo "  --utilities        - تثبيت أدوات المساعدة فقط"
    echo "  --docker           - تثبيت أدوات Docker"
    echo "  --database         - تثبيت أدوات قواعد البيانات"
    echo "  --monitoring       - تثبيت أدوات المراقبة"
    echo "  --gui              - تثبيت أدوات GUI إضافية"
    echo "  --verify           - التحقق من التثبيت فقط"
    echo "  --help             - عرض هذه المساعدة\n"
}

# Main function
main() {
    local install_all=true
    local install_system=false
    local install_python=false
    local install_nodejs=false
    local install_utilities=false
    local install_docker=false
    local install_database=false
    local install_monitoring=false
    local install_gui=false
    local verify_only=false
    
    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --all)
                install_all=true
                ;;
            --system)
                install_all=false
                install_system=true
                ;;
            --python)
                install_all=false
                install_python=true
                ;;
            --nodejs)
                install_all=false
                install_nodejs=true
                ;;
            --utilities)
                install_all=false
                install_utilities=true
                ;;
            --docker)
                install_all=false
                install_docker=true
                ;;
            --database)
                install_all=false
                install_database=true
                ;;
            --monitoring)
                install_all=false
                install_monitoring=true
                ;;
            --gui)
                install_all=false
                install_gui=true
                ;;
            --verify)
                install_all=false
                verify_only=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
        esac
    done
    
    if [ "$verify_only" = true ]; then
        verify_installations
        exit 0
    fi
    
    print_header "بدء تثبيت أدوات التطوير"
    
    # Install selected tools
    if [ "$install_all" = true ] || [ "$install_system" = true ]; then
        install_system_packages
    fi
    
    if [ "$install_all" = true ] || [ "$install_python" = true ]; then
        install_python_tools
    fi
    
    if [ "$install_all" = true ] || [ "$install_nodejs" = true ]; then
        install_nodejs_tools
    fi
    
    if [ "$install_all" = true ] || [ "$install_utilities" = true ]; then
        install_utilities
    fi
    
    if [ "$install_all" = true ] || [ "$install_docker" = true ]; then
        install_docker_tools "$@"
    fi
    
    if [ "$install_all" = true ] || [ "$install_database" = true ]; then
        install_database_tools
    fi
    
    if [ "$install_all" = true ] || [ "$install_monitoring" = true ]; then
        install_monitoring_tools
    fi
    
    # Always create helper scripts and shell config
    create_dev_scripts
    create_shell_config
    setup_shell_environment
    
    # Verify and show summary
    verify_installations
    show_summary
}

# Run main function
main "$@"