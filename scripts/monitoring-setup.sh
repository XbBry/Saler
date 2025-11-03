#!/bin/bash
#
# سكريبت إعداد نظام المراقبة الشامل - Comprehensive Monitoring Setup Script
# إعداد وتكوين جميع مكونات نظام المراقبة لشركة سالير
#

set -euo pipefail

# الألوان للنص الملون
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# متغيرات الإعدادات
PROJECT_NAME="saler"
MONITORING_DIR="./monitoring"
LOGS_DIR="./logs"
SCRIPTS_DIR="./scripts"
GRAFANA_DIR="./grafana-dashboards"

# متغيرات الخدمات
PROMETHEUS_VERSION="2.45.0"
GRAFANA_VERSION="10.0.0"
LOKI_VERSION="2.8.0"
PROMTAIL_VERSION="2.8.0"
ALERTMANAGER_VERSION="0.25.0"
NODE_EXPORTER_VERSION="1.6.0"

# دالة طباعة رسائل ملونة
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

print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# فحص المتطلبات
check_requirements() {
    print_header "فحص المتطلبات الأساسية"
    
    # فحص Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
        exit 1
    fi
    print_success "Docker متوفر: $(docker --version)"
    
    # فحص Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        print_error "Docker Compose غير متوفر. يرجى تثبيت Docker Compose أولاً."
        exit 1
    fi
    print_success "Docker Compose متوفر"
    
    # فحص curl
    if ! command -v curl &> /dev/null; then
        print_warning "curl غير متوفر. سيتم تثبيته..."
        sudo apt-get update && sudo apt-get install -y curl
    fi
    
    # فحص jq
    if ! command -v jq &> /dev/null; then
        print_warning "jq غير متوفر. سيتم تثبيته..."
        sudo apt-get update && sudo apt-get install -y jq
    fi
    
    # فحص المساحة المتاحة
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        print_error "مساحة القرص غير كافية. مطلوب على الأقل 10GB."
        exit 1
    fi
    print_success "المساحة المتاحة: ${available_space}GB"
}

# إنشاء هيكل المجلدات
create_directory_structure() {
    print_header "إنشاء هيكل المجلدات"
    
    # إنشاء المجلدات الأساسية
    mkdir -p $MONITORING_DIR
    mkdir -p $LOGS_DIR/{application,system,security,analytics}
    mkdir -p $SCRIPTS_DIR
    mkdir -p $GRAFANA_DIR
    
    # إنشاء مجلدات التكوين
    mkdir -p $MONITORING_DIR/{prometheus,grafana,loki,alertmanager,config}
    mkdir -p $MONITORING_DIR/exporters/{node,redis,postgres,custom}
    mkdir -p $MONITORING_DIR/data/{prometheus,grafana,loki,alertmanager}
    
    # إنشاء مجلدات النسخ الاحتياطية
    mkdir -p backups/{configs,data,logs}
    
    print_success "تم إنشاء هيكل المجلدات بنجاح"
}

# تحميل وتحضير الملفات
download_files() {
    print_header "تحميل ملفات التكوين والإعدادات"
    
    cd $MONITORING_DIR
    
    # تحميل Prometheus
    if [ ! -f "prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz" ]; then
        print_info "تحميل Prometheus..."
        wget https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
        tar xzf prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
        mv prometheus-${PROMETHEUS_VERSION}.linux-amd64 prometheus
    fi
    
    # تحميل Node Exporter
    if [ ! -f "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz" ]; then
        print_info "تحميل Node Exporter..."
        wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
        tar xzf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
        mv node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64 node_exporter
    fi
    
    # تحميل Alertmanager
    if [ ! -f "alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz" ]; then
        print_info "تحميل Alertmanager..."
        wget https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz
        tar xzf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz
        mv alertmanager-${ALERTMANAGER_VERSION}.linux-amd64 alertmanager
    fi
    
    cd - > /dev/null
    print_success "تم تحميل جميع الملفات"
}

