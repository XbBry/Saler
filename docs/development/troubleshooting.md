# 🔧 دليل استكشاف الأخطاء وحلها - Troubleshooting Guide

## نظرة عامة

هذا الدليل يحتوي على حلول للمشاكل الشائعة التي قد تواجهها أثناء تطوير Saler، مقسمة حسب الفئة مع خطوات التشخيص والعلاج.

## مشاكل البيئة والتشغيل

### 🐳 Docker المشاكل

#### المشكلة: Docker daemon غير متصل
```bash
# الأعراض
$ docker ps
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**الحلول:**
```bash
# 1. فحص حالة Docker daemon
sudo systemctl status docker

# 2. تشغيل Docker daemon
sudo systemctl start docker

# 3. إعادة تشغيل إذا لزم الأمر
sudo systemctl restart docker

# 4. إضافة المستخدم إلى docker group
sudo usermod -aG docker $USER
newgrp docker

# 5. فحص الإعدادات
docker info
```

#### المشكلة: المنفذ مستخدم
```bash
# الأعراض
Error: bind: address already in use
Port 8000 is already allocated
```

**الحلول:**
```bash
# 1. فحص العمليات التي تستخدم المنفذ
sudo lsof -i :8000
sudo netstat -tulpn | grep :8000

# 2. إيقاف العمليات
sudo kill -9 <PID>

# 3. أو استخدام منفذ آخر
# تعديل docker-compose.yml
ports:
  - "8001:8000"  # بدلاً من 8000

# 4. فحص المنافذ المتوفرة
netstat -tulpn | grep LISTEN
```

#### المشكلة: Docker memory issues
```bash
# الأعراض
Cannot start container: system memory limit exceeded
```

**الحلول:**
```bash
# 1. فحص استخدام الذاكرة
docker stats

# 2. تنظيف الموارد غير المستخدمة
docker system prune -af

# 3. زيادة Docker memory (Docker Desktop)
# Settings > Resources > Memory: 4GB minimum

# 4. تنظيف volumes
docker volume prune -f
```

#### المشكلة: Build cache issues
```bash
# الأعراض
LayerAlreadyExists: pull access denied for image
```

**الحلول:**
```bash
# 1. تنظيف build cache
docker builder prune -af

# 2. إعادة بناء من الصفر
docker-compose build --no-cache

# 3. تحديث قاعدة الصورة
docker-compose pull
```

### 🐍 Python المشاكل

#### المشكلة: Virtual environment errors
```bash
# الأعراض
python: command not found
pip: command not found
```

**الحلول:**
```bash
# 1. إنشاء virtual environment جديدة
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# 2. تثبيت dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. التأكد من PATH
echo $PATH
# يجب أن يحتوي على المسار للـ venv/bin

# 4. استخدام python3/pip3 بدلاً من python/pip
python3 -m venv venv
```

#### المشكلة: Package conflicts
```bash
# الأعراض
ERROR: Package has requirement, but you have a different version
```

**الحلول:**
```bash
# 1. تحديث pip
pip install --upgrade pip

# 2. تنظيف cache
pip cache purge

# 3. تثبيت مع explicit versions
pip install -r requirements.txt --force-reinstall

# 4. استخدام poetry لإدارة dependencies
pip install poetry
poetry install
```

#### المشكلة: Import errors
```bash
# الأعراض
ModuleNotFoundError: No module named 'app'
```

**الحلول:**
```bash
# 1. فحص PYTHONPATH
echo $PYTHONPATH
# يجب أن يحتوي على مسار backend

# 2. تشغيل من المجلد الصحيح
cd backend
export PYTHONPATH=$PWD:$PYTHONPATH
python -m app.main

# 3. استخدام relative imports
# بدلاً من: import app.models
# استخدم: from .models import User
```

### 🌿 Node.js المشاكل

#### المشكلة: Node modules issues
```bash
# الأعراض
Error: Cannot find module 'express'
npm ERR! peer dep missing
```

**الحلول:**
```bash
# 1. تنظيف node_modules
cd frontend
rm -rf node_modules
rm package-lock.json

# 2. تثبيت dependencies مرة أخرى
npm install

# 3. استخدام specific Node version
nvm use 18

# 4. تنظيف npm cache
npm cache clean --force

