# 🚀 Docker Performance Optimization Script
# Comprehensive performance optimization for Docker containers

#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"
BACKUP_DIR="$PROJECT_DIR/backups"
DATA_DIR="$PROJECT_DIR/data"

# =============================================================================
# PERFORMANCE MONITORING FUNCTIONS
# =============================================================================

# Function to display current Docker performance metrics
show_performance_metrics() {
    log_step "عرض مقاييس الأداء الحالية..."
    
    echo -e "${CYAN}=== Docker System Information ===${NC}"
    docker system df
    echo ""
    
    echo -e "${CYAN}=== Container Resource Usage ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""
    
    echo -e "${CYAN}=== Disk Usage ===${NC}"
    docker system df -v
    echo ""
    
    echo -e "${CYAN}=== Running Containers ===${NC}"
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
}

# Function to analyze performance bottlenecks
analyze_performance() {
    log_step "تحليل عنق الزجاجة في الأداء..."
    
    # Check CPU usage
    high_cpu_containers=$(docker stats --no-stream --format "{{.Container}} {{.CPUPerc}}" | awk '$2 > 80 {print $1}')
    if [ -n "$high_cpu_containers" ]; then
        log_warning "Containers with high CPU usage: $high_cpu_containers"
    else
        log_success "No containers with high CPU usage detected"
    fi
    
    # Check memory usage
    high_mem_containers=$(docker stats --no-stream --format "{{.Container}} {{.MemPerc}}" | awk -F'/' '$2 > 80 {print $1}')
    if [ -n "$high_mem_containers" ]; then
        log_warning "Containers with high memory usage: $high_mem_containers"
    else
        log_success "No containers with high memory usage detected"
    fi
    
    # Check disk I/O
    log_info "Checking disk I/O performance..."
    docker stats --no-stream --format "{{.Container}} {{.BlockIO}}" | while read container blockio; do
        if [[ $blockio == *"MB"* ]] || [[ $blockio == *"GB"* ]]; then
            log_warning "High disk I/O detected in container: $container ($blockio)"
        fi
    done
    
    # Check network I/O
    log_info "Checking network I/O performance..."
    docker stats --no-stream --format "{{.Container}} {{.NetIO}}" | while read container netio; do
        if [[ $netio == *"MB"* ]] || [[ $netio == *"GB"* ]]; then
            log_warning "High network I/O detected in container: $container ($netio)"
        fi
    done
}

# =============================================================================
# DOCKER DAEMON OPTIMIZATION
# =============================================================================

optimize_docker_daemon() {
    log_step "تحسين إعدادات Docker Daemon..."
    
    DAEMON_CONFIG="/etc/docker/daemon.json"
    BACKUP_CONFIG="$BACKUP_DIR/daemon.json.backup.$(date +%s)"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create optimized daemon configuration
    cat > "$DAEMON_CONFIG" << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5",
    "compress": true
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true",
    "overlay2.size=10G"
  ],
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    },
    "nproc": {
      "Name": "nproc",
      "Hard": 4096,
      "Soft": 4096
    }
  },
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "features": {
    "buildkit": true
  },
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 10,
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
    
    log_success "تم إنشاء تكوين Docker daemon محسن"
    log_info "يجب إعادة تشغيل Docker لتطبيق التغييرات: sudo systemctl restart docker"
}

# =============================================================================
# BUILDKIT OPTIMIZATION
# =============================================================================

setup_buildkit() {
    log_step "إعداد BuildKit للتحسين..."
    
    # Create buildkit configuration
    mkdir -p "$HOME/.docker"
    
    cat > "$HOME/.docker/buildx.toml" << 'EOF'
[worker.oci]
  default = true

[worker.containerd]
  default = true

[registry."docker.io"]
  mirrors = ["mirror.gcr.io"]

[registry."gcr.io"]
  mirrors = ["mirror.gcr.io"]
EOF
    
    # Set environment variables
    if ! grep -q "DOCKER_BUILDKIT=1" "$HOME/.bashrc"; then
        echo 'export DOCKER_BUILDKIT=1' >> "$HOME/.bashrc"
        echo 'export COMPOSE_DOCKER_CLI_BUILD=1' >> "$HOME/.bashrc"
        echo 'export BUILDKIT_PROGRESS=plain' >> "$HOME/.bashrc"
        echo 'export BUILDKIT_INLINE_CACHE=1' >> "$HOME/.bashrc"
    fi
    
    log_success "تم إعداد BuildKit للتحسين"
}

