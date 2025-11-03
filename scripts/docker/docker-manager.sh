#!/bin/bash

# 🐳 Docker Management Script for Saler Platform
# Comprehensive script for managing Docker containers and services
# Usage: ./docker-manager.sh [command] [options]

set -e

# Configuration
PROJECT_NAME="saler"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV="docker-compose.yml"
COMPOSE_PROD="docker-compose.yml"
COMPOSE_OVERRIDE="docker-compose.override.yml"
COMPOSE_MONITORING="docker-compose.monitoring.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check Docker and Docker Compose
check_requirements() {
    print_info "Checking Docker requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are available"
}

# Function to create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    directories=(
        "data/postgres"
        "data/redis"
        "data/pgadmin"
        "logs/backend"
        "logs/frontend"
        "logs/nginx"
        "logs/postgres"
        "logs/redis"
        "backups"
        "static"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_info "Created directory: $dir"
    done
    
    print_success "Directories created successfully"
}

# Function to start development environment
start_dev() {
    print_info "Starting development environment..."
    
    check_requirements
    create_directories
    
    docker-compose -f "$COMPOSE_DEV" -f "$COMPOSE_OVERRIDE" --profile development up -d
    
    print_info "Waiting for services to start..."
    sleep 15
    
    # Check service health
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "Backend is running on http://localhost:8000"
    else
        print_warning "Backend health check failed"
    fi
    
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is running on http://localhost:3000"
    else
        print_warning "Frontend health check failed"
    fi
    
    print_success "Development environment started!"
    print_info "Backend API: http://localhost:8000"
    print_info "Frontend: http://localhost:3000"
    print_info "API Docs: http://localhost:8000/docs"
    print_info "pgAdmin: http://localhost:8080"
    print_info "Redis Commander: http://localhost:8081"
}

# Function to start production environment
start_prod() {
    print_info "Starting production environment..."
    
    check_requirements
    create_directories
    
    # Check if production environment variables are set
    if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$SECRET_KEY" ]; then
        print_error "Production environment variables not set!"
        print_error "Please set POSTGRES_PASSWORD and SECRET_KEY environment variables"
        exit 1
    fi
    
    docker-compose -f "$COMPOSE_FILE" -f docker-compose.prod.yml up -d
    
    print_info "Waiting for production services to start..."
    sleep 20
    
    # Check service health
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "Backend is running on http://localhost:8000"
    else
        print_warning "Backend health check failed"
    fi
    
    print_success "Production environment started!"
    print_info "Backend API: http://localhost:8000"
    print_info "Frontend: http://localhost:3001"
    print_info "Nginx: http://localhost:80"
}

# Function to stop all services
stop() {
    print_info "Stopping all services..."
    docker-compose -f "$COMPOSE_DEV" -f "$COMPOSE_OVERRIDE" --profile development down
    docker-compose -f "$COMPOSE_FILE" -f docker-compose.prod.yml down
    print_success "All services stopped"
}

# Function to restart services
restart() {
    print_info "Restarting services..."
    stop
    sleep 5
    start_dev
}

# Function to view logs
logs() {
    local service=$1
    if [ -z "$service" ]; then
        print_info "Showing logs for all services..."
        docker-compose logs -f
    else
        print_info "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Function to execute commands in containers
exec() {
    local service=$1
    shift
    local command="$@"
    
    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        exit 1
    fi
    
    print_info "Executing command in $service: $command"
    docker-compose exec "$service" $command
}

# Function to build images
build() {
    print_info "Building Docker images..."
    
    print_info "Building backend image..."
    docker build -t saler/backend:latest ./backend
    
    print_info "Building frontend image..."
    docker build -t saler/frontend:latest ./frontend
    
    print_success "Images built successfully"
}

# Function to clean up Docker resources
clean() {
    print_warning "This will remove all containers, volumes, and networks. Continue? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Cleaning up Docker resources..."
        
        # Stop and remove containers
        docker-compose down -v --remove-orphans
        
        # Remove unused images
        docker image prune -af
        
        # Remove unused volumes
        docker volume prune -f
        
        # Remove unused networks
        docker network prune -f
        
        # Remove build cache
        docker builder prune -af
        
        print_success "Docker cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to backup database
backup_db() {
    local backup_name="saler_backup_$(date +%Y%m%d_%H%M%S)"
    
    print_info "Creating database backup: $backup_name"
    
    docker-compose exec postgres pg_dump -U saler_user saler > "backups/${backup_name}.sql"
    
    if [ -f "backups/${backup_name}.sql" ]; then
        print_success "Database backup created: backups/${backup_name}.sql"
        print_info "Backup size: $(du -h "backups/${backup_name}.sql" | cut -f1)"
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Function to restore database
restore_db() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file name"
        exit 1
    fi
    
    if [ ! -f "backups/$backup_file" ]; then
        print_error "Backup file not found: backups/$backup_file"
        exit 1
    fi
    
    print_warning "This will overwrite the current database. Continue? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Restoring database from: $backup_file"
        
        # Drop and recreate database
        docker-compose exec postgres dropdb -U saler_user saler
        docker-compose exec postgres createdb -U saler_user saler
        
        # Restore from backup
        docker-compose exec -T postgres psql -U saler_user saler < "backups/$backup_file"
        
        print_success "Database restored successfully"
    else
        print_info "Database restore cancelled"
    fi
}

# Function to show service status
status() {
    print_info "Service Status:"
    docker-compose ps
}

# Function to show help
help() {
    echo "🐳 Saler Platform Docker Manager"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start-dev        Start development environment"
    echo "  start-prod       Start production environment"
    echo "  stop            Stop all services"
    echo "  restart         Restart services"
    echo "  logs [service]  Show logs (all or specific service)"
    echo "  exec <service> [command]  Execute command in container"
    echo "  build           Build Docker images"
    echo "  clean           Clean up Docker resources"
    echo "  backup-db       Create database backup"
    echo "  restore-db <file>  Restore database from backup"
    echo "  status          Show service status"
    echo "  health          Check service health"
    echo "  help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 start-dev"
    echo "  $0 logs backend"
    echo "  $0 exec backend bash"
    echo "  $0 backup-db"
    echo "  $0 restore-db saler_backup_20231201_120000.sql"
}

# Function to check service health
health() {
    print_info "Checking service health..."
    
    # Check backend
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "✅ Backend: Healthy"
    else
        print_error "❌ Backend: Unhealthy"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "✅ Frontend: Healthy"
    else
        print_error "❌ Frontend: Unhealthy"
    fi
    
    # Check database
    if docker-compose exec postgres pg_isready -U saler_user -d saler &> /dev/null; then
        print_success "✅ Database: Healthy"
    else
        print_error "❌ Database: Unhealthy"
    fi
    
    # Check Redis
    if docker-compose exec redis redis-cli ping &> /dev/null; then
        print_success "✅ Redis: Healthy"
    else
        print_error "❌ Redis: Unhealthy"
    fi
}

# Main script execution
case "${1:-help}" in
    "start-dev")
        start_dev
        ;;
    "start-prod")
        start_prod
        ;;
    "stop")
        stop
        ;;
    "restart")
        restart
        ;;
    "logs")
        logs "$2"
        ;;
    "exec")
        shift
        exec "$@"
        ;;
    "build")
        build
        ;;
    "clean")
        clean
        ;;
    "backup-db")
        backup_db
        ;;
    "restore-db")
        restore_db "$2"
        ;;
    "status")
        status
        ;;
    "health")
        health
        ;;
    "help"|*)
        help
        ;;
esac