# إنشاء ملف Docker Compose
create_docker_compose() {
    print_header "إنشاء ملف Docker Compose"
    
    cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  # Prometheus - نظام جمع المقاييس
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: saler-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - ./monitoring/data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped
    networks:
      - monitoring

  # Grafana - نظام عرض اللوحات
  grafana:
    image: grafana/grafana:10.0.0
    container_name: saler-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/data/grafana:/var/lib/grafana
      - ./grafana-dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    restart: unless-stopped
    networks:
      - monitoring

  # Loki - نظام تجميع السجلات
  loki:
    image: grafana/loki:2.8.0
    container_name: saler-loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki/loki-config.yml:/etc/loki/local-config.yaml
      - ./monitoring/data/loki:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped
    networks:
      - monitoring

  # Promtail - وكيل إرسال السجلات إلى Loki
  promtail:
    image: grafana/promtail:2.8.0
    container_name: saler-promtail
    volumes:
      - ./monitoring/loki/promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - ./logs:/var/log/saler:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
    networks:
      - monitoring

  # Alertmanager - نظام إدارة التنبيهات
  alertmanager:
    image: prom/alertmanager:v0.25.0
    container_name: saler-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - ./monitoring/data/alertmanager:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    restart: unless-stopped
    networks:
      - monitoring

  # Redis Exporter - مراقبة Redis
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: saler-redis-exporter
    environment:
      - REDIS_ADDR=redis://redis:6379
    ports:
      - "9121:9121"
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - redis

  # Postgres Exporter - مراقبة PostgreSQL
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: saler-postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://user:pass@postgres:5432/db?sslmode=disable
    ports:
      - "9187:9187"
    restart: unless-stopped
    networks:
      - monitoring

  # مثال Redis للمراقبة
  redis:
    image: redis:alpine
    container_name: saler-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - monitoring

  # مثال PostgreSQL للمراقبة
  postgres:
    image: postgres:13
    container_name: saler-postgres
    environment:
      - POSTGRES_DB=saler
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    ports:
      - "5432:5432"
    volumes:
      - ./monitoring/data/postgres:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
  alertmanager_data:
EOF

    print_success "تم إنشاء ملف Docker Compose"
}

# إنشاء ملف إعداد Prometheus
create_prometheus_config() {
    print_header "إنشاء ملف إعداد Prometheus"
    
    cat > $MONITORING_DIR/prometheus/prometheus.yml << 'EOF'
# تكوين Prometheus لشركة سالير

global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'saler-cluster'
    environment: 'production'

# قواعد التحميل
rule_files:
  - "alert_rules.yml"

# تكوين التنبيهات
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

# إعدادات التحميل
scrape_configs:
  # مراقبة Prometheus نفسه
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # مراقبة Node Exporter
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 5s
    metrics_path: /metrics

  # مراقبة Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 10s

  # مراقبة PostgreSQL
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  # مراقبة التطبيق - استبدل هذا بعنوان التطبيق الفعلي
  - job_name: 'saler-app'
    static_configs:
      - targets: ['app:8080']
    metrics_path: /metrics
    scrape_interval: 15s

  # مراقبة مخصصة للتطبيق
  - job_name: 'saler-custom'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: /custom-metrics
    scrape_interval: 30s
    params:
      format: ['prometheus']

  # مراقبة خدمات Kubernetes (إذا كانت متوفرة)
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

  # مراقبة الكائنات في Kubernetes
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}/proxy/metrics

  # مراقبة Pods في Kubernetes
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

  # مراقبة خدمات التطبيقات
  - job_name: 'saler-services'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - saler-production
            - saler-staging
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
        action: replace
        target_label: __scheme__
        regex: (https?)
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_service_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_service_name]
        action: replace
        target_label: kubernetes_name
EOF

    # إنشاء قواعد التنبيهات
    cat > $MONITORING_DIR/prometheus/alert_rules.yml << 'EOF'
# قواعد التنبيهات لشركة سالير

groups:
- name: saler-system.rules
  rules:
  # تنبيهات النظام الأساسية
  - alert: InstanceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
      service: "{{ $labels.job }}"
    annotations:
      summary: "Instance {{ $labels.instance }} is down"
      description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 1 minute."

  - alert: HighCPUUsage
    expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
      service: node
    annotations:
      summary: "High CPU usage on {{ $labels.instance }}"
      description: "CPU usage is above 80% for more than 5 minutes on {{ $labels.instance }}."

  - alert: HighMemoryUsage
    expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
    for: 5m
    labels:
      severity: warning
      service: node
    annotations:
      summary: "High memory usage on {{ $labels.instance }}"
      description: "Memory usage is above 85% for more than 5 minutes on {{ $labels.instance }}."

  - alert: DiskSpaceLow
    expr: (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes) * 100 < 10
    for: 5m
    labels:
      severity: critical
      service: node
    annotations:
      summary: "Low disk space on {{ $labels.instance }}"
      description: "Disk space is below 10% on {{ $labels.instance }} ({{ $labels.mountpoint }})."

