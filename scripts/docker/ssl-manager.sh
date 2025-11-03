#!/bin/bash

# 🔒 SSL Certificate Management Script for Saler Platform
# Automated SSL certificate generation and renewal

set -e

# Configuration
SSL_DIR="docker/ssl"
LETSENCRYPT_DIR="docker/letsencrypt"
DOMAIN=${DOMAIN:-localhost}
EMAIL=${EMAIL:-admin@saler.com}
COUNTRY=${COUNTRY:-US}
STATE=${STATE:-California}
CITY=${CITY:-San Francisco}
ORG=${ORG:-Saler Platform}
OU=${OU:-IT}

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

# Function to create SSL directory
create_ssl_dir() {
    mkdir -p "$SSL_DIR"
    mkdir -p "$LETSENCRYPT_DIR"
    print_info "SSL directory created: $SSL_DIR"
}

# Function to generate self-signed certificate
generate_self_signed() {
    local domain=${1:-$DOMAIN}
    local days=${2:-365}
    
    print_info "Generating self-signed certificate for: $domain"
    create_ssl_dir
    
    openssl req -x509 -nodes -days $days \
        -newkey rsa:2048 \
        -keyout "$SSL_DIR/${domain}.key" \
        -out "$SSL_DIR/${domain}.crt" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$OU/CN=$domain" \
        -addext "subjectAltName=DNS:$domain,DNS:www.$domain,IP:127.0.0.1"
    
    if [ -f "$SSL_DIR/${domain}.key" ] && [ -f "$SSL_DIR/${domain}.crt" ]; then
        print_success "Self-signed certificate generated successfully"
        print_info "Certificate: $SSL_DIR/${domain}.crt"
        print_info "Private key: $SSL_DIR/${domain}.key"
        
        # Show certificate details
        openssl x509 -in "$SSL_DIR/${domain}.crt" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|Subject Alternative Name)"
    else
        print_error "Failed to generate self-signed certificate"
        exit 1
    fi
}

# Function to generate certificate signing request (CSR)
generate_csr() {
    local domain=${1:-$DOMAIN}
    
    print_info "Generating CSR for: $domain"
    create_ssl_dir
    
    # Create config file for SAN
    cat > "$SSL_DIR/${domain}.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
OU=$OU
CN=$domain

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = www.$domain
DNS.3 = *.${domain}
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
    
    # Generate private key and CSR
    openssl genrsa -out "$SSL_DIR/${domain}.key" 2048
    openssl req -new -key "$SSL_DIR/${domain}.key" -out "$SSL_DIR/${domain}.csr" -config "$SSL_DIR/${domain}.conf"
    
    if [ -f "$SSL_DIR/${domain}.csr" ]; then
        print_success "CSR generated successfully"
        print_info "CSR file: $SSL_DIR/${domain}.csr"
        print_info "Send this CSR to your Certificate Authority for signing"
        
        # Show CSR details
        openssl req -in "$SSL_DIR/${domain}.csr" -text -noout | grep -E "(Subject:|Subject Public Key Info:|Requested Extensions)"
    else
        print_error "Failed to generate CSR"
        exit 1
    fi
}

# Function to sign certificate with CA
sign_certificate() {
    local domain=${1:-$DOMAIN}
    local ca_cert=${2}
    local ca_key=${3}
    
    if [ -z "$ca_cert" ] || [ -z "$ca_key" ]; then
        print_error "CA certificate and key files are required"
        print_info "Usage: $0 sign <domain> <ca_cert> <ca_key>"
        exit 1
    fi
    
    if [ ! -f "$ca_cert" ] || [ ! -f "$ca_key" ]; then
        print_error "CA certificate or key file not found"
        exit 1
    fi
    
    print_info "Signing certificate for: $domain with CA: $ca_cert"
    
    # Create extended config
    cat > "$SSL_DIR/${domain}.ext" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = www.$domain
EOF
    
    # Sign the certificate
    openssl x509 -req -in "$SSL_DIR/${domain}.csr" \
        -CA "$ca_cert" -CAkey "$ca_key" \
        -out "$SSL_DIR/${domain}.crt" \
        -days 365 \
        -extensions v3_req \
        -extfile "$SSL_DIR/${domain}.ext"
    
    if [ -f "$SSL_DIR/${domain}.crt" ]; then
        print_success "Certificate signed successfully"
        print_info "Signed certificate: $SSL_DIR/${domain}.crt"
        
        # Verify the certificate
        verify_certificate "$domain"
    else
        print_error "Failed to sign certificate"
        exit 1
    fi
}

