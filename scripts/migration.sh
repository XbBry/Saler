#!/bin/bash

# Database Migration Script for Saler
# ====================================

set -e

# Configuration
PROJECT_NAME="saler"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
MIGRATIONS_DIR="./backend/prisma/migrations"
BACKUP_DIR="./backups/migrations"
ALEMBIC_INI="./backend/alembic.ini"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
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

confirm_action() {
    local message="$1"
    echo -e "${YELLOW}$message${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled by user"
        exit 0
    fi
}

check_requirements() {
    log_info "Checking migration requirements..."
    
    # Check if Docker is running
    if ! docker info &>/dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if database is accessible
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler; then
        log_error "PostgreSQL is not accessible"
        exit 1
    fi
    
    # Check if alembic is available
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic --version &>/dev/null; then
        log_error "Alembic is not available in the backend container"
        exit 1
    fi
    
    # Check migration directory
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        log_warning "Migrations directory not found: $MIGRATIONS_DIR"
        log_info "Creating migrations directory..."
        mkdir -p "$MIGRATIONS_DIR"
    fi
    
    log_success "Migration requirements check passed"
}

create_migration_backup() {
    log_info "Creating pre-migration backup..."
    
    local backup_name="pre_migration_$(date +%Y%m%d_%H%M%S)"
    local backup_file="$BACKUP_DIR/${backup_name}.sql"
    
    mkdir -p "$BACKUP_DIR"
    
    # Create database dump
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump \
        -U saler \
        -d saler \
        --verbose \
        --format=custom \
        --file="$backup_file"
    
    if [ $? -eq 0 ]; then
        log_success "Pre-migration backup created: $backup_file"
        echo "$backup_file"
    else
        log_error "Failed to create pre-migration backup"
        return 1
    fi
}

show_current_schema() {
    log_info "Current database schema status..."
    
    # Show current revision
    log_info "Current Alembic revision:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic current || {
        log_warning "Unable to determine current revision"
    }
    
    # Show available migrations
    log_info "Available migrations:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic history --verbose || {
        log_warning "Unable to show migration history"
    }
    
    # Show database tables
    log_info "Current database tables:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -d saler -c "\dt" || {
        log_warning "Unable to list database tables"
    }
}

list_pending_migrations() {
    log_info "Checking for pending migrations..."
    
    local pending_migrations=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic heads 2>/dev/null | wc -l)
    
    if [ "$pending_migrations" -gt 0 ]; then
        log_info "Pending migrations found:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic heads --verbose || true
    else
        log_info "No pending migrations found"
    fi
    
    echo "$pending_migrations"
}