- name: saler-application.rules
  rules:
  # تنبيهات التطبيق
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
    for: 2m
    labels:
      severity: critical
      service: saler-app
    annotations:
      summary: "High error rate on {{ $labels.instance }}"
      description: "Error rate is above 5% for more than 2 minutes on {{ $labels.instance }}."

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, instance)) > 0.5
    for: 5m
    labels:
      severity: warning
      service: saler-app
    annotations:
      summary: "High response time on {{ $labels.instance }}"
      description: "95th percentile response time is above 500ms for more than 5 minutes on {{ $labels.instance }}."

  - alert: DatabaseConnectionsHigh
    expr: pg_stat_activity_count > 80
    for: 5m
    labels:
      severity: warning
      service: postgres
    annotations:
      summary: "High database connections"
      description: "Database has more than 80 active connections for more than 5 minutes."

  - alert: RedisMemoryUsageHigh
    expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90
    for: 5m
    labels:
      severity: warning
      service: redis
    annotations:
      summary: "High Redis memory usage"
      description: "Redis memory usage is above 90% for more than 5 minutes."

- name: saler-business.rules
  rules:
  # تنبيهات الأعمال
  - alert: LowConversionRate
    expr: sum(rate(conversions_total[1h])) / sum(rate(visits_total[1h])) * 100 < 2
    for: 10m
    labels:
      severity: warning
      service: business
    annotations:
      summary: "Low conversion rate"
      description: "Conversion rate is below 2% for more than 10 minutes."

  - alert: RevenueDrop
    expr: sum(rate(order_revenue_total[1h])) < avg_over_time(sum(rate(order_revenue_total[1h]))[24h:1h]) * 0.5
    for: 30m
    labels:
      severity: critical
      service: business
    annotations:
      summary: "Significant revenue drop"
      description: "Revenue has dropped by more than 50% compared to 24-hour average."
EOF

    print_success "تم إنشاء ملفات Prometheus"
}

# إنشاء ملف إعداد Alertmanager
create_alertmanager_config() {
    print_header "إنشاء ملف إعداد Alertmanager"
    
    cat > $MONITORING_DIR/alertmanager/alertmanager.yml << 'EOF'
# تكوين Alertmanager لشركة سالير

global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@saler.com'
  smtp_auth_username: 'alerts@saler.com'
  smtp_auth_password: 'password'
  resolve_timeout: 5m

# قوالب الإشعارات
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# قواعد التوجيه
route:
  group_by: ['alertname', 'instance']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
  # تنبيهات حرجة
  - match:
      severity: critical
    receiver: 'critical-alerts'
    group_wait: 5s
    repeat_interval: 5m
  
  # تنبيهات النظام
  - match:
      service: node
    receiver: 'system-alerts'
    group_interval: 5m
    repeat_interval: 30m
  
  # تنبيهات التطبيق
  - match:
      service: saler-app
    receiver: 'app-alerts'
    group_interval: 2m
    repeat_interval: 15m
  
  # تنبيهات الأعمال
  - match:
      service: business
    receiver: 'business-alerts'
    group_interval: 15m
    repeat_interval: 2h

# استقبال التنبيهات
receivers:
- name: 'default'
  email_configs:
  - to: 'ops@saler.com'
    subject: '[SALER] {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      التنبيه: {{ .Annotations.summary }}
      الوصف: {{ .Annotations.description }}
      الوقت: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      الشدة: {{ .Labels.severity }}
      {{ end }}

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@saler.com,ops@saler.com'
    subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
    body: |
      تنبيه حرج - يتطلب إجراءات فورية
      
      {{ range .Alerts }}
      التنبيه: {{ .Annotations.summary }}
      الوصف: {{ .Annotations.description }}
      الوقت: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      الشدة: {{ .Labels.severity }}
      الخادم: {{ .Labels.instance }}
      {{ end }}
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#critical-alerts'
    title: 'تنبيه حرج - {{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}• {{ .Annotations.summary }}{{ end }}'

- name: 'system-alerts'
  email_configs:
  - to: 'ops@saler.com'
    subject: '[SYSTEM] {{ .GroupLabels.alertname }}'
    body: |
      تنبيه نظام
      
      {{ range .Alerts }}
      التنبيه: {{ .Annotations.summary }}
      الوصف: {{ .Annotations.description }}
      الوقت: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      الخادم: {{ .Labels.instance }}
      {{ end }}

- name: 'app-alerts'
  email_configs:
  - to: 'dev-team@saler.com,ops@saler.com'
    subject: '[APP] {{ .GroupLabels.alertname }}'
    body: |
      تنبيه التطبيق
      
      {{ range .Alerts }}
      التنبيه: {{ .Annotations.summary }}
      الوصف: {{ .Annotations.description }}
      الوقت: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      الخدمة: {{ .Labels.service }}
      {{ end }}
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#dev-alerts'
    title: 'تنبيه تطبيق - {{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}• {{ .Annotations.summary }}{{ end }}'

- name: 'business-alerts'
  email_configs:
  - to: 'business@saler.com,management@saler.com'
    subject: '[BUSINESS] {{ .GroupLabels.alertname }}'
    body: |
      تنبيه أعمال
      
      {{ range .Alerts }}
      التنبيه: {{ .Annotations.summary }}
      الوصف: {{ .Annotations.description }}
      الوقت: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      الخدمة: {{ .Labels.service }}
      {{ end }}

# قواعد كتم التنبيهات
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
EOF

    print_success "تم إنشاء ملف Alertmanager"
}

