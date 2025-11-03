# 🤝 دليل المساهمة - Contribution Guidelines

## نظرة عامة

نرحب بجميع المساهمات لتطوير Saler! هذا الدليل يوضح كيفية المساهمة بطريقة فعالة ومهنية.

## فهرس المحتويات

- [كيفية المساهمة](#كيفية-المساهمة)
- [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
- [عملية التطوير](#عملية-التطوير)
- [كتابة الكود](#كتابة-الكود)
- [الاختبار](#الاختبار)
- [توثيق التغييرات](#توثيق-التغييرات)
- [Pull Request Process](#pull-request-process)
- [مراجعة الكود](#مراجعة-الكود)
- [معايير الجودة](#معايير-الجودة)

## كيفية المساهمة

### أنواع المساهمات

نرحب بجميع أنواع المساهمات:

1. **🐛 إصلاح الأخطاء (Bug Fixes)**
   - إصلاح الأخطاء الموجودة
   - تحسين stability
   - إصلاح performance issues

2. **✨ إضافة ميزات جديدة (New Features)**
   - ميزات صغيرة ومفيدة
   - تحسينات للـ UI/UX
   - تكاملات خارجية

3. **📚 تحسين التوثيق (Documentation)**
   - إصلاح الأخطاء في الوثائق
   - إضافة أمثلة جديدة
   - ترجمة الوثائق

4. **🧪 إضافة اختبارات (Tests)**
   - Unit tests
   - Integration tests
   - E2E tests

5. **⚡ تحسين الأداء (Performance)**
   - تحسين استعلامات قاعدة البيانات
   - تحسين cache strategies
   - تحسين front-end performance

### قبل البدء

1. **تحقق من Issues الموجودة**
   - ابحث في GitHub Issues
   - تحقق من الـ roadmap
   - تأكد من عدم تكرار العمل

2. **أنشئ Issue لمناقشة الفكرة**
   - وصف المشكلة أو الميزة
   - اقترح الحل المقترح
   - انتظر الموافقة قبل البدء

## إعداد بيئة التطوير

### المتطلبات

- Git
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### إعداد البيئة

```bash
# 1. Fork المستودع
git clone https://github.com/your-username/saler.git
cd saler

# 2. إضافة upstream remote
git remote add upstream https://github.com/original/saler.git

# 3. إعداد بيئة التطوير
./scripts/setup.sh

# 4. بدء التطوير
./scripts/dev.sh start --with-gui
```

### IDE Configuration

```bash
# إعداد IDE configurations
./scripts/ide.sh

# تثبيت VS Code extensions المُوصى بها
# (سيتم تثبيتها تلقائياً)
```

## عملية التطوير

### Branch Strategy

نستخدم Git Flow مع بعض التعديلات:

```bash
# إنشاء feature branch
git checkout -b feature/descriptive-feature-name

# أو لـ bug fix
git checkout -b fix/issue-description

# أو لـ improvement
git checkout -b improvement/description
```

#### أنواع Branches

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Critical fixes for production
- `release/*`: Release preparation

### Workflow اليومي

```bash
# 1. تحديث main branch
git checkout main
git pull upstream main

# 2. إنشاء feature branch
git checkout -b feature/your-feature-name

# 3. تطوير الكود
# ... write code ...

# 4. تشغيل الاختبارات
./scripts/dev.sh test

# 5. فحص جودة الكود
./scripts/dev.sh lint

# 6. commit التغييرات
git add .
git commit -m "feat: add AI lead scoring feature

- Implement machine learning model integration
- Add real-time scoring endpoint
- Include comprehensive tests
- Update API documentation

Closes #123"

# 7. رفع الـ branch
git push origin feature/your-feature-name
```

## كتابة الكود

### معايير الكود

#### Python

```python
# ✅ استخدم type hints
def calculate_lead_score(
    lead_data: Dict[str, Any],
    model_version: str = "v2.0"
) -> Optional[float]:
    """Calculate AI-powered lead score.
    
    Args:
        lead_data: Raw lead information
        model_version: AI model version to use
        
    Returns:
        Calculated score or None if calculation fails
        
    Raises:
        ValidationError: If lead data is invalid
        ModelError: If AI model fails
    """
    pass

# ✅ استخدم docstrings واضحة
async def process_lead_async(
    lead: LeadCreate,
    scoring_service: AIScoringService
) -> Lead:
    """Process a lead asynchronously with AI scoring.
    
    This function handles the complete lead processing workflow including
    validation, AI scoring, and database persistence.
    
    Args:
        lead: Lead data to process
        scoring_service: AI scoring service instance
        
    Returns:
        Processed Lead object with calculated score
        
    Example:
        >>> lead_data = LeadCreate(name="Ahmed", email="ahmed@example.com")
        >>> processed = await process_lead_async(lead_data, scoring_service)
        >>> print(f"Score: {processed.score}")
    """
    pass
```

#### JavaScript/TypeScript

```typescript
// ✅ استخدم TypeScript types
interface LeadData {
  readonly id: string;
  name: string;
  email: string;
  score?: number;
}

export class LeadService {
  constructor(private readonly apiClient: ApiClient) {}
  
  async createLead(data: LeadData): Promise<Lead> {
    // Implementation
  }
  
  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    // Implementation
  }
}

// ✅ استخدم JSDoc documentation
/**
 * Calculate lead score using AI model.
 * 
 * @param leadData - Raw lead information
 * @param options - Scoring options
 * @returns Promise that resolves to score result
 * 
 * @example
 * const result = await calculateLeadScore({
 *   name: "Ahmed Ali",
 *   email: "ahmed@example.com"
 * });
 */
export async function calculateLeadScore(
  leadData: LeadData,
  options: ScoringOptions = {}
): Promise<ScoringResult> {
  // Implementation
}
```

### Code Style

#### Python

```python
# .flake8 في الجذر
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = .git,__pycache__,venv,node_modules

# Black formatting
# استخدم black لتطبيق تنسيق الكود
black app/ tests/

# isort للـ imports
isort app/ tests/

# mypy للفحص النوعي
mypy app/
```

#### JavaScript/TypeScript

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}

// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 88
}
```

## الاختبار

### Unit Testing

#### Python

```python
import pytest
from unittest.mock import Mock, patch
from app.services.ai_scoring import AIScoringService

class TestAIScoringService:
    @pytest.fixture
    def service(self):
        return AIScoringService()
    
    @pytest.mark.asyncio
    async def test_calculate_score_success(self, service):
        """Test successful score calculation."""
        # Arrange
        lead_data = {"name": "Ahmed", "email": "ahmed@example.com"}
        expected_score = 85.5
        
        with patch.object(service, '_call_ai_model') as mock_ai:
            mock_ai.return_value = {"score": expected_score}
            
            # Act
            result = await service.calculate_score_async(lead_data)
            
            # Assert
            assert result["score"] == expected_score
    
    def test_validation_error(self, service):
        """Test validation error handling."""
        # Arrange
        invalid_data = {"name": "", "email": "invalid"}
        
        # Act & Assert
        with pytest.raises(ValidationError):
            service.calculate_score_sync(invalid_data)
```

#### JavaScript

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadForm } from '@/components/LeadForm';

describe('LeadForm Component', () => {
  it('should create lead when form is submitted', async () => {
    // Arrange
    const onSubmit = jest.fn();
    render(<LeadForm onSubmit={onSubmit} />);
    
    // Act
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Ahmed Ali' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ahmed@example.com' }
    });
    
    fireEvent.submit(screen.getByRole('form'));
    
    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Ahmed Ali',
        email: 'ahmed@example.com'
      });
    });
  });
});
```

### Integration Testing

```python
# tests/integration/test_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_lead_endpoint():
    """Test lead creation API endpoint."""
    # Arrange
    lead_data = {
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "phone": "+1234567890"
    }
    
    # Act
    response = client.post("/api/v1/leads", json=lead_data)
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == lead_data["name"]
    assert "id" in data
```

### Performance Testing

```python
# tests/performance/test_scoring_performance.py
import asyncio
import time
from app.services.ai_scoring import AIScoringService

@pytest.mark.performance
async def test_scoring_performance():
    """Test that scoring meets performance requirements."""
    # Arrange
    service = AIScoringService()
    lead_data = create_test_lead_data()
    
    # Act
    start_time = time.time()
    result = await service.calculate_score_async(lead_data)
    execution_time = time.time() - start_time
    
    # Assert
    assert execution_time < 2.0, f"Scoring took {execution_time}s"
    assert result["score"] is not None
```

## توثيق التغييرات

### Commit Messages

نتبع [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Examples
feat: add AI lead scoring feature
fix: resolve database connection timeout
docs: update API documentation for scoring endpoint
style: format Python code with black
refactor: simplify lead validation logic
test: add comprehensive tests for scoring service
chore: update dependencies
perf: optimize database queries for leads list
ci: add GitHub Actions workflow for testing
```

### Commit Message Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

#### Examples

```bash
feat(ai-scoring): implement machine learning model integration

- Add TensorFlow model for lead scoring
- Implement real-time scoring endpoint
- Include confidence intervals in response
- Add comprehensive error handling

Closes #123

fix(database): resolve connection pool timeout issue

- Increase connection pool size
- Add connection retry logic
- Improve error messaging

Related to #456

docs(api): update scoring endpoint documentation

- Add request/response examples
- Include error code descriptions
- Add rate limiting information
```

### Changelog Entry

في ملف `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- AI-powered lead scoring feature (#123)
- Real-time scoring API endpoint (#124)
- Lead confidence intervals (#125)

### Changed
- Improved database query performance (#126)
- Updated API response format (#127)

### Fixed
- Resolved connection timeout issues (#128)
- Fixed memory leak in scoring service (#129)

### Deprecated
- Old scoring algorithm (will be removed in v2.0)
```

## Pull Request Process

### قبل إنشاء PR

1. **تأكد من إتمام المتطلبات:**
   - جميع الاختبارات تمر
   - الكود يتبع معايير style
   - التوثيق محدث
   - CHANGELOG محدث

2. **تحديث main branch:**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

3. **فحص نهائي:**
   ```bash
   # تشغيل جميع الاختبارات
   ./scripts/dev.sh test
   
   # فحص quality
   ./scripts/dev.sh lint
   
   # فحص security
   ./scripts/dev.sh security-check
   
   # build المشروع
   ./scripts/dev.sh build
   ```

### PR Template

عند إنشاء PR، استخدم هذا template:

```markdown
## وصف التغيير

وصف واضح ومختصر للتغيير المقترح.

## نوع التغيير

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)  
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## كيف تم اختبار التغيير؟

- [ ] Unit tests pass locally
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Screenshots (إن وجد)

If this change affects the UI, add screenshots here.

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues

Closes #(issue_number)
```

### بعد إنشاء PR

1. **يسمح بمراجعة الكود من فريق التطوير**
2. **سيتم تشغيل CI checks تلقائياً**
3. **يجب حل جميع التعليقات والتغييرات المطلوبة**
4. **PR يجب أن يمر بجميع checks قبل الـ merge**

## مراجعة الكود

### للـ Author

#### قبل إنشاء PR

```bash
# تأكد من clean history
git log --oneline -10

# تفحص الـ diff
git diff main

# تأكد من الـ tests
./scripts/dev.sh test-all

# تأكد من التوثيق
./scripts/dev.sh check-docs
```

#### عند الرد على التعليقات

- كن مهذب ومهني
- اشرح قراراتك بوضوح
- اطلب توضيح إذا لم تكن متأكد
- قم بالتغييرات المطلوبة بسرعة

### للـ Reviewer

#### ما يجب فحصه

1. **Functionality**: هل الكود يحل المشكلة المطلوبة؟
2. **Code Quality**: هل الكود واضح ومفهوم؟
3. **Security**: هل هناك مشاكل أمنية؟
4. **Performance**: هل الكود performant؟
5. **Tests**: هل يوجد tests مناسبة؟
6. **Documentation**: هل التوثيق محدث؟

#### Template للمراجعة

```markdown
## مراجعة الكود

### ✅ الإيجابيات
- Code is well-structured and readable
- Good use of TypeScript types
- Comprehensive error handling

### 🔄 التغييرات المطلوبة
- Fix the database query performance issue in `getLeads()` function
- Add missing input validation for the `email` field
- Update the API documentation to include the new response format

### 💡 اقتراحات للتحسين
- Consider using a caching layer for the scoring results
- The error messages could be more user-friendly
- Add loading states for better UX

### 📝 أسئلة
- What's the expected throughput for the scoring endpoint?
- Should we add rate limiting for this feature?

### 🧪 Testing
- [ ] All unit tests pass
- [ ] Integration tests pass  
- [ ] Manual testing completed
- [ ] Performance testing completed
```

## معايير الجودة

### Code Quality Metrics

#### Python

```python
# حد أدنى 80% coverage
pytest --cov=app --cov-report=html

# جودة الكود مع flake8
flake8 app/ --max-complexity=10

# فحص type hints مع mypy
mypy app/ --strict

# فحص security مع bandit
bandit -r app/
```

#### JavaScript

```bash
# ESLint checks
npm run lint

# TypeScript checks
npx tsc --noEmit

# Test coverage
npm run test:coverage

# Bundle size
npm run analyze
```

### Performance Standards

```python
# API response time < 2 seconds
# Database queries < 100ms
# AI scoring < 3 seconds
# Frontend render time < 100ms

@pytest.mark.performance
async def test_api_performance():
    start_time = time.time()
    response = client.get("/api/v1/leads")
    response_time = time.time() - start_time
    
    assert response_time < 2.0, f"API response took {response_time}s"
```

### Security Requirements

```python
# ✅ استخدم parameterized queries
query = "SELECT * FROM leads WHERE user_id = %s"
cursor.execute(query, (user_id,))

# ✅ validate جميع المدخلات
from pydantic import BaseModel, validator

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str]
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone format')
        return v

# ✅ استخدم authentication و authorization
from fastapi.security import HTTPBearer
from jose import JWTError, jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
```

## نصائح للنجاح

### للمبتدئين

1. **ابدأ بمشاكل صغيرة** - اختر good first issue
2. **اقرأ الكود الموجود** - افهم البنية قبل المساهمة
3. **اسأل الأسئلة** - لا تتردد في طرح الأسئلة
4. **تعلم من المراجعات** - استفد من تعليقات المراجعين

### للمطورين المتقدمين

1. **كن mentor** - ساعد المطورين الجدد
2. **حافظ على standards** - تأكد من جودة الكود
3. **شارك المعرفة** - اكتب التوثيق والتعليمات
4. **تحسين العمليات** - اقترح تحسينات للـ workflow

## موارد مفيدة

### التوثيق

- [دليل البدء السريع](./quick-start.md)
- [دليل سير العمل](./workflow-guide.md)
- [أفضل الممارسات](./best-practices.md)
- [استكشاف الأخطاء](./troubleshooting.md)

### Tools

```bash
# Development tools
./scripts/setup.sh      # Setup development environment
./scripts/dev.sh        # Manage development services
./scripts/tools.sh      # Install development tools
./scripts/ide.sh        # Setup IDE configurations

# Quality checks
./scripts/test.sh       # Run all tests
./scripts/lint.sh       # Code quality checks
./scripts/security.sh   # Security checks
./scripts/performance.sh # Performance tests
```

### Community

- GitHub Discussions
- Discord Server
- Weekly Office Hours
- Monthly Community Call

## شكر وتقدير

نتقدم بالشكر لجميع المساهمين الذين يساعدون في تطوير Saler. كل مساهمة، مهما كانت صغيرة، تساعد في بناء منتج أفضل للجميع.

---

🎉 **مرحباً بك في فريق Saler!** نتطلع لرؤيتك ومساهماتك.