# 5. فحص package.json
cat package.json
```

#### المشكلة: Build errors
```bash
# الأعراض
Module not found: Can't resolve 'components/Button'
Build failed
```

**الحلول:**
```bash
# 1. فحص imports
# تأكد من المسار الصحيح
import Button from '@/components/Button'

# 2. فحص tsconfig.json
cat frontend/tsconfig.json

# 3. تحديث dependencies
npm update

# 4. تشغيل type checking
npx tsc --noEmit
```

#### المشكلة: Next.js development server won't start
```bash
# الأعراض
Error: listen EADDRINUSE: address already in use :::3000
```

**الحلول:**
```bash
# 1. فحص العمليات التي تستخدم port 3000
lsof -ti:3000
kill -9 $(lsof -ti:3000)

# 2. استخدام منفذ مختلف
npm run dev -- -p 3001

# 3. تنظيف Next.js cache
rm -rf .next
npm run dev
```

## مشاكل قاعدة البيانات

### 🗄️ PostgreSQL المشاكل

#### المشكلة: Connection refused
```bash
# الأعراض
psycopg2.OperationalError: could not connect to server
Connection refused
```

**الحلول:**
```bash
# 1. فحص حالة PostgreSQL container
docker-compose ps postgres

# 2. فحص logs
docker-compose logs postgres

# 3. إعادة تشغيل PostgreSQL
docker-compose restart postgres

# 4. فحص connections
docker-compose exec postgres pg_isready -U saler_user

# 5. فحص connection string
echo $DATABASE_URL
# يجب أن يكون: postgresql://saler_user:password@postgres:5432/saler
```

#### المشكلة: Database doesn't exist
```bash
# الأعراض
database "saler" does not exist
```

**الحلول:**
```bash
# 1. إنشاء قاعدة البيانات
docker-compose exec postgres psql -U saler_user -c "CREATE DATABASE saler;"

# 2. أو من خلال docker-compose
# تأكد من وجود init script في backend/prisma/init.sql

# 3. فحص database creation logs
docker-compose logs postgres | grep database
```

#### المشكلة: Permission denied
```bash
# الأعراض
FATAL: password authentication failed for user "saler_user"
FATAL: role "saler_user" does not exist
```

**الحلول:**
```bash
# 1. فحص variables في docker-compose.yml
POSTGRES_USER=saler_user
POSTGRES_PASSWORD=saler_password
POSTGRES_DB=saler

# 2. إعادة إنشاء containers
docker-compose down -v
docker-compose up -d postgres

# 3. فحص user creation
docker-compose exec postgres psql -U postgres -c "\du"
```

#### المشكلة: Migration errors
```bash
# الأعراض
alembic.util.exc.CommandError: Can't locate revision
```

**الحلول:**
```bash
# 1. فحص migration history
docker-compose exec backend python -m alembic current
docker-compose exec backend python -m alembic history

# 2. إنشاء migration جديدة
docker-compose exec backend python -m alembic revision --autogenerate -m "Description"

# 3. reset migrations
docker-compose exec backend python -m alembic downgrade -1
docker-compose exec backend python -m alembic upgrade head

# 4. فحص migration files
ls -la backend/alembic/versions/
```

### 🔴 Redis المشاكل

#### المشكلة: Redis connection failed
```bash
# الأعراض
redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379
```

**الحلول:**
```bash
# 1. فحص Redis container
docker-compose ps redis

# 2. فحص logs
docker-compose logs redis

# 3. إعادة تشغيل Redis
docker-compose restart redis

# 4. فحص الاتصال
docker-compose exec redis redis-cli ping
# يجب أن يرجع: PONG

# 5. فحص URL
echo $REDIS_URL
# يجب أن يكون: redis://redis:6379/0
```

#### المشكلة: Redis memory issues
```bash
# الأعراض
OOM command not allowed when used memory > 'maxmemory'
```

**الحلول:**
```bash
# 1. فحص Redis memory usage
docker-compose exec redis redis-cli info memory

# 2. تنظيف cache
docker-compose exec redis redis-cli flushdb

# 3. زيادة memory limit في docker-compose.yml
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

# 4. مراقبة Redis keys
docker-compose exec redis redis-cli --scan --pattern "*"
```

## مشاكل الشبكة والاتصال

### 🌐 API Connection مشاكل

#### المشكلة: Backend API not accessible
```bash
# الأعراض
curl: (7) Failed to connect to localhost port 8000
Connection refused
```

**الحلول:**
```bash
# 1. فحص Backend container
docker-compose ps backend
docker-compose logs backend

