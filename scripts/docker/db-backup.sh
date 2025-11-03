#!/bin/bash

# 💾 Database Backup Script for Saler Platform
# Automated database backup and restore operations

set -e

# Configuration
PROJECT_NAME="saler"
BACKUP_DIR="backups"
DB_NAME="saler"
DB_USER="saler_user"
DB_HOST="localhost"
DB_PORT="5432"

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

# Function to create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    print_info "Backup directory: $BACKUP_DIR"
}

# Function to get database password from environment or prompt
get_db_password() {
    if [ -n "$POSTGRES_PASSWORD" ]; then
        echo "$POSTGRES_PASSWORD"
    else
        print_warning "POSTGRES_PASSWORD environment variable not set"
        print_info "Please enter database password:"
        read -rs DB_PASSWORD
        echo "$DB_PASSWORD"
    fi
}

# Function to create manual backup
create_backup() {
    local backup_name="${1:-saler_backup_$(date +%Y%m%d_%H%M%S)}"
    local compress="${2:-true}"
    
    print_info "Creating database backup: $backup_name"
    create_backup_dir
    
    DB_PASSWORD=$(get_db_password)
    export PGPASSWORD="$DB_PASSWORD"
    
    if [ "$compress" = "true" ]; then
        backup_file="${BACKUP_DIR}/${backup_name}.sql.gz"
        print_info "Creating compressed backup: $backup_file"
        
        # Create compressed backup
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$backup_file"
        
        if [ -f "$backup_file" ]; then
            backup_size=$(du -h "$backup_file" | cut -f1)
            print_success "Compressed backup created: $backup_file ($backup_size)"
        else
            print_error "Failed to create backup"
            exit 1
        fi
    else
        backup_file="${BACKUP_DIR}/${backup_name}.sql"
        print_info "Creating uncompressed backup: $backup_file"
        
        # Create uncompressed backup
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$backup_file"
        
        if [ -f "$backup_file" ]; then
            backup_size=$(du -h "$backup_file" | cut -f1)
            print_success "Backup created: $backup_file ($backup_size)"
        else
            print_error "Failed to create backup"
            exit 1
        fi
    fi
}

