# تدفق البيانات - مشروع Saler

## نظرة عامة

تدفق البيانات في مشروع Saler مصمم ليكون فعالاً وآمناً ومنظماً. يشمل التدفق معالجة البيانات من لحظة إدخالها حتى عرضها للمستخدم، مع ضمان سلامة البيانات والأداء المحسن.

## مخطط تدفق البيانات العام

```mermaid
graph TB
    subgraph "Client Layer"
        User[User/Client]
        Admin[Admin Dashboard]
        Mobile[Mobile App]
    end
    
    subgraph "API Gateway"
        Gateway[API Gateway]
        Auth[Authentication]
        RateLimit[Rate Limiting]
    end
    
    subgraph "Service Layer"
        UserService[User Service]
        StoreService[Store Service]
        ProductService[Product Service]
        OrderService[Order Service]
        PaymentService[Payment Service]
    end
    
    subgraph "Cache Layer"
        Redis1[Redis Cache]
        Redis2[Redis Cache]
        Redis3[Redis Cache]
    end
    
    subgraph "Database Layer"
        PG1[(PostgreSQL)]
        PG2[(PostgreSQL)]
        PG3[(PostgreSQL)]
    end
    
    subgraph "Message Queue"
        RabbitMQ[RabbitMQ]
        Kafka[Kafka]
    end
    
    subgraph "External APIs"
        Shopify[Shopify API]
        PaymentGateway[Payment Gateway]
        Email[Email Service]
    end
    
    %% Data Flow
    User --> Gateway
    Gateway --> Auth
    Gateway --> RateLimit
    Auth --> UserService
    
    UserService --> Redis1
    UserService --> PG1
    
    UserService --> RabbitMQ
    RabbitMQ --> Email
    
    ProductService --> Redis2
    ProductService --> PG2
    
    OrderService --> Redis3
    OrderService --> PG3
    OrderService --> PaymentService
    
    PaymentService --> PaymentGateway
    PaymentService --> RabbitMQ
    
    OrderService --> Kafka
    Kafka --> AnalyticsService
```

## تدفق البيانات للمعاملات

### 1. تدفق تسجيل المستخدم

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant U as User Service
    participant R as Redis Cache
    participant DB as PostgreSQL
    participant E as Email Service
    participant MQ as Message Queue

    C->>G: POST /auth/register
    G->>U: Forward request
    U->>U: Validate data
    U->>DB: Check email exists
    DB-->>U: Email exists?
    
    alt Email doesn't exist
        U->>U: Hash password
        U->>DB: Create user
        DB-->>U: User created
        U->>E: Send verification email
        E-->>U: Email sent
        U->>R: Cache user data
        U->>MQ: Publish user.created event
        MQ-->>Analytics: Analytics event
        U-->>G: User created response
        G-->>C: Success response
    else Email exists
        U-->>G: Error: Email exists
        G-->>C: Error response
    end
```

### 2. تدفق إنشاء المنتج

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant P as Product Service
    participant R as Redis Cache
    participant DB as PostgreSQL
    participant ES as Elasticsearch
    participant I as Inventory Service
    participant MQ as Message Queue

    C->>G: POST /products
    G->>P: Forward request
    P->>P: Validate product data
    P->>DB: Check SKU uniqueness
    DB-->>P: SKU available?
    
    alt SKU available
        P->>DB: Create product (transaction)
        DB-->>P: Product created
        P->>I: Create inventory records
        I-->>P: Inventory created
        P->>ES: Index product for search
        ES-->>P: Indexed successfully
        P->>R: Clear products cache
        P->>MQ: Publish product.created event
        MQ-->>Store: Store notification
        P-->>G: Product response
        G-->>C: Success response
    else SKU exists
        P-->>G: Error: SKU exists
        G-->>C: Error response
    end
```

### 3. تدفق معالجة الطلب

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant O as Order Service
    participant I as Inventory Service
    participant P as Payment Service
    participant N as Notification Service
    participant DB as PostgreSQL
    participant MQ as Message Queue

    C->>G: POST /orders
    G->>O: Forward request
    O->>O: Validate order data
    O->>I: Check inventory availability
    I-->>O: Inventory available?
    
    alt Inventory available
        O->>DB: Create order (transaction)
        DB-->>O: Order created
        O->>I: Reserve inventory
        I-->>O: Inventory reserved
        O->>P: Process payment
        P-->>O: Payment processed
        O->>N: Send confirmation email
        N-->>O: Email sent
        O->>MQ: Publish order.created event
        MQ-->>Analytics: Analytics event
        O->>DB: Update order totals
        DB-->>O: Order updated
        O-->>G: Order response
        G-->>C: Success response
    else Inventory insufficient
        O-->>G: Error: Insufficient inventory
        G-->>C: Error response
    end