# 2. فحص port mapping
docker-compose ps backend | grep 8000

# 3. فحص backend health
curl http://localhost:8000/health

# 4. فحص environment variables
docker-compose exec backend env | grep DATABASE_URL

# 5. إعادة تشغيل backend
docker-compose restart backend
```

#### المشكلة: Frontend can't connect to backend
```bash
# Symptoms
Network request failed
CORS error
```

**الحلول:**
```bash
# 1. فحص NEXT_PUBLIC_API_URL
# يجب أن يكون: http://localhost:8000 (not 0.0.0.0:8000)

# 2. فحص CORS settings في backend
grep -r "CORS" backend/app/

# 3. فحص network connectivity
docker-compose exec frontend curl http://backend:8000/health

# 4. فحص Docker network
docker network ls
docker network inspect saler-network
```

### 📡 WebSocket مشاكل

#### المشكلة: WebSocket connection failed
```bash
# الأعراض
WebSocket connection to ws://localhost:8000/ws failed
```

**الحلول:**
```bash
# 1. فحص WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" \
     http://localhost:8000/ws

# 2. فحص WebSocket route في FastAPI
grep -r "websocket" backend/app/

# 3. فحص Firewall
sudo ufw status
```

## مشاكل الأداء

### ⚡ Performance المشاكل

#### المشكلة: Slow API responses
```bash
# الأعراض
HTTP 500 errors
Request timeout
Slow database queries
```

**الحلول:**
```bash
# 1. مراقبة النظام
docker stats
htop

# 2. فحص API logs
docker-compose logs backend | tail -50

# 3. فحص database performance
docker-compose exec postgres psql -U saler_user -c "
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;"

# 4. فحص Redis performance
docker-compose exec redis redis-cli info stats

# 5. تحسين database indexes
# إضافة indexes للـ queries البطيئة
```

#### المشكلة: High memory usage
```bash
# الأعراض
Out of memory errors
Container killed
```

**الحلول:**
```bash
# 1. فحص memory usage
docker-compose stats

# 2. تنظيف memory leaks
# فحص code for memory leaks

# 3. تحسين Python memory usage
# إضافة garbage collection
import gc
gc.collect()

# 4. زيادة memory limits في docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

## مشاكل الاختبار

### 🧪 Testing المشاكل

#### المشكلة: Tests failing
```bash
# الأعراض
FAILED tests/test_lead_scoring.py::test_ai_scoring
AssertionError: None is not an instance of <class 'app.models.Lead'>
```

**الحلول:**
```bash
# 1. فحص test database
docker-compose exec postgres psql -U saler_user -c "\dt"

# 2. تشغيل tests مع verbose
python -m pytest -v tests/

# 3. فحص test configuration
cat pytest.ini

# 4. تنظيف test database
docker-compose exec backend python -m pytest --co  # list tests
docker-compose exec backend python -m pytest tests/ --tb=short
```

#### المشكلة: Frontend tests failing
```bash
# Symptoms
Jest test failed
TypeError: Cannot read property 'map' of undefined
```

**الحلول:**
```bash
# 1. فحص test environment
cd frontend
npm test -- --env=jsdom

# 2. فحص test data
# تأكد من وجود mock data

# 3. تشغيل tests مع coverage
npm test -- --coverage

# 4. فحص TypeScript types
npx tsc --noEmit
```

## مشاكل الأمان

### 🔒 Security المشاكل

#### المشكلة: JWT token errors
```bash
# Symptoms
JWT decode error
Token has expired
```

**الحلول:**
```bash
# 1. فحص SECRET_KEY
echo $SECRET_KEY
# يجب أن يكون secret وآمن

# 2. فحص token expiration
# في الكود: ACCESS_TOKEN_EXPIRE_MINUTES

# 3. فحص token format
# JWT format: header.payload.signature

# 4. فحص algorithm
# يجب أن يكون HS256 في both sides
```

#### المشكلة: CORS errors
```bash
# Symptoms
Access to fetch blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

**الحلول:**
```bash
# 1. فحص CORS settings في FastAPI
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. فحص headers في requests
# تأكد من إرسال Headers الصحيحة