# إنشاء ملف إعداد Loki
create_loki_config() {
    print_header "إنشاء ملف إعداد Loki"
    
    cat > $MONITORING_DIR/loki/loki-config.yml << 'EOF'
# تكوين Loki لشركة سالير

auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://alertmanager:9093

analytics:
  reporting_enabled: false
EOF

    # إعداد Promtail
    cat > $MONITORING_DIR/loki/promtail-config.yml << 'EOF'
# تكوين Promtail لشركة سالير

server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # سجلات النظام
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          __path__: /var/log/syslog
    pipeline_stages:
      - json:
          expressions:
            output: log
            timestamp: time
      - timestamp:
          source: timestamp
          format: RFC3339
      - labels:
          timestamp:

  # سجلات التطبيقات
  - job_name: saler-app
    static_configs:
      - targets:
          - localhost
        labels:
          job: saler-app
          __path__: /var/log/saler/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            service: service
            message: msg
      - labels:
          level:
          service:
      - timestamp:
          format: RFC3339
          source: time
      - output:
          source: message

  # سجلات Nginx
  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log
    pipeline_stages:
      - regex:
          expression: '^(?P<remote_addr>[\w\.]+) - (?P<remote_user>.*?) \[(?P<time_local>.*?)\] "(?P<method>.*?) (?P<request>.*?) (?P<protocol>.*?)" (?P<status>[\d]+) (?P<body_bytes_sent>[\d]+) "(?P<http_referer>.*?)" "(?P<http_user_agent>.*?)"'
      - labels:
          method:
          status:
          remote_addr:
      - timestamp:
          format: '02/Jan/2006:15:04:05 -0700'
          source: time_local

  # سجلات Docker
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: 'container'
      - source_labels: ['__meta_docker_container_label_logging']
        action: keep
        regex: 'promtail'
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
      - labels:
          stream:
          container:

  # سجلات Kubernetes
  - job_name: kubernetes
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - saler-production
            - saler-staging
    relabel_configs:
      - source_labels: ['__meta_kubernetes_pod_annotation_prometheus_io_scrape']
        action: keep
        regex: true
      - source_labels: ['__meta_kubernetes_pod_annotation_prometheus_io_path']
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: ['__address__', '__meta_kubernetes_pod_annotation_prometheus_io_port']
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: ['__meta_kubernetes_namespace']
        action: replace
        target_label: kubernetes_namespace
      - source_labels: ['__meta_kubernetes_pod_name']
        action: replace
        target_label: kubernetes_pod_name
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
      - labels:
          stream:
      - output:
          source: output
EOF

    print_success "تم إنشاء ملفات Loki"
}

