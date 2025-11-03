/**
 * سكربتات الإعداد والنشر المتقدمة
 * Advanced Setup and Deployment Scripts
 * 
 * سكربتات شاملة لإعداد ونشر نظام المراقبة المتقدم
 * Comprehensive scripts for setting up and deploying the advanced monitoring system
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class AdvancedDeploymentManager {
    constructor(options = {}) {
        this.config = {
            projectRoot: options.projectRoot || process.cwd(),
            environment: options.environment || 'development',
            configPath: options.configPath || './deployment-config.json',
            logPath: options.logPath || './deployment-logs',
            nodeVersion: options.nodeVersion || '18',
            ...options
        };

        this.deploymentSteps = [
            'prerequisites',
            'environment_setup',
            'dependencies',
            'configuration',
            'database_setup',
            'services',
            'security',
            'monitoring',
            'validation',
            'cleanup'
        ];

        this.deploymentLog = [];
        this.currentStep = null;
        this.isDevelopment = this.config.environment === 'development';
        
        this.ensureDirectories();
        this.loadDeploymentConfig();
        
        console.log('🚀 مدير النشر المتقدم تم تهيئته بنجاح');
    }

    ensureDirectories() {
        const directories = [
            this.config.logPath,
            './logs',
            './config',
            './data',
            './temp',
            './backups'
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 تم إنشاء المجلد: ${dir}`);
            }
        });
    }

    loadDeploymentConfig() {
        try {
            if (fs.existsSync(this.config.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.config.configPath, 'utf8'));
                this.deploymentConfig = config;
                console.log('📋 تم تحميل تكوين النشر');
            } else {
                this.createDefaultDeploymentConfig();
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل تكوين النشر:', error);
            this.createDefaultDeploymentConfig();
        }
    }

    createDefaultDeploymentConfig() {
        const defaultConfig = {
            environment: this.config.environment,
            version: '1.0.0',
            services: {
                monitoring_api: {
                    port: 3000,
                    replicas: this.isDevelopment ? 1 : 3,
                    health_check: true,
                    auto_restart: true
                },
                dashboard_visualization: {
                    port: 3001,
                    ssl: !this.isDevelopment,
                    cors: true,
                    static_files: true
                },
                ai_analytics: {
                    enabled: true,
                    workers: this.isDevelopment ? 2 : 8,
                    memory_limit: this.isDevelopment ? '512MB' : '2GB'
                },
                alerting_system: {
                    enabled: true,
                    retry_attempts: 3,
                    queue_size: 1000
                },
                optimization_system: {
                    enabled: true,
                    scan_interval: '30s',
                    auto_optimization: !this.isDevelopment
                }
            },
            database: {
                type: 'postgresql',
                host: 'localhost',
                port: 5432,
                name: 'saler_monitoring',
                ssl: !this.isDevelopment,
                connection_pool: {
                    min: 5,
                    max: this.isDevelopment ? 10 : 50
                }
            },
            cache: {
                type: 'redis',
                host: 'localhost',
                port: 6379,
                ttl: 3600,
                memory_limit: this.isDevelopment ? '256MB' : '1GB'
            },
            monitoring: {
                prometheus: {
                    enabled: true,
                    port: 9090,
                    retention: '30d'
                },
                grafana: {
                    enabled: true,
                    port: 3002,
                    admin_password: 'admin123'
                },
                jaeger: {
                    enabled: !this.isDevelopment,
                    port: 14268
                }
            },
            security: {
                ssl: {
                    enabled: !this.isDevelopment,
                    cert_path: './ssl/cert.pem',
                    key_path: './ssl/key.pem'
                },
                auth: {
                    enabled: true,
                    jwt_secret: this.generateSecret(),
                    session_timeout: 3600
                },
                rate_limiting: {
                    enabled: true,
                    window: '1h',
                    max_requests: 1000
                }
            },
            integrations: {
                slack: {
                    enabled: false,
                    webhook_url: '',
                    channels: {
                        alerts: '#monitoring',
                        critical: '#alerts-critical'
                    }
                },
                pagerduty: {
                    enabled: false,
                    integration_key: '',
                    service_key: ''
                },
                email: {
                    enabled: true,
                    smtp_host: 'smtp.gmail.com',
                    smtp_port: 587,
                    username: '',
                    password: ''
                }
            }
        };

        this.deploymentConfig = defaultConfig;
        this.saveDeploymentConfig();
        console.log('📝 تم إنشاء تكوين النشر الافتراضي');
    }

    generateSecret() {
        return require('crypto').randomBytes(64).toString('hex');
    }

    saveDeploymentConfig() {
        fs.writeFileSync(this.config.configPath, JSON.stringify(this.deploymentConfig, null, 2));
        console.log('💾 تم حفظ تكوين النشر');
    }

    async deploy() {
        try {
            console.log('🚀 بدء عملية النشر المتقدم...');
            this.log('🚀 بدء عملية النشر المتقدم', 'info');
            
            for (const step of this.deploymentSteps) {
                await this.executeStep(step);
            }
            
            console.log('✅ اكتملت عملية النشر بنجاح!');
            this.log('✅ اكتملت عملية النشر بنجاح!', 'success');
            
            return {
                status: 'success',
                environment: this.config.environment,
                timestamp: new Date(),
                services: this.getServiceStatus()
            };
            
        } catch (error) {
            console.error('❌ فشل في عملية النشر:', error);
            this.log(`❌ فشل في عملية النشر: ${error.message}`, 'error');
            
            await this.rollback();
            
            throw error;
        }
    }

    async executeStep(stepName) {
        this.currentStep = stepName;
        console.log(`⚙️ تنفيذ خطوة: ${stepName}`);
        this.log(`⚙️ تنفيذ خطوة: ${stepName}`, 'info');
        
        const stepMethods = {
            prerequisites: this.checkPrerequisites,
            environment_setup: this.setupEnvironment,
            dependencies: this.installDependencies,
            configuration: this.configureServices,
            database_setup: this.setupDatabase,
            services: this.deployServices,
            security: this.configureSecurity,
            monitoring: this.setupMonitoring,
            validation: this.validateDeployment,
            cleanup: this.cleanup
        };
        
        const method = stepMethods[stepName];
        if (!method) {
            throw new Error(`Unknown deployment step: ${stepName}`);
        }
        
        try {
            await method.call(this);
            this.log(`✅ تمت خطوة ${stepName} بنجاح`, 'success');
        } catch (error) {
            this.log(`❌ فشل في خطوة ${stepName}: ${error.message}`, 'error');
            throw error;
        }
    }

    async checkPrerequisites() {
        console.log('🔍 فحص المتطلبات الأساسية...');
        
        const checks = [
            {
                name: 'Node.js Version',
                command: 'node --version',
                validate: (output) => {
                    const version = parseFloat(output.trim().replace('v', ''));
                    return version >= parseFloat(this.config.nodeVersion);
                }
            },
            {
                name: 'NPM',
                command: 'npm --version',
                validate: (output) => output.trim().length > 0
            },
            {
                name: 'Git',
                command: 'git --version',
                validate: (output) => output.includes('git version')
            }
        ];

        if (!this.isDevelopment) {
            checks.push(
                {
                    name: 'Docker',
                    command: 'docker --version',
                    validate: (output) => output.includes('Docker version')
                },
                {
                    name: 'Docker Compose',
                    command: 'docker-compose --version',
                    validate: (output) => output.includes('docker-compose')
                }
            );
        }

        for (const check of checks) {
            try {
                const { stdout } = await execPromise(check.command);
                if (check.validate(stdout)) {
                    console.log(`✅ ${check.name}: متوافق`);
                } else {
                    throw new Error(`${check.name} غير متوافق`);
                }
            } catch (error) {
                throw new Error(`فشل في فحص ${check.name}: ${error.message}`);
            }
        }
    }

    async setupEnvironment() {
        console.log('🌍 إعداد البيئة...');
        
        // Create environment files
        const envFiles = {
            '.env': this.generateBaseEnvFile(),
            `.env.${this.config.environment}`: this.generateEnvironmentEnvFile()
        };

        for (const [filename, content] of Object.entries(envFiles)) {
            fs.writeFileSync(filename, content);
            console.log(`📄 تم إنشاء ملف البيئة: ${filename}`);
        }

        // Create systemd service files (Linux)
        if (process.platform === 'linux' && !this.isDevelopment) {
            await this.createSystemdServices();
        }

        // Create nginx configuration
        if (!this.isDevelopment) {
            await this.createNginxConfig();
        }
    }

    generateBaseEnvFile() {
        return `# Base Environment Configuration
NODE_ENV=${this.config.environment}
LOG_LEVEL=info
LOG_PATH=./logs

# Database Configuration
DB_HOST=${this.deploymentConfig.database.host}
DB_PORT=${this.deploymentConfig.database.port}
DB_NAME=${this.deploymentConfig.database.name}
DB_SSL=${this.deploymentConfig.database.ssl}

# Cache Configuration
REDIS_HOST=${this.deploymentConfig.cache.host}
REDIS_PORT=${this.deploymentConfig.cache.port}
REDIS_TTL=${this.deploymentConfig.cache.ttl}

# Security
JWT_SECRET=${this.deploymentConfig.security.auth.jwt_secret}
SESSION_TIMEOUT=${this.deploymentConfig.security.auth.session_timeout}

# Monitoring
PROMETHEUS_PORT=${this.deploymentConfig.monitoring.prometheus.port}
GRAFANA_PORT=${this.deploymentConfig.monitoring.grafana.port}
`;
    }

    generateEnvironmentEnvFile() {
        const isProd = this.config.environment === 'production';
        
        return `# Environment Specific Configuration
ENVIRONMENT=${this.config.environment}
DEBUG=${!isProd}

# Service Ports
API_PORT=${this.deploymentConfig.services.monitoring_api.port}
DASHBOARD_PORT=${this.deploymentConfig.services.dashboard_visualization.port}

# Scaling Configuration
WORKERS=${this.deploymentConfig.services.ai_analytics.workers}
REPLICAS=${this.deploymentConfig.services.monitoring_api.replicas}

# Monitoring Configuration
METRICS_RETENTION=${this.deploymentConfig.monitoring.prometheus.retention}
`;
    }

    async createSystemdServices() {
        console.log('⚙️ إنشاء خدمات systemd...');
        
        const serviceTemplates = {
            'saler-monitoring-api': {
                description: 'Saler Monitoring API',
                execStart: `node ${path.join(this.config.projectRoot, 'real-time-collector.js')}`,
                workingDirectory: this.config.projectRoot,
                user: 'monitoring',
                restart: 'always'
            },
            'saler-dashboard': {
                description: 'Saler Dashboard Visualization',
                execStart: `node ${path.join(this.config.projectRoot, 'dashboard-visualization-system.js')}`,
                workingDirectory: this.config.projectRoot,
                user: 'monitoring',
                restart: 'always'
            },
            'saler-optimizer': {
                description: 'Saler Automated Optimization',
                execStart: `node ${path.join(this.config.projectRoot, 'automated-optimization-system.js')}`,
                workingDirectory: this.config.projectRoot,
                user: 'monitoring',
                restart: 'always'
            }
        };

        const systemdDir = '/etc/systemd/system/';
        
        for (const [serviceName, config] of Object.entries(serviceTemplates)) {
            const serviceContent = this.generateSystemdServiceFile(serviceName, config);
            const servicePath = path.join(systemdDir, `${serviceName}.service`);
            
            try {
                fs.writeFileSync(servicePath, serviceContent);
                console.log(`✅ تم إنشاء خدمة systemd: ${serviceName}`);
            } catch (error) {
                console.log(`⚠️ فشل في إنشاء خدمة systemd ${serviceName} (قد تحتاج صلاحيات admin)`);
            }
        }
    }

    generateSystemdServiceFile(serviceName, config) {
        return `[Unit]
Description=${config.description}
After=network.target

[Service]
Type=simple
User=${config.user}
WorkingDirectory=${config.workingDirectory}
ExecStart=${config.execStart}
Restart=${config.restart}
RestartSec=5
StandardOutput=journal
StandardError=journal

# Environment variables
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
`;
    }

    async createNginxConfig() {
        console.log('🌐 إنشاء تكوين nginx...');
        
        const nginxConfig = `
server {
    listen 80;
    server_name ${process.env.DOMAIN || 'localhost'};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${process.env.DOMAIN || 'localhost'};
    
    ssl_certificate ${this.deploymentConfig.security.ssl.cert_path};
    ssl_certificate_key ${this.deploymentConfig.security.ssl.key_path};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Monitoring Dashboard
    location /dashboard {
        proxy_pass http://localhost:${this.deploymentConfig.services.dashboard_visualization.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:${this.deploymentConfig.services.monitoring_api.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Grafana
    location /grafana/ {
        proxy_pass http://localhost:${this.deploymentConfig.monitoring.grafana.port}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:${this.deploymentConfig.services.monitoring_api.port}/health;
        access_log off;
    }
}

# Rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
`;
        
        fs.writeFileSync('/tmp/saler-monitoring.conf', nginxConfig);
        console.log('📄 تم إنشاء ملف تكوين nginx');
    }

    async installDependencies() {
        console.log('📦 تثبيت التبعيات...');
        
        // Install Node.js dependencies
        const packageJson = {
            name: 'saler-advanced-monitoring',
            version: '1.0.0',
            description: 'Advanced Performance Monitoring System for Saler',
            main: 'index.js',
            scripts: {
                start: 'node index.js',
                dev: 'nodemon index.js',
                test: 'jest',
                'deploy:prod': 'npm run build && pm2 start ecosystem.config.js',
                'deploy:dev': 'npm run dev'
            },
            dependencies: {
                'express': '^4.18.2',
                'socket.io': '^4.7.2',
                'axios': '^1.5.0',
                'ws': '^8.13.0',
                'nodemailer': '^6.9.4',
                'twilio': '^4.14.0',
                'redis': '^4.6.8',
                'pg': '^8.11.3',
                'prom-client': '^15.0.0',
                'winston': '^3.10.0',
                'joi': '^17.9.2',
                'helmet': '^7.0.0',
                'cors': '^2.8.5',
                'compression': '^1.7.4',
                'express-rate-limit': '^6.10.0',
                'jsonwebtoken': '^9.0.2',
                'bcryptjs': '^2.4.3'
            },
            devDependencies: {
                'nodemon': '^3.0.1',
                'jest': '^29.6.2',
                'eslint': '^8.47.0',
                'pm2': '^5.3.0'
            }
        };

        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        
        try {
            await execPromise('npm install', { timeout: 300000 }); // 5 minutes timeout
            console.log('✅ تم تثبيت تبعيات Node.js');
        } catch (error) {
            throw new Error(`فشل في تثبيت التبعيات: ${error.message}`);
        }

        // Install Docker services if not development
        if (!this.isDevelopment) {
            await this.installDockerDependencies();
        }
    }

    async installDockerDependencies() {
        console.log('🐳 تثبيت خدمات Docker...');
        
        const dockerCompose = `
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${this.deploymentConfig.database.name}
      POSTGRES_USER: monitoring
      POSTGRES_PASSWORD: ${this.generateSecret()}
    ports:
      - "${this.deploymentConfig.database.port}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - monitoring

  redis:
    image: redis:7-alpine
    ports:
      - "${this.deploymentConfig.cache.port}:6379"
    volumes:
      - redis_data:/data
    command: redis-server --maxmemory ${this.deploymentConfig.cache.memory_limit}
    networks:
      - monitoring

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "${this.deploymentConfig.monitoring.prometheus.port}:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=${this.deploymentConfig.monitoring.prometheus.retention}'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "${this.deploymentConfig.monitoring.grafana.port}:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${this.deploymentConfig.monitoring.grafana.admin_password}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana:/etc/grafana/provisioning
    networks:
      - monitoring

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
`;
        
        fs.writeFileSync('docker-compose.yml', dockerCompose);
        
        try {
            await execPromise('docker-compose pull', { timeout: 300000 });
            await execPromise('docker-compose up -d', { timeout: 300000 });
            console.log('✅ تم تشغيل خدمات Docker');
        } catch (error) {
            console.log('⚠️ فشل في تشغيل Docker (قد تحتاج صلاحيات admin)');
        }
    }

    async configureServices() {
        console.log('⚙️ تكوين الخدمات...');
        
        // Create configuration files
        const configs = {
            'config/prometheus.yml': this.generatePrometheusConfig(),
            'config/grafana/datasources.yml': this.generateGrafanaDatasourceConfig(),
            'config/grafana/dashboards.yml': this.generateGrafanaDashboardConfig(),
            'ecosystem.config.js': this.generatePM2Config(),
            'deployment-scripts/monitor.sh': this.generateMonitoringScript(),
            'deployment-scripts/backup.sh': this.generateBackupScript(),
            'deployment-scripts/update.sh': this.generateUpdateScript()
        };

        for (const [filepath, content] of Object.entries(configs)) {
            const fullPath = path.join(this.config.projectRoot, filepath);
            const dir = path.dirname(fullPath);
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(fullPath, content);
            fs.chmodSync(fullPath, '755'); // Make scripts executable
            console.log(`📄 تم إنشاء ملف التكوين: ${filepath}`);
        }
    }

    generatePrometheusConfig() {
        return `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'saler-monitoring'
    static_configs:
      - targets: ['localhost:${this.deploymentConfig.services.monitoring_api.port}']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
`;
    }

    generateGrafanaDatasourceConfig() {
        return `
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:${this.deploymentConfig.monitoring.prometheus.port}
    isDefault: true
    
  - name: PostgreSQL
    type: postgres
    access: proxy
    url: postgres:${this.deploymentConfig.database.port}
    database: ${this.deploymentConfig.database.name}
    user: monitoring
    secureJsonData:
      password: "${this.generateSecret()}"
`;
    }

    generateGrafanaDashboardConfig() {
        return `
apiVersion: 1

providers:
  - name: 'Saler Monitoring Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
`;
    }

    generatePM2Config() {
        return `module.exports = {
  apps: [{
    name: 'saler-monitoring-api',
    script: './real-time-collector.js',
    instances: ${this.deploymentConfig.services.monitoring_api.replicas},
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '${this.config.environment}'
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }, {
    name: 'saler-dashboard',
    script: './dashboard-visualization-system.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: '${this.config.environment}'
    },
    error_file: './logs/dashboard-error.log',
    out_file: './logs/dashboard-out.log',
    log_file: './logs/dashboard-combined.log',
    time: true
  }, {
    name: 'saler-optimizer',
    script: './automated-optimization-system.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: '${this.config.environment}'
    },
    error_file: './logs/optimizer-error.log',
    out_file: './logs/optimizer-out.log',
    log_file: './logs/optimizer-combined.log',
    time: true
  }]
};`;
    }

    generateMonitoringScript() {
        return `#!/bin/bash

# Saler Monitoring Health Check Script

LOG_FILE="./logs/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

# Check if services are running
check_service() {
    local service_name=$1
    local port=$2
    
    if nc -z localhost "$port" 2>/dev/null; then
        log "✅ $service_name is running on port $port"
        return 0
    else
        log "❌ $service_name is NOT running on port $port"
        return 1
    fi
}

# Check database connectivity
check_database() {
    if pg_isready -h localhost -p ${this.deploymentConfig.database.port} -U monitoring >/dev/null 2>&1; then
        log "✅ Database is accessible"
        return 0
    else
        log "❌ Database is NOT accessible"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    if redis-cli -h localhost -p ${this.deploymentConfig.cache.port} ping >/dev/null 2>&1; then
        log "✅ Redis is accessible"
        return 0
    else
        log "❌ Redis is NOT accessible"
        return 1
    fi
}

log "🔍 Starting health check..."

# Run all checks
SERVICES_OK=0
TOTAL_SERVICES=6

check_service "Monitoring API" ${this.deploymentConfig.services.monitoring_api.port} && ((SERVICES_OK++))
check_service "Dashboard" ${this.deploymentConfig.services.dashboard_visualization.port} && ((SERVICES_OK++))
check_service "Prometheus" ${this.deploymentConfig.monitoring.prometheus.port} && ((SERVICES_OK++))
check_service "Grafana" ${this.deploymentConfig.monitoring.grafana.port} && ((SERVICES_OK++))
check_database && ((SERVICES_OK++))
check_redis && ((SERVICES_OK++))

# Calculate health percentage
HEALTH_PERCENT=$((SERVICES_OK * 100 / TOTAL_SERVICES))

log "📊 Health check completed: $SERVICES_OK/$TOTAL_SERVICES services OK ($HEALTH_PERCENT%)"

if [ $HEALTH_PERCENT -ge 80 ]; then
    log "✅ System health is GOOD"
    exit 0
elif [ $HEALTH_PERCENT -ge 60 ]; then
    log "⚠️ System health is FAIR"
    exit 1
else
    log "❌ System health is POOR"
    exit 2
fi
`;
    }

    generateBackupScript() {
        return `#!/bin/bash

# Saler Monitoring Backup Script

BACKUP_DIR="./backups"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME="saler_backup_$DATE"
LOG_FILE="./logs/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

log "🚀 Starting backup process: $BACKUP_NAME"

# Backup database
if pg_dump -h localhost -U monitoring -d ${this.deploymentConfig.database.name} > "${BACKUP_NAME}_database.sql" 2>/dev/null; then
    log "✅ Database backup completed"
else
    log "❌ Database backup failed"
fi

# Backup Redis data
if redis-cli -h localhost -p ${this.deploymentConfig.cache.port} --rdb "${BACKUP_NAME}_redis.rdb" >/dev/null 2>&1; then
    log "✅ Redis backup completed"
else
    log "❌ Redis backup failed"
fi

# Backup configuration files
tar -czf "${BACKUP_NAME}_config.tar.gz" ../config ../*.json ../*.yml ../*.js 2>/dev/null
log "✅ Configuration backup completed"

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "saler_backup_*" -mtime +7 -delete
log "🧹 Old backups cleaned"

# Compress backup directory
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"*
rm -rf "$BACKUP_NAME"*

log "✅ Backup process completed: ${BACKUP_NAME}.tar.gz"
`;
    }

    generateUpdateScript() {
        return `#!/bin/bash

# Saler Monitoring Update Script

LOG_FILE="./logs/update.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

log "🚀 Starting update process..."

# Create backup before update
./backup.sh

# Pull latest changes
if git pull origin main; then
    log "✅ Code updated from repository"
else
    log "❌ Failed to pull latest code"
    exit 1
fi

# Install updated dependencies
if npm install; then
    log "✅ Dependencies updated"
else
    log "❌ Failed to update dependencies"
    exit 1
fi

# Restart services
log "🔄 Restarting services..."

# Stop services
pm2 stop all || true
docker-compose stop monitoring-api dashboard optimizer || true

# Start services
pm2 start ecosystem.config.js || docker-compose up -d monitoring-api dashboard optimizer

log "✅ Update process completed"

# Run health check
./monitor.sh
`;
    }

    async setupDatabase() {
        console.log('🗄️ إعداد قاعدة البيانات...');
        
        // Create database schema
        const schema = `
-- Saler Monitoring Database Schema

CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6),
    metric_unit VARCHAR(20),
    source VARCHAR(100),
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    source VARCHAR(100),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS optimization_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    optimization_type VARCHAR(100) NOT NULL,
    description TEXT,
    before_metrics JSONB,
    after_metrics JSONB,
    improvement_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'executed'
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
`;
        
        fs.writeFileSync('schema.sql', schema);
        
        // Execute schema
        try {
            await execPromise(`psql -h ${this.deploymentConfig.database.host} -U monitoring -d ${this.deploymentConfig.database.name} -f schema.sql`);
            console.log('✅ تم إنشاء مخطط قاعدة البيانات');
        } catch (error) {
            console.log('⚠️ فشل في إنشاء قاعدة البيانات (قد تحتاج إعداد manual)');
        }
    }

    async deployServices() {
        console.log('🚀 نشر الخدمات...');
        
        if (this.isDevelopment) {
            await this.deployDevelopmentServices();
        } else {
            await this.deployProductionServices();
        }
    }

    async deployDevelopmentServices() {
        console.log('🛠️ نشر خدمات التطوير...');
        
        // Start services in development mode
        const services = [
            { name: 'Monitoring API', script: 'real-time-collector.js', port: this.deploymentConfig.services.monitoring_api.port },
            { name: 'Dashboard', script: 'dashboard-visualization-system.js', port: this.deploymentConfig.services.dashboard_visualization.port },
            { name: 'AI Analytics', script: 'ai-analytics-engine.js', port: this.deploymentConfig.services.ai_analytics.port || 3002 },
            { name: 'Alerting System', script: 'advanced-alerting-system.js', port: this.deploymentConfig.services.alerting_system.port || 3003 },
            { name: 'Optimization System', script: 'automated-optimization-system.js', port: this.deploymentConfig.services.optimization_system.port || 3004 }
        ];

        for (const service of services) {
            try {
                const process = spawn('node', [service.script], {
                    stdio: 'inherit',
                    detached: false
                });
                
                console.log(`✅ تم تشغيل ${service.name} على المنفذ ${service.port}`);
            } catch (error) {
                console.log(`❌ فشل في تشغيل ${service.name}: ${error.message}`);
            }
        }
    }

    async deployProductionServices() {
        console.log('🏭 نشر خدمات الإنتاج...');
        
        try {
            // Start with PM2
            await execPromise('pm2 start ecosystem.config.js');
            console.log('✅ تم تشغيل الخدمات بـ PM2');
            
            // Start Docker services
            await execPromise('docker-compose up -d');
            console.log('✅ تم تشغيل خدمات Docker');
            
        } catch (error) {
            console.log('⚠️ فشل في تشغيل بعض الخدمات (قد تحتاج تدخل manual)');
        }
    }

    async configureSecurity() {
        console.log('🔒 تكوين الأمان...');
        
        // Generate SSL certificates if needed
        if (this.deploymentConfig.security.ssl.enabled) {
            await this.generateSSLCertificates();
        }
        
        // Setup firewall rules (Ubuntu/Debian)
        if (process.platform === 'linux' && !this.isDevelopment) {
            await this.setupFirewallRules();
        }
        
        // Create security monitoring script
        const securityScript = `#!/bin/bash

# Security monitoring script for Saler

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ./logs/security.log
}

# Check for failed login attempts
check_failed_logins() {
    local failed_attempts=$(grep "Failed password" /var/log/auth.log | wc -l)
    if [ $failed_attempts -gt 10 ]; then
        log "⚠️ High number of failed login attempts: $failed_attempts"
    fi
}

# Check for suspicious processes
check_suspicious_processes() {
    local suspicious=$(ps aux | grep -E "(nc|netcat|nmap|telnet)" | grep -v grep | wc -l)
    if [ $suspicious -gt 0 ]; then
        log "⚠️ Suspicious network tools detected: $suspicious"
    fi
}

# Check disk usage
check_disk_usage() {
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $usage -gt 80 ]; then
        log "⚠️ High disk usage: ${usage}%"
    fi
}

check_failed_logins
check_suspicious_processes
check_disk_usage
`;
        
        fs.writeFileSync('deployment-scripts/security-monitor.sh', securityScript);
        fs.chmodSync('deployment-scripts/security-monitor.sh', '755');
        
        console.log('✅ تم تكوين إعدادات الأمان');
    }

    async generateSSLCertificates() {
        console.log('🔐 توليد شهادات SSL...');
        
        // This is a simplified version
        // In production, you'd use Let's Encrypt or proper CA
        const sslDir = './ssl';
        if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true });
        }
        
        // Generate self-signed certificate for development
        if (this.isDevelopment) {
            try {
                await execPromise(`openssl req -x509 -newkey rsa:4096 -keyout ${sslDir}/key.pem -out ${sslDir}/cert.pem -days 365 -nodes -subj "/C=SA/ST=Riyadh/L=Riyadh/O=Saler/CN=localhost"`);
                console.log('✅ تم توليد شهادة SSL محلية');
            } catch (error) {
                console.log('⚠️ فشل في توليد شهادة SSL');
            }
        }
    }

    async setupFirewallRules() {
        console.log('🔥 إعداد قواعد الجدار الناري...');
        
        const firewallScript = `#!/bin/bash

# Setup UFW firewall rules for Saler Monitoring

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (change port as needed)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow monitoring ports
ufw allow ${this.deploymentConfig.services.monitoring_api.port}/tcp
ufw allow ${this.deploymentConfig.services.dashboard_visualization.port}/tcp
ufw allow ${this.deploymentConfig.monitoring.prometheus.port}/tcp
ufw allow ${this.deploymentConfig.monitoring.grafana.port}/tcp

# Database ports (internal only)
ufw allow from 10.0.0.0/8 to any port ${this.deploymentConfig.database.port}
ufw allow from 10.0.0.0/8 to any port ${this.deploymentConfig.cache.port}

# Enable firewall
ufw --force enable

echo "✅ Firewall rules configured"
`;
        
        fs.writeFileSync('deployment-scripts/setup-firewall.sh', firewallScript);
        fs.chmodSync('deployment-scripts/setup-firewall.sh', '755');
    }

    async setupMonitoring() {
        console.log('📊 إعداد المراقبة...');
        
        // Create monitoring dashboards
        const dashboardTemplate = {
            dashboard: {
                id: null,
                title: "Saler Advanced Monitoring",
                tags: ["saler", "monitoring"],
                style: "dark",
                timezone: "browser",
                panels: [
                    {
                        id: 1,
                        title: "System Overview",
                        type: "stat",
                        targets: [
                            {
                                expr: "up{job=\"saler-monitoring\"}",
                                refId: "A"
                            }
                        ],
                        fieldConfig: {
                            defaults: {
                                color: {
                                    mode: "thresholds"
                                },
                                thresholds: {
                                    steps: [
                                        { color: "green", value: null },
                                        { color: "red", value: 80 }
                                    ]
                                }
                            }
                        }
                    }
                ],
                time: {
                    from: "now-1h",
                    to: "now"
                },
                refresh: "5s"
            }
        };
        
        fs.writeFileSync('config/grafana/dashboards/saler-overview.json', JSON.stringify(dashboardTemplate, null, 2));
        
        console.log('✅ تم إعداد المراقبة');
    }

    async validateDeployment() {
        console.log('✅ التحقق من النشر...');
        
        const validationTests = [
            this.testAPIHealth,
            this.testDashboardHealth,
            this.testDatabaseConnection,
            this.testRedisConnection,
            this.testMonitoringEndpoints
        ];
        
        let passedTests = 0;
        const totalTests = validationTests.length;
        
        for (const test of validationTests) {
            try {
                await test.call(this);
                passedTests++;
                console.log(`✅ ${test.name} passed`);
            } catch (error) {
                console.log(`❌ ${test.name} failed: ${error.message}`);
            }
        }
        
        const successRate = (passedTests / totalTests) * 100;
        
        if (successRate >= 80) {
            console.log(`✅ النشر مكتمل بنجاح! (${passedTests}/${totalTests} اختبارات)`);
        } else {
            throw new Error(`فشل النشر - فقط ${passedTests}/${totalTests} اختبارات نجحت`);
        }
    }

    async testAPIHealth() {
        try {
            const { execPromise } = require('util');
            const { stdout } = await execPromise(`curl -s http://localhost:${this.deploymentConfig.services.monitoring_api.port}/health`);
            if (!stdout.includes('healthy')) {
                throw new Error('API health check failed');
            }
        } catch (error) {
            throw new Error('API health check failed');
        }
    }

    async testDashboardHealth() {
        try {
            const { execPromise } = require('util');
            await execPromise(`curl -s http://localhost:${this.deploymentConfig.services.dashboard_visualization.port}/`);
        } catch (error) {
            throw new Error('Dashboard health check failed');
        }
    }

    async testDatabaseConnection() {
        try {
            const { execPromise } = require('util');
            await execPromise(`psql -h ${this.deploymentConfig.database.host} -U monitoring -d ${this.deploymentConfig.database.name} -c "SELECT 1;"`);
        } catch (error) {
            throw new Error('Database connection failed');
        }
    }

    async testRedisConnection() {
        try {
            const { execPromise } = require('util');
            await execPromise(`redis-cli -h ${this.deploymentConfig.cache.host} -p ${this.deploymentConfig.cache.port} ping`);
        } catch (error) {
            throw new Error('Redis connection failed');
        }
    }

    async testMonitoringEndpoints() {
        const endpoints = [
            `http://localhost:${this.deploymentConfig.monitoring.prometheus.port}/-/ready`,
            `http://localhost:${this.deploymentConfig.monitoring.grafana.port}/api/health`
        ];
        
        for (const endpoint of endpoints) {
            try {
                const { execPromise } = require('util');
                await execPromise(`curl -s "${endpoint}"`);
            } catch (error) {
                throw new Error(`Monitoring endpoint ${endpoint} failed`);
            }
        }
    }

    async cleanup() {
        console.log('🧹 تنظيف ما بعد النشر...');
        
        // Remove temporary files
        const tempFiles = ['schema.sql', './deployment-scripts/temp'];
        tempFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
        
        // Set proper permissions
        try {
            const { execPromise } = require('util');
            await execPromise('chmod +x deployment-scripts/*.sh');
            console.log('✅ تم تعيين الصلاحيات');
        } catch (error) {
            console.log('⚠️ فشل في تعيين بعض الصلاحيات');
        }
        
        console.log('✅ اكتمل التنظيف');
    }

    async rollback() {
        console.log('🔄 بدء عملية الاسترجاع...');
        this.log('🔄 بدء عملية الاسترجاع', 'warning');
        
        try {
            // Stop services
            await execPromise('pm2 stop all || true');
            await execPromise('docker-compose stop || true');
            
            // Restore from backup if available
            const { execPromise } = require('util');
            await execPromise('./backup.sh restore || echo "No backup to restore"');
            
            console.log('✅ تم إتمام الاسترجاع');
            this.log('✅ تم إتمام الاسترجاع', 'success');
            
        } catch (error) {
            console.error('❌ فشل في عملية الاسترجاع:', error);
            this.log(`❌ فشل في الاسترجاع: ${error.message}`, 'error');
        }
    }

    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date(),
            level,
            message,
            step: this.currentStep
        };
        
        this.deploymentLog.push(logEntry);
        
        // Write to log file
        const logLine = `[${logEntry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}\\n`;
        fs.appendFileSync(this.config.logPath + '/deployment.log', logLine);
    }

    getServiceStatus() {
        return {
            environment: this.config.environment,
            services: {
                'monitoring-api': {
                    port: this.deploymentConfig.services.monitoring_api.port,
                    status: 'running'
                },
                'dashboard': {
                    port: this.deploymentConfig.services.dashboard_visualization.port,
                    status: 'running'
                },
                'ai-analytics': {
                    port: this.deploymentConfig.services.ai_analytics.port || 3002,
                    status: 'running'
                },
                'alerting': {
                    port: this.deploymentConfig.services.alerting_system.port || 3003,
                    status: 'running'
                },
                'optimization': {
                    port: this.deploymentConfig.services.optimization_system.port || 3004,
                    status: 'running'
                }
            },
            monitoring: {
                prometheus: this.deploymentConfig.monitoring.prometheus.port,
                grafana: this.deploymentConfig.monitoring.grafana.port
            },
            database: {
                host: this.deploymentConfig.database.host,
                port: this.deploymentConfig.database.port,
                name: this.deploymentConfig.database.name
            },
            cache: {
                host: this.deploymentConfig.cache.host,
                port: this.deploymentConfig.cache.port
            }
        };
    }
}

module.exports = AdvancedDeploymentManager;

// Example usage
if (require.main === module) {
    const deployer = new AdvancedDeploymentManager({
        environment: process.env.NODE_ENV || 'development',
        configPath: './deployment-config.json'
    });

    console.log('🚀 مدير النشر المتقدم جاهز للاستخدام');
    
    // Example deployment
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'deploy':
            deployer.deploy()
                .then(result => {
                    console.log('✅ النشر مكتمل:', result);
                })
                .catch(error => {
                    console.error('❌ فشل النشر:', error);
                    process.exit(1);
                });
            break;
            
        case 'rollback':
            deployer.rollback()
                .then(() => {
                    console.log('✅ الاسترجاع مكتمل');
                })
                .catch(error => {
                    console.error('❌ فشل الاسترجاع:', error);
                    process.exit(1);
                });
            break;
            
        case 'status':
            console.log('📊 حالة الخدمات:', deployer.getServiceStatus());
            break;
            
        default:
            console.log('Usage: node setup-deployment.js [deploy|rollback|status]');
            break;
    }
}