# 3. فحص preflight requests
# OPTIONS request يجب أن يعمل
```

## مشاكل المراقبة والسجلات

### 📊 Monitoring المشاكل

#### المشكلة: Missing logs
```bash
# Symptoms
Empty log files
Log file not being created
```

**الحلول:**
```bash
# 1. فحص log configuration
# تأكد من وجود logs/ directory
mkdir -p logs

# 2. فحص logging configuration
# في Python:
import logging
logging.basicConfig(level=logging.INFO)

# 3. فحص log rotation
tail -f logs/app.log

# 4. فحص Docker logs
docker-compose logs -f backend
```

#### المشكلة: Prometheus/Grafana not working
```bash
# Symptoms
No metrics available
Grafana dashboard empty
```

**الحلول:**
```bash
# 1. فحص Prometheus container
docker-compose ps prometheus

# 2. فحص metrics endpoint
curl http://localhost:9090/api/v1/query?query=http_requests_total

# 3. فحص Grafana configuration
# تأكد من data source configuration

# 4. فحص Prometheus targets
# http://localhost:9090/targets
```

## أدوات التشخيص

### 🔍 Diagnostic Commands

```bash
# System health check
./scripts/health-check.sh

# Service status check
./scripts/dev.sh status

# Database connectivity test
docker-compose exec postgres pg_isready -U saler_user

# Redis connectivity test
docker-compose exec redis redis-cli ping

# API health check
curl -f http://localhost:8000/health || echo "API is down"

# Memory usage check
docker stats --no-stream

# Disk usage check
df -h
du -sh logs/ dev-data/

# Network connectivity check
docker network ls
docker network inspect saler-network
```

### 📝 Log Analysis

```bash
# Real-time log monitoring
docker-compose logs -f backend

# Error log filtering
docker-compose logs backend | grep ERROR

# Database query log
docker-compose logs postgres | grep "query"

# API request log
docker-compose logs backend | grep "INFO"
tail -f logs/*.log

# Search in logs
grep -r "ERROR" logs/
grep -r "timeout" logs/
```

### 🐛 Debug Mode

```bash
# Enable debug mode
export DEBUG=true
export LOG_LEVEL=DEBUG

# Backend debug
docker-compose exec backend python -c "
import logging
logging.basicConfig(level=logging.DEBUG)
from app.main import app
"

# Frontend debug
cd frontend
export NEXT_PUBLIC_DEBUG=true
npm run dev

# Database debug
docker-compose exec postgres psql -U saler_user -c "
  SELECT version();
  SELECT * FROM pg_stat_activity;
"
```

## نصائح للتشخيص السريع

### 1. سجل جميع العمليات
```bash
# إنشاء debug log
{
  echo "=== DEBUG SESSION $(date) ==="
  echo "System info:"
  uname -a
  echo "Docker version:"
  docker --version
  echo "Docker Compose version:"
  docker-compose --version
  echo "Running services:"
  docker-compose ps
  echo "Resource usage:"
  docker stats --no-stream
} > debug.log
```

### 2. Health checks دورية
```bash
# إضافة إلى crontab
*/5 * * * * /path/to/scripts/health-check.sh >> /var/log/health.log 2>&1
```

### 3. Automated testing
```bash
# Add to pre-commit hook
#!/bin/bash
set -e
echo "Running pre-commit checks..."
./scripts/dev.sh test --quick
./scripts/dev.sh lint --quick
```

## الحصول على مساعدة إضافية

### 📚 الموارد الإضافية
- [دليل البدء السريع](./quick-start.md)
- [دليل سير العمل](./workflow-guide.md)
- [وثائق API](http://localhost:8000/docs)

### 🛠️ أدوات التشخيص المساعدة
```bash
# استخدام debug scripts
./scripts/debug/python-debug.py
./scripts/debug/node-debug.js

# تشغيل diagnostic suite
./scripts/diagnostics.sh
```

### 📞 Contact & Support
- GitHub Issues
- Documentation Wiki
- Team Chat

---

💡 **نصيحة أخيرة**: عند مواجهة مشكلة، ابدأ بالأساسيات:
1. فحص logs
2. فحص resource usage
3. فحص network connectivity
4. فحص configuration
5. إعادة تشغيل الخدمات

معظم المشاكل يمكن حلها بهذه الخطوات البسيطة!