```

## تدفق البيانات للقراءة

### 1. تدفق جلب المنتجات

```mermaid
flowchart TD
    A[Client Request] --> B[API Gateway]
    B --> C[Product Service]
    
    C --> D{Check Cache}
    D -->|Cache Hit| E[Return Cached Data]
    D -->|Cache Miss| F[Query Database]
    
    F --> G[Apply Filters]
    G --> H[Format Response]
    H --> I[Cache Result]
    I --> J[Return Response]
    
    E --> J
    J --> K[Client]
    
    style A fill:#e1f5fe
    style K fill:#c8e6c9
```

### 2. تدفق البحث المتقدم

```mermaid
flowchart TD
    A[Search Query] --> B[API Gateway]
    B --> C[Search Service]
    
    C --> D{Parse Query}
    D --> E[Elasticsearch Query]
    
    E --> F[Search Index]
    F --> G[Filter Results]
    G --> H[Rank by Relevance]
    H --> I[Apply Business Rules]
    I --> J[Format Results]
    
    J --> K{Cache Result?}
    K -->|Yes| L[Store in Cache]
    K -->|No| M[Skip Cache]
    
    L --> N[Return Results]
    M --> N
    N --> O[Client]
    
    style A fill:#e1f5fe
    style O fill:#c8e6c9
```

## تدفق البيانات للتحديث

### 1. تدفق تحديث المخزون

```mermaid
sequenceDiagram
    participant A as Admin
    participant G as API Gateway
    participant I as Inventory Service
    participant DB as PostgreSQL
    participant R as Redis Cache
    participant N as Notification Service
    participant MQ as Message Queue

    A->>G: PUT /inventory/update
    G->>I: Forward request
    I->>DB: Get current inventory
    DB-->>I: Current quantity
    
    I->>DB: Update inventory (transaction)
    DB-->>I: Inventory updated
    
    I->>R: Clear related caches
    I->>N: Check low stock alert
    N-->>I: Alert needed?
    
    alt Low stock alert
        I->>A: Send low stock notification
        I->>MQ: Publish inventory.low_stock event
        MQ-->>Store: Store notification
    end
    
    I->>MQ: Publish inventory.updated event
    MQ-->>Analytics: Analytics event
    
    I-->>G: Update response
    G-->>A: Success response
```

## تدفق البيانات للتحليلات

### 1. تدفق جمع الأحداث

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Analytics Service
    participant DB as PostgreSQL
    participant K as Kafka
    participant ES as Elasticsearch
    participant R as Redis Cache

    C->>A: Track event
    A->>A: Validate event data
    A->>DB: Store event
    DB-->>A: Event stored
    
    A->>R: Update realtime metrics
    A->>K: Publish to Kafka
    K-->>Analytics: Batch processing
    
    A->>ES: Index for real-time search
    ES-->>A: Indexed
    
    A-->>C: Event tracked
```

### 2. تدفق إنشاء التقارير

```mermaid
flowchart TD
    A[Report Request] --> B[API Gateway]
    B --> C[Analytics Service]
    
    C --> D{Check Cache}
    D -->|Cache Hit| E[Return Cached Report]
    D -->|Cache Miss| F[Aggregate Data]
    
    F --> G[Query Database]
    G --> H[Calculate Metrics]
    H --> I[Apply Filters]
    I --> J[Format Report]
    
    J --> K[Cache Report]
    K --> L[Return Report]
    
    E --> L
    L --> M[Client]
    
    style A fill:#e1f5fe
    style M fill:#c8e6c9
```

## تدفق البيانات للمدفوعات

### 1. تدفق معالجة الدفع

```mermaid
sequenceDiagram
    participant C as Client
    participant O as Order Service
    participant P as Payment Service
    participant G as Payment Gateway
    participant DB as PostgreSQL
    participant N as Notification Service
    participant MQ as Message Queue

    C->>O: POST /payment/process
    O->>P: Forward payment request
    P->>G: Process payment
    G-->>P: Payment result
    
    alt Payment successful
        P->>DB: Update payment status
        DB-->>P: Payment updated
        P->>O: Update order status
        O-->>P: Order updated
        P->>N: Send confirmation
        N-->>P: Email/SMS sent
        P->>MQ: Publish payment.completed
        MQ-->>Analytics: Analytics event
        P-->>O: Payment success
        O-->>C: Success response
    else Payment failed
        P->>DB: Record failed payment
        P->>MQ: Publish payment.failed
        P-->>O: Payment failed
        O-->>C: Error response
    end
```

## تدفق البيانات للملفات

### 1. تدفق رفع الملفات

```mermaid
sequenceDiagram
    participant C as Client
    participant F as File Service
    participant S as Storage Service
    participant DB as PostgreSQL
    participant IP as Image Processor
    participant R as Redis Cache

    C->>F: POST /files/upload
    F->>F: Validate file
    F->>S: Upload to storage
    S-->>F: File uploaded
    
    alt Image file
        F->>IP: Generate thumbnails
        IP-->>F: Thumbnails created
        F->>S: Upload thumbnails
        S-->>F: Thumbnails uploaded
    end
    
    F->>DB: Store file metadata
    DB-->>F: Metadata stored
    F->>R: Clear related caches
    
    F-->>C: File uploaded successfully
```

