# دليل النشر - Development Deployment Guide

## نظرة عامة

يوضح هذا الدليل طرق نشر تطبيق Saler في بيئات مختلفة، من التطوير المحلي إلى الإنتاج. سنغطي استراتيجيات النشر المختلفة، وأدوات CI/CD، وإعدادات البيئة المطلوبة.

## محتويات الدليل

1. [إعدادات النشر](#إعدادات-النشر)
2. [النشر المحلي](#النشر-المحلي)
3. [Docker Deployment](#docker-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Production Deployment](#production-deployment)
6. [Cloud Deployments](#cloud-deployments)
7. [Database Migration](#database-migration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security Considerations](#security-considerations)
10. [Rollback Strategies](#rollback-strategies)

## إعدادات النشر

### متطلبات النظام

```yaml
# نظام التشغيل المدعوم
- Ubuntu 20.04+ LTS
- CentOS 8+
- macOS 12+
- Windows 10+ (WSL2)

# متطلبات الأجهزة
- CPU: 4+ cores
- RAM: 8GB+ minimum, 16GB+ recommended
- Storage: 50GB+ SSD
- Network: 100Mbps+ connection

# البرمجيات المطلوبة
- Node.js 18+
- Python 3.11+
- Docker 24+
- Docker Compose 2+
- PostgreSQL 15+
- Redis 7+
```

### متغيرات البيئة

```bash
# ملف .env للنشر
NODE_ENV=production
API_URL=https://api.saler.app
FRONTEND_URL=https://saler.app
DATABASE_URL=postgresql://user:pass@localhost:5432/saler
REDIS_URL=redis://localhost:6379/0

# أمان التطبيق
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-encryption-key
BCRYPT_ROUNDS=12

# APIs الخارجية
SHOPIFY_API_KEY=your-shopify-key
SHOPIFY_API_SECRET=your-shopify-secret
META_API_KEY=your-meta-key
META_API_SECRET=your-meta-secret

# التخزين
S3_BUCKET=saler-assets
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# المراقبة
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# البريد الإلكتروني
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
```

## النشر المحلي

### إعداد البيئة المحلية

```bash
#!/bin/bash
# setup-local.sh - إعداد البيئة المحلية

echo "🚀 بدء إعداد بيئة التطوير المحلية..."

# تثبيت التبعيات
echo "📦 تثبيت تبعيات Node.js..."
npm install

echo "📦 تثبيت تبعيات Python..."
pip install -r requirements.txt

# إعداد قاعدة البيانات
echo "🗄️ إعداد قاعدة البيانات..."
python manage.py db upgrade

# تثبيت التبعيات الإضافية
echo "🔧 تثبيت أدوات التطوير..."
npm install -g concurrently nodemon

# إعداد متغيرات البيئة
echo "⚙️ إعداد متغيرات البيئة..."
cp .env.example .env

echo "✅ تم إعداد البيئة المحلية بنجاح!"
```

### تشغيل التطبيق محلياً

```bash
#!/bin/bash
# run-local.sh - تشغيل التطبيق محلياً

echo "🔄 تشغيل التطبيق في وضع التطوير..."

# تشغيل الخدمات الأساسية
docker-compose up -d postgres redis

# تشغيل الخلفية
npm run server

# تشغيل الواجهة الأمامية
npm run client

# تشغيل النظام ككل
npm run dev
```

## Docker Deployment

### Dockerfile للتطبيق

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./
RUN npm ci --only=production

# نسخ ملفات المصدر
COPY . .

# بناء التطبيق
RUN npm run build

# مرحلة التشغيل
FROM node:18-alpine

WORKDIR /app

# تثبيت الأدوات الأساسية
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++

# نسخ ملفات التطبيق
COPY --from=builder /app ./

# إنشاء مستخدم غير-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S saler -u 1001

# إعداد الصلاحيات
RUN chown -R saler:nodejs /app
USER saler

# تحديد المنفذ
EXPOSE 3000

# فحص صحة التطبيق
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# تشغيل التطبيق
CMD ["node", "dist/server.js"]
```

### Docker Compose للنشر

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/saler
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    networks:
      - saler-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=saler
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - saler-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - saler-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - saler-network

volumes:
  postgres_data:
  redis_data:

networks:
  saler-network:
    driver: bridge
```

### Docker Compose للإنتاج

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  postgres:
    image: postgres:15-alpine
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    command: |
      postgres
        -c max_connections=200
        -c shared_buffers=256MB
        -c effective_cache_size=1GB
        -c maintenance_work_mem=64MB
        -c checkpoint_completion_target=0.9
        -c wal_buffers=16MB
        -c default_statistics_target=100

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    deploy:
      resources:
        limits:
          memory: 128M
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:e2e

      - name: Run security audit
        run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          echo "🚀 نشر على بيئة Staging..."
          # Commands to deploy to staging environment

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to production
        run: |
          echo "🚀 نشر على بيئة الإنتاج..."
          # Commands to deploy to production environment

      - name: Run smoke tests
        run: |
          echo "🧪 تشغيل اختبارات الإحماء..."
          # Commands to run smoke tests after deployment
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - staging
  - production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

services:
  - name: docker:24-dind
    command: ["--mtu=1460"]

test:
  stage: test
  image: node:18-alpine
  before_script:
    - npm ci
  script:
    - npm run test
    - npm run lint
    - npm audit

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main

deploy-staging:
  stage: staging
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $STAGING_USER@$STAGING_HOST "cd /var/www/saler && docker-compose pull && docker-compose up -d"
  environment:
    name: staging
    url: https://staging.saler.app
  only:
    - main

deploy-production:
  stage: production
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_HOST "cd /var/www/saler && docker-compose pull && docker-compose up -d"
  environment:
    name: production
    url: https://saler.app
  when: manual
  only:
    - main
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'registry.saler.app'
        IMAGE_NAME = 'saler-app'
        BUILD_NUMBER = env.BUILD_NUMBER ?: '0'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm test'
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh 'npm audit'
                        sh 'snyk test'
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                script {
                    docker.build("${IMAGE_NAME}:${BUILD_NUMBER}")
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        docker.image("${IMAGE_NAME}:${BUILD_NUMBER}").push()
                        docker.image("${IMAGE_NAME}:${BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }
        
        stage('Deploy Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh """
                    ssh staging-server "
                        cd /var/www/saler
                        docker-compose pull
                        docker-compose up -d
                    "
                """
            }
        }
        
        stage('Deploy Production') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    ssh production-server "
                        cd /var/www/saler
                        docker-compose pull
                        docker-compose up -d
                        docker system prune -f
                    "
                """
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'logs/**/*', fingerprint: true
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
        
        success {
            sh 'echo "Deployment successful!"'
        }
        
        failure {
            sh 'echo "Deployment failed!"'
            mail to: 'devops@saler.app',
                 subject: 'Deployment Failed',
                 body: "The deployment for build ${BUILD_NUMBER} failed."
        }
    }
}
```

## Production Deployment

### إعداد الخادم

```bash
#!/bin/bash
# setup-production.sh - إعداد خادم الإنتاج

echo "🚀 إعداد خادم الإنتاج..."

# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# إنشاء مستخدم التطبيق
sudo adduser saler
sudo usermod -aG docker saler

# إعداد مجلدات التطبيق
sudo mkdir -p /var/www/saler
sudo chown saler:saler /var/www/saler

# إعداد Nginx
sudo apt install nginx -y
sudo systemctl enable nginx

# إعداد SSL مع Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# إعداد الجدار الناري
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

echo "✅ تم إعداد الخادم بنجاح!"
```

### نشر التطبيق

```bash
#!/bin/bash
# deploy-production.sh - نشر التطبيق في الإنتاج

echo "🚀 بدء النشر في بيئة الإنتاج..."

# تحديث الكود
cd /var/www/saler
git pull origin main

# بناء التطبيق
docker-compose build --no-cache

# تشغيل قاعدة البيانات والخدمات
docker-compose up -d postgres redis

# انتظار قاعدة البيانات
echo "⏳ انتظار قاعدة البيانات..."
sleep 30

# تشغيل migrations
docker-compose exec app npm run db:migrate

# تشغيل التطبيق
docker-compose up -d app nginx

# فحص حالة الخدمات
docker-compose ps

# إعادة تشغيل الخدمات إذا لزم الأمر
docker-compose restart app

echo "✅ تم النشر بنجاح!"
```

### إعداد Nginx

```nginx
# nginx.prod.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # إعدادات الأداء
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # ضغط البيانات
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # معدل الطلبات
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    upstream app_backend {
        server app:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # إعادة توجيه HTTP إلى HTTPS
    server {
        listen 80;
        server_name saler.app www.saler.app;
        return 301 https://$server_name$request_uri;
    }

    # الخادم الرئيسي
    server {
        listen 443 ssl http2;
        server_name saler.app www.saler.app;

        # إعدادات SSL
        ssl_certificate /etc/ssl/certs/saler.crt;
        ssl_certificate_key /etc/ssl/private/saler.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # إعدادات الأمان
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: https:;" always;

        # المجلد الجذر
        root /var/www/html;
        index index.html;

        # ملفات الثابتة
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
            gzip_static on;
        }

        # تحميل الملفات
        location /uploads/ {
            alias /var/www/uploads/;
            expires 1y;
            add_header Cache-Control "public";
        }

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # إعدادات المهلة
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Authentication endpoints
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Socket.IO
        location /socket.io/ {
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
            
            # Cache للملفات الثابتة
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                gzip_static on;
            }
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Logging
        access_log /var/log/nginx/access.log combined;
        error_log /var/log/nginx/error.log warn;
    }
}
```

## Cloud Deployments

### AWS ECS Deployment

```yaml
# ecs-task-definition.json
{
  "family": "saler-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/saler-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/saler"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:saler/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/saler-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saler-app
  namespace: saler
  labels:
    app: saler-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: saler-app
  template:
    metadata:
      labels:
        app: saler-app
    spec:
      containers:
      - name: app
        image: saler-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: uploads-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: saler-app-service
  namespace: saler
spec:
  selector:
    app: saler-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: saler-app-ingress
  namespace: saler
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  tls:
  - hosts:
    - saler.app
    - www.saler.app
    secretName: saler-tls
  rules:
  - host: saler.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: saler-app-service
            port:
              number: 80
```

### Heroku Deployment

```json
# package.json (إضافة scripts للنشر)
{
  "scripts": {
    "start": "node dist/server.js",
    "heroku-postbuild": "npm run build",
    "deploy": "git push heroku main"
  },
  "engines": {
    "node": "18.x"
  }
}
```

```bash
# heroku-deploy.sh
#!/bin/bash

echo "🚀 نشر على Heroku..."

# إعداد التطبيق
heroku create saler-app --region eu

# إضافة إضافات قاعدة البيانات
heroku addons:create heroku-postgresql:mini -a saler-app
heroku addons:create heroku-redis:mini -a saler-app

# إعداد متغيرات البيئة
heroku config:set NODE_ENV=production -a saler-app
heroku config:set JWT_SECRET=your-jwt-secret -a saler-app

# نشر التطبيق
git push heroku main

# تشغيل migrations
heroku run npm run db:migrate -a saler-app

# فتح التطبيق
heroku open -a saler-app

echo "✅ تم النشر على Heroku بنجاح!"
```

## Database Migration

### Alembic Migration

```python
# migrations/001_initial_schema.py
"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 12:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_users_email', 'email', unique=True)
    )

    # Create stores table
    op.create_table('stores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.Index('ix_stores_owner_id', 'owner_id')
    )

def downgrade() -> None:
    op.drop_table('stores')
    op.drop_table('users')
```

### Migration Scripts

```bash
#!/bin/bash
# run-migrations.sh - تشغيل migrations

echo "🗄️ تشغيل قاعدة البيانات migrations..."

# انتظار قاعدة البيانات
echo "⏳ انتظار قاعدة البيانات..."
until docker-compose exec postgres pg_isready -U postgres; do
    sleep 1
done

# تشغيل migrations
echo "⚙️ تشغيل migrations..."
docker-compose exec app npm run db:migrate

# تشغيل seed data (إذا كان مطلوباً)
echo "🌱 تشغيل seed data..."
docker-compose exec app npm run db:seed

echo "✅ تم تشغيل migrations بنجاح!"
```

```python
# scripts/migrate.py - Python migration script
import os
import subprocess
import sys
from datetime import datetime

def run_migration():
    """تشغيل migrations مع التحقق من النجاح"""
    
    try:
        print("🗄️ بدء عملية migration...")
        
        # تشغيل Alembic migrations
        result = subprocess.run([
            'alembic', 'upgrade', 'head'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ تم تشغيل migrations بنجاح!")
            
            # تشغيل التحقق من صحة قاعدة البيانات
            verify_result = subprocess.run([
                'python', 'scripts/verify_db.py'
            ], capture_output=True, text=True)
            
            if verify_result.returncode == 0:
                print("✅ تم التحقق من قاعدة البيانات بنجاح!")
            else:
                print("⚠️ تحذير: مشكلة في التحقق من قاعدة البيانات")
                
        else:
            print("❌ خطأ في تشغيل migrations:")
            print(result.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ خطأ في migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
```

## Monitoring & Logging

### إعداد Log Management

```python
# config/logging_config.py
import logging
import logging.handlers
import json
from datetime import datetime
from typing import Dict, Any

class JSONFormatter(logging.Formatter):
    """تنسيق سجلات JSON"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # إضافة معلومات إضافية إذا كانت متوفرة
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
            
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
            
        if hasattr(record, 'ip_address'):
            log_entry['ip_address'] = record.ip_address
            
        return json.dumps(log_entry)

def setup_logging() -> None:
    """إعداد نظام السجلات"""
    
    # إعداد المسجل الجذر
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # إزالة المسجلات الافتراضية
    root_logger.handlers = []
    
    # ملف السجلات للتطبيق
    file_handler = logging.handlers.RotatingFileHandler(
        'logs/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(JSONFormatter())
    file_handler.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    
    # ملف السجلات للأخطاء
    error_handler = logging.handlers.RotatingFileHandler(
        'logs/error.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setFormatter(JSONFormatter())
    error_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_handler)
    
    # إرسال السجلات للخارج (ELK Stack, Splunk, إلخ)
    if os.getenv('LOG_AGGREGATION_URL'):
        setup_remote_logging()
    
    # إضافة معالج للسجلات الحساسة
    sensitive_handler = logging.handlers.RotatingFileHandler(
        'logs/audit.log',
        maxBytes=50*1024*1024,  # 50MB
        backupCount=10,
        encoding='utf-8'
    )
    sensitive_handler.setFormatter(JSONFormatter())
    sensitive_handler.setLevel(logging.INFO)
    
    # مسجل خاص للسجلات الحساسة
    audit_logger = logging.getLogger('audit')
    audit_logger.addHandler(sensitive_handler)
    audit_logger.setLevel(logging.INFO)
    audit_logger.propagate = False

def setup_remote_logging():
    """إعداد السجلات البعيدة"""
    import requests
    
    class RemoteHandler(logging.Handler):
        def emit(self, record):
            try:
                log_entry = self.format(record)
                requests.post(
                    os.getenv('LOG_AGGREGATION_URL'),
                    json={'message': log_entry},
                    timeout=5
                )
            except Exception:
                pass  # تجاهل الأخطاء في الإرسال
    
    remote_handler = RemoteHandler()
    remote_handler.setFormatter(JSONFormatter())
    
    root_logger = logging.getLogger()
    root_logger.addHandler(remote_handler)
```

### Health Check Endpoints

```python
# health.py - فحوصات صحة التطبيق
from flask import Blueprint, jsonify
import psycopg2
import redis
import requests
from datetime import datetime
import os

health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health_check():
    """فحص صحة أساسي للتطبيق"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': os.getenv('APP_VERSION', 'unknown'),
        'environment': os.getenv('NODE_ENV', 'development')
    })

@health_bp.route('/ready')
def readiness_check():
    """فحص استعداد التطبيق لتلقي الطلبات"""
    checks = {
        'database': check_database(),
        'redis': check_redis(),
        'external_apis': check_external_apis()
    }
    
    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503
    
    return jsonify({
        'status': 'ready' if all_healthy else 'not_ready',
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }), status_code

@health_bp.route('/live')
def liveness_check():
    """فحص إذا كان التطبيق يعمل"""
    return jsonify({
        'status': 'alive',
        'timestamp': datetime.utcnow().isoformat()
    })

def check_database() -> bool:
    """فحص اتصال قاعدة البيانات"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            connect_timeout=5
        )
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        cursor.fetchone()
        conn.close()
        return True
    except Exception:
        return False

def check_redis() -> bool:
    """فحص اتصال Redis"""
    try:
        r = redis.Redis(
            host=os.getenv('REDIS_HOST'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True,
            socket_connect_timeout=5
        )
        r.ping()
        return True
    except Exception:
        return False

def check_external_apis() -> bool:
    """فحص APIs الخارجية"""
    try:
        # فحص API خارجة مثال (Shopify, Meta Ads, إلخ)
        response = requests.get(
            'https://api.external-service.com/health',
            timeout=5
        )
        return response.status_code == 200
    except Exception:
        return False
```

### Monitoring Scripts

```bash
#!/bin/bash
# monitor.sh - مراقبة الأداء والتطبيق

echo "📊 بدء مراقبة التطبيق..."

# مراقبة استخدام الموارد
monitor_resources() {
    echo "🔍 مراقبة استخدام الموارد..."
    
    # استخدام المعالج والذاكرة
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
    echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')%"
    echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
    
    # العمليات النشطة
    echo "Active Processes: $(ps aux | wc -l)"
    
    # استخدام الشبكة
    echo "Network Connections: $(netstat -tuln | wc -l)"
}

# فحص قاعدة البيانات
check_database() {
    echo "🗄️ فحص قاعدة البيانات..."
    
    docker-compose exec -T postgres psql -U postgres -d saler -c "
        SELECT 
            datname as database,
            numbackends as connections,
            xact_commit as commits,
            xact_rollback as rollbacks,
            blks_read as reads,
            blks_hit as hits
        FROM pg_stat_database 
        WHERE datname = 'saler';
    "
}

# فحص Redis
check_redis() {
    echo "💾 فحص Redis..."
    
    docker-compose exec -T redis redis-cli info memory
    docker-compose exec -T redis redis-cli info stats
}

# فحص سجلات الأخطاء
check_logs() {
    echo "📋 فحص سجلات الأخطاء..."
    
    echo "آخر 10 أخطاء:"
    tail -n 10 logs/error.log | grep ERROR
    
    echo "آخر 10 تحذيرات:"
    tail -n 10 logs/app.log | grep WARNING
}

# فحص SSL الشهادات
check_ssl() {
    echo "🔒 فحص شهادات SSL..."
    
    echo | openssl s_client -servername saler.app -connect saler.app:443 2>/dev/null | openssl x509 -noout -dates
}

# إرسال تقرير
send_report() {
    echo "📤 إرسال تقرير المراقبة..."
    
    report=$(cat << EOF
تقرير المراقبة - $(date)

استخدام الموارد:
$(monitor_resources)

فحص قاعدة البيانات:
$(check_database)

فحص Redis:
$(check_redis)

آخر الأخطاء:
$(tail -n 5 logs/error.log)

EOF
    )
    
    # إرسال التقرير عبر البريد الإلكتروني
    echo "$report" | mail -s "تقرير مراقبة Saler" admin@saler.app
    
    # إرسال إلى Slack (إذا كان مفعل)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"تقرير مراقبة Saler: $(date)\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# تشغيل المراقبة
case "$1" in
    "resources")
        monitor_resources
        ;;
    "database")
        check_database
        ;;
    "redis")
        check_redis
        ;;
    "logs")
        check_logs
        ;;
    "ssl")
        check_ssl
        ;;
    "report")
        send_report
        ;;
    *)
        echo "استخدام: $0 {resources|database|redis|logs|ssl|report}"
        echo "تشغيل جميع الفحوصات..."
        
        monitor_resources
        check_database
        check_redis
        check_logs
        check_ssl
        ;;
esac
```

## Security Considerations

### إعداد الأمان للنشر

```bash
#!/bin/bash
# security-setup.sh - إعداد أمان النشر

echo "🔒 إعداد أمان النشر..."

# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت جدار الحماية
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# تثبيت fail2ban
sudo apt install fail2ban -y

# إعداد fail2ban للحماية من هجمات SSH
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = admin@saler.app
sendername = Fail2Ban
mta = sendmail
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# إعداد SSL مع Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d saler.app -d www.saler.app

# إعداد تجديد SSL التلقائي
sudo crontab -l | grep -q "certbot renew" || (sudo crontab -l; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

echo "✅ تم إعداد الأمان بنجاح!"
```

### Secure Configuration

```python
# config/security.py - إعدادات الأمان
import os
import secrets
from typing import List

class SecurityConfig:
    """إعدادات أمان التطبيق"""
    
    # مفاتيح الأمان
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # ساعة واحدة
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 يوم
    JWT_ALGORITHM = 'HS256'
    
    # إعدادات كلمة المرور
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_SPECIAL = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_BAN_COMMON = True
    
    # إعدادات Rate Limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    RATELIMIT_DEFAULT = "100/hour"
    RATELIMIT_API = "1000/hour"
    RATELIMIT_AUTH = "5/minute"
    
    # إعدادات CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'https://saler.app').split(',')
    CORS_ALLOW_HEADERS = [
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ]
    
    # إعدادات CSP
    CONTENT_SECURITY_POLICY = {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'font-src': "'self'",
        'connect-src': "'self' wss: https:",
        'frame-src': "'none'",
        'object-src': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'"
    }
    
    # Session Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600
    
    # Database Security
    DATABASE_SSL_MODE = 'require'
    DATABASE_CONNECTION_TIMEOUT = 30
    DATABASE_POOL_SIZE = 10
    DATABASE_POOL_TIMEOUT = 30
    DATABASE_POOL_RECYCLE = 3600
    
    # Redis Security
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')
    REDIS_SSL = True
    
    @classmethod
    def get_secure_headers(cls) -> dict:
        """الحصول على رؤوس الأمان الآمنة"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': '; '.join([
                f'{key} {value}' for key, value in cls.CONTENT_SECURITY_POLICY.items()
            ])
        }
    
    @classmethod
    def validate_password_strength(cls, password: str) -> tuple[bool, List[str]]:
        """التحقق من قوة كلمة المرور"""
        errors = []
        
        if len(password) < cls.PASSWORD_MIN_LENGTH:
            errors.append(f'يجب أن تكون كلمة المرور {cls.PASSWORD_MIN_LENGTH} أحرف على الأقل')
        
        if cls.PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            errors.append('يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل')
        
        if cls.PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in password):
            errors.append('يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل')
        
        if cls.PASSWORD_REQUIRE_NUMBERS and not any(c.isdigit() for c in password):
            errors.append('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل')
        
        if cls.PASSWORD_REQUIRE_SPECIAL and not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            errors.append('يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل')
        
        if cls.PASSWORD_BAN_COMMON:
            common_passwords = ['password', '123456', 'qwerty', 'admin', 'letmein']
            if password.lower() in common_passwords:
                errors.append('كلمة المرور شائعة جداً، يرجى اختيار كلمة مرور أخرى')
        
        return len(errors) == 0, errors
```

## Rollback Strategies

### خطة التراجع

```bash
#!/bin/bash
# rollback.sh - استراتيجية التراجع

set -e  # إيقاف السكريبت في حالة خطأ

ROLLBACK_DIR="/var/www/saler/backups"
CURRENT_DIR="/var/www/saler"
APP_NAME="saler-app"

echo "🔄 بدء عملية التراجع..."

# عرض النسخ المتاحة
echo "📋 النسخ المتاحة:"
ls -la "$ROLLBACK_DIR"/"$APP_NAME"_* | tail -10

# طلب تأكيد المستخدم
read -p "هل تريد المتابعة مع التراجع؟ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "تم إلغاء عملية التراجع"
    exit 0
fi

# تحديد النسخة المراد التراجع إليها
if [ ! -z "$1" ]; then
    BACKUP_VERSION="$1"
else
    echo "اختر النسخة المراد التراجع إليها:"
    ls "$ROLLBACK_DIR"/"$APP_NAME"_* | sort | tail -5
    read -p "أدخل اسم النسخة (مثل: saler-app_20240101_120000): " BACKUP_VERSION
fi

BACKUP_PATH="$ROLLBACK_DIR/$BACKUP_VERSION"

if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ النسخة المحددة غير موجودة: $BACKUP_PATH"
    exit 1
fi

echo "🔄 التراجع إلى النسخة: $BACKUP_VERSION"

# حفظ النسخة الحالية كنسخة احتياطية للطوارئ
echo "💾 حفظ النسخة الحالية..."
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_CURRENT="$ROLLBACK_DIR/emergency_$BACKUP_TIMESTAMP"
sudo cp -r "$CURRENT_DIR" "$BACKUP_CURRENT"
echo "✅ تم حفظ النسخة الحالية في: $BACKUP_CURRENT"

# إيقاف الخدمات الحالية
echo "⏹️ إيقاف الخدمات..."
cd "$CURRENT_DIR"
docker-compose down

# استعادة النسخة السابقة
echo "📦 استعادة النسخة..."
sudo rm -rf "$CURRENT_DIR"/*
sudo cp -r "$BACKUP_PATH"/* "$CURRENT_DIR/"

# ضبط الصلاحيات
sudo chown -R saler:saler "$CURRENT_DIR"
sudo chmod +x "$CURRENT_DIR/deploy.sh"

# تشغيل الخدمات
echo "▶️ تشغيل الخدمات..."
cd "$CURRENT_DIR"
docker-compose up -d

# التحقق من تشغيل الخدمات
echo "🔍 التحقق من تشغيل الخدمات..."
sleep 30

# فحص قاعدة البيانات
echo "🗄️ فحص قاعدة البيانات..."
if docker-compose exec postgres pg_isready -U postgres; then
    echo "✅ قاعدة البيانات تعمل بشكل طبيعي"
else
    echo "❌ مشكلة في قاعدة البيانات"
    exit 1
fi

# فحص التطبيق
echo "🌐 فحص التطبيق..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ التطبيق يعمل بشكل طبيعي"
else
    echo "❌ مشكلة في التطبيق"
    echo "🔄 التراجع للطوارئ..."
    # التراجع للطوارئ
    sudo rm -rf "$CURRENT_DIR"/*
    sudo cp -r "$BACKUP_CURRENT"/* "$CURRENT_DIR/"
    docker-compose up -d
    echo "✅ تم التراجع للطوارئ"
    exit 1
fi

# إرسال إشعار
echo "📧 إرسال إشعار التراجع..."
echo "تم التراجع بنجاح إلى النسخة $BACKUP_VERSION في $(date)" | mail -s "تقرير تراجع Saler" admin@saler.app

echo "✅ تمت عملية التراجع بنجاح!"
echo "📋 معلومات النسخة:"
echo "   النسخة الحالية: $BACKUP_VERSION"
echo "   نسخة الطوارئ: $BACKUP_CURRENT"
```

### Automated Rollback

```yaml
# .github/workflows/rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'نسخة التراجع'
        required: true
        type: string
        default: 'latest'
      environment:
        description: 'البيئة'
        required: true
        type: choice
        options:
        - staging
        - production
        default: 'staging'

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Execute rollback
        run: |
          echo "🔄 التراجع إلى النسخة: ${{ github.event.inputs.version }}"
          
          # SSH إلى الخادم وتنفيذ التراجع
          ssh ${{ secrets.REMOTE_USER }}@${{ secrets.REMOTE_HOST }} "
            cd /var/www/saler
            ./rollback.sh ${{ github.event.inputs.version }}
          "
          
      - name: Verify rollback
        run: |
          echo "🔍 التحقق من نجاح التراجع..."
          
          # فحص صحة التطبيق
          curl -f https://${{ secrets.DOMAIN }}/health
          
          # تشغيل اختبارات أساسية
          npm run test:smoke
          
      - name: Notify team
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            التراجع ${{ job.status == 'success' && 'تم بنجاح' || 'فشل' }}
            النسخة: ${{ github.event.inputs.version }}
            البيئة: ${{ github.event.inputs.environment }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Monitoring Rollback

```python
# scripts/rollback_monitor.py
import requests
import time
import json
from datetime import datetime
import logging

def monitor_rollback():
    """مراقبة عملية التراجع"""
    
    health_url = "https://saler.app/health"
    api_url = "https://saler.app/api/v1/stats"
    
    # إعداد السجلات
    logging.basicConfig(
        filename='rollback_monitor.log',
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    print("🔍 بدء مراقبة التراجع...")
    
    start_time = time.time()
    failures = 0
    max_failures = 5
    
    while time.time() - start_time < 1800:  # 30 دقيقة كحد أقصى
        try:
            # فحص صحة التطبيق
            health_response = requests.get(health_url, timeout=10)
            if health_response.status_code == 200:
                print(f"✅ التطبيق يعمل بشكل طبيعي - {datetime.now()}")
                failures = 0
            else:
                failures += 1
                print(f"⚠️ مشكلة في صحة التطبيق - {health_response.status_code}")
                
            # فحص API
            api_response = requests.get(api_url, timeout=10)
            if api_response.status_code == 200:
                print("✅ API يعمل بشكل طبيعي")
            else:
                failures += 1
                print(f"⚠️ مشكلة في API - {api_response.status_code}")
                
            if failures >= max_failures:
                logging.error(f"فشل متكرر: {failures} أخطاء")
                send_alert("فشل متكرر في التطبيق بعد التراجع")
                break
                
        except Exception as e:
            failures += 1
            error_msg = f"خطأ في المراقبة: {e}"
            print(f"❌ {error_msg}")
            logging.error(error_msg)
            
            if failures >= max_failures:
                send_alert(error_msg)
                break
        
        time.sleep(30)  # فحص كل 30 ثانية
    
    print("✅ انتهت مراقبة التراجع")
    logging.info("انتهت مراقبة التراجع بنجاح")

def send_alert(message):
    """إرسال تنبيه"""
    # إرسال تنبيه للإدارة
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if webhook_url:
        requests.post(webhook_url, json={
            'text': f'🚨 تنبيه: {message}',
            'channel': '#alerts'
        })

if __name__ == "__main__":
    monitor_rollback()
```

## أفضل الممارسات للنشر

### 1. مرحلة النشر

- استخدم Blue-Green Deployment
- قم بعمل نشر تدريجي (Canary Deployment)
- اختبر كل مرحلة قبل الانتقال للتالية
- احتفظ بنسخة احتياطية قابلة للاسترداد

### 2. المراقبة

- راقب أداء التطبيق بعد النشر
- راقب استخدام الموارد
- راقب أخطاء التطبيق
- احتفظ بسجلات مفصلة

### 3. الأمان

- استخدم HTTPS دائماً
- قم بتحديث التبعيات بانتظام
- استخدم متغيرات البيئة للأسرار
- فعّل جدار الحماية

### 4. النسخ الاحتياطية

- عمل نسخ احتياطية تلقائية
- اختبار عملية الاسترداد
- الاحتفاظ بنسخ متعددة
- توثيق عملية الاسترداد

---

هذا الدليل يوفر نظرة شاملة على عملية نشر تطبيق Saler من التطوير المحلي إلى الإنتاج، مع التركيز على الأمان، المراقبة، وإستراتيجيات التراجع.