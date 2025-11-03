# 🔄 دليل سير العمل في التطوير - Saler Development Workflow

## نظرة عامة

هذا الدليل يوضح سير العمل المثالي لتطوير Saler من البداية إلى الإنتاج، مع أفضل الممارسات والأدوات المساعدة.

## بنية سير العمل

```
Development → Testing → Code Review → Staging → Production
     ↓              ↓           ↓          ↓          ↓
   Feature     Integration   PR Review   Deploy     Monitor
   Branches     Tests       Merge       Staging     Health
```

## إعداد البيئة

### البدء اليومي

```bash
# 1. تحديث المستودع
git pull origin main

# 2. بدء بيئة التطوير
./scripts/dev.sh start

# 3. فحص حالة الخدمات
./scripts/dev.sh status

# 4. فحص آخر السجلات
./scripts/dev.sh logs --tail=20
```

### الإعداد الأولي للمشروع

```bash
# إعداد شامل للبيئة
./scripts/setup.sh

# تثبيت أدوات التطوير
./scripts/tools.sh

# إعداد IDE configurations
./scripts/ide.sh

# بدء التطوير
./scripts/dev.sh start --with-gui
```

## سير عمل Git

### 1. إنشاء Feature Branch

```bash
# إنشاء branch جديد
git checkout -b feature/AI-lead-scoring

# أو لـ bug fix
git checkout -b fix/database-connection-issue

# أو لـ improvement
git checkout -b improvement/api-performance
```

### 2. العمل على Feature

```bash
# إنشاء الكود
# ... تطوير الكود ...

# فحص جودة الكود
./scripts/dev.sh lint

# تشغيل الاختبارات
./scripts/dev.sh test

# التنسيق التلقائي
./scripts/dev.sh format

# فحص Git status
git status

# إضافة الملفات
git add .

# إنشاء commit مع رسالة واضحة
git commit -m "feat: implement AI lead scoring algorithm

- Add machine learning model integration
- Implement real-time scoring endpoint
- Add comprehensive tests
- Update API documentation

Closes #123"
```

### 3. Git Hooks التلقائية

تم إعداد Git hooks تلقائياً ستقوم بـ:
- فحص syntax للأخطاء
- التحقق من security issues
- فحص TODO/FIXME comments
- التأكد من .gitignore configurations

### 4. Push و Pull Request

```bash
# رفع الـ branch
git push origin feature/AI-lead-scoring

# أو إنشاء PR من GitHub/GitLab interface
# ثم إنشاء merge request
```

### 5. Code Review Process

```markdown
## PR Template

### وصف التغيير
وصف واضح ومختصر للتغيير

### نوع التغيير
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

### اختبار التغيير
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Performance impact assessed

### screenshots (إن وجد)
ضع screenshots إذا كان هناك تغييرات في UI
```

## التقنيات والأدوات

### Python Development

#### البيئة الافتراضية
```bash
cd backend
source venv/bin/activate

# تثبيت dependencies
pip install -r requirements.txt

# تثبيت development dependencies
pip install -r requirements-dev.txt
```

#### تشغيل الاختبارات
```bash
# جميع الاختبارات
python -m pytest

# مع coverage
python -m pytest --cov=app

# مع detailed output
python -m pytest -v --tb=short

# watch mode (مراقبة التغييرات)
ptw  # python-task-watch

# specific test
python -m pytest tests/test_lead_scoring.py::test_ai_scoring
```

#### Debugging
```python
# استخدام Python Debugger
import pdb; pdb.set_trace()

# أو في VS Code
# Set breakpoint and press F5

# أو استخدام debug script
from scripts.debug.python_debug import debug_trace, memory_usage
debug_trace()
memory_usage()
```

#### Linting و Formatting
```bash
# فحص مع flake8
flake8 app/

# تنسيق مع black
black app/

# ترتيب imports مع isort
isort app/

# فحص types مع mypy
mypy app/

# فحص security مع bandit
bandit -r app/
```

### JavaScript/TypeScript Development

#### تشغيل Frontend
```bash
cd frontend

# تشغيل development server
npm run dev

# بناء للإنتاج
npm run build

# تشغيل production server
npm start

# فحص builds
npm run analyze
```

#### Testing
```bash
# تشغيل جميع الاختبارات
npm test

# watch mode
npm run test:watch

# مع coverage
npm run test:coverage

# specific test
npm test LeadScoring.test.tsx
```

#### Linting و Formatting
```bash
# فحص ESLint
npm run lint

# إصلاح تلقائي
npm run lint:fix

# تنسيق مع Prettier
npx prettier --write src/

# فحص TypeScript
npx tsc --noEmit
```

### Database Development