# =============================================================================
# CONTAINER OPTIMIZATION
# =============================================================================

optimize_containers() {
    log_step "تحسين إعدادات الـ containers..."
    
    # Create container optimization script
    cat > "$DOCKER_DIR/optimize-containers.sh" << 'EOF'
#!/bin/bash
# Container optimization script

# Function to optimize container runtime settings
optimize_container() {
    local container_name=$1
    local memory_limit=$2
    local cpu_limit=$3
    
    echo "Optimizing container: $container_name"
    
    # Update memory limits
    docker update --memory="$memory_limit" --memory-swap="$memory_limit" "$container_name" || true
    
    # Update CPU limits
    docker update --cpus="$cpu_limit" "$container_name" || true
    
    # Enable auto-restart
    docker update --restart unless-stopped "$container_name" || true
    
    # Set logging limits
    docker update --log-opt max-size=50m --log-opt max-file=5 "$container_name" || true
}

# Optimize specific containers
optimize_container "saler-backend" "512m" "0.5"
optimize_container "saler-worker" "256m" "0.25"
optimize_container "saler-frontend" "256m" "0.5"
optimize_container "saler-postgres" "1g" "0.5"
optimize_container "saler-redis" "512m" "0.25"

echo "Container optimization completed"
EOF
    
    chmod +x "$DOCKER_DIR/optimize-containers.sh"
    log_success "تم إنشاء سكريبت تحسين containers"
}

# =============================================================================
# NETWORK OPTIMIZATION
# =============================================================================

optimize_networks() {
    log_step "تحسين إعدادات الشبكة..."
    
    # Create network optimization script
    cat > "$DOCKER_DIR/optimize-networks.sh" << 'EOF'
#!/bin/bash
# Network optimization script

# Create high-performance network
docker network create \
    --driver bridge \
    --opt com.docker.network.bridge.name=saler-perf \
    --opt com.docker.network.bridge.enable_icc=true \
    --opt com.docker.network.bridge.enable_ip_masquerade=true \
    --opt com.docker.network.driver.mtu=1500 \
    saler-perf-network || echo "Network already exists"

# Configure DNS optimization
echo "nameserver 8.8.8.8" | sudo tee /etc/docker/dns.conf > /dev/null 2>&1 || true

# Optimize bridge settings
echo 'net.core.rmem_max = 16777216' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'net.core.wmem_max = 16777216' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'net.ipv4.tcp_rmem = 4096 65536 16777216' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'net.ipv4.tcp_wmem = 4096 65536 16777216' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true

# Apply sysctl settings
sudo sysctl -p > /dev/null 2>&1 || true

echo "Network optimization completed"
EOF
    
    chmod +x "$DOCKER_DIR/optimize-networks.sh"
    log_success "تم إنشاء سكريبت تحسين الشبكة"
}

# =============================================================================
# STORAGE OPTIMIZATION
# =============================================================================

optimize_storage() {
    log_step "تحسين إعدادات التخزين..."
    
    # Create storage optimization script
    cat > "$DOCKER_DIR/optimize-storage.sh" << 'EOF'
#!/bin/bash
# Storage optimization script

# Create directories for data
mkdir -p data/postgres data/redis data/uploads data/logs

# Optimize filesystem settings
echo 'vm.swappiness = 10' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'vm.dirty_ratio = 15' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'vm.dirty_background_ratio = 5' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'vm.dirty_expire_centisecs = 3000' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true
echo 'vm.dirty_writeback_centisecs = 500' | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || true

# Apply sysctl settings
sudo sysctl -p > /dev/null 2>&1 || true

# Set up log rotation for Docker
sudo tee /etc/logrotate.d/docker > /dev/null << 'LOGROTATE'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 50M
    missingok
    delaycompress
    copytruncate
    notifempty
}
LOGROTATE

