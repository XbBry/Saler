#!/bin/bash

# Security Validation Script for Saler
# =====================================

set -e

# Configuration
PROJECT_NAME="saler"
SECURITY_REPORT="/var/log/saler/security/security-report-$(date +%Y%m%d_%H%M%S).txt"
SECURITY_DIR="/var/log/saler/security"
BACKUP_DIR="./backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Security scoring
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNING_CHECKS=0
FAILED_CHECKS=0

# Functions
log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

# Create security directory
mkdir -p "$SECURITY_DIR"

# 1. Check file permissions
check_file_permissions() {
    log_info "Checking file permissions..."
    
    local permission_issues=0
    
    # Check sensitive files
    local sensitive_files=(
        "./.env.production"
        "./docker/ssl/key.pem"
        "./docker/ssl/cert.pem"
        "./backups"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [ -e "$file" ]; then
            local perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null || echo "unknown")
            
            case "$file" in
                *".env.production")
                    if [ "$perms" != "600" ] && [ "$perms" != "unknown" ]; then
                        log_error "Environment file has incorrect permissions: $perms (should be 600)"
                        ((permission_issues++))
                    else
                        log_success "Environment file permissions are secure"
                    fi
                    ;;
                *"key.pem")
                    if [ "$perms" != "600" ] && [ "$perms" != "unknown" ]; then
                        log_error "Private key has incorrect permissions: $perms (should be 600)"
                        ((permission_issues++))
                    else
                        log_success "Private key permissions are secure"
                    fi
                    ;;
                *"cert.pem")
                    if [ "$perms" != "644" ] && [ "$perms" != "unknown" ]; then
                        log_warning "Certificate permissions: $perms (recommended: 644)"
                        ((permission_issues++))
                    else
                        log_success "Certificate permissions are acceptable"
                    fi
                    ;;
                *"backups")
                    if [ "$perms" = "777" ] || [ "$perms" = "666" ]; then
                        log_error "Backup directory has overly permissive permissions: $perms"
                        ((permission_issues++))
                    else
                        log_success "Backup directory permissions are secure"
                    fi
                    ;;
            esac
        else
            log_warning "File not found: $file"
        fi
    done
    
    # Check Docker socket permissions (if running Docker)
    if [ -S "/var/run/docker.sock" ]; then
        local docker_perms=$(stat -c "%a" /var/run/docker.sock 2>/dev/null || echo "unknown")
        if [ "$docker_perms" != "660" ] && [ "$docker_perms" != "unknown" ]; then
            log_warning "Docker socket permissions: $docker_perms (recommended: 660)"
        else
            log_success "Docker socket permissions are secure"
        fi
    fi
    
    if [ $permission_issues -eq 0 ]; then
        log_success "File permission check passed"
    else
        log_error "Found $permission_issues file permission issues"
    fi
}

# 2. Check for exposed secrets
check_exposed_secrets() {
    log_info "Checking for exposed secrets..."
    
    local secret_patterns=(
        "password\s*=\s*['\"][^'\"]{8,}['\"]"
        "secret\s*=\s*['\"][^'\"]{8,}['\"]"
        "key\s*=\s*['\"][^'\"]{8,}['\"]"
        "token\s*=\s*['\"][^'\"]{8,}['\"]"
        "api_key\s*=\s*['\"][^'\"]{8,}['\"]"
    )
    
    local exposed_secrets=0
    local search_dirs=("./" "./logs")
    
    for dir in "${search_dirs[@]}"; do
        if [ -d "$dir" ]; then
            for pattern in "${secret_patterns[@]}"; do
                # Search in common file types
                for ext in "py" "js" "ts" "json" "env" "yml" "yaml" "txt" "log"; do
                    if grep -r -i -E "$pattern" "$dir" --include="*.$ext" 2>/dev/null; then
                        log_error "Potential secret found in $dir files"
                        ((exposed_secrets++))
                    fi
                done
            done
        fi
    done
    
    # Check for hardcoded passwords in Python files
    if grep -r -i "password\s*=" . --include="*.py" --exclude-dir=venv --exclude-dir=node_modules 2>/dev/null | grep -v "#.*password\|password.*#" | head -5; then
        log_warning "Potential hardcoded passwords found in Python files"
        ((exposed_secrets++))
    fi
    
    # Check for API keys in JavaScript/TypeScript files
    if grep -r -i "api[_-]key\|secret[_-]key" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null | grep -v "process.env\|NEXT_PUBLIC" | head -3; then
        log_warning "Potential API keys found in frontend files"
        ((exposed_secrets++))
    fi
    
    if [ $exposed_secrets -eq 0 ]; then
        log_success "No obvious exposed secrets found"
    else
        log_error "Found $exposed_secrets potential secret exposure issues"
    fi
}