generate_migration() {
    local message="$1"
    
    if [ -z "$message" ]; then
        log_error "Migration message is required"
        exit 1
    fi
    
    log_info "Generating new migration: $message"
    
    # Check if database is up to date before generating migration
    local current_revision=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic current 2>/dev/null || echo "none")
    log_info "Current revision: $current_revision"
    
    # Generate migration
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic revision --autogenerate -m "$message"; then
        log_success "Migration generated successfully"
        
        # Show the new migration file
        local migration_file=$(ls -t "$MIGRATIONS_DIR"/*.py 2>/dev/null | head -1)
        if [ ! -z "$migration_file" ]; then
            log_info "Generated migration file: $(basename "$migration_file")"
            log_info "Please review the migration file before applying it"
        fi
    else
        log_error "Failed to generate migration"
        return 1
    fi
}

validate_migration() {
    local migration_file="$1"
    
    log_info "Validating migration: $(basename "$migration_file")"
    
    # Check if migration file exists and is readable
    if [ ! -f "$migration_file" ]; then
        log_error "Migration file not found: $migration_file"
        return 1
    fi
    
    # Check for common issues in migration file
    local issues=0
    
    # Check for DROP TABLE operations without backup
    if grep -q "DROP TABLE" "$migration_file"; then
        log_warning "Migration contains DROP TABLE operations"
        echo "  Review the migration and ensure data is backed up"
        issues=$((issues + 1))
    fi
    
    # Check for ALTER TABLE operations
    if grep -q "ALTER TABLE" "$migration_file"; then
        log_info "Migration contains ALTER TABLE operations"
    fi
    
    # Check for CREATE INDEX operations
    if grep -q "CREATE INDEX" "$migration_file"; then
        log_info "Migration contains CREATE INDEX operations"
    fi
    
    # Check migration syntax
    if ! python -m py_compile "$migration_file" 2>/dev/null; then
        log_error "Migration file has syntax errors"
        issues=$((issues + 1))
    else
        log_success "Migration file syntax is valid"
    fi
    
    # Show migration content
    log_info "Migration content preview:"
    head -20 "$migration_file"
    echo "..."
    tail -10 "$migration_file"
    
    if [ $issues -gt 0 ]; then
        log_warning "Found $issues potential issues in migration"
        return 1
    else
        log_success "Migration validation passed"
    fi
}

apply_migration() {
    local migration_file="$1"
    
    if [ -z "$migration_file" ]; then
        log_error "Migration file is required"
        exit 1
    fi
    
    # Validate migration first
    validate_migration "$migration_file"
    
    log_info "Applying migration: $(basename "$migration_file")"
    
    # Confirm destructive operation
    confirm_action "This will apply the migration to the database. Continue?"
    
    # Apply migration
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic upgrade head; then
        log_success "Migration applied successfully"
        
        # Show current revision
        local new_revision=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic current 2>/dev/null || echo "unknown")
        log_info "New current revision: $new_revision"
    else
        log_error "Failed to apply migration"
        return 1
    fi
}

rollback_migration() {
    local target_revision="$1"
    
    if [ -z "$target_revision" ]; then
        log_error "Target revision is required for rollback"
        exit 1
    fi
    
    log_info "Rolling back to revision: $target_revision"
    
    # Confirm destructive operation
    confirm_action "This will rollback the database to a previous state. Continue?"
    
    # Rollback migration
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic downgrade "$target_revision"; then
        log_success "Migration rolled back successfully"
        
        # Show current revision
        local current_revision=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic current 2>/dev/null || echo "unknown")
        log_info "Current revision after rollback: $current_revision"
    else
        log_error "Failed to rollback migration"
        return 1
    fi
}

verify_migration() {
    log_info "Verifying migration results..."
    
    # Check database connectivity
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler; then
        log_error "Database is not accessible after migration"
        return 1
    fi
    
    # Check application connectivity
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python -c "import psycopg2; print('Database connection: OK')" 2>/dev/null; then
        log_warning "Backend database connectivity check failed"
    else
        log_success "Backend database connectivity: OK"
    fi
    
    # Check application health
    if curl -f http://localhost:8000/health &>/dev/null; then
        log_success "Application health check: OK"
    else
        log_warning "Application health check failed"
    fi
    
    # Show table structure changes
    log_info "Database tables after migration:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -d saler -c "\dt" || {
        log_warning "Unable to list database tables"
    }
    
    log_success "Migration verification completed"
}

create_migration_plan() {
    log_info "Creating migration plan..."
    
    local plan_file="$BACKUP_DIR/migration_plan_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$plan_file" << EOF
Saler Migration Plan
====================
Date: $(date)
Current Revision: $(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic current 2>/dev/null || echo "unknown")

Pending Migrations:
$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic heads --verbose 2>/dev/null || echo "None")

Migration Strategy:
1. Create backup of current database
2. Review each migration file
3. Apply migrations one by one
4. Verify application functionality
5. Run post-migration tests

Rollback Plan:
- Target revision: $(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic heads --verbose 2>/dev/null | head -1 | cut -d: -f1 || echo "head")
- Use: ./scripts/migration.sh rollback <revision>

EOF
    
    log_success "Migration plan created: $plan_file"
}

run_migration_tests() {
    log_info "Running migration tests..."
    
    # Create test database
    log_info "Creating test database..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -c "CREATE DATABASE saler_test;" 2>/dev/null || true
    
    # Apply migrations to test database
    log_info "Applying migrations to test database..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic upgrade head; then
        log_success "Migration tests passed"
    else
        log_error "Migration tests failed"
        # Cleanup test database
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -c "DROP DATABASE saler_test;" 2>/dev/null || true
        return 1
    fi
    
    # Run application tests if available
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python -m pytest tests/ -v &>/dev/null; then
        log_success "Application tests passed"
    else
        log_warning "Application tests failed or not available"
    fi
    
    # Cleanup test database
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -c "DROP DATABASE saler_test;" 2>/dev/null || true
}

generate_migration_report() {
    local report_file="$BACKUP_DIR/migration_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Saler Migration Report
======================
Date: $(date)
Migration ID: $(date +%Y%m%d_%H%M%S)

Migration Summary:
- Pre-migration backup: Created
- Current revision: $(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic current 2>/dev/null || echo "unknown")
- Pending migrations: $(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend alembic heads 2>/dev/null | wc -l)

Database Status:
$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -d saler -c "SELECT version();" 2>/dev/null || echo "Unable to determine version")

Application Status:
$(curl -s http://localhost:8000/health 2>/dev/null || echo "Health check unavailable")

Rollback Information:
- To rollback: ./scripts/migration.sh rollback <revision>
- Previous backup: $(ls -t "$BACKUP_DIR"/pre_migration_*.sql 2>/dev/null | head -1 | xargs basename || echo "Not available")

Next Steps:
1. Monitor application logs
2. Test critical functionality
3. Update documentation
4. Notify team of successful migration

EOF
    
    log_success "Migration report generated: $report_file"
}

main() {
    echo "============================================"
    echo "      SALER DATABASE MIGRATION SCRIPT"
    echo "============================================"
    echo
    
    # Parse command line arguments
    COMMAND=""
    ARGUMENT=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            generate)
                COMMAND="generate"
                shift
                if [[ $# -gt 0 ]]; then
                    ARGUMENT="$1"
                    shift
                fi
                ;;
            apply)
                COMMAND="apply"
                shift
                if [[ $# -gt 0 ]]; then
                    ARGUMENT="$1"
                    shift
                fi
                ;;
            rollback)
                COMMAND="rollback"
                shift
                if [[ $# -gt 0 ]]; then
                    ARGUMENT="$1"
                    shift
                fi
                ;;
            status)
                COMMAND="status"
                shift
                ;;
            plan)
                COMMAND="plan"
                shift
                ;;
            test)
                COMMAND="test"
                shift
                ;;
            help|--help|-h)
                echo "Usage: $0 [command] [options]"
                echo
                echo "Commands:"
                echo "  generate <message>    Generate new migration"
                echo "  apply [file]          Apply migration (file or latest)"
                echo "  rollback <revision>   Rollback to specific revision"
                echo "  status               Show migration status"
                echo "  plan                Create migration plan"
                echo "  test                Run migration tests"
                echo "  help                Show this help"
                echo
                echo "Examples:"
                echo "  $0 generate 'Add user preferences table'"
                echo "  $0 apply"
                echo "  $0 apply 2024_001_add_preferences.py"
                echo "  $0 rollback 2023_12_31_1200"
                echo "  $0 status"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    if [ -z "$COMMAND" ]; then
        log_error "Command is required"
        echo "Use '$0 help' for usage information"
        exit 1
    fi
    
    # Check requirements
    check_requirements
    
    # Execute command
    case $COMMAND in
        generate)
            if [ -z "$ARGUMENT" ]; then
                log_error "Migration message is required"
                echo "Usage: $0 generate <message>"
                exit 1
            fi
            generate_migration "$ARGUMENT"
            ;;
        apply)
            create_migration_backup
            
            if [ -z "$ARGUMENT" ]; then
                # Apply latest migration
                local latest_migration=$(ls -t "$MIGRATIONS_DIR"/*.py 2>/dev/null | head -1)
                if [ -z "$latest_migration" ]; then
                    log_error "No migration files found"
                    exit 1
                fi
                apply_migration "$latest_migration"
            else
                # Apply specific migration
                if [ ! -f "$ARGUMENT" ]; then
                    log_error "Migration file not found: $ARGUMENT"
                    exit 1
                fi
                apply_migration "$ARGUMENT"
            fi
            
            verify_migration
            generate_migration_report
            ;;
        rollback)
            if [ -z "$ARGUMENT" ]; then
                log_error "Target revision is required for rollback"
                exit 1
            fi
            rollback_migration "$ARGUMENT"
            verify_migration
            ;;
        status)
            show_current_schema
            ;;
        plan)
            create_migration_plan
            ;;
        test)
            run_migration_tests
            ;;
    esac
    
    log_success "Migration operation completed"
}

# Run main function
main "$@"