# إعداد Grafana
setup_grafana() {
    print_header "إعداد Grafana"
    
    # إعداد مصادر البيانات
    mkdir -p $MONITORING_DIR/grafana/provisioning/{datasources,dashboards}
    
    cat > $MONITORING_DIR/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
    jsonData:
      maxLines: 1000

  - name: Alertmanager
    type: alertmanager
    access: proxy
    url: http://alertmanager:9093
    editable: true
EOF

    # إعداد اللوحات
    cat > $MONITORING_DIR/grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # نسخ لوحات المعلومات
    cp -r ../grafana-dashboards/* $MONITORING_DIR/grafana/provisioning/dashboards/
    
    print_success "تم إعداد Grafana"
}

# بدء الخدمات
start_services() {
    print_header "بدء خدمات المراقبة"
    
    # إنشاء شبكة Docker إذا لم تكن موجودة
    docker network ls | grep -q monitoring || docker network create monitoring
    
    # بناء وتشغيل الخدمات
    docker-compose -f docker-compose.monitoring.yml up -d
    
    print_info "انتظار بدء الخدمات..."
    sleep 30
    
    # فحص حالة الخدمات
    if docker-compose -f docker-compose.monitoring.yml ps | grep -q "Up"; then
        print_success "تم بدء جميع الخدمات بنجاح"
        
        echo ""
        print_info "الخدمات المتاحة:"
        echo "  • Prometheus: http://localhost:9090"
        echo "  • Grafana: http://localhost:3000 (admin/admin123)"
        echo "  • Alertmanager: http://localhost:9093"
        echo "  • Loki: http://localhost:3100"
        echo ""
    else
        print_error "فشل في بدء بعض الخدمات. تحقق من السجلات:"
        docker-compose -f docker-compose.monitoring.yml logs
        exit 1
    fi
}

# إعداد Node Exporter
setup_node_exporter() {
    print_header "إعداد Node Exporter"
    
    # تشغيل Node Exporter على النظام المحلي
    cd $MONITORING_DIR/node_exporter
    ./node_exporter --web.listen-address=":9100" &
    cd ../..
    
    print_success "تم تشغيل Node Exporter على المنفذ 9100"
}

# إنشاء سكريبت إيقاف الخدمات
create_stop_script() {
    print_header "إنشاء سكريبت إيقاف الخدمات"
    
    cat > stop-monitoring.sh << 'EOF'
#!/bin/bash
# سكريبت إيقاف خدمات المراقبة

echo "إيقاف خدمات المراقبة..."

# إيقاف جميع الحاويات
docker-compose -f docker-compose.monitoring.yml down

# إيقاف Node Exporter
pkill -f node_exporter

# إيقاف Prometheus (إذا كان يعمل محلياً)
pkill -f prometheus

echo "تم إيقاف جميع خدمات المراقبة"
EOF

    chmod +x stop-monitoring.sh
    print_success "تم إنشاء سكريبت الإيقاف"
}

# إنشاء سكريبت النسخ الاحتياطي
create_backup_script() {
    print_header "إنشاء سكريبت النسخ الاحتياطي"
    
    cat > backup-monitoring.sh << 'EOF'
#!/bin/bash
# سكريبت نسخ احتياطي لبيانات المراقبة

BACKUP_DIR="./backups/monitoring-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "بدء النسخ الاحتياطي إلى: $BACKUP_DIR"

# نسخ بيانات Prometheus
docker exec saler-prometheus tar czf - /prometheus > $BACKUP_DIR/prometheus_data.tar.gz

# نسخ بيانات Grafana
docker exec saler-grafana tar czf - /var/lib/grafana > $BACKUP_DIR/grafana_data.tar.gz

# نسخ إعدادات Loki
docker exec saler-loki tar czf - /loki > $BACKUP_DIR/loki_data.tar.gz

# نسخ إعدادات Alertmanager
docker exec saler-alertmanager tar czf - /alertmanager > $BACKUP_DIR/alertmanager_data.tar.gz

# نسخ ملفات التكوين
cp -r monitoring/prometheus $BACKUP_DIR/
cp -r monitoring/alertmanager $BACKUP_DIR/
cp -r monitoring/loki $BACKUP_DIR/
cp docker-compose.monitoring.yml $BACKUP_DIR/

echo "تم الانتهاء من النسخ الاحتياطي"
echo "حجم النسخ الاحتياطي: $(du -sh $BACKUP_DIR | cut -f1)"
EOF

    chmod +x backup-monitoring.sh
    print_success "تم إنشاء سكريبت النسخ الاحتياطي"
}

# إنشاء سكريبت الاستعادة
create_restore_script() {
    print_header "إنشاء سكريبت الاستعادة"
    
    cat > restore-monitoring.sh << 'EOF'
#!/bin/bash
# سكريبت استعادة بيانات المراقبة

if [ -z "$1" ]; then
    echo "الاستخدام: $0 <مجلد_النسخ_الاحتياطي>"
    exit 1
fi

BACKUP_DIR=$1

if [ ! -d "$BACKUP_DIR" ]; then
    echo "مجلد النسخ الاحتياطي غير موجود: $BACKUP_DIR"
    exit 1
fi

echo "بدء الاستعادة من: $BACKUP_DIR"

# إيقاف الخدمات
docker-compose -f docker-compose.monitoring.yml down

# استعادة بيانات Prometheus
docker run --rm -v saler_prometheus_data:/prometheus -v $BACKUP_DIR:/backup alpine tar xzf /backup/prometheus_data.tar.gz -C /

# استعادة بيانات Grafana
docker run --rm -v saler_grafana_data:/grafana -v $BACKUP_DIR:/backup alpine tar xzf /backup/grafana_data.tar.gz -C /

# استعادة بيانات Loki
docker run --rm -v saler_loki_data:/loki -v $BACKUP_DIR:/backup alpine tar xzf /backup/loki_data.tar.gz -C /

# استعادة بيانات Alertmanager
docker run --rm -v saler_alertmanager_data:/alertmanager -v $BACKUP_DIR:/backup alpine tar xzf /backup/alertmanager_data.tar.gz -C /

# استعادة ملفات التكوين
cp -r $BACKUP_DIR/prometheus monitoring/
cp -r $BACKUP_DIR/alertmanager monitoring/
cp -r $BACKUP_DIR/loki monitoring/
cp $BACKUP_DIR/docker-compose.monitoring.yml ./

# إعادة تشغيل الخدمات
docker-compose -f docker-compose.monitoring.yml up -d

echo "تم الانتهاء من الاستعادة"
EOF

    chmod +x restore-monitoring.sh
    print_success "تم إنشاء سكريبت الاستعادة"
}

# عرض ملخص التثبيت
show_summary() {
    print_header "ملخص التثبيت"
    
    echo ""
    print_success "تم إعداد نظام المراقبة بنجاح!"
    echo ""
    echo "الخدمات المتاحة:"
    echo "  🔍 Prometheus (جمع المقاييس): http://localhost:9090"
    echo "  📊 Grafana (عرض اللوحات): http://localhost:3000"
    echo "  🔔 Alertmanager (إدارة التنبيهات): http://localhost:9093"
    echo "  📝 Loki (تجميع السجلات): http://localhost:3100"
    echo ""
    echo "بيانات الدخول الافتراضية:"
    echo "  Grafana: admin / admin123"
    echo ""
    echo "ملفات مفيدة:"
    echo "  • سكريبت الإيقاف: ./stop-monitoring.sh"
    echo "  • سكريبت النسخ الاحتياطي: ./backup-monitoring.sh"
    echo "  • سكريبت الاستعادة: ./restore-monitoring.sh <مجلد_النسخ_الاحتياطي>"
    echo ""
    echo "للحصول على المساعدة:"
    echo "  • عرض السجلات: docker-compose -f docker-compose.monitoring.yml logs -f"
    echo "  • إعادة تشغيل خدمة: docker-compose -f docker-compose.monitoring.yml restart <service>"
    echo "  • إيقاف جميع الخدمات: ./stop-monitoring.sh"
    echo ""
}

# الدالة الرئيسية
main() {
    print_header "مرحباً بك في نظام إعداد المراقبة الشامل لشركة سالير"
    echo "هذا السكريبت سيقوم بإعداد نظام مراقبة شامل يتضمن:"
    echo "  • Prometheus لجمع المقاييس"
    echo "  • Grafana لعرض اللوحات"
    echo "  • Loki لتجميع السجلات"
    echo "  • Alertmanager لإدارة التنبيهات"
    echo "  • Prometheus exporters لمراقبة الخدمات المختلفة"
    echo ""
    
    read -p "هل تريد المتابعة؟ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "تم إلغاء التثبيت"
        exit 0
    fi
    
    # تنفيذ خطوات التثبيت
    check_requirements
    create_directory_structure
    download_files
    create_docker_compose
    create_prometheus_config
    create_alertmanager_config
    create_loki_config
    setup_grafana
    create_stop_script
    create_backup_script
    create_restore_script
    setup_node_exporter
    start_services
    show_summary
    
    print_success "تم الانتهاء من التثبيت بنجاح! 🎉"
}

# تشغيل السكريبت الرئيسي
main "$@"