# 🏆 دليل أفضل الممارسات - Best Practices Guide

## نظرة عامة

هذا الدليل يجمع أفضل الممارسات لتطوير Saler، بناءً على خبرة الفريق والمعايير الصناعية لتطوير البرمجيات عالية الجودة.

## معايير الكود

### 🎯 معايير Python

#### Code Style و Formatting

**Black Formatting:**
```python
# ✅ Good - Following Black formatting
def calculate_lead_score(
    lead_data: dict,
    model_version: str = "v2.0",
    include_metadata: bool = True
) -> LeadScore:
    """Calculate AI-powered lead score.
    
    Args:
        lead_data: Raw lead information
        model_version: AI model version to use
        include_metadata: Whether to include metadata
    
    Returns:
        LeadScore object with calculated score and confidence
        
    Raises:
        ValidationError: If lead_data is invalid
        ModelError: If AI model fails
    """
    pass

# ❌ Bad - Inconsistent formatting
def calculate_lead_score(lead_data,model_version="v2.0",include_metadata=True):
    pass
```

**Import Organization:**
```python
# Standard library imports
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional

# Third-party imports
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr, validator

# Local application imports
from app.core.config import settings
from app.models.lead import Lead, LeadCreate
from app.services.ai_scoring import AIScoringService
from app.utils.logger import get_logger
```

**Type Hints:**
```python
from typing import Union, List, Dict, Optional, Any
from enum import Enum

class LeadStatus(Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"

def process_leads(
    leads: List[LeadCreate],
    config: Dict[str, Any],
    scoring_service: Optional[AIScoringService] = None
) -> Dict[str, Union[int, List[Lead]]]:
    """Process multiple leads with optional AI scoring.
    
    Args:
        leads: List of lead data to process
        config: Processing configuration
        scoring_service: Optional AI scoring service
        
    Returns:
        Dict containing processed results and statistics
    """
    results = {"processed": 0, "errors": 0, "leads": []}
    
    for lead in leads:
        try:
            processed_lead = _process_single_lead(lead, config, scoring_service)
            results["leads"].append(processed_lead)
            results["processed"] += 1
        except Exception as e:
            logger.error(f"Failed to process lead {lead.id}: {e}")
            results["errors"] += 1
            
    return results
```

#### Error Handling

```python
from typing import Union
import structlog

logger = structlog.get_logger()

class LeadProcessingError(Exception):
    """Base exception for lead processing errors."""
    pass

class ValidationError(LeadProcessingError):
    """Raised when lead data validation fails."""
    pass

class ModelError(LeadProcessingError):
    """Raised when AI model processing fails."""
    pass

async def process_lead_async(
    lead_data: LeadCreate,
    scoring_service: AIScoringService
) -> Lead:
    """Process a single lead asynchronously.
    
    Args:
        lead_data: Lead data to process
        scoring_service: AI scoring service
        
    Returns:
        Processed Lead object
        
    Raises:
        ValidationError: If lead data is invalid
        ModelError: If AI scoring fails
        LeadProcessingError: For other processing errors
    """
    try:
        # Validate input
        _validate_lead_data(lead_data)
        
        # Process with AI scoring
        score = await scoring_service.calculate_score_async(lead_data.dict())
        
        # Create and return lead
        return Lead(
            id=generate_lead_id(),
            **lead_data.dict(),
            score=score,
            created_at=datetime.utcnow()
        )
        
    except ValidationError:
        logger.error("Validation failed", lead_data=lead_data.dict())
        raise
    except Exception as e:
        logger.error("Processing failed", lead_data=lead_data.dict(), error=str(e))
        raise LeadProcessingError(f"Failed to process lead: {e}")

def _validate_lead_data(lead_data: LeadCreate) -> None:
    """Validate lead data before processing.
    
    Args:
        lead_data: Lead data to validate
        
    Raises:
        ValidationError: If validation fails
    """
    if not lead_data.name or len(lead_data.name.strip()) < 2:
        raise ValidationError("Name must be at least 2 characters")
        
    if lead_data.email and "@" not in lead_data.email:
        raise ValidationError("Invalid email format")
```

#### Database Best Practices

```python
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from contextlib import contextmanager

Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), default="new", index=True)
    score = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="leads")
    
    # Constraints
    __table_args__ = (
        {'mysql_engine': 'InnoDB'},
        {'mysql_charset': 'utf8mb4'}
    )
    
    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, name='{self.name}', email='{self.email}')>"

# Database session management
@contextmanager
def get_db_session():
    """Provide a scoped database session."""
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage
async def create_lead(lead_data: LeadCreate) -> Lead:
    """Create a new lead in database.
    
    Args:
        lead_data: Lead data to create
        
    Returns:
        Created Lead object
        
    Raises:
        DatabaseError: If database operation fails
    """
    with get_db_session() as session:
        lead = Lead(**lead_data.dict())
        session.add(lead)
        session.flush()  # Get ID without committing
        return lead
```

### 🎯 معايير JavaScript/TypeScript

#### TypeScript Best Practices