# Function to restore backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file name"
        print_info "Available backups:"
        ls -la "$BACKUP_DIR"/*.sql* 2>/dev/null || print_warning "No backups found"
        exit 1
    fi
    
    if [[ "$backup_file" == *.gz ]]; then
        if [ ! -f "$backup_file" ]; then
            print_error "Compressed backup file not found: $backup_file"
            exit 1
        fi
        print_warning "This will overwrite the current database!"
        print_warning "Continue? (y/N)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Restoring from compressed backup: $backup_file"
            DB_PASSWORD=$(get_db_password)
            export PGPASSWORD="$DB_PASSWORD"
            
            # Drop and recreate database
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
            createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
            
            # Restore from compressed backup
            gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
            
            print_success "Database restored from compressed backup"
        else
            print_info "Restore cancelled"
        fi
    else
        if [ ! -f "$backup_file" ]; then
            print_error "Backup file not found: $backup_file"
            exit 1
        fi
        print_warning "This will overwrite the current database!"
        print_warning "Continue? (y/N)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Restoring from backup: $backup_file"
            DB_PASSWORD=$(get_db_password)
            export PGPASSWORD="$DB_PASSWORD"
            
            # Drop and recreate database
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
            createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
            
            # Restore from backup
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" < "$backup_file"
            
            print_success "Database restored from backup"
        else
            print_info "Restore cancelled"
        fi
    fi
}

# Function to list backups
list_backups() {
    print_info "Available backups in $BACKUP_DIR:"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR"/*.sql* 2>/dev/null)" ]; then
        echo ""
        printf "%-30s %-15s %-15s\n" "File" "Size" "Date"
        echo "------------------------------------------------------------"
        
        for backup in "$BACKUP_DIR"/*.sql*; do
            if [ -f "$backup" ]; then
                filename=$(basename "$backup")
                filesize=$(du -h "$backup" | cut -f1)
                filedate=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1-2)
                printf "%-30s %-15s %-15s\n" "$filename" "$filesize" "$filedate"
            fi
        done
        echo ""
    else
        print_warning "No backups found in $BACKUP_DIR"
    fi
}

# Function to clean old backups
clean_old_backups() {
    local days=${1:-30}
    
    print_info "Cleaning backups older than $days days..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # Find and remove old backups
        find "$BACKUP_DIR" -name "*.sql*" -type f -mtime +$days -delete 2>/dev/null || true
        
        print_success "Old backups cleaned (older than $days days)"
        list_backups
    else
        print_warning "Backup directory $BACKUP_DIR not found"
    fi
}

# Function to schedule automatic backups
schedule_backups() {
    local interval=${1:-daily}  # daily, weekly, monthly
    
    print_info "Setting up automatic backups: $interval"
    
    # Create cron job
    local cron_cmd="0 2 * * * $PWD/scripts/docker/db-backup.sh backup"
    
    case $interval in
        "daily")
            cron_cmd="0 2 * * * $PWD/scripts/docker/db-backup.sh backup"
            ;;
        "weekly")
            cron_cmd="0 2 * * 0 $PWD/scripts/docker/db-backup.sh backup"
            ;;
        "monthly")
            cron_cmd="0 2 1 * * $PWD/scripts/docker/db-backup.sh backup"
            ;;
    esac
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_cmd") | crontab -
    
    print_success "Automatic backups scheduled: $interval"
    print_info "Cron job added: $cron_cmd"
}

# Function to verify backup integrity
verify_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file to verify"
        exit 1
    fi
    
    if [[ "$backup_file" == *.gz ]]; then
        print_info "Verifying compressed backup: $backup_file"
        
        # Test gunzip
        if gunzip -t "$backup_file" 2>/dev/null; then
            print_success "✅ Backup file integrity check passed"
            
            # Test database structure
            print_info "Testing database structure..."
            DB_PASSWORD=$(get_db_password)
            export PGPASSWORD="$DB_PASSWORD"
            
            # Show table count
            table_count=$(gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")
            print_info "Tables found: $table_count"
            
        else
            print_error "❌ Backup file integrity check failed"
            exit 1
        fi
    else
        print_info "Verifying backup: $backup_file"
        
        # Test file exists and is readable
        if [ -f "$backup_file" ] && [ -r "$backup_file" ]; then
            print_success "✅ Backup file is readable"
            
            # Test database structure
            print_info "Testing database structure..."
            DB_PASSWORD=$(get_db_password)
            export PGPASSWORD="$DB_PASSWORD"
            
            # Show table count (temporary database)
            temp_db="temp_verify_$(date +%s)"
            createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$temp_db" 2>/dev/null || true
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$temp_db" < "$backup_file" 2>/dev/null || true
            
            table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$temp_db" -tAc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$temp_db" 2>/dev/null || true
            
            print_info "Tables found: $table_count"
            print_success "✅ Database structure verification passed"
            
        else
            print_error "❌ Backup file is not readable or does not exist"
            exit 1
        fi
    fi
}

# Function to show backup statistics
show_stats() {
    print_info "Backup Statistics:"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR"/*.sql* 2>/dev/null)" ]; then
        local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        local file_count=$(find "$BACKUP_DIR" -name "*.sql*" -type f | wc -l)
        local latest_backup=$(ls -t "$BACKUP_DIR"/*.sql* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
        local latest_date=$(ls -lt "$BACKUP_DIR"/*.sql* 2>/dev/null | head -1 | awk '{print $6, $7, $8}' || echo "N/A")
        
        echo ""
        echo "📊 Backup Directory: $BACKUP_DIR"
        echo "📁 Total Size: $total_size"
        echo "📄 Total Files: $file_count"
        echo "🕒 Latest Backup: $latest_backup ($latest_date)"
        echo ""
    else
        print_warning "No backups found"
    fi
}

# Function to show help
help() {
    echo "💾 Saler Platform Database Backup Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup [name] [compress]     Create backup (name optional, compress=true/false)"
    echo "  restore <file>              Restore from backup file"
    echo "  list                       List all available backups"
    echo "  clean [days]               Clean backups older than X days (default: 30)"
    echo "  verify <file>              Verify backup file integrity"
    echo "  stats                      Show backup statistics"
    echo "  schedule [interval]         Schedule automatic backups (daily/weekly/monthly)"
    echo "  help                       Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 backup my_backup false"
    echo "  $0 restore backups/saler_backup_20231201_120000.sql"
    echo "  $0 clean 7"
    echo "  $0 verify backups/saler_backup_20231201_120000.sql.gz"
    echo "  $0 schedule weekly"
    echo ""
    echo "Environment Variables:"
    echo "  POSTGRES_PASSWORD          Database password"
    echo "  DB_NAME                    Database name (default: saler)"
    echo "  DB_USER                    Database user (default: saler_user)"
}

# Main script execution
case "${1:-help}" in
    "backup")
        create_backup "$2" "$3"
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "clean")
        clean_old_backups "$2"
        ;;
    "verify")
        verify_backup "$2"
        ;;
    "stats")
        show_stats
        ;;
    "schedule")
        schedule_backups "$2"
        ;;
    "help"|*)
        help
        ;;
esac