# Create tmpfs for temporary files
echo 'tmpfs /tmp tmpfs defaults,size=1G,mode=1777 0 0' | sudo tee -a /etc/fstab > /dev/null 2>&1 || true

echo "Storage optimization completed"
EOF
    
    chmod +x "$DOCKER_DIR/optimize-storage.sh"
    log_success "تم إنشاء سكريبت تحسين التخزين"
}

# =============================================================================
# MONITORING SETUP
# =============================================================================

setup_monitoring() {
    log_step "إعداد مراقبة الأداء..."
    
    # Create performance monitoring script
    cat > "$DOCKER_DIR/perf-monitor.sh" << 'EOF'
#!/bin/bash
# Performance monitoring script

# Create monitoring directory
mkdir -p monitoring/perf

# CPU monitoring
monitor_cpu() {
    while true; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
        memory_usage=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
        disk_usage=$(df -h / | awk 'NR==2{print $5}')
        
        echo "$timestamp,CPU:${cpu_usage}%,Memory:${memory_usage}%,Disk:${disk_usage}" >> monitoring/perf/system-metrics.log
        
        # Check for performance issues
        if (( $(echo "$cpu_usage > 80" | bc -l) )); then
            echo "[ALERT] High CPU usage detected: $cpu_usage%"
        fi
        
        if (( $(echo "$memory_usage > 80" | bc -l) )); then
            echo "[ALERT] High memory usage detected: $memory_usage%"
        fi
        
        sleep 60
    done
}

# Container performance monitoring
monitor_containers() {
    while true; do
        docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" >> monitoring/perf/container-metrics.log
        sleep 30
    done
}

# Start monitoring in background
monitor_cpu &
monitor_containers &

echo "Performance monitoring started"
wait
EOF
    
    chmod +x "$DOCKER_DIR/perf-monitor.sh"
    log_success "تم إنشاء سكريبت مراقبة الأداء"
}

# =============================================================================
# PERFORMANCE TESTING
# =============================================================================

run_performance_tests() {
    log_step "تشغيل اختبارات الأداء..."
    
    # Create performance testing script
    cat > "$DOCKER_DIR/perf-test.sh" << 'EOF'
#!/bin/bash
# Performance testing script

echo "Starting performance tests..."

# Test 1: Container startup time
test_startup_time() {
    echo "Testing container startup time..."
    start_time=$(date +%s.%N)
    docker run --rm hello-world > /dev/null 2>&1
    end_time=$(date +%s.%N)
    startup_time=$(echo "$end_time - $start_time" | bc)
    echo "Container startup time: ${startup_time}s"
}

# Test 2: Build performance
test_build_performance() {
    echo "Testing build performance..."
    start_time=$(date +%s.%N)
    docker build -t perf-test . > /dev/null 2>&1
    end_time=$(date +%s.%N)
    build_time=$(echo "$end_time - $start_time" | bc)
    echo "Build time: ${build_time}s"
}

# Test 3: Network performance
test_network_performance() {
    echo "Testing network performance..."
    docker run --rm --network host alpine ping -c 10 google.com
}

# Test 4: Disk I/O performance
test_disk_performance() {
    echo "Testing disk I/O performance..."
    docker run --rm -v /tmp:/data alpine dd if=/dev/zero of=/data/test bs=1M count=100 oflag=direct
}

# Run all tests
test_startup_time
test_build_performance
test_network_performance
test_disk_performance

echo "Performance tests completed"
EOF
    
    chmod +x "$DOCKER_DIR/perf-test.sh"
    log_success "تم إنشاء سكريبت اختبارات الأداء"
}

# =============================================================================
# CLEANUP AND MAINTENANCE
# =============================================================================