## تدفق البيانات للأمان

### 1. تدفق المصادقة

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant R as Redis Cache
    participant DB as PostgreSQL
    participant JWT as JWT Handler

    C->>G: POST /auth/login
    G->>A: Forward request
    A->>DB: Verify credentials
    DB-->>A: User found
    
    A->>A: Validate password
    A->>JWT: Generate tokens
    JWT-->>A: Access + Refresh tokens
    
    A->>R: Store session
    R-->>A: Session stored
    A-->>G: Auth response
    G-->>C: Tokens returned
```

### 2. تدفق تخويل الطلبات

```mermaid
flowchart TD
    A[API Request] --> B[Extract Token]
    B --> C[Validate JWT]
    C --> D{Valid Token?}
    D -->|Yes| E[Extract User Info]
    D -->|No| F[Reject Request]
    
    E --> G[Check Permissions]
    G --> H{Has Permission?}
    H -->|Yes| I[Process Request]
    H -->|No| F
    
    I --> J[Service Processing]
    J --> K[Response]
    K --> L[Client]
    
    F --> M[401/403 Error]
    M --> L
    
    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style F fill:#ffcdd2
    style M fill:#ffcdd2
```

## تدفق البيانات للإشعارات

### 1. تدفق إشعارات الطلبات

```mermaid
sequenceDiagram
    participant O as Order Service
    participant N as Notification Service
    participant E as Email Service
    participant S as SMS Service
    participant R as Redis Cache
    participant P as Push Service

    O->>N: Order status changed
    N->>N: Determine notification type
    
    alt Email notification
        N->>E: Send email
        E-->>N: Email sent
    end
    
    alt SMS notification
        N->>S: Send SMS
        S-->>N: SMS sent
    end
    
    alt Push notification
        N->>P: Send push notification
        P-->>N: Push sent
    end
    
    N->>R: Update notification cache
    R-->>N: Cache updated
    
    N-->>O: Notifications sent
```

## تدفق البيانات للويب هوكس

### 1. تدفق معالجة الويب هوك

```mermaid
sequenceDiagram
    participant W as Webhook Service
    participant DB as PostgreSQL
    participant Q as Queue
    participant H as HTTP Client

    W->>DB: Get active webhooks
    DB-->>W: Webhook list
    
    loop For each webhook
        W->>H: Prepare HTTP request
        H->>External: Send webhook
        External-->>H: Response
        H-->>W: Delivery result
        
        W->>Q: Store delivery record
        Q-->>DB: Save to database
    end
    
    W->>DB: Update webhook status
    DB-->>W: Status updated
```

## تحسينات تدفق البيانات

### 1. استراتيجيات التخزين المؤقت

```javascript
// Cache Strategy Implementation
class CacheStrategy {
  // Write-through cache
  async writeThrough(key, data, service) {
    // Write to cache first
    await this.cache.set(key, data, 300);
    
    // Write to database
    await service.save(data);
  }

  // Read-through cache
  async readThrough(key, service) {
    // Try cache first
    let data = await this.cache.get(key);
    
    if (!data) {
      // Miss - get from service
      data = await service.find(key);
      
      // Cache the result
      if (data) {
        await this.cache.set(key, data, 300);
      }
    }
    
    return data;
  }

  // Write-behind cache
  async writeBehind(key, data) {
    // Write to cache immediately
    await this.cache.set(key, data, 300);
    
    // Queue for database write
    await this.queue.add('database-write', {
      key,
      data,
      operation: 'write'
    });
  }
}
```

### 2. معالجة البيانات المجمعة

```javascript
// Data Aggregation Pipeline
class DataAggregator {
  constructor() {
    this.aggregators = new Map();
  }

  async aggregate(dataType, data) {
    const aggregator = this.aggregators.get(dataType);
    if (!aggregator) {
      throw new Error(`No aggregator found for ${dataType}`);
    }

    return await aggregator.process(data);
  }

  registerAggregator(dataType, aggregator) {
    this.aggregators.set(dataType, aggregator);
  }
}

// Real-time aggregator
class RealtimeAggregator {
  constructor() {
    this.counters = new Map();
  }

  async process(event) {
    const key = `${event.userId}:${event.eventType}`;
    
    if (!this.counters.has(key)) {
      this.counters.set(key, 0);
    }
    
    this.counters.set(key, this.counters.get(key) + 1);
    
    // Update in database every 100 events
    if (this.counters.get(key) % 100 === 0) {
      await this.flushToDatabase(key, this.counters.get(key));
    }
  }

  async flushToDatabase(key, value) {
    await this.database.increment(key, value);
    this.counters.set(key, 0);
  }
}
```

هذا التصميم يضمن تدفق البيانات بكفاءة عالية مع ضمان سلامة البيانات والأمان والأداء المحسن.

---

**آخر تحديث**: 2 نوفمبر 2025