# 🚀 Docker Performance Optimization Script
# Applies system-level optimizations for better container performance

#!/bin/bash

set -e

echo "🐳 Applying Docker performance optimizations..."

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo "❌ This script should not be run as root for security reasons"
        echo "💡 Run as a regular user with Docker permissions"
        exit 1
    fi
}

# Function to optimize Docker daemon settings
optimize_docker_daemon() {
    if command -v sudo &> /dev/null; then
        echo "📝 Optimizing Docker daemon configuration..."
        
        DOCKER_DAEMON_CONFIG="/etc/docker/daemon.json"
        
        if [[ ! -f "$DOCKER_DAEMON_CONFIG" ]]; then
            echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"},"storage-driver":"overlay2","live-restore":true,"userland-proxy":false,"experimental":false,"metrics-addr":"127.0.0.1:9323"}' | sudo tee "$DOCKER_DAEMON_CONFIG" > /dev/null
            echo "✅ Created Docker daemon configuration"
            echo "🔄 Restart Docker service to apply changes"
            echo "   Run: sudo systemctl restart docker"
        else
            echo "⚠️  Docker daemon config already exists, backing up..."
            sudo cp "$DOCKER_DAEMON_CONFIG" "$DOCKER_DAEMON_CONFIG.backup.$(date +%s)"
            echo "✅ Backup created"
        fi
    fi
}

# Function to set up buildkit optimizations
setup_buildkit() {
    echo "🔧 Setting up BuildKit optimizations..."
    
    # Create Docker environment file
    DOCKER_ENV_FILE="$HOME/.docker/environment.env"
    mkdir -p "$(dirname "$DOCKER_ENV_FILE")"
    
    cat > "$DOCKER_ENV_FILE" << EOF
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1
BUILDKIT_PROGRESS=plain
BUILDKIT_INLINE_CACHE=1
EOF
    
    echo "✅ Created Docker environment configuration"
    echo "💡 Source this file: source $DOCKER_ENV_FILE"
}

# Function to optimize Docker Compose
optimize_compose() {
    echo "📝 Optimizing Docker Compose..."
    
    # Create compose override file for development
    COMPOSE_OVERRIDE="$HOME/.docker/compose.override.yml"
    mkdir -p "$(dirname "$COMPOSE_OVERRIDE")"
    
    cat > "$COMPOSE_OVERRIDE" << 'EOF'
version: '3.8'

services:
  # Development overrides
  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
  
  redis:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
  
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
  
  frontend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
EOF
    
    echo "✅ Created Docker Compose override file"
}

# Function to set up log rotation
setup_log_rotation() {
    echo "📝 Setting up Docker log rotation..."
    
    LOGROTATE_CONFIG="/etc/logrotate.d/docker-containers"
    
    if [[ ! -f "$LOGROTATE_CONFIG" ]] && command -v sudo &> /dev/null; then
        cat > "$LOGROTATE_CONFIG" << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
EOF
        echo "✅ Created log rotation configuration"
    else
        echo "⚠️  Log rotation config already exists or no sudo access"
    fi
}

# Function to optimize system settings
optimize_system() {
    echo "🔧 Optimizing system settings..."
    
    # Increase file watcher limits for development
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || echo "⚠️  Could not update inotify limits"
    
    # Optimize network settings
    echo net.core.somaxconn=65535 | sudo tee -a /etc/sysctl.conf > /dev/null 2>&1 || echo "⚠️  Could not update network settings"
    
    echo "✅ System optimizations applied (may require reboot to take effect)"
}

# Function to create useful aliases
create_aliases() {
    echo "📝 Creating useful Docker aliases..."
    
    ALIAS_FILE="$HOME/.docker_aliases"
    
    cat > "$ALIAS_FILE" << 'EOF'
# Docker and Docker Compose aliases for development
alias dps='docker ps'
alias dpsa='docker ps -a'
alias dstop='docker stop $(docker ps -q)'
alias drm='docker rm $(docker ps -aq)'
alias drmi='docker rmi $(docker images -q)'
alias dex='docker exec -it'
alias dlog='docker logs -f'
alias dbuild='docker build --no-cache'
alias dprune='docker system prune -af'

# Docker Compose aliases
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcr='docker-compose restart'
alias dcl='docker-compose logs -f'
alias dce='docker-compose exec'
alias dcb='docker-compose build --no-cache'
alias dcpull='docker-compose pull'
alias dcpush='docker-compose push'

# Saler-specific aliases
alias saler-dev='cd /path/to/saler && docker-compose up -d'
alias saler-stop='cd /path/to/saler && docker-compose down'
alias saler-logs='cd /path/to/saler && docker-compose logs -f'
alias saler-backup='cd /path/to/saler && docker-compose --profile maintenance run --rm db-backup'

# Environment management
alias env-dev='export $(cat .env | xargs)'
alias env-list='printenv | grep -E "(DATABASE_URL|REDIS_URL|SECRET_KEY)" | sed "s/=.*/: ****/"'

# Health checks
alias health='docker-compose ps && echo "\n=== Health Status ===" && curl -s http://localhost:8000/health && curl -s http://localhost:3000/api/health'

# Performance monitoring
alias docker-stats='docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"'
alias disk-usage='docker system df -v'

# Quick development commands
alias saler-shell='docker-compose exec backend bash'
alias saler-migrate='docker-compose --profile maintenance run --rm migrations'
alias saler-worker='docker-compose exec worker python -m workers.scheduler'

# Cleanup shortcuts
alias clean-docker='docker system prune -af --volumes'
alias clean-saler='docker-compose down -v --remove-orphans && docker system prune -af'

# Backup and restore
alias backup-db='docker-compose --profile maintenance run --rm db-backup'
alias restore-db='docker cp $(ls -t backups/*.sql | head -1):/backups/ ./tempRestore/ && docker-compose exec postgres psql -U saler_user saler < ./tempRestore/*.sql'
EOF
    
    echo "✅ Created Docker aliases"
    echo "💡 Source these aliases: source $ALIAS_FILE"
    echo "💡 Add to your .bashrc or .zshrc: echo 'source $ALIAS_FILE' >> ~/.bashrc"
}

# Function to display usage information
show_usage() {
    echo "🐳 Docker Performance Optimization Complete!"
    echo ""
    echo "📋 What's been optimized:"
    echo "   ✅ Docker daemon configuration"
    echo "   ✅ BuildKit settings"
    echo "   ✅ Docker Compose overrides"
    echo "   ✅ Log rotation setup"
    echo "   ✅ System performance settings"
    echo "   ✅ Useful aliases created"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Restart Docker: sudo systemctl restart docker"
    echo "   2. Source environment: source ~/.docker/environment.env"
    echo "   3. Load aliases: source ~/.docker_aliases"
    echo "   4. Rebuild containers: docker-compose up -d --build"
    echo ""
    echo "📊 Monitor performance:"
    echo "   • docker-stats - Real-time container stats"
    echo "   • docker system df - Disk usage"
    echo "   • health - Check all services health"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   • saler-dev - Start development environment"
    echo "   • saler-logs - Follow all logs"
    echo "   • backup-db - Create database backup"
    echo "   • clean-docker - Clean up Docker resources"
}

# Main execution
main() {
    echo "🚀 Starting Docker performance optimization..."
    echo ""
    
    check_root
    optimize_docker_daemon
    setup_buildkit
    optimize_compose
    setup_log_rotation
    optimize_system
    create_aliases
    
    echo ""
    show_usage
}

# Run main function
main "$@"