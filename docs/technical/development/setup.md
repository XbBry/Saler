# إعداد بيئة التطوير - مشروع Saler

## نظرة عامة

هذا الدليل يوضح كيفية إعداد بيئة تطوير محلية كاملة لمشروع Saler، بما يشمل جميع الخدمات والتبعيات المطلوبة للتطوير بكفاءة.

### متطلبات النظام

#### الحد الأدنى
- **OS**: macOS 10.15, Ubuntu 20.04, Windows 10
- **RAM**: 8GB
- **Storage**: 20GB مساحة فارغة
- **CPU**: معالج ثنائي النواة

#### الموصى به
- **OS**: macOS 12+, Ubuntu 22.04, Windows 11
- **RAM**: 16GB أو أكثر
- **Storage**: 50GB مساحة فارغة (SSD مفضل)
- **CPU**: معالج رباعي النواة

### تثبيت الأدوات الأساسية

#### 1. Git

```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt update
sudo apt install git

# Windows (استخدام Git Bash أو تثبيت من git-scm.com)
```

#### تكوين Git الأولي
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.editor "code --wait"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

#### 2. Node.js

```bash
# تثبيت Node.js 18 LTS باستخدام nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc

# تثبيت Node.js LTS
nvm install --lts
nvm use --lts

# التحقق من التثبيت
node --version
npm --version
```

#### 3. Docker Desktop

```bash
# macOS
brew install --cask docker

# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Windows
# تحميل Docker Desktop من docker.com
```

#### 4. PostgreSQL

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# إنشاء مستخدم للتطوير
sudo -u postgres createuser --interactive your_username
sudo -u postgres createdb saler_development
```

#### 5. Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## إعداد المشروع

### 1. استنساخ المشروع

```bash
# استنساخ المشروع
git clone https://github.com/company/saler.git
cd saler

# التحقق من البنية
ls -la
```

### 2. تثبيت التبعيات

#### Backend Dependencies
```bash
cd backend

# تثبيت التبعيات
npm install

# تثبيت التبعيات للتطوير
npm install --save-dev nodemon
npm install --save-dev jest
npm install --save-dev eslint
npm install --save-dev prettier
npm install --save-dev husky
```

#### Frontend Dependencies
```bash
cd ../frontend

# تثبيت التبعيات
npm install

# تثبيت التبعيات الإضافية للتطوير
npm install --save-dev @types/react
npm install --save-dev @types/react-dom
npm install --save-dev eslint-plugin-react-hooks
npm install --save-dev prettier-plugin-tailwindcss
```

### 3. إعداد متغيرات البيئة

#### Backend Environment Variables
```bash
# إنشاء ملف .env في مجلد backend
cp backend/.env.example backend/.env

# تحرير الملف
code backend/.env
```

```env
# backend/.env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://your_username:password@localhost:5432/saler_development
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# API Keys (Development)
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
META_ACCESS_TOKEN=your-meta-access-token

# Email (Development - MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# File Storage
FILE_STORAGE_TYPE=local
FILE_STORAGE_PATH=./uploads

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
LOG_FORMAT=dev
```

#### Frontend Environment Variables
```bash
# إنشاء ملف .env.local في مجلد frontend
cp frontend/.env.local.example frontend/.env.local

# تحرير الملف
code frontend/.env.local
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CDN_URL=http://localhost:3000/static

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your-google-analytics-id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT=false
```

### 4. إعداد قاعدة البيانات

#### تشغيل الخدمات مع Docker Compose
```yaml
# docker-compose.yml في الجذر
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: saler_development
      POSTGRES_USER: your_username
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U your_username"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    volumes:
      - mailhog_data:/maildir

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  mailhog_data:
```

```bash
# تشغيل الخدمات
docker-compose up -d

# التحقق من حالة الخدمات
docker-compose ps

# عرض السجلات
docker-compose logs -f postgres
```

#### تشغيل Migrations
```bash
cd backend

# تشغيل جميع Migrations
npm run migrate

# إضافة بيانات تجريبية
npm run seed

# التحقق من حالة قاعدة البيانات
psql postgresql://your_username:password@localhost:5432/saler_development
\dt  # عرض الجداول
SELECT COUNT(*) FROM users;  # عدد المستخدمين
```

### 5. إعداد البريد الإلكتروني للتطوير

#### MailHog Web Interface
```bash
# الوصول لواجهة MailHog
open http://localhost:8025

# أو زيارة الرابط مباشرة في المتصفح
```

#### اختبار إرسال البريد
```javascript
// backend/src/utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'localhost',
  port: 1025,
  secure: false,
});

async function sendTestEmail() {
  const info = await transporter.sendMail({
    from: '"Saler" <noreply@saler.com>',
    to: 'test@example.com',
    subject: 'اختبار البريد الإلكتروني',
    text: 'هذا بريد تجريبي من بيئة التطوير',
    html: '<p>هذا بريد تجريبي من بيئة التطوير</p>',
  });

  console.log('تم إرسال البريد:', info.messageId);
}

module.exports = { transporter, sendTestEmail };
```

### 6. إعداد أدوات التطوير

#### VS Code Configuration
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  },
  "git.ignoreLimitWarning": true
}
```

#### VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-git-base",
    "ms-vscode.vscode-gitlens",
    "graphql.vscode-graphql",
    "graphql.vscode-graphql-syntax",
    "ms-vscode.vscode-docker",
    "ms-vscode-remote.remote-containers",
    "ms-vscode-remote.remote-ssh",
    "ms-vscode-remote.remote-wsl",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

#### ESLint Configuration
```json
// backend/.eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
```