cleanup_docker() {
    log_step "تنظيف Docker وتحسين الأداء..."
    
    # Create cleanup script
    cat > "$DOCKER_DIR/cleanup.sh" << 'EOF'
#!/bin/bash
# Docker cleanup and optimization script

echo "Starting Docker cleanup..."

# Remove unused containers
echo "Removing unused containers..."
docker container prune -f

# Remove unused images
echo "Removing unused images..."
docker image prune -a -f

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Remove build cache
echo "Removing build cache..."
docker builder prune -f

# Remove system-wide debris
echo "Removing system debris..."
docker system prune -f

# Optimize database
echo "Optimizing Docker database..."
docker system df

echo "Docker cleanup completed"
EOF
    
    chmod +x "$DOCKER_DIR/cleanup.sh"
    log_success "تم إنشاء سكريبت التنظيف"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

check_requirements() {
    log_step "التحقق من المتطلبات..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker غير متشغل. يرجى بدء تشغيل Docker."
        exit 1
    fi
    
    # Check if running as root or with sudo privileges
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        log_warning "هذا السكريبت يحتاج صلاحيات sudo لتحسينات النظام"
    fi
    
    log_success "جميع المتطلبات محققة"
}

create_performance_aliases() {
    log_step "إنشاء aliases لتحسين الأداء..."
    
    cat >> "$HOME/.docker_aliases" << 'EOF'

# Performance monitoring aliases
alias perf-metrics='bash /path/to/docker/perf-monitor.sh'
alias perf-test='bash /path/to/docker/perf-test.sh'
alias perf-cleanup='bash /path/to/docker/cleanup.sh'
alias perf-optimize='bash /path/to/docker/optimize-*.sh'

# Performance viewing aliases
alias perf-stats='docker stats --no-stream'
alias perf-top='docker stats'
alias perf-mem='docker system df -v'
alias perf-net='docker network ls'

# Resource management aliases
alias perf-limits='docker update --cpus 0.5 --memory 512m'
alias perf-restart='docker-compose restart'
alias perf-rebuild='docker-compose up -d --build'

# System monitoring
alias sys-info='echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '\''{print $2}'\'' | awk -F'\''%'\'' '\''{print $1}'\'')"; echo "Memory Usage: $(free | grep Mem | awk '\''{printf("%.2f", $3/$2 * 100.0)}'\'')"; echo "Disk Usage: $(df -h / | awk '\''NR==2{print $5}'\'')'
EOF
    
    log_success "تم إنشاء aliases الأداء"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo -e "${CYAN}"
    echo "================================================================================"
    echo "                    🚀 Docker Performance Optimization"
    echo "================================================================================"
    echo -e "${NC}"
    
    log_info "بدء تحسين أداء Docker..."
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR" "$DATA_DIR" "$DOCKER_DIR"
    
    # Check requirements
    check_requirements
    
    # Run optimizations
    optimize_docker_daemon
    setup_buildkit
    optimize_containers
    optimize_networks
    optimize_storage
    setup_monitoring
    run_performance_tests
    cleanup_docker
    create_performance_aliases
    
    # Show final results
    echo ""
    log_success "تم تحسين أداء Docker بنجاح!"
    echo ""
    echo -e "${GREEN}التحسينات المطبقة:${NC}"
    echo "  ✅ تحسين Docker Daemon"
    echo "  ✅ إعداد BuildKit"
    echo "  ✅ تحسين Containers"
    echo "  ✅ تحسين Network"
    echo "  ✅ تحسين Storage"
    echo "  ✅ إعداد Monitoring"
    echo "  ✅ إنشاء Performance Tests"
    echo "  ✅ إنشاء Cleanup Scripts"
    echo "  ✅ إنشاء Performance Aliases"
    echo ""
    echo -e "${YELLOW}الخطوات التالية:${NC}"
    echo "  1. إعادة تشغيل Docker: sudo systemctl restart docker"
    echo "  2. تحميل aliases: source ~/.docker_aliases"
    echo "  3. تشغيل مراقبة الأداء: perf-metrics"
    echo "  4. تشغيل اختبارات الأداء: perf-test"
    echo "  5. مراقبة الأداء: perf-stats"
    echo ""
    echo -e "${BLUE}ملفات مفيدة:${NC}"
    echo "  - $DOCKER_DIR/perf-monitor.sh - مراقبة الأداء"
    echo "  - $DOCKER_DIR/perf-test.sh - اختبارات الأداء"
    echo "  - $DOCKER_DIR/cleanup.sh - تنظيف Docker"
    echo "  - ~/.docker_aliases - aliases مفيدة"
    echo ""
    
    # Show current performance
    show_performance_metrics
}

# Run main function
main "$@"