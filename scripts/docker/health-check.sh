#!/bin/bash

# 🏥 Health Check Script for Saler Platform
# Comprehensive health monitoring for all services

set -e

# Configuration
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
API_DOCS_URL="http://localhost:8000/docs"
HEALTH_ENDPOINT="/health"
METRICS_ENDPOINT="/metrics"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_CHECKS++))
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to increment total checks
check_started() {
    ((TOTAL_CHECKS++))
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    check_started
    print_info "Checking $name: $url"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "✅ $name: HTTP $status_code"
        return 0
    else
        print_error "❌ $name: HTTP $status_code (expected $expected_status)"
        return 1
    fi
}

# Function to check TCP port
check_tcp_port() {
    local name=$1
    local host=$2
    local port=$3
    
    check_started
    print_info "Checking $name: $host:$port"
    
    if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        print_success "✅ $name: Port $port is open"
        return 0
    else
        print_error "❌ $name: Port $port is closed"
        return 1
    fi
}

# Function to check Docker container
check_docker_container() {
    local container_name=$1
    
    check_started
    print_info "Checking Docker container: $container_name"
    
    if docker ps --format "table {{.Names}}" | grep -q "^$container_name$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
        
        if [ "$status" = "running" ]; then
            if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
                print_success "✅ $container_name: Running (Health: $health)"
                return 0
            else
                print_warning "⚠️ $container_name: Running but unhealthy (Health: $health)"
                return 1
            fi
        else
            print_error "❌ $container_name: Not running (Status: $status)"
            return 1
        fi
    else
        print_error "❌ $container_name: Container not found"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    check_started
    print_info "Checking PostgreSQL database connectivity"
    
    if docker-compose exec -T postgres pg_isready -U saler_user -d saler &> /dev/null; then
        print_success "✅ Database: PostgreSQL is ready"
        
        # Check database size
        local db_size=$(docker-compose exec -T postgres psql -U saler_user -d saler -tAc "SELECT pg_size_pretty(pg_database_size('saler'));" 2>/dev/null || echo "unknown")
        print_info "Database size: $db_size"
        
        return 0
    else
        print_error "❌ Database: PostgreSQL is not ready"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    check_started
    print_info "Checking Redis connectivity"
    
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        print_success "✅ Redis: Connection successful"
        
        # Check Redis info
        local redis_info=$(docker-compose exec -T redis redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "unknown")
        print_info "Redis memory usage: $redis_info"
        
        return 0
    else
        print_error "❌ Redis: Connection failed"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local path=${1:-.}
    local threshold=${2:-90}
    
    check_started
    print_info "Checking disk space for: $path (threshold: $threshold%)"
    
    local usage=$(df "$path" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        print_success "✅ Disk space: ${usage}% used"
        return 0
    elif [ "$usage" -lt 95 ]; then
        print_warning "⚠️ Disk space: ${usage}% used (warning)"
        return 1
    else
        print_error "❌ Disk space: ${usage}% used (critical)"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    check_started
    print_info "Checking system memory usage"
    
    if command -v free &> /dev/null; then
        local usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
        local used=$(free -h | grep Mem | awk '{print $3}')
        local total=$(free -h | grep Mem | awk '{print $2}')
        
        print_info "Memory usage: ${used}/${total} (${usage}%)"
        
        if (( $(echo "$usage < 80" | bc -l) )); then
            print_success "✅ Memory: ${usage}% used"
            return 0
        elif (( $(echo "$usage < 90" | bc -l) )); then
            print_warning "⚠️ Memory: ${usage}% used (warning)"
            return 1
        else
            print_error "❌ Memory: ${usage}% used (critical)"
            return 1
        fi
    else
        print_warning "⚠️ Memory: free command not available"
        return 1
    fi
}

# Function to check service logs for errors
check_service_logs() {
    local service=$1
    local max_errors=${2:-5}
    
    check_started
    print_info "Checking $service logs for errors"
    
    local error_count=$(docker-compose logs --tail=100 "$service" 2>/dev/null | grep -i "error\|exception\|failed" | wc -l || echo "0")
    
    if [ "$error_count" -eq 0 ]; then
        print_success "✅ $service: No recent errors in logs"
        return 0
    elif [ "$error_count" -lt "$max_errors" ]; then
        print_warning "⚠️ $service: $error_count errors found in recent logs"
        return 1
    else
        print_error "❌ $service: $error_count errors found in recent logs"
        return 1
    fi
}

# Function to perform comprehensive health check
comprehensive_health_check() {
    print_header "Saler Platform Health Check"
    print_info "Started at: $(date)"
    
    # Reset counters
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0
    WARNINGS=0
    
    # Check Docker containers
    print_header "Docker Containers"
    check_docker_container "saler-postgres"
    check_docker_container "saler-redis"
    check_docker_container "saler-backend"
    check_docker_container "saler-frontend"
    check_docker_container "saler-worker"
    
    # Check services endpoints
    print_header "Service Endpoints"
    check_http_endpoint "Backend Health" "$BACKEND_URL$HEALTH_ENDPOINT"
    check_http_endpoint "Backend API Docs" "$API_DOCS_URL"
    check_http_endpoint "Frontend" "$FRONTEND_URL"
    check_http_endpoint "Backend Metrics" "$BACKEND_URL$METRICS_ENDPOINT"
    
    # Check database and cache
    print_header "Database & Cache"
    check_database
    check_redis
    
    # Check ports
    print_header "Network Ports"
    check_tcp_port "Backend" "localhost" "8000"
    check_tcp_port "Frontend" "localhost" "3000"
    check_tcp_port "PostgreSQL" "localhost" "5432"
    check_tcp_port "Redis" "localhost" "6379"
    
    # Check system resources
    print_header "System Resources"
    check_disk_space
    check_memory
    
    # Check service logs
    print_header "Service Logs"
    check_service_logs "backend" 3
    check_service_logs "frontend" 3
    check_service_logs "postgres" 1
    check_service_logs "redis" 1
    
    # Performance checks
    print_header "Performance Checks"
    
    # Backend response time
    check_started
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$BACKEND_URL$HEALTH_ENDPOINT" --max-time 10)
    print_info "Backend response time: ${response_time}s"
    
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        print_success "✅ Backend response time: ${response_time}s"
    elif (( $(echo "$response_time < 3.0" | bc -l) )); then
        print_warning "⚠️ Backend response time: ${response_time}s (slow)"
    else
        print_error "❌ Backend response time: ${response_time}s (very slow)"
    fi
    
    # Summary
    print_header "Health Check Summary"
    echo ""
    echo "📊 Total Checks: $TOTAL_CHECKS"
    echo "✅ Passed: $PASSED_CHECKS"
    echo "⚠️ Warnings: $WARNINGS"
    echo "❌ Failed: $FAILED_CHECKS"
    echo ""
    
    local success_rate=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    echo "📈 Success Rate: ${success_rate}%"
    
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        if [ "$WARNINGS" -eq 0 ]; then
            print_success "🎉 All systems are healthy!"
            return 0
        else
            print_warning "⚠️ Systems are operational with warnings"
            return 1
        fi
    else
        print_error "💥 Some systems are not healthy!"
        return 2
    fi
}

# Function to monitor continuously
continuous_monitor() {
    local interval=${1:-30}
    
    print_info "Starting continuous health monitoring (interval: ${interval}s)"
    print_info "Press Ctrl+C to stop"
    
    while true; do
        clear
        comprehensive_health_check
        echo ""
        print_info "Next check in ${interval} seconds..."
        sleep "$interval"
    done
}

# Function to export health status as JSON
export_json() {
    print_info "Exporting health status as JSON..."
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local status="healthy"
    
    if [ "$FAILED_CHECKS" -gt 0 ]; then
        status="unhealthy"
    elif [ "$WARNINGS" -gt 0 ]; then
        status="warning"
    fi
    
    cat << EOF
{
  "timestamp": "$timestamp",
  "status": "$status",
  "checks": {
    "total": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "warnings": $WARNINGS,
    "failed": $FAILED_CHECKS,
    "success_rate": $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
  },
  "services": {
    "backend": {
      "url": "$BACKEND_URL",
      "health_endpoint": "$HEALTH_ENDPOINT",
      "status": "$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$HEALTH_ENDPOINT" --max-time 10 2>/dev/null || echo "down")"
    },
    "frontend": {
      "url": "$FRONTEND_URL",
      "status": "$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" --max-time 10 2>/dev/null || echo "down")"
    },
    "database": {
      "type": "postgresql",
      "status": "$(docker-compose exec -T postgres pg_isready -U saler_user -d saler &>/dev/null && echo "healthy" || echo "unhealthy")"
    },
    "redis": {
      "type": "redis",
      "status": "$(docker-compose exec -T redis redis-cli ping &>/dev/null && echo "healthy" || echo "unhealthy")"
    }
  }
}
EOF
}