```typescript
// Type definitions
export interface Lead {
  readonly id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export interface LeadCreateInput {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  tags?: string[];
}

export interface LeadScoringResult {
  score: number;
  confidence: number;
  factors: ScoringFactor[];
  modelVersion: string;
}

export interface ScoringFactor {
  name: string;
  impact: number;
  description: string;
}

// Error handling
export class LeadProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'LeadProcessingError';
  }
}

export class ValidationError extends LeadProcessingError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// Utility functions
export const validateLeadInput = (input: LeadCreateInput): void => {
  if (!input.name || input.name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters');
  }
  
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new ValidationError('Invalid email format');
  }
};

// Service implementation
export class LeadService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly scoringService: ScoringService
  ) {}

  async createLead(input: LeadCreateInput): Promise<Lead> {
    try {
      // Validate input
      validateLeadInput(input);
      
      // Call API
      const response = await this.apiClient.post<Lead>('/api/v1/leads', input);
      
      // Return result
      return response.data;
      
    } catch (error) {
      if (error instanceof LeadProcessingError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new LeadProcessingError(
        'Failed to create lead',
        'UNKNOWN_ERROR',
        { originalError: error.message }
      );
    }
  }

  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) {
        params.append('status', filters.status);
      }
      
      if (filters?.minScore) {
        params.append('min_score', filters.minScore.toString());
      }
      
      const response = await this.apiClient.get<Lead[]>(`/api/v1/leads?${params}`);
      
      return response.data;
      
    } catch (error) {
      throw new LeadProcessingError(
        'Failed to fetch leads',
        'FETCH_ERROR',
        { error }
      );
    }
  }
}
```

#### React Best Practices

```typescript
// Component with proper error boundaries and hooks
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lead, LeadCreateInput } from '@/types/lead';
import { LeadService } from '@/services/leadService';
import { useToast } from '@/hooks/useToast';

interface LeadListProps {
  userId?: string;
  onLeadSelect?: (lead: Lead) => void;
}

export const LeadList: React.FC<LeadListProps> = ({
  userId,
  onLeadSelect
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Custom hooks
  const { showToast } = useToast();
  
  // Services
  const leadService = useMemo(() => new LeadService(), []);
  
  // Queries
  const {
    data: leads = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leads', { userId, searchTerm, selectedStatus }],
    queryFn: () => leadService.getLeads({
      userId,
      search: searchTerm,
      status: selectedStatus || undefined
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    }
  });
  
  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: (input: LeadCreateInput) => leadService.createLead(input),
    onSuccess: (lead) => {
      showToast('Lead created successfully', 'success');
      refetch();
    },
    onError: (error) => {
      showToast(error.message, 'error');
    }
  });
  
  // Event handlers
  const handleCreateLead = useCallback(async (input: LeadCreateInput) => {
    await createLeadMutation.mutateAsync(input);
  }, [createLeadMutation]);
  
  const handleLeadClick = useCallback((lead: Lead) => {
    onLeadSelect?.(lead);
  }, [onLeadSelect]);
  
  // Computed values
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);
  
  // Effects
  useEffect(() => {
    // Log analytics
    console.log('LeadList mounted', { userId });
    
    return () => {
      console.log('LeadList unmounted');
    };
  }, [userId]);
  
  // Render
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading leads...</div>;
  }
  
  if (error) {
    return (
      <div className="text-red-500 p-4">
        Failed to load leads: {error.message}
        <Button onClick={() => refetch()} className="ml-2">
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="lead-list">
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
        </select>
      </div>
      
      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => handleLeadClick(lead)}
          />
        ))}
      </div>
      
      {filteredLeads.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          No leads found
        </div>
      )}
    </div>
  );
};
```

## معايير الأمان

### 🔒 Security Best Practices

#### Environment Variables

```bash
# .env.local (NOT committed to git)
# ============================

# Database - Use strong passwords
DATABASE_URL=postgresql://saler_user:VerySecurePassword123!@localhost:5432/saler_dev
REDIS_URL=redis://:RedisPassword456@localhost:6379/0

# JWT Secrets - Use long, random strings
SECRET_KEY=your-256-bit-secret-key-here-generate-with-openssl-rand-base64-32
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Keys
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# .env.example (SAFE to commit)
# =============================
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

#### Input Validation

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
import re

class LeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Lead full name")
    email: EmailStr = Field(..., description="Lead email address")
    phone: Optional[str] = Field(None, regex=r'^\+?[1-9]\d{1,14}$', description="International phone format")
    company: Optional[str] = Field(None, max_length=200)
    source: str = Field(..., max_length=50, description="Lead source (web, referral, etc.)")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            # Remove all non-digit characters except +
            clean_phone = re.sub(r'[^\d+]', '', v)
            if len(clean_phone) < 8:
                raise ValueError('Phone number too short')
        return v
    
    class Config:
        # Enable smart defaults
        schema_extra = {
            "example": {
                "name": "Ahmed Ali",
                "email": "ahmed@example.com",
                "phone": "+1234567890",
                "company": "Tech Corp",
                "source": "website"
            }
        }
```

```typescript
import { z } from 'zod';

// Comprehensive validation schema
export const LeadCreateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
    
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
    .optional()
    .or(z.literal('')),
    
  company: z.string()
    .max(200, 'Company name too long')
    .optional(),
    
  source: z.enum(['website', 'referral', 'social', 'email', 'phone'], {
    errorMap: () => ({ message: 'Invalid lead source' })
  })
}).strict(); // Reject unknown properties

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

// Usage in component
export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<LeadCreateInput>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    try {
      const validated = LeadCreateSchema.parse(formData);
      setErrors({});
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validatedData = validateForm();
    
    if (validatedData) {
      await createLead(validatedData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
    </form>
  );
};
```

#### Authentication & Authorization