```json
// frontend/.eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react-hooks"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "ignorePatterns": [
    "node_modules/",
    ".next/",
    "out/",
    "dist/"
  ]
}
```

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "proseWrap": "preserve"
}
```

```json
// frontend/.prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 7. إعداد Scripts للتطوير

#### Backend Package Scripts
```json
// backend/package.json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ --ext .js,.ts",
    "lint:fix": "eslint src/ --ext .js,.ts --fix",
    "format": "prettier --write src/",
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "seed": "knex seed:run",
    "db:reset": "npm run migrate:rollback && npm run migrate && npm run seed",
    "build": "tsc",
    "docker:dev": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

#### Frontend Package Scripts
```json
// frontend/package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit",
    "docker:dev": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

### 8. تشغيل البيئة

#### تشغيل Backend
```bash
# في terminal منفصل
cd backend

# تشغيل في وضع التطوير
npm run dev

# أو استخدام Docker
npm run docker:dev
```

#### تشغيل Frontend
```bash
# في terminal منفصل آخر
cd frontend

# تشغيل في وضع التطوير
npm run dev

# أو استخدام Docker
npm run docker:dev
```

#### التحقق من التشغيل
```bash
# فحص حالة Backend
curl http://localhost:3000/health

# فحص حالة Frontend
open http://localhost:3000

# فحص قاعدة البيانات
open http://localhost:8080  # Adminer

# فحص البريد
open http://localhost:8025  # MailHog
```

## أدوات إضافية للتطوير

### 1. Database GUI Tools

#### Database Management
```bash
# تثبيت Adminer للوصول لقاعدة البيانات
docker run -d -p 8080:8080 adminer

# أو تثبيت pgAdmin
docker run -d -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@saler.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4
```

#### Redis GUI
```bash
# تثبيت Redis Insight
docker run -d -p 8001:8001 redis/redisinsight

# أو استخدام Redis CLI
redis-cli
```

### 2. API Development Tools

#### API Testing
```bash
# تثبيت HTTPie
pip install httpie

# تثبيت Postman CLI
brew install postman

# اختبار API
http POST localhost:3000/api/auth/login \
  email="test@example.com" \
  password="password123"
```

#### GraphQL Playground
```javascript
// إضافة GraphQL endpoint للتطوير
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Query {
    health: String
    version: String
  }
`);

const root = {
  health: () => 'OK',
  version: () => process.env.npm_package_version,
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: process.env.NODE_ENV === 'development',
}));
```

### 3. Monitoring and Debugging

#### Logging
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} ${level}: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

module.exports = logger;
```

#### Health Checks
```javascript
// backend/src/routes/health.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const redis = require('../database/redis');

router.get('/', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    services: {}
  };

  try {
    // Database health check
    await pool.query('SELECT 1');
    healthcheck.services.database = 'OK';
  } catch (error) {
    healthcheck.services.database = 'ERROR';
    healthcheck.message = 'ERROR';
  }

  try {
    // Redis health check
    await redis.ping();
    healthcheck.services.redis = 'OK';
  } catch (error) {
    healthcheck.services.redis = 'ERROR';
    healthcheck.message = 'ERROR';
  }

  const statusCode = healthcheck.message === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

module.exports = router;
```

### 4. Git Hooks

#### Pre-commit Hook
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

cd backend

# Run linting
npm run lint

# Run tests
npm test

cd ../frontend

# Run linting
npm run lint

# Run type checking
npm run type-check

# Return to root
cd ..
```

#### Commit Message Convention
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build'
      ]
    ]
  }
};
```

## استكشاف الأخطاء وحلها

### مشاكل شائعة

#### 1. خطأ الاتصال بقاعدة البيانات
```bash
# التحقق من حالة PostgreSQL
sudo systemctl status postgresql

# التحقق من حالة الخدمة
ps aux | grep postgres

# إعادة تشغيل الخدمة
sudo systemctl restart postgresql

# التحقق من السجلات
sudo journalctl -u postgresql -f
```

#### 2. خطأ Redis
```bash
# التحقق من حالة Redis
redis-cli ping

# التحقق من السجلات
tail -f /var/log/redis/redis-server.log

# إعادة تشغيل Redis
sudo systemctl restart redis-server
```

#### 3. مشاكل Node.js Dependencies
```bash
# تنظيف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# أو استخدام yarn
yarn install --frozen-lockfile
```

#### 4. مشاكل Docker
```bash
# تنظيف Docker
docker system prune -a

# إعادة بناء الحاويات
docker-compose down --volumes
docker-compose up --build -d

# فحص السجلات
docker-compose logs -f
```

### نصائح التطوير

#### 1. استخدام Git بكفاءة
```bash
# إنشاء branch جديد للمهمة
git checkout -b feature/product-search

# commits صغيرة ومعنوية
git add .
git commit -m "feat: add product search functionality"

# push مع تتبع branch
git push -u origin feature/product-search
```

#### 2. Code Review
```bash
# قبل push
npm run lint
npm test
npm run type-check

# open pull request مع وصف واضح
# ربط بالـ issue
# إضافة screenshots إذا لزم الأمر
```

#### 3. Debugging
```javascript
// استخدام console.log بطريقة منظمة
const logger = require('../utils/logger');

logger.debug('User data:', user); // Debug
logger.info('User logged in:', user.id); // Info
logger.warn('Deprecated method used'); // Warning
logger.error('Database connection failed', error); // Error
```

هذه البيئة الشاملة توفر كل ما تحتاجه لتطوير مشروع Saler بكفاءة عالية وسهولة.

---

**آخر تحديث**: 2 نوفمبر 2025