# Function to verify certificate
verify_certificate() {
    local domain=${1:-$DOMAIN}
    local cert_file=${2:-$SSL_DIR/${domain}.crt}
    
    if [ ! -f "$cert_file" ]; then
        print_error "Certificate file not found: $cert_file"
        exit 1
    fi
    
    print_info "Verifying certificate: $cert_file"
    
    # Check certificate validity
    if openssl x509 -checkend 86400 -noout -in "$cert_file"; then
        print_success "✅ Certificate is valid for at least 24 hours"
    else
        print_warning "⚠️ Certificate expires within 24 hours"
    fi
    
    # Show certificate details
    print_info "Certificate details:"
    openssl x509 -in "$cert_file" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|Subject Alternative Name)"
    
    # Check certificate chain
    if [ -f "$SSL_DIR/ca.crt" ]; then
        print_info "Verifying certificate chain..."
        if openssl verify -CAfile "$SSL_DIR/ca.crt" "$cert_file"; then
            print_success "✅ Certificate chain is valid"
        else
            print_warning "⚠️ Certificate chain verification failed"
        fi
    fi
}

# Function to generate nginx configuration
generate_nginx_config() {
    local domain=${1:-$DOMAIN}
    
    print_info "Generating Nginx configuration for: $domain"
    
    cat > "docker/nginx/${domain}.conf" << EOF
server {
    listen 80;
    server_name $domain www.$domain;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $domain www.$domain;
    
    # SSL Configuration
    ssl_certificate $SSL_DIR/${domain}.crt;
    ssl_certificate_key $SSL_DIR/${domain}.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Backend Proxy
    location / {
        proxy_pass http://frontend:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket Support
    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
    
    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    print_success "Nginx configuration generated: docker/nginx/${domain}.conf"
}

# Function to install certbot for Let's Encrypt
install_certbot() {
    print_info "Installing certbot..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    elif command -v brew &> /dev/null; then
        brew install certbot
    else
        print_error "Unable to install certbot. Please install manually."
        exit 1
    fi
    
    if command -v certbot &> /dev/null; then
        print_success "Certbot installed successfully"
    else
        print_error "Failed to install certbot"
        exit 1
    fi
}

# Function to get Let's Encrypt certificate
letsencrypt_certificate() {
    local domain=${1:-$DOMAIN}
    local email=${2:-$EMAIL}
    local staging=${3:-false}
    
    print_info "Getting Let's Encrypt certificate for: $domain"
    
    if ! command -v certbot &> /dev/null; then
        install_certbot
    fi
    
    local certbot_args="certonly --nginx -d $domain -d www.$domain --email $email --agree-tos --non-interactive"
    
    if [ "$staging" = "true" ]; then
        certbot_args="$certbot_args --staging"
    fi
    
    # Run certbot
    eval "$certbot_args"
    
    if [ $? -eq 0 ]; then
        print_success "Let's Encrypt certificate obtained successfully"
        print_info "Certificate location: /etc/letsencrypt/live/$domain/"
        
        # Copy certificates to SSL directory
        sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/${domain}.crt"
        sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/${domain}.key"
        sudo chmod 644 "$SSL_DIR/${domain}.crt"
        sudo chmod 600 "$SSL_DIR/${domain}.key"
        
        print_success "Certificates copied to: $SSL_DIR/"
    else
        print_error "Failed to obtain Let's Encrypt certificate"
        exit 1
    fi
}

# Function to renew certificates
renew_certificates() {
    print_info "Renewing certificates..."
    
    if ! command -v certbot &> /dev/null; then
        print_error "Certbot not installed"
        exit 1
    fi
    
    # Renew certificates
    certbot renew
    
    if [ $? -eq 0 ]; then
        print_success "Certificates renewed successfully"
        
        # Copy renewed certificates
        for domain in $(find /etc/letsencrypt/live/ -maxdepth 1 -type d -name "*.*" -exec basename {} \;); do
            if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
                sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/${domain}.crt"
                sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/${domain}.key"
                sudo chmod 644 "$SSL_DIR/${domain}.crt"
                sudo chmod 600 "$SSL_DIR/${domain}.key"
                print_info "Updated certificate for: $domain"
            fi
        done
    else
        print_error "Certificate renewal failed"
        exit 1
    fi
}

# Function to show certificate info
show_certificate_info() {
    local domain=${1:-$DOMAIN}
    
    print_info "Certificate information for: $domain"
    
    if [ -f "$SSL_DIR/${domain}.crt" ]; then
        echo ""
        echo "=== Certificate Details ==="
        openssl x509 -in "$SSL_DIR/${domain}.crt" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|Subject Alternative Name)"
        
        echo ""
        echo "=== Certificate Chain ==="
        openssl x509 -in "$SSL_DIR/${domain}.crt" -noout -text | grep -A 10 "Certificate:"
        
        echo ""
        echo "=== File Information ==="
        ls -la "$SSL_DIR/${domain}.crt" "$SSL_DIR/${domain}.key" 2>/dev/null || echo "Key file not found"
        
        echo ""
        echo "=== Certificate Validity ==="
        if openssl x509 -checkend 0 -noout -in "$SSL_DIR/${domain}.crt" 2>/dev/null; then
            echo "✅ Certificate is currently valid"
        else
            echo "❌ Certificate has expired or is not yet valid"
        fi
        
        # Show days until expiration
        local expire_date=$(openssl x509 -enddate -noout -in "$SSL_DIR/${domain}.crt" | cut -d= -f2)
        local expire_epoch=$(date -d "$expire_date" +%s)
        local now_epoch=$(date +%s)
        local days_until_expire=$(( (expire_epoch - now_epoch) / 86400 ))
        echo "Days until expiration: $days_until_expire"
        
    else
        print_error "Certificate file not found: $SSL_DIR/${domain}.crt"
    fi
}

# Function to clean up old certificates
cleanup_certificates() {
    local days=${1:-30}
    
    print_info "Cleaning up certificates older than $days days..."
    
    find "$SSL_DIR" -name "*.crt" -mtime +$days -type f 2>/dev/null | while read -r cert_file; do
        local domain=$(basename "${cert_file%.*}")
        print_warning "Removing old certificate: $cert_file"
        rm -f "$cert_file"
        
        # Remove corresponding key and other files
        rm -f "$SSL_DIR/${domain}.key"
        rm -f "$SSL_DIR/${domain}.csr"
        rm -f "$SSL_DIR/${domain}.conf"
        rm -f "$SSL_DIR/${domain}.ext"
    done
    
    print_success "Certificate cleanup completed"
}

# Function to show help
help() {
    echo "🔒 Saler Platform SSL Certificate Manager"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  self-signed [domain] [days]    Generate self-signed certificate"
    echo "  csr <domain>                    Generate certificate signing request"
    echo "  sign <domain> <ca_cert> <ca_key> Sign certificate with CA"
    echo "  verify [domain] [cert_file]    Verify certificate"
    echo "  nginx-config [domain]          Generate Nginx configuration"
    echo "  letsencrypt [domain] [email] [staging] Get Let's Encrypt certificate"
    echo "  renew                          Renew all certificates"
    echo "  info [domain]                  Show certificate information"
    echo "  cleanup [days]                 Clean up old certificates (default: 30)"
    echo "  install-certbot                Install certbot for Let's Encrypt"
    echo "  help                           Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN                         Domain name (default: localhost)"
    echo "  EMAIL                         Email for Let's Encrypt (default: admin@saler.com)"
    echo "  COUNTRY                       Country code (default: US)"
    echo "  STATE                         State (default: California)"
    echo "  CITY                          City (default: San Francisco)"
    echo "  ORG                           Organization (default: Saler Platform)"
    echo ""
    echo "Examples:"
    echo "  $0 self-signed mydomain.com"
    echo "  $0 csr mydomain.com"
    echo "  $0 sign mydomain.com ca.crt ca.key"
    echo "  $0 verify mydomain.com"
    echo "  $0 letsencrypt mydomain.com admin@mydomain.com"
    echo "  $0 info mydomain.com"
    echo ""
    echo "Note: For production use, use Let's Encrypt certificates instead of self-signed."
}

# Main script execution
case "${1:-help}" in
    "self-signed")
        generate_self_signed "$2" "$3"
        ;;
    "csr")
        generate_csr "$2"
        ;;
    "sign")
        sign_certificate "$2" "$3" "$4"
        ;;
    "verify")
        verify_certificate "$2" "$3"
        ;;
    "nginx-config")
        generate_nginx_config "$2"
        ;;
    "letsencrypt")
        letsencrypt_certificate "$2" "$3" "$4"
        ;;
    "renew")
        renew_certificates
        ;;
    "info")
        show_certificate_info "$2"
        ;;
    "cleanup")
        cleanup_certificates "$2"
        ;;
    "install-certbot")
        install_certbot
        ;;
    "help"|*)
        help
        ;;
esac