#### PostgreSQL Operations
```bash
# اتصال مباشر
psql-dev  # alias مُعرَّف مسبقاً

# أو
docker-compose exec postgres psql -U saler_user saler

# تشغيل migrations
docker-compose exec backend python -m alembic upgrade head

# إنشاء migration جديدة
docker-compose exec backend python -m alembic revision --autogenerate -m "Description"

# نسخة احتياطية
./scripts/dev.sh db backup

# استعادة نسخة احتياطية
./scripts/dev.sh db restore backup_20231201_143022.sql
```

#### Data Management
```sql
-- عرض الجداول
\dt

-- عرض schema
\d+ table_name

-- عرض البيانات
SELECT * FROM leads LIMIT 10;

-- تحليل الأداء
EXPLAIN ANALYZE SELECT * FROM leads WHERE score > 80;
```

### Redis Development

```bash
# اتصال مباشر
redis-cli  # alias مُعرَّف مسبقاً

# أو
docker-compose exec redis redis-cli

# مراقبة Redis
redis-cli monitor

# معلومات عن الذاكرة
redis-cli info memory

# بحث في keys
redis-cli keys "*lead*"
```

## سير عمل الاختبار

### 1. Unit Testing

#### Python Tests
```python
# tests/test_lead_scoring.py
import pytest
from app.services.ai_scoring import AIScoringService

@pytest.fixture
def scoring_service():
    return AIScoringService()

def test_calculate_lead_score(scoring_service):
    # Arrange
    lead_data = {
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "phone": "+1234567890"
    }
    
    # Act
    score = scoring_service.calculate_score(lead_data)
    
    # Assert
    assert 0 <= score <= 100
    assert isinstance(score, float)

@pytest.mark.asyncio
async def test_real_time_scoring(scoring_service):
    # Test async operations
    result = await scoring_service.predict_async(test_data)
    assert result.status == "success"
```

#### JavaScript Tests
```typescript
// tests/components/LeadCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadCard } from '@/components/LeadCard';

describe('LeadCard', () => {
  const mockLead = {
    id: '1',
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    score: 85
  };

  it('renders lead information correctly', () => {
    render(<LeadCard lead={mockLead} />);
    
    expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
    expect(screen.getByText('ahmed@example.com')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(mockLead);
  });
});
```

### 2. Integration Testing

```python
# tests/integration/test_api_endpoints.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_lead_endpoint():
    response = client.post("/api/v1/leads", json={
        "name": "Ahmed Ali",
        "email": "ahmed@example.com"
    })
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == "Ahmed Ali"
```

```typescript
// tests/integration/api.test.ts
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils';

describe('Lead API Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  it('should create and retrieve lead', async () => {
    // Create lead
    const createResponse = await fetch('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ahmed Ali',
        email: 'ahmed@example.com'
      })
    });

    expect(createResponse.status).toBe(201);
    const lead = await createResponse.json();

    // Retrieve lead
    const getResponse = await fetch(`/api/v1/leads/${lead.id}`);
    expect(getResponse.status).toBe(200);
    
    const retrievedLead = await getResponse.json();
    expect(retrievedLead.name).toBe('Ahmed Ali');
  });
});
```

### 3. End-to-End Testing

```typescript
// cypress/integration/lead-management.spec.ts
describe('Lead Management Flow', () => {
  beforeEach(() => {
    cy.visit('/leads');
    cy.login('admin@example.com', 'password');
  });

  it('should create new lead and verify scoring', () => {
    // Create new lead
    cy.get('[data-testid="new-lead-button"]').click();
    cy.get('[data-testid="lead-name"]').type('Ahmed Ali');
    cy.get('[data-testid="lead-email"]').type('ahmed@example.com');
    cy.get('[data-testid="lead-phone"]').type('+1234567890');
    cy.get('[data-testid="submit-lead"]').click();

    // Verify lead appears in list
    cy.get('[data-testid="lead-card"]')
      .should('contain', 'Ahmed Ali')
      .and('contain', 'ahmed@example.com');

    // Verify AI scoring
    cy.get('[data-testid="ai-score"]')
      .should('be.visible')
      .and('contain', 'Score:');
  });
});
```

## Performance Monitoring

### 1. Application Monitoring

```python
# Backend metrics
from prometheus_client import Counter, Histogram, generate_latest
import time

# Define metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path
    ).inc()
    
    REQUEST_LATENCY.observe(process_time)
    
    return response
```

### 2. Database Performance

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Monitor slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 3. Frontend Performance

```typescript
// Performance monitoring
export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  const start = performance.now();
  return fn().then((result) => {
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  });
};

// Usage
const fetchLeads = measurePerformance('fetchLeads', async () => {
  const response = await fetch('/api/leads');
  return response.json();
});
```

