#!/bin/bash

# 🐳 Docker Cleanup Script for Saler Platform
# Comprehensive cleanup of Docker resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to clean containers
clean_containers() {
    print_info "Cleaning up containers..."
    
    # Stop all containers
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    # Remove all containers
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    print_success "Containers cleaned"
}

# Function to clean images
clean_images() {
    print_info "Cleaning up images..."
    
    # Remove unused images
    docker image prune -af
    
    print_success "Images cleaned"
}

# Function to clean volumes
clean_volumes() {
    print_warning "Cleaning volumes will delete all data! Continue? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Cleaning volumes..."
        
        # Remove unused volumes
        docker volume prune -f
        
        print_success "Volumes cleaned"
    else
        print_info "Volume cleanup cancelled"
    fi
}

# Function to clean networks
clean_networks() {
    print_info "Cleaning up networks..."
    
    # Remove unused networks
    docker network prune -f
    
    print_success "Networks cleaned"
}

# Function to clean build cache
clean_build_cache() {
    print_info "Cleaning build cache..."
    
    # Remove build cache
    docker builder prune -af
    
    print_success "Build cache cleaned"
}

# Function to clean system
clean_system() {
    print_info "Running system-wide cleanup..."
    
    # Remove unused objects
    docker system prune -af
    
    print_success "System cleanup completed"
}

# Function to clean Saler-specific resources
clean_saler() {
    print_info "Cleaning Saler-specific resources..."
    
    # Stop and remove Saler containers
    docker-compose down -v --remove-orphans 2>/dev/null || true
    
    # Remove Saler images
    docker rmi saler/backend:latest saler/frontend:latest 2>/dev/null || true
    
    # Remove Saler volumes
    docker volume rm saler_postgres_data saler_redis_data 2>/dev/null || true
    
    print_success "Saler resources cleaned"
}

# Function to show Docker disk usage
show_disk_usage() {
    print_info "Docker disk usage:"
    docker system df
}

# Function to deep clean
deep_clean() {
    print_warning "This will perform a deep cleanup of all Docker resources!"
    print_warning "This will remove ALL containers, images, volumes, and networks."
    print_warning "This action cannot be undone!"
    print_warning ""
    print_warning "Continue? (YES/NO)"
    read -r response
    
    if [[ "$response" == "YES" ]]; then
        clean_system
        clean_images
        clean_volumes
        clean_networks
        clean_build_cache
        print_success "Deep cleanup completed"
    else
        print_info "Deep cleanup cancelled"
    fi
}

# Function to show help
help() {
    echo "🧹 Saler Platform Docker Cleanup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  containers    Clean up containers only"
    echo "  images        Clean up images only"
    echo "  volumes       Clean up volumes only"
    echo "  networks      Clean up networks only"
    echo "  cache         Clean build cache only"
    echo "  saler         Clean Saler-specific resources"
    echo "  system        Run system-wide cleanup"
    echo "  deep          Perform deep cleanup (ALL resources)"
    echo "  disk-usage    Show Docker disk usage"
    echo "  help          Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 saler"
    echo "  $0 system"
    echo "  $0 deep"
}

# Main script execution
case "${1:-help}" in
    "containers")
        clean_containers
        ;;
    "images")
        clean_images
        ;;
    "volumes")
        clean_volumes
        ;;
    "networks")
        clean_networks
        ;;
    "cache")
        clean_build_cache
        ;;
    "saler")
        clean_saler
        ;;
    "system")
        clean_system
        show_disk_usage
        ;;
    "deep")
        deep_clean
        show_disk_usage
        ;;
    "disk-usage")
        show_disk_usage
        ;;
    "help"|*)
        help
        ;;
esac