# Function to show help
help() {
    echo "🏥 Saler Platform Health Check Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  check                  Perform comprehensive health check"
    echo "  monitor [interval]     Continuous monitoring (default: 30s)"
    echo "  export                 Export health status as JSON"
    echo "  container <name>       Check specific Docker container"
    echo "  endpoint <url>         Check specific HTTP endpoint"
    echo "  port <host> <port>     Check specific TCP port"
    echo "  database               Check database connectivity"
    echo "  redis                  Check Redis connectivity"
    echo "  disk [path] [threshold] Check disk space (default: 90%)"
    echo "  memory                 Check system memory"
    echo "  logs <service> [max]   Check service logs for errors"
    echo "  help                   Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 monitor 60"
    echo "  $0 container saler-backend"
    echo "  $0 endpoint http://localhost:8000/health"
    echo "  $0 port localhost 5432"
    echo "  $0 logs backend 5"
}

# Main script execution
case "${1:-check}" in
    "check")
        comprehensive_health_check
        ;;
    "monitor")
        continuous_monitor "${2:-30}"
        ;;
    "export")
        comprehensive_health_check > /dev/null 2>&1
        export_json
        ;;
    "container")
        check_docker_container "$2"
        ;;
    "endpoint")
        check_http_endpoint "Custom Endpoint" "$2"
        ;;
    "port")
        check_tcp_port "Custom Port" "$2" "$3"
        ;;
    "database")
        check_database
        ;;
    "redis")
        check_redis
        ;;
    "disk")
        check_disk_space "${2:-.}" "${3:-90}"
        ;;
    "memory")
        check_memory
        ;;
    "logs")
        check_service_logs "$2" "${3:-5}"
        ;;
    "help"|*)
        help
        ;;
esac