```python
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    permissions: List[str] = []

def create_access_token(
    data: dict, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password for storage."""
    return pwd_context.hash(password)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        permissions: List[str] = payload.get("permissions", [])
        
        if user_id is None or email is None:
            raise credentials_exception
            
        token_data = TokenData(
            user_id=user_id, 
            email=email, 
            permissions=permissions
        )
        
    except JWTError:
        raise credentials_exception
        
    # Get user from database
    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
        
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "permissions": permissions,
        "is_active": user.is_active
    }

async def require_permissions(required_permissions: List[str]):
    """Dependency to require specific permissions."""
    async def permission_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_permissions = current_user.get("permissions", [])
        
        for permission in required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
        
        return current_user
    
    return permission_checker

# Usage in routes
@app.post("/leads", response_model=LeadResponse)
async def create_lead(
    lead_data: LeadCreate,
    current_user: Dict[str, Any] = Depends(require_permissions(["leads:create"]))
):
    """Create new lead (requires leads:create permission)."""
    # Implementation
    pass

@app.get("/leads", response_model=List[LeadResponse])
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get leads (authenticated users only)."""
    # Implementation
    pass
```

## معايير الأداء

### ⚡ Performance Best Practices

#### Database Optimization

```sql
-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_leads_email ON leads(email);
CREATE INDEX CONCURRENTLY idx_leads_status_score ON leads(status, score);
CREATE INDEX CONCURRENTLY idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX CONCURRENTLY idx_leads_user_status ON leads(user_id, status);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_leads_active_user ON leads(user_id) 
WHERE is_active = true;

-- Composite index for common queries
CREATE INDEX CONCURRENTLY idx_leads_user_status_score ON leads(user_id, status, score DESC) 
WHERE is_active = true;

-- JSON index for metadata
CREATE INDEX CONCURRENTLY idx_leads_metadata ON leads USING GIN (metadata);

-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

```python
# Database query optimization
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import select, func, and_, or_

async def get_leads_with_pagination(
    user_id: int,
    status: Optional[str] = None,
    min_score: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Lead]:
    """Get leads with optimized pagination."""
    
    # Build query with filters
    query = select(Lead).options(
        selectinload(Lead.user),  # Eager load relationships
        selectinload(Lead.metadata_)
    ).where(
        Lead.user_id == user_id,
        Lead.is_active == True
    )
    
    # Add filters
    if status:
        query = query.where(Lead.status == status)
    
    if min_score:
        query = query.where(Lead.score >= min_score)
    
    # Optimized pagination
    query = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    
    # Use streaming for large results
    result = await session.execute(query)
    return result.scalars().all()

# Bulk operations
async def bulk_update_lead_scores(
    updates: List[Dict[str, Any]]
) -> int:
    """Bulk update lead scores efficiently."""
    
    # Use bulk operations for better performance
    result = await session.execute(
        update(Lead).where(Lead.id == bindparam('lead_id')),
        updates
    )
    
    return result.rowcount

# Caching strategy
from functools import lru_cache
import redis.asyncio as redis

redis_client = redis.from_url(os.getenv("REDIS_URL"))

class LeadCache:
    def __init__(self):
        self.redis = redis_client
        self.default_ttl = 300  # 5 minutes
    
    async def get_lead(self, lead_id: int) -> Optional[Lead]:
        """Get lead from cache or database."""
        cached = await self.redis.get(f"lead:{lead_id}")
        if cached:
            return Lead.parse_raw(cached)
        
        # Fetch from database
        lead = await get_lead_by_id(lead_id)
        if lead:
            # Cache for future use
            await self.redis.setex(
                f"lead:{lead_id}",
                self.default_ttl,
                lead.json()
            )
        
        return lead
    
    async def invalidate_lead(self, lead_id: int) -> None:
        """Invalidate lead cache."""
        await self.redis.delete(f"lead:{lead_id}")
```

#### API Performance

```python
from functools import wraps
from time import time
import asyncio
from typing import Callable, Any
import structlog

logger = structlog.get_logger()

def performance_monitor(func: Callable) -> Callable:
    """Decorator to monitor function performance."""
    @wraps(func)
    async def async_wrapper(*args, **kwargs) -> Any:
        start_time = time()
        try:
            result = await func(*args, **kwargs)
            execution_time = time() - start_time
            
            logger.info(
                "Function executed",
                function=func.__name__,
                execution_time=execution_time,
                success=True
            )
            
            return result
        except Exception as e:
            execution_time = time() - start_time
            logger.error(
                "Function failed",
                function=func.__name__,
                execution_time=execution_time,
                error=str(e),
                success=False
            )
            raise
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs) -> Any:
        start_time = time()
        try:
            result = func(*args, **kwargs)
            execution_time = time() - start_time
            
            logger.info(
                "Function executed",
                function=func.__name__,
                execution_time=execution_time,
                success=True
            )
            
            return result
        except Exception as e:
            execution_time = time() - start_time
            logger.error(
                "Function failed",
                function=func.__name__,
                execution_time=execution_time,
                error=str(e),
                success=False
            )
            raise
    
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper

@performance_monitor
async def calculate_ai_score(lead_data: Dict[str, Any]) -> float:
    """Calculate AI score with performance monitoring."""
    # AI scoring logic
    pass

# Response caching
from fastapi import Response
from starlette.responses import JSONResponse
import json