# 3. Check SSL/TLS configuration
check_ssl_configuration() {
    log_info "Checking SSL/TLS configuration..."
    
    local ssl_dir="./docker/ssl"
    local cert_file="$ssl_dir/cert.pem"
    local key_file="$ssl_dir/key.pem"
    
    # Check if SSL files exist
    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        log_success "SSL certificate and key files exist"
        
        # Check certificate validity
        if command -v openssl &> /dev/null; then
            # Check certificate expiry
            local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d= -f2)
            if [ ! -z "$expiry_date" ]; then
                local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ "$days_until_expiry" -lt 7 ]; then
                    log_error "SSL certificate expires in $days_until_expiry days"
                elif [ "$days_until_expiry" -lt 30 ]; then
                    log_warning "SSL certificate expires in $days_until_expiry days"
                else
                    log_success "SSL certificate is valid for $days_until_expiry days"
                fi
            fi
            
            # Check certificate issuer
            local issuer=$(openssl x509 -in "$cert_file" -noout -issuer 2>/dev/null | grep -o "CN = [^,]*" | cut -d= -f2 | tr -d ' ')
            if echo "$issuer" | grep -qi "self.*signed\|localhost"; then
                log_warning "Certificate appears to be self-signed: $issuer"
            else
                log_success "Certificate issuer: $issuer"
            fi
            
            # Check key strength
            local key_info=$(openssl rsa -in "$key_file" -check -noout 2>/dev/null || echo "invalid")
            if [ "$key_info" = "RSA key ok" ]; then
                log_success "Private key format is valid"
                
                # Check key size
                local key_size=$(openssl rsa -in "$key_file" -text -noout 2>/dev/null | grep "Private-Key:" | grep -o "[0-9]\+ bit" | grep -o "[0-9]\+")
                if [ "$key_size" -ge 2048 ]; then
                    log_success "Private key size is secure: $key_size bits"
                else
                    log_error "Private key size is too small: $key_size bits (recommended: 2048+)"
                fi
            else
                log_error "Private key format is invalid"
            fi
        else
            log_warning "OpenSSL not available, skipping detailed SSL checks"
        fi
    else
        log_error "SSL certificate or key file missing"
    fi
    
    # Check for weak SSL protocols in nginx config
    local nginx_config="./docker/nginx.prod.conf"
    if [ -f "$nginx_config" ]; then
        if grep -q "ssl_protocols.*TLSv1.0\|ssl_protocols.*TLSv1.1" "$nginx_config"; then
            log_error "Weak SSL protocols detected (TLSv1.0/TLSv1.1)"
        else
            log_success "SSL protocols configuration is secure"
        fi
        
        # Check for HSTS header
        if grep -q "Strict-Transport-Security" "$nginx_config"; then
            log_success "HSTS header is configured"
        else
            log_warning "HSTS header not configured"
        fi
    fi
}