## Error Handling و Logging

### 1. Structured Logging

```python
# Python logging configuration
import logging
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage
logger.info("Lead processing started", lead_id=lead.id, user_id=user.id)
logger.error("AI scoring failed", error=str(e), lead_id=lead.id)
```

```typescript
// TypeScript logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

// Usage
logger.info('Lead processing started', { leadId: lead.id, userId: user.id });
logger.error('AI scoring failed', { error: e.message, leadId: lead.id });
```

### 2. Error Boundaries

```typescript
// React Error Boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Security Best Practices

### 1. Environment Variables

```bash
# .env.local (لا يتم commit)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
SECRET_KEY=your-very-secure-secret-key
OPENAI_API_KEY=sk-...

# .env.example (يتم commit)
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Input Validation

```python
# Pydantic models
from pydantic import BaseModel, EmailStr, validator

class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., regex=r'^\+?[1-9]\d{1,14}$')
    
    @validator('name')
    def name_must_contain_space(cls, v):
        if ' ' not in v:
            raise ValueError('must contain a space')
        return v

@app.post("/leads")
async def create_lead(lead: LeadCreate):
    # lead is automatically validated
    pass
```

```typescript
// Zod validation
import { z } from 'zod';

const LeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/)
});

export const createLead = (data: unknown) => {
  const validated = LeadSchema.parse(data);
  // validated data is type-safe
};
```

### 3. API Security

```python
# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/leads")
@limiter.limit("10/minute")
async def create_lead(request: Request, lead: LeadCreate):
    # Implementation
    pass

# Authentication
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return user_id
```

## Deployment Workflow

### 1. Staging Environment

```bash
# بناء للإنتاج
docker-compose -f docker-compose.staging.yml build

# اختبار في staging
docker-compose -f docker-compose.staging.yml up -d

# تشغيل الاختبارات في staging
./scripts/ci/staging-tests.sh
```

### 2. Production Deployment

```bash
# نسخ احتياطية
./scripts/dev.sh db backup

# بناء production images
docker-compose -f docker-compose.prod.yml build --no-cache

# نشر إلى production
docker-compose -f docker-compose.prod.yml up -d

# مراقبة النظام
./scripts/monitoring/health-check.sh
```

### 3. Monitoring و Alerts

```yaml
# docker/prometheus/rules.yml
groups:
- name: saler.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High error rate detected
      description: "Error rate is {{ $value }} errors per second"
      
  - alert: DatabaseConnectionsHigh
    expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: Database connections are high
      description: "Database connection usage is {{ $value | humanizePercentage }}"
```

## نصائح للإنتاجية

### 1. Aliases سريعة

```bash
# أضف إلى .bashrc أو .zshrc
alias saler-dev='./scripts/dev.sh start --with-gui'
alias saler-test='./scripts/dev.sh test'
alias saler-lint='./scripts/dev.sh lint'
alias saler-format='./scripts/dev.sh format'
alias saler-backup='./scripts/dev.sh db backup'
alias saler-logs='./scripts/dev.sh logs'
```

### 2. IDE Shortcuts

```json
// VS Code keybindings.json
[
  {
    "key": "ctrl+shift+d",
    "command": "workbench.action.tasks.runTask",
    "args": "Start Development Services"
  },
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "Run Tests"
  },
  {
    "key": "ctrl+shift+l",
    "command": "workbench.action.tasks.runTask",
    "args": "Lint Code"
  }
]
```

### 3. Automation Scripts

```bash
#!/bin/bash
# scripts/daily-workflow.sh

echo "🌅 Starting daily development workflow..."

# Update code
echo "📥 Pulling latest changes..."
git pull origin main

# Start development environment
echo "🚀 Starting development environment..."
./scripts/dev.sh start --with-gui

# Run quick tests
echo "🧪 Running quick tests..."
cd backend && python -m pytest --maxfail=1 -q

# Open useful tools
echo "🔧 Opening development tools..."
open http://localhost:3000  # Frontend
open http://localhost:8000/docs  # API docs
open http://localhost:8080  # pgAdmin

echo "✅ Daily workflow completed! Happy coding! 🎉"
```

## خلاصة

هذا الدليل يوفر framework شامل للتطوير الفعال. المفتاح هو:

1. **اتبع Process ثابت** للتطوير
2. **استخدم الأدوات المساعدة** باستمرار
3. **راقب الجودة** في كل مرحلة
4. **استخدم الإعدادات المُعدة مسبقاً** للتوفير في الوقت
5. **توثق التغييرات** والتحديات

للحصول على أفضل النتائج، ابدأ بـ [دليل البدء السريع](./quick-start.md) ثم ارجع لهذا الدليل عند الحاجة.