async def cached_response(
    cache_key: str,
    cache_ttl: int = 300
) -> Callable:
    """Decorator for caching API responses."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Response:
            # Check cache first
            cached_result = await redis_client.get(cache_key)
            if cached_result:
                return JSONResponse(
                    content=json.loads(cached_result),
                    headers={"X-Cache": "HIT"}
                )
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            await redis_client.setex(
                cache_key,
                cache_ttl,
                json.dumps(result, default=str)
            )
            
            # Add cache header
            response = JSONResponse(content=result)
            response.headers["X-Cache"] = "MISS"
            return response
        
        return wrapper
    return decorator

@app.get("/leads")
@cached_response("leads:list", 300)  # Cache for 5 minutes
async def get_leads_cached() -> List[Lead]:
    """Get leads with response caching."""
    # Implementation
    pass
```

#### Frontend Performance

```typescript
// React performance optimization
import React, { useMemo, useCallback, memo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

// Memoized component to prevent unnecessary re-renders
interface LeadCardProps {
  lead: Lead;
  onSelect?: (lead: Lead) => void;
  isSelected?: boolean;
}

export const LeadCard = memo<LeadCardProps>(({ lead, onSelect, isSelected }) => {
  // Use useMemo for expensive calculations
  const displayScore = useMemo(() => {
    return lead.score ? Math.round(lead.score * 100) / 100 : 0;
  }, [lead.score]);
  
  const cardClasses = useMemo(() => {
    return `lead-card ${isSelected ? 'selected' : ''} ${lead.score > 80 ? 'high-score' : ''}`;
  }, [isSelected, lead.score]);
  
  // Use useCallback for event handlers
  const handleClick = useCallback(() => {
    onSelect?.(lead);
  }, [lead, onSelect]);
  
  // Memoize expensive JSX
  const scoreDisplay = useMemo(() => (
    <div className="score-badge">
      <span className="score-value">{displayScore}</span>
      <span className="score-label">Score</span>
    </div>
  ), [displayScore]);
  
  return (
    <div className={cardClasses} onClick={handleClick}>
      <h3>{lead.name}</h3>
      <p>{lead.email}</p>
      {scoreDisplay}
    </div>
  );
});

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

interface VirtualizedLeadListProps {
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
}

export const VirtualizedLeadList: React.FC<VirtualizedLeadListProps> = ({
  leads,
  onLeadSelect
}) => {
  // Memoize the row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const lead = leads[index];
    return (
      <div style={style}>
        <LeadCard 
          lead={lead} 
          onSelect={onLeadSelect}
        />
      </div>
    );
  }, [leads, onLeadSelect]);
  
  return (
    <List
      height={600}
      itemCount={leads.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};

// Infinite scrolling with React Query
export const useInfiniteLeads = (filters: LeadFilters) => {
  return useInfiniteQuery({
    queryKey: ['leads', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => fetchLeads({
      ...filters,
      skip: pageParam * PAGE_SIZE,
      limit: PAGE_SIZE
    }),
    getNextPageParam: (lastPage, pages) => {
      // Return next page param or undefined
      return lastPage.hasMore ? pages.length : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};

// Debounced search
import { useMemo, useEffect, useState } from 'react';
import { debounce } from 'lodash';

export const useDebouncedSearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  
  // Create debounced function
  const debouncedSetSearch = useMemo(
    () => debounce((term: string) => {
      setDebouncedSearch(term);
    }, delay),
    [delay]
  );
  
  useEffect(() => {
    debouncedSetSearch(searchTerm);
    
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchTerm, debouncedSetSearch]);
  
  return debouncedSearch;
};
```

## معايير الاختبار

### 🧪 Testing Best Practices

#### Python Testing

```python
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
import asyncio

from app.main import app
from app.services.ai_scoring import AIScoringService
from app.models.lead import LeadCreate, Lead

class TestAIScoringService:
    """Test suite for AI scoring service."""
    
    @pytest.fixture
    def scoring_service(self):
        """Create scoring service instance for testing."""
        return AIScoringService()
    
    @pytest.fixture
    def sample_lead_data(self):
        """Sample lead data for testing."""
        return LeadCreate(
            name="Ahmed Ali",
            email="ahmed@example.com",
            phone="+1234567890",
            company="Tech Corp",
            source="website"
        )
    
    @pytest.mark.asyncio
    async def test_calculate_score_success(self, scoring_service, sample_lead_data):
        """Test successful score calculation."""
        # Arrange
        expected_score = 85.5
        
        with patch.object(scoring_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
            mock_ai.return_value = {"score": expected_score, "confidence": 0.9}
            
            # Act
            result = await scoring_service.calculate_score_async(sample_lead_data.dict())
            
            # Assert
            assert result["score"] == expected_score
            assert result["confidence"] == 0.9
            mock_ai.assert_called_once_with(sample_lead_data.dict())
    
    @pytest.mark.asyncio
    async def test_calculate_score_api_failure(self, scoring_service, sample_lead_data):
        """Test handling of AI API failure."""
        # Arrange
        with patch.object(scoring_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
            mock_ai.side_effect = Exception("API timeout")
            
            # Act & Assert
            with pytest.raises(ModelError, match="AI scoring failed"):
                await scoring_service.calculate_score_async(sample_lead_data.dict())
    
    def test_calculate_score_validation_error(self, scoring_service):
        """Test validation error handling."""
        # Arrange
        invalid_data = {
            "name": "",  # Invalid: empty name
            "email": "invalid-email",  # Invalid email
            "phone": "123"  # Invalid phone
        }
        
        # Act & Assert
        with pytest.raises(ValidationError):
            scoring_service.calculate_score_sync(invalid_data)
    
    @pytest.mark.performance
    async def test_score_calculation_performance(self, scoring_service, sample_lead_data):
        """Test score calculation meets performance requirements."""
        # Arrange
        start_time = asyncio.get_event_loop().time()
        
        # Act
        await scoring_service.calculate_score_async(sample_lead_data.dict())
        
        # Assert
        execution_time = asyncio.get_event_loop().time() - start_time
        assert execution_time < 2.0, f"Scoring took {execution_time}s, should be < 2s"

class TestLeadAPI:
    """Test suite for Lead API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self):
        """Create authentication headers."""
        # This would be replaced with actual JWT token
        return {"Authorization": "Bearer test-token"}
    
    def test_create_lead_success(self, client, auth_headers):
        """Test successful lead creation."""
        # Arrange
        lead_data = {
            "name": "Ahmed Ali",
            "email": "ahmed@example.com",
            "phone": "+1234567890",
            "source": "website"
        }
        
        # Act
        response = client.post(
            "/api/v1/leads",
            json=lead_data,
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == lead_data["name"]
        assert data["email"] == lead_data["email"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_lead_validation_error(self, client, auth_headers):
        """Test validation error response."""
        # Arrange
        invalid_data = {
            "name": "",  # Invalid: empty name
            "email": "invalid-email"
        }
        
        # Act
        response = client.post(
            "/api/v1/leads",
            json=invalid_data,
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any("name" in error["loc"] for error in errors)
        assert any("email" in error["loc"] for error in errors)
    
    def test_get_leads_pagination(self, client, auth_headers):
        """Test leads pagination."""
        # Act
        response = client.get(
            "/api/v1/leads?skip=0&limit=10",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10
    
    @pytest.mark.integration
    def test_full_lead_flow(self, client, auth_headers, sample_lead_data):
        """Test complete lead creation and retrieval flow."""
        # Create lead
        create_response = client.post(
            "/api/v1/leads",
            json=sample_lead_data.dict(),
            headers=auth_headers
        )
        assert create_response.status_code == 201
        created_lead = create_response.json()
        
        # Get lead
        get_response = client.get(
            f"/api/v1/leads/{created_lead['id']}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        retrieved_lead = get_response.json()
        
        assert retrieved_lead["id"] == created_lead["id"]
        assert retrieved_lead["name"] == created_lead["name"]
```

#### JavaScript/TypeScript Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadService } from '@/services/leadService';
import { LeadList } from '@/components/LeadList';
import { mockLeads } from '../mocks/leadMocks';

// Mock services
jest.mock('@/services/leadService');

const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

describe('LeadList Component', () => {
  let queryClient: QueryClient;
  let mockLeadService: jest.Mocked<LeadService>;
  
  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockLeadService = new LeadService() as jest.Mocked<LeadService>;
    (LeadService as jest.Mock).mockImplementation(() => mockLeadService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };
  
  it('renders leads correctly', async () => {
    // Arrange
    mockLeadService.getLeads.mockResolvedValue(mockLeads);
    
    // Act
    renderWithQueryClient(<LeadList />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
      expect(screen.getByText('ahmed@example.com')).toBeInTheDocument();
    });
    
    expect(mockLeadService.getLeads).toHaveBeenCalledTimes(1);
  });
  
  it('handles loading state', () => {
    // Arrange
    mockLeadService.getLeads.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to simulate loading
    );
    
    // Act
    renderWithQueryClient(<LeadList />);
    
    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('handles error state', async () => {
    // Arrange
    mockLeadService.getLeads.mockRejectedValue(new Error('API Error'));
    
    // Act
    renderWithQueryClient(<LeadList />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/failed to load leads/i)).toBeInTheDocument();
    });
  });
  
  it('filters leads by search term', async () => {
    // Arrange
    mockLeadService.getLeads.mockResolvedValue(mockLeads);
    renderWithQueryClient(<LeadList />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
    });
    
    // Act
    const searchInput = screen.getByPlaceholderText(/search leads/i);
    fireEvent.change(searchInput, { target: { value: 'Ahmed' } });
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
      // Should not show other leads that don't match "Ahmed"
      expect(screen.queryByText('Sara Mohamed')).not.toBeInTheDocument();
    });
  });
  
  it('calls onLeadSelect when lead is clicked', async () => {
    // Arrange
    const onLeadSelect = jest.fn();
    mockLeadService.getLeads.mockResolvedValue(mockLeads);
    
    renderWithQueryClient(<LeadList onLeadSelect={onLeadSelect} />);
    
    // Wait for leads to load
    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
    });
    
    // Act
    const leadCard = screen.getByText('Ahmed Ali').closest('[data-testid="lead-card"]');
    fireEvent.click(leadCard!);
    
    // Assert
    await waitFor(() => {
      expect(onLeadSelect).toHaveBeenCalledWith(mockLeads[0]);
    });
  });
  
  it('retry loading on error', async () => {
    // Arrange
    mockLeadService.getLeads
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockLeads);
    
    renderWithQueryClient(<LeadList />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to load leads/i)).toBeInTheDocument();
    });
    
    // Act
    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
    });
  });
});

// Integration tests
describe('Lead Integration Tests', () => {
  let queryClient: QueryClient;
  let originalFetch: typeof fetch;
  
  beforeEach(() => {
    queryClient = createTestQueryClient();
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });
  
  it('creates and retrieves lead through API', async () => {
    // Arrange
    const mockLead = mockLeads[0];
    const mockCreatedLead = { ...mockLead, id: 'new-id' };
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreatedLead
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockCreatedLead]
      });
    
    // Act
    const leadService = new LeadService();
    const createdLead = await leadService.createLead({
      name: 'Ahmed Ali',
      email: 'ahmed@example.com'
    });
    
    const leads = await leadService.getLeads();
    
    // Assert
    expect(createdLead.id).toBe('new-id');
    expect(leads).toHaveLength(1);
    expect(leads[0].id).toBe('new-id');
  });
});

// Performance tests
describe('LeadList Performance', () => {
  it('handles large number of leads efficiently', async () => {
    // Arrange
    const largeLeadSet = Array.from({ length: 1000 }, (_, i) => ({
      ...mockLeads[0],
      id: `lead-${i}`,
      name: `Lead ${i}`
    }));
    
    mockLeadService.getLeads.mockResolvedValue(largeLeadSet);
    
    // Measure render time
    const startTime = performance.now();
    
    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <LeadList />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Lead 0')).toBeInTheDocument();
    });
    
    // Assert
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
  });
});
```

## معايير التوثيق

### 📚 Documentation Best Practices

#### Code Documentation

```python
"""
Lead Processing Module
======================

This module provides functionality for processing and scoring leads using AI.
It includes data validation, database operations, and integration with external
AI services.

Modules:
    models: Database models for leads
    services: Business logic and AI integration
    utils: Helper functions and utilities

Example:
    Basic usage::
        
        from app.services.lead_processing import LeadProcessingService
        
        service = LeadProcessingService()
        result = await service.process_lead(lead_data)
        print(f"Lead score: {result.score}")
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from app.core.database import get_db_session
from app.core.config import settings
from app.models.lead import Lead, LeadCreate
from app.services.ai_scoring import AIScoringService
from app.utils.logger import get_logger

logger = structlog.get_logger(__name__)

class LeadStatus(Enum):
    """Enumeration of possible lead statuses."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"

class LeadProcessingService:
    """Service for processing and managing leads.
    
    This service handles the complete lifecycle of lead processing including:
    - Data validation and sanitization
    - AI-powered scoring
    - Database persistence
    - Status tracking
    - Notification sending
    
    Attributes:
        ai_service: AI scoring service instance
        db_session: Database session dependency
        
    Example:
        Create and process a lead::
            
            service = LeadProcessingService()
            lead_data = LeadCreate(
                name="Ahmed Ali",
                email="ahmed@example.com",
                phone="+1234567890"
            )
            result = await service.create_and_score_lead(lead_data)
    """
    
    def __init__(
        self,
        ai_service: AIScoringService = Depends(),
        db_session: Session = Depends(get_db_session)
    ):
        """Initialize the lead processing service.
        
        Args:
            ai_service: AI scoring service for lead scoring
            db_session: Database session for persistence
        """
        self.ai_service = ai_service
        self.db = db_session
        self.logger = logger.bind(service="lead_processing")
    
    async def create_and_score_lead(
        self,
        lead_data: LeadCreate,
        user_id: Optional[int] = None,
        async_scoring: bool = True
    ) -> Lead:
        """Create a new lead and calculate AI score.
        
        This method creates a new lead in the database and immediately
        calculates an AI-powered score for lead qualification.
        
        Args:
            lead_data: Lead information to create
            user_id: ID of user who created the lead (optional)
            async_scoring: Whether to use async scoring (recommended for better UX)
            
        Returns:
            Lead: Created lead with calculated score
            
        Raises:
            ValidationError: If lead data is invalid
            DatabaseError: If database operation fails
            AIScoringError: If AI scoring fails
            
        Example:
            Basic lead creation and scoring::
                
                lead_data = LeadCreate(
                    name="Sara Mohamed",
                    email="sara@example.com",
                    company="Tech Corp"
                )
                lead = await service.create_and_score_lead(lead_data)
                print(f"Lead {lead.name} scored {lead.score}/100")
            
            Async scoring for better performance::
                
                lead = await service.create_and_score_lead(
                    lead_data, 
                    async_scoring=True
                )
                # Score will be updated later via background task
        """
        self.logger.info(
            "Creating new lead",
            name=lead_data.name,
            email=lead_data.email,
            user_id=user_id
        )
        
        try:
            # Create lead in database
            lead = Lead(
                **lead_data.dict(),
                user_id=user_id,
                status=LeadStatus.NEW.value,
                created_at=datetime.utcnow()
            )
            
            self.db.add(lead)
            self.db.flush()  # Get ID without committing
            
            # Calculate AI score
            if async_scoring:
                # Schedule async scoring
                await self._schedule_async_scoring(lead.id)
            else:
                # Synchronous scoring
                score_data = await self.ai_service.calculate_score_async(
                    lead_data.dict()
                )
                lead.score = score_data["score"]
                lead.metadata_["scoring_details"] = score_data
            
            # Commit transaction
            self.db.commit()
            self.db.refresh(lead)
            
            self.logger.info(
                "Lead created successfully",
                lead_id=lead.id,
                score=lead.score
            )
            
            return lead
            
        except Exception as e:
            self.db.rollback()
            self.logger.error(
                "Failed to create lead",
                error=str(e),
                lead_data=lead_data.dict()
            )
            raise
    
    async def _schedule_async_scoring(self, lead_id: int) -> None:
        """Schedule asynchronous scoring for a lead.
        
        Args:
            lead_id: ID of lead to score
        """
        # This would typically send to a task queue like Celery
        # For now, we'll use a simple background task
        await self._background_score_lead(lead_id)
    
    async def _background_score_lead(self, lead_id: int) -> None:
        """Background task to score a lead.
        
        Args:
            lead_id: ID of lead to score
        """
        try:
            lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
            if not lead:
                self.logger.error(f"Lead {lead_id} not found for scoring")
                return
            
            score_data = await self.ai_service.calculate_score_async({
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "company": lead.company
            })
            
            # Update lead with score
            lead.score = score_data["score"]
            lead.metadata_["scoring_details"] = score_data
            lead.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            self.logger.info(
                "Lead scored successfully",
                lead_id=lead_id,
                score=lead.score
            )
            
        except Exception as e:
            self.logger.error(
                "Background scoring failed",
                lead_id=lead_id,
                error=str(e)
            )
```

#### API Documentation

```python
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

app = FastAPI(
    title="Saler Lead Management API",
    description="""
    ## Overview
    
    The Saler Lead Management API provides comprehensive functionality for managing
    leads in a sales pipeline. It supports CRUD operations, AI-powered scoring,
    and real-time updates.
    
    ## Features
    
    * **Lead Management**: Create, read, update, and delete leads
    * **AI Scoring**: Automatic lead scoring using machine learning models
    * **Pipeline Tracking**: Track lead progression through sales stages
    * **Analytics**: Real-time analytics and reporting
    * **Webhooks**: Integration with external systems via webhooks
    
    ## Authentication
    
    All endpoints require authentication using Bearer tokens:
    
    ```http
    Authorization: Bearer <your-jwt-token>
    ```
    
    ## Rate Limiting
    
    API endpoints are rate-limited:
    - **General endpoints**: 1000 requests per hour
    - **Scoring endpoints**: 100 requests per hour
    - **Bulk operations**: 10 requests per hour
    
    ## Error Handling
    
    The API uses standard HTTP status codes and returns detailed error information:
    
    ```json
    {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Invalid input data",
            "details": [
                {
                    "field": "email",
                    "message": "Invalid email format"
                }
            ]
        }
    }
    ```
    """,
    version="1.0.0",
    contact={
        "name": "Saler API Support",
        "email": "api-support@saler.com",
        "url": "https://docs.saler.com/support"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    }
)

class LeadStatus(str, Enum):
    """Lead status enumeration."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"

class LeadResponse(BaseModel):
    """Lead response model."""
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    status: LeadStatus
    score: Optional[float] = Field(None, ge=0, le=100, description="AI-generated score")
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class LeadCreateRequest(BaseModel):
    """Lead creation request model."""
    name: str = Field(..., min_length=2, max_length=100, description="Lead full name")
    email: EmailStr = Field(..., description="Lead email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    company: Optional[str] = Field(None, max_length=200, description="Company name")
    source: str = Field(..., description="Lead source (web, referral, etc.)")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Ahmed Ali",
                "email": "ahmed@example.com",
                "phone": "+1234567890",
                "company": "Tech Solutions Ltd",
                "source": "website",
                "notes": "Interested in enterprise solutions"
            }
        }

class LeadUpdateRequest(BaseModel):
    """Lead update request model."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=200)
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None

class ScoringResponse(BaseModel):
    """AI scoring response model."""
    score: float = Field(..., ge=0, le=100, description="Lead score (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Score confidence")
    factors: List[Dict[str, Any]] = Field(..., description="Scoring factors")
    model_version: str = Field(..., description="AI model version")

@app.post(
    "/api/v1/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
    description="""
    Create a new lead in the system with optional AI-powered scoring.
    
    The endpoint will:
    1. Validate the input data
    2. Create the lead in the database
    3. Calculate AI-powered score (if enabled)
    4. Send webhooks to external systems (if configured)
    
    ## Performance
    
    - **Synchronous scoring**: ~2-3 seconds response time
    - **Asynchronous scoring**: ~500ms response time (score updated later)
    
    ## Webhooks
    
    If webhooks are configured, a POST request will be sent to configured URLs:
    
    ```json
    {
        "event": "lead.created",
        "data": {
            "lead": {...},
            "score": 85.5,
            "timestamp": "2023-12-01T10:00:00Z"
        }
    }
    ```
    """
)
async def create_lead(
    lead_data: LeadCreateRequest,
    async_scoring: bool = Query(True, description="Use async scoring for better performance"),
    include_analytics: bool = Query(False, description="Include analytics data in response"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> LeadResponse:
    """Create a new lead.
    
    Creates a new lead in the database with optional AI-powered scoring.
    The lead will be associated with the authenticated user.
    
    Args:
        lead_data: Lead information to create
        async_scoring: Use asynchronous scoring (recommended)
        include_analytics: Include analytics data in response
        current_user: Authenticated user information
        
    Returns:
        LeadResponse: Created lead with calculated score
        
    Raises:
        HTTPException: If validation fails or lead creation fails
        
    Example:
        Create a new lead::
            
            POST /api/v1/leads
            {
                "name": "Sara Mohamed",
                "email": "sara@example.com",
                "company": "Innovation Corp",
                "source": "referral"
            }
    """
    try:
        # Implementation here
        pass
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lead: {str(e)}"
        )

@app.get(
    "/api/v1/leads",
    response_model=List[LeadResponse],
    summary="Get leads list",
    description="""
    Retrieve a paginated list of leads with optional filtering.
    
    ## Pagination
    
    Results are paginated with a default limit of 50 leads per page.
    Maximum limit is 100 leads per page.
    
    ## Filtering
    
    Leads can be filtered by:
    - **status**: Filter by lead status
    - **score_range**: Filter by score range (e.g., "80,100")
    - **date_range**: Filter by creation date (e.g., "2023-12-01,2023-12-31")
    - **company**: Filter by company name
    - **source**: Filter by lead source
    
    ## Sorting
    
    Results can be sorted by:
    - **created_at**: Creation date (default: desc)
    - **updated_at**: Last update date
    - **score**: AI score
    - **name**: Lead name
    
    Example:
        Get high-score leads from this month::
            
            GET /api/v1/leads?status=qualified&score_range=80,100&date_range=2023-12-01,2023-12-31
    """
)
async def get_leads(
    skip: int = Query(0, ge=0, description="Number of leads to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of leads to return"),
    status: Optional[LeadStatus] = Query(None, description="Filter by status"),
    score_min: Optional[float] = Query(None, ge=0, le=100, description="Minimum score"),
    score_max: Optional[float] = Query(None, ge=0, le=100, description="Maximum score"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search in name/email"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[LeadResponse]:
    """Get leads with filtering and pagination.
    
    Retrieves a paginated list of leads with optional filtering and sorting.
    
    Args:
        skip: Number of leads to skip (pagination)
        limit: Number of leads to return (max 100)
        status: Filter by lead status
        score_min: Minimum score filter
        score_max: Maximum score filter
        date_from: Filter leads created after this date
        date_to: Filter leads created before this date
        search: Search term for name/email fields
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)
        current_user: Authenticated user information
        
    Returns:
        List[LeadResponse]: Paginated list of leads
        
    Raises:
        HTTPException: If query parameters are invalid
        
    Example:
        Get recent qualified leads::
            
            GET /api/v1/leads?status=qualified&sort_by=created_at&limit=20
    """
    # Implementation here
    pass

@app.get(
    "/api/v1/leads/{lead_id}",
    response_model=LeadResponse,
    summary="Get lead by ID",
    description="""
    Retrieve a specific lead by its unique identifier.
    
    ## Response Details
    
    The response includes:
    - **Lead information**: All lead data
    - **AI scoring**: Current score and details
    - **Activity history**: Recent lead activities
    - **User information**: Lead owner details
    
    ## Caching
    
    Lead responses are cached for 5 minutes to improve performance.
    Use cache headers to understand caching behavior.
    
    Example:
        Get specific lead details::
            
            GET /api/v1/leads/12345
    """
)
async def get_lead(
    lead_id: int = Path(..., ge=1, description="Lead unique identifier"),
    include_history: bool = Query(True, description="Include activity history"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> LeadResponse:
    """Get a specific lead by ID.
    
    Retrieves detailed information about a specific lead including
    AI scoring results and activity history.
    
    Args:
        lead_id: Lead unique identifier
        include_history: Include activity history in response
        current_user: Authenticated user information
        
    Returns:
        LeadResponse: Lead details
        
    Raises:
        HTTPException: If lead is not found or access is denied
        
    Example:
        Get lead details with history::
            
            GET /api/v1/leads/12345?include_history=true
    """
    # Implementation here
    pass

@app.post(
    "/api/v1/leads/{lead_id}/score",
    response_model=ScoringResponse,
    summary="Recalculate lead score",
    description="""
    Manually trigger AI scoring for a specific lead.
    
    This endpoint allows manual recalculation of the AI score for a lead.
    Useful when lead information has been updated or scoring model has improved.
    
    ## Rate Limiting
    
    Scoring operations are limited to 100 requests per hour per user.
    
    ## Async Processing
    
    For better performance, the scoring can be performed asynchronously:
    - **Synchronous**: Response includes score immediately (~2-3 seconds)
    - **Asynchronous**: Score calculated in background, webhook sent when complete
    
    ## Model Information
    
    Response includes model version and scoring factors for transparency.
    
    Example:
        Recalculate lead score::
            
            POST /api/v1/leads/12345/score
            {
                "force": true,
                "async": false
            }
    """
)
async def recalculate_lead_score(
    lead_id: int,
    force: bool = Query(False, description="Force recalculation even if recent"),
    async_mode: bool = Query(False, description="Use asynchronous processing"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ScoringResponse:
    """Recalculate AI score for a lead.
    
    Manually triggers AI scoring for a specific lead. Useful when
    lead data has been updated or to test new scoring models.
    
    Args:
        lead_id: Lead unique identifier
        force: Force recalculation even if recent score exists
        async_mode: Use asynchronous processing
        current_user: Authenticated user information
        
    Returns:
        ScoringResponse: New AI score and details
        
    Raises:
        HTTPException: If lead not found or scoring fails
        
    Example:
        Force score recalculation::
            
            POST /api/v1/leads/12345/score?force=true
    """
    # Implementation here
    pass
```

## خلاصة

هذا الدليل يغطي أفضل الممارسات الأساسية لتطوير Saler. المفتاح هو:

1. **اتباع معايير ثابتة** للكود والتوثيق
2. **الأمان أولاً** في كل قرار تطويري
3. **الأداء المستمر** والتطوير للـ scale
4. **اختبار شامل** في جميع المستويات
5. **توثيق واضح** وصيانة أفضل

للحصول على أفضل النتائج، ارجع إلى هذا الدليل بانتظام وطبق هذه الممارسات في كل مشروع.