# 4. Check database security
check_database_security() {
    log_info "Checking database security..."
    
    # Check if PostgreSQL is accessible from outside
    local postgres_port=$(docker-compose exec -T postgres sh -c "netstat -tlnp | grep :5432" 2>/dev/null | wc -l)
    if [ "$postgres_port" -gt 0 ]; then
        log_warning "PostgreSQL port is listening (may be exposed)"
    else
        log_success "PostgreSQL port is not exposed"
    fi
    
    # Check database connections
    if docker-compose exec -T postgres psql -U saler -d saler -c "SELECT count(*) FROM pg_stat_activity;" &>/dev/null; then
        local connection_count=$(docker-compose exec -T postgres psql -U saler -d saler -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ' | head -1)
        if [ "$connection_count" -gt 100 ]; then
            log_warning "High number of database connections: $connection_count"
        else
            log_success "Database connection count is normal: $connection_count"
        fi
    else
        log_warning "Unable to check database connections"
    fi
    
    # Check for default passwords
    local env_file="./.env.production"
    if [ -f "$env_file" ]; then
        if grep -i "password.*=\|postgresql.*password" "$env_file" | grep -qi "change.*this\|default\|password"; then
            log_error "Default or placeholder passwords detected in environment file"
        else
            log_success "No default passwords detected in environment file"
        fi
    fi
}

# 5. Check container security
check_container_security() {
    log_info "Checking container security..."
    
    # Check for containers running as root
    local root_containers=$(docker ps --format "table {{.Names}}\t{{.Image}}" | grep -E "(saler-.*)" | while read name image; do
        if docker inspect "$name" --format '{{.State.Status}}' 2>/dev/null | grep -q running; then
            local user=$(docker inspect "$name" --format '{{.Config.User}}' 2>/dev/null)
            if [ -z "$user" ] || [ "$user" = "root" ] || [ "$user" = "0" ]; then
                echo "$name:$user"
            fi
        fi
    done)
    
    if [ ! -z "$root_containers" ]; then
        log_warning "Some containers may be running as root:"
        echo "$root_containers" | while read container_info; do
            log_warning "  $container_info"
        done
    else
        log_success "All containers are running as non-root users"
    fi
    
    # Check for privileged containers
    local privileged_containers=$(docker ps --format "table {{.Names}}" | grep -E "(saler-.*)" | while read name; do
        if docker inspect "$name" --format '{{.HostConfig.Privileged}}' 2>/dev/null | grep -q true; then
            echo "$name"
        fi
    done)
    
    if [ ! -z "$privileged_containers" ]; then
        log_error "Privileged containers detected:"
        echo "$privileged_containers" | while read container; do
            log_error "  $container"
        done
    else
        log_success "No privileged containers detected"
    fi
    
    # Check for mounted Docker socket
    local socket_mounts=$(docker ps --format "table {{.Names}}" | grep -E "(saler-.*)" | while read name; do
        if docker inspect "$name" --format '{{range .Mounts}}{{if eq .Type "bind"}}{{.Source}}{{end}}{{end}}' 2>/dev/null | grep -q "/var/run/docker.sock"; then
            echo "$name"
        fi
    done)
    
    if [ ! -z "$socket_mounts" ]; then
        log_error "Containers with Docker socket mounted:"
        echo "$socket_mounts" | while read container; do
            log_error "  $container"
        done
    else
        log_success "No containers have Docker socket mounted"
    fi
}

# 6. Check network security
check_network_security() {
    log_info "Checking network security..."
    
    # Check for exposed ports
    local exposed_ports=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(saler-.*)" | grep -v "127.0.0.1\|localhost")
    
    if [ ! -z "$exposed_ports" ]; then
        log_warning "Some services may have exposed ports:"
        echo "$exposed_ports" | while read line; do
            log_warning "  $line"
        done
    else
        log_success "No obviously exposed ports detected"
    fi
    
    # Check firewall rules (if ufw is available)
    if command -v ufw &> /dev/null; then
        local firewall_status=$(ufw status 2>/dev/null | grep "Status:" | awk '{print $2}')
        if [ "$firewall_status" = "active" ]; then
            log_success "Firewall (ufw) is active"
            
            # Check for open ports
            local open_ports=$(ufw status numbered 2>/dev/null | grep -E "ALLOW|80|443|22" | wc -l)
            if [ "$open_ports" -gt 5 ]; then
                log_warning "Many firewall rules configured: $open_ports"
            fi
        else
            log_warning "Firewall is not active"
        fi
    elif command -v iptables &> /dev/null; then
        local iptables_rules=$(iptables -L 2>/dev/null | wc -l)
        if [ "$iptables_rules" -gt 10 ]; then
            log_success "iptables rules configured: $iptables_rules"
        else
            log_warning "Few iptables rules configured"
        fi
    else
        log_warning "No firewall configuration tool found"
    fi
}

# 7. Check application security headers
check_security_headers() {
    log_info "Checking security headers..."
    
    # Check Nginx configuration for security headers
    local nginx_config="./docker/nginx.prod.conf"
    if [ -f "$nginx_config" ]; then
        local headers_to_check=(
            "X-Frame-Options"
            "X-Content-Type-Options"
            "X-XSS-Protection"
            "Strict-Transport-Security"
            "Content-Security-Policy"
        )
        
        local missing_headers=0
        for header in "${headers_to_check[@]}"; do
            if grep -q "$header" "$nginx_config"; then
                log_success "Security header found: $header"
            else
                log_warning "Security header missing: $header"
                ((missing_headers++))
            fi
        done
        
        if [ $missing_headers -eq 0 ]; then
            log_success "All security headers are configured"
        fi
    fi
    
    # Test actual security headers (if service is running)
    if curl -s -I http://localhost/health &>/dev/null; then
        log_info "Testing security headers via HTTP request..."
        
        local response_headers=$(curl -s -I http://localhost/health 2>/dev/null)
        
        # Check for security headers in response
        if echo "$response_headers" | grep -qi "x-frame-options"; then
            log_success "X-Frame-Options header present"
        else
            log_warning "X-Frame-Options header missing in response"
        fi
        
        if echo "$response_headers" | grep -qi "x-content-type-options"; then
            log_success "X-Content-Type-Options header present"
        else
            log_warning "X-Content-Type-Options header missing in response"
        fi
    fi
}

# 8. Check for security vulnerabilities
check_vulnerabilities() {
    log_info "Checking for known vulnerabilities..."
    
    # Check for outdated packages (if package.json exists)
    if [ -f "./package.json" ]; then
        if command -v npm &> /dev/null; then
            log_info "Checking npm dependencies for vulnerabilities..."
            
            if npm audit --audit-level=high 2>/dev/null; then
                log_success "No high-severity npm vulnerabilities found"
            else
                log_warning "High-severity npm vulnerabilities detected"
            fi
        fi
    fi
    
    # Check Python dependencies (if requirements.txt exists)
    if [ -f "./requirements.txt" ]; then
        if command -v pip &> /dev/null; then
            log_info "Checking Python dependencies for vulnerabilities..."
            
            if pip install safety && safety check --json 2>/dev/null; then
                log_success "No known Python vulnerabilities found"
            else
                log_warning "Potential Python vulnerabilities detected"
            fi
        fi
    fi
    
    # Check for common vulnerable files
    local vulnerable_files=(
        ".env"
        ".git/config"
        "docker-compose.override.yml"
        "docker-compose.yml"
    )
    
    for file in "${vulnerable_files[@]}"; do
        if [ -f "$file" ]; then
            if echo "$file" | grep -q "\.env"; then
                if [ "$file" = ".env" ]; then
                    log_warning "Production environment file (.env) found - ensure it's not committed"
                fi
            fi
        fi
    done
}

# 9. Check backup security
check_backup_security() {
    log_info "Checking backup security..."
    
    # Check backup directory permissions
    if [ -d "$BACKUP_DIR" ]; then
        local backup_perms=$(stat -c "%a" "$BACKUP_DIR" 2>/dev/null || echo "unknown")
        if [ "$backup_perms" != "700" ] && [ "$backup_perms" != "750" ]; then
            log_warning "Backup directory permissions: $backup_perms (recommended: 700)"
        else
            log_success "Backup directory permissions are secure"
        fi
        
        # Check for unencrypted backups
        local unencrypted_backups=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.rdb" 2>/dev/null | wc -l)
        local encrypted_backups=$(find "$BACKUP_DIR" -name "*.sql.gz" -o -name "*.rdb.gz" 2>/dev/null | wc -l)
        
        if [ "$unencrypted_backups" -gt 0 ]; then
            log_error "Unencrypted backups found: $unencrypted_backups"
        else
            log_success "All backups are encrypted/compressed"
        fi
        
        if [ "$encrypted_backups" -gt 0 ]; then
            log_success "Encrypted backups found: $encrypted_backups"
        fi
        
        # Check backup age
        local old_backups=$(find "$BACKUP_DIR" -name "*backup*" -mtime +30 2>/dev/null | wc -l)
        if [ "$old_backups" -gt 0 ]; then
            log_warning "Old backups (>30 days) found: $old_backups"
        else
            log_success "No old backups found"
        fi
    else
        log_warning "Backup directory not found"
    fi
}

# 10. Check system security
check_system_security() {
    log_info "Checking system security..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        log_warning "Script is running as root"
    else
        log_success "Script is not running as root"
    fi
    
    # Check for fail2ban
    if systemctl is-active --quiet fail2ban 2>/dev/null; then
        log_success "fail2ban is running"
        
        # Check active jails
        local active_jails=$(fail2ban-client status 2>/dev/null | grep "Jail list:" | cut -d: -f2 | tr -d ' ' | wc -w)
        if [ "$active_jails" -gt 0 ]; then
            log_success "Active fail2ban jails: $active_jails"
        else
            log_warning "No active fail2ban jails"
        fi
    else
        log_warning "fail2ban is not running"
    fi
    
    # Check for automatic security updates
    if command -v apt &> /dev/null; then
        if dpkg -l | grep -q unattended-upgrades; then
            log_success "Automatic security updates are configured"
        else
            log_warning "Automatic security updates may not be configured"
        fi
    fi
    
    # Check for users with sudo access
    local sudo_users=$(grep -E "^[^#].*\bsudo\b" /etc/group 2>/dev/null | cut -d: -f4 | tr ',' '\n' | wc -l)
    if [ "$sudo_users" -gt 3 ]; then
        log_warning "Many users with sudo access: $sudo_users"
    else
        log_success "Reasonable number of sudo users: $sudo_users"
    fi
}

# Generate security report
generate_security_report() {
    log_info "Generating security report..."
    
    {
        echo "Saler Security Assessment Report"
        echo "================================"
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo "Uptime: $(uptime)"
        echo
        
        echo "Security Summary:"
        echo "  Total Checks: $TOTAL_CHECKS"
        echo "  Passed: $PASSED_CHECKS"
        echo "  Warnings: $WARNING_CHECKS"
        echo "  Failed: $FAILED_CHECKS"
        echo "  Security Score: $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))%"
        echo
        
        echo "Container Status:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep saler || echo "Docker not available"
        echo
        
        echo "System Information:"
        echo "  OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)"
        echo "  Kernel: $(uname -r)"
        echo "  Architecture: $(uname -m)"
        echo "  Memory: $(free -h | awk 'NR==2{print $2}')"
        echo "  Disk: $(df -h / | awk 'NR==2{print $2}')"
        echo
        
        echo "Recent Security Events:"
        journalctl -u ssh --since "24 hours ago" --no-pager 2>/dev/null | tail -10 || echo "No recent SSH events"
        echo
        
        echo "Recommendations:"
        if [ $FAILED_CHECKS -gt 0 ]; then
            echo "- Address all security failures immediately"
        fi
        if [ $WARNING_CHECKS -gt 0 ]; then
            echo "- Review and address security warnings"
        fi
        echo "- Regularly update dependencies"
        echo "- Monitor security logs"
        echo "- Implement regular security assessments"
        
    } > "$SECURITY_REPORT"
    
    log_success "Security report saved to: $SECURITY_REPORT"
}

# Main function
main() {
    echo "============================================"
    echo "       SALER SECURITY VALIDATION SCRIPT"
    echo "============================================"
    echo
    
    # Parse command line arguments
    COMMAND="check"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            check)
                COMMAND="check"
                shift
                ;;
            report)
                COMMAND="report"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [command] [options]"
                echo
                echo "Commands:"
                echo "  check    Run comprehensive security validation (default)"
                echo "  report   Generate detailed security report"
                echo
                echo "Options:"
                echo "  --help, -h    Show this help"
                echo
                echo "This script checks:"
                echo "  - File permissions"
                echo "  - Exposed secrets"
                echo "  - SSL/TLS configuration"
                echo "  - Database security"
                echo "  - Container security"
                echo "  - Network security"
                echo "  - Security headers"
                echo "  - Vulnerability scanning"
                echo "  - Backup security"
                echo "  - System security"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute command
    case $COMMAND in
        check)
            log_info "Starting comprehensive security validation..."
            
            check_file_permissions
            check_exposed_secrets
            check_ssl_configuration
            check_database_security
            check_container_security
            check_network_security
            check_security_headers
            check_vulnerabilities
            check_backup_security
            check_system_security
            
            # Generate report
            generate_security_report
            
            # Summary
            echo
            log_info "Security validation completed:"
            echo "  Total Checks: $TOTAL_CHECKS"
            echo "  Passed: $PASSED_CHECKS"
            echo "  Warnings: $WARNING_CHECKS"
            echo "  Failed: $FAILED_CHECKS"
            
            local security_score=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
            echo "  Security Score: $security_score%"
            
            if [ $FAILED_CHECKS -eq 0 ]; then
                if [ $WARNING_CHECKS -eq 0 ]; then
                    log_success "All security checks passed!"
                    exit 0
                else
                    log_warning "Security check completed with warnings"
                    exit 0
                fi
            else
                log_error "Security check failed with $FAILED_CHECKS critical issues"
                exit 1
            fi
            ;;
        report)
            generate_security_report
            ;;
    esac
}

# Run main function
main "$@"