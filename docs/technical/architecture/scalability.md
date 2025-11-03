# قابلية التوسع - مشروع Saler

## نظرة عامة

قابلية التوسع في مشروع Saler مصممة لدعم النمو السريع وزيادة الحمل بشكل أفقي ورأسي. نستخدم معمارية الخدمات المصغرة (Microservices) مع تقنيات التوزيع والحمل المتوازن لضمان الأداء المثلى حتى مع millions من المستخدمين.

### أهداف قابلية التوسع

- **التوسع الأفقي (Horizontal Scaling)**: إضافة خوادم إضافية
- **التوسع الرأسي (Vertical Scaling)**: زيادة موارد الخوادم الموجودة
- **التوزيع الجغرافي (Geographic Distribution)**: خوادم متعددة المناطق
- **التحمل (Fault Tolerance)**: استمرارية الخدمة رغم الأعطال
- **الكفاءة (Efficiency)**: استخدام أمثل للموارد

## استراتيجيات التوسع

### 1. التوسع الأفقي للتطبيق

#### Load Balancer Configuration
```yaml
# Kubernetes Ingress with Load Balancing
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: saler-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/load-balance: "round_robin"
    nginx.ingress.kubernetes.io/upstream-hash-by: "$remote_addr"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - saler.com
    - api.saler.com
    secretName: saler-tls
  rules:
  - host: api.saler.com
    http:
      paths:
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 3000
      - path: /api/stores
        pathType: Prefix
        backend:
          service:
            name: store-service
            port:
              number: 3000
      - path: /api/products
        pathType: Prefix
        backend:
          service:
            name: product-service
            port:
              number: 3000
      - path: /api/orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 3000
```

#### Auto Scaling Configuration
```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 4
        periodSeconds: 60
      selectPolicy: Max
```

#### Service Deployment
```yaml
# Product Service Deployment with Scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  labels:
    app: product-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: saler/product-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
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
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
      securityContext:
        fsGroup: 1001
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
```

### 2. التوسع لقاعدة البيانات

#### PostgreSQL Clustering
```yaml
# PostgreSQL HA Cluster
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: saler-db-cluster
spec:
  instances: 3
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      maintenance_work_mem: "64MB"
      checkpoint_completion_target: "0.9"
      wal_buffers: "16MB"
      default_statistics_target: "100"
      random_page_cost: "1.1"
      effective_io_concurrency: "200"
  
  bootstrap:
    initdb:
      database: saler
      owner: saler_user
      secret:
        name: saler-db-credentials
  
  storage:
    size: 100Gi
    storageClass: fast-ssd
  
  monitoring:
    enabled: true
  
  backup:
    barmanObjectStore:
      destinationPath: "s3://saler-backups/postgresql"
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: access-key
        secretAccessKey:
          name: backup-credentials
          key: secret-key
      wal:
        retention: "30D"
      data:
        retention: "7D"
```

#### Database Sharding Strategy
```javascript
// Database Sharding Implementation
class DatabaseSharding {
  constructor() {
    this.shards = new Map();
    this.shardConfig = {
      totalShards: 8,
      shardKey: 'user_id' // Field used for sharding
    };
  }

  // Initialize shards
  async initializeShards() {
    for (let i = 0; i < this.shardConfig.totalShards; i++) {
      const shard = new Database({
        host: `db-shard-${i}.cluster.local`,
        port: 5432,
        database: 'saler_shard_' + i,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
      
      await shard.connect();
      this.shards.set(i, shard);
    }
  }

  // Get shard for user
  getShardForUser(userId) {
    const hash = this.hashUserId(userId);
    const shardIndex = hash % this.shardConfig.totalShards;
    return this.shards.get(shardIndex);
  }

  // Hash function for sharding
  hashUserId(userId) {
    const str = userId.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Cross-shard query
  async queryAcrossShards(query, shardKey = null) {
    const results = [];
    
    if (shardKey) {
      // Query specific shard
      const shard = this.getShardForUser(shardKey);
      const result = await shard.query(query);
      return result.rows;
    } else {
      // Query all shards
      const promises = Array.from(this.shards.values()).map(shard => 
        shard.query(query).catch(err => ({ error: err.message }))
      );
      
      const shardResults = await Promise.all(promises);
      
      // Combine results
      for (const result of shardResults) {
        if (result.rows) {
          results.push(...result.rows);
        }
      }
    }
    
    return results;
  }
}
```

#### Read Replicas
```javascript
// Read Replica Load Balancer
class DatabaseReadReplica {
  constructor() {
    this.master = null;
    this.readReplicas = [];
    this.currentReplicaIndex = 0;
  }

  async initializeConnections() {
    // Master connection
    this.master = new Database({
      host: process.env.DB_MASTER_HOST,
      port: process.env.DB_MASTER_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // Read replicas
    const replicaHosts = process.env.DB_REPLICA_HOSTS.split(',');
    for (const host of replicaHosts) {
      const replica = new Database({
        host: host.trim(),
        port: process.env.DB_REPLICA_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
      
      await replica.connect();
      this.readReplicas.push(replica);
    }
  }

  // Route read queries to replicas
  async executeReadQuery(query, params = []) {
    // Use round-robin for load balancing
    const replica = this.getNextReadReplica();
    return await replica.query(query, params);
  }

  // Route write queries to master
  async executeWriteQuery(query, params = []) {
    return await this.master.query(query, params);
  }

  getNextReadReplica() {
    const replica = this.readReplicas[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.readReplicas.length;
    return replica;
  }
}
```

### 3. التوسع للتخزين المؤقت (Caching)

#### Redis Cluster Configuration
```yaml
# Redis Cluster Setup
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-cluster
  replicas: 6
  template:
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
          name: client
        - containerPort: 16379
          name: gossip
        command:
        - redis-server
        - /etc/redis/redis.conf
        - --cluster-enabled
        - "yes"
        - --cluster-config-file
        - /var/lib/redis/nodes.conf
        - --cluster-node-timeout
        - "5000"
        - --appendonly
        - "yes"
        - --maxmemory
        - "1gb"
        - --maxmemory-policy
        - "allkeys-lru"
        volumeMounts:
        - name: redis-data
          mountPath: /var/lib/redis
        - name: redis-config
          mountPath: /etc/redis
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

#### Multi-Level Caching Strategy
```javascript
// Multi-Level Caching System
class MultiLevelCache {
  constructor() {
    this.l1Cache = new Map(); // In-memory cache
    this.l2Cache = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });
    this.l3Cache = new DatabaseCache(); // Database cache
  }

  async get(key) {
    // L1: In-memory cache (fastest)
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }

    // L2: Redis cache (fast)
    value = await this.l2Cache.get(key);
    if (value) {
      // Populate L1 cache
      this.l1Cache.set(key, value);
      return JSON.parse(value);
    }

    // L3: Database cache (slowest)
    value = await this.l3Cache.get(key);
    if (value) {
      // Populate L2 cache
      await this.l2Cache.setex(key, 300, JSON.stringify(value));
      this.l1Cache.set(key, value);
      return value;
    }

    return null;
  }

  async set(key, value, ttl = 300) {
    const serializedValue = JSON.stringify(value);
    
    // Set in all cache levels
    this.l1Cache.set(key, value);
    await this.l2Cache.setex(key, ttl, serializedValue);
    await this.l3Cache.set(key, value, ttl);
  }

  async delete(key) {
    // Delete from all cache levels
    this.l1Cache.delete(key);
    await this.l2Cache.del(key);
    await this.l3Cache.delete(key);
  }

  // Cache warming for frequently accessed data
  async warmCache(keys) {
    for (const key of keys) {
      const value = await this.l3Cache.get(key);
      if (value) {
        await this.set(key, value, 300);
      }
    }
  }
}
```

### 4. التوسع للملفات

#### Distributed File Storage
```yaml
# MinIO Cluster for Distributed Storage
apiVersion: v1
kind: Service
metadata:
  name: minio-service
spec:
  ports:
  - port: 9000
    targetPort: 9000
  - port: 9001
    targetPort: 9001
  selector:
    app: minio
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: minio
spec:
  serviceName: minio-service
  replicas: 4
  template:
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        ports:
        - containerPort: 9000
        - containerPort: 9001
        env:
        - name: MINIO_ROOT_USER
          value: "minioadmin"
        - name: MINIO_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: minio-credentials
              key: password
        command:
        - minio
        - server
        - http://minio-{0...3}.minio-service.default.svc.cluster.local:9000/data
        - --console-address
        - ":9001"
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

#### CDN Integration
```javascript
// CDN Integration for File Delivery
class CDNManager {
  constructor() {
    this.cloudflare = new CloudFlare({
      email: process.env.CF_EMAIL,
      key: process.env.CF_API_KEY
    });
    this.awsS3 = new AWS.S3({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  // Upload file to CDN
  async uploadFile(file, options = {}) {
    const { bucket = 'saler-files', region = 'us-west-2' } = options;
    
    // Upload to S3
    const uploadParams = {
      Bucket: bucket,
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000', // 1 year
      ServerSideEncryption: 'AES256'
    };

    const result = await this.awsS3.upload(uploadParams).promise();
    
    // Purge CDN cache
    await this.purgeCDNCache([result.Key]);
    
    return {
      url: result.Location,
      key: result.Key,
      etag: result.ETag
    };
  }

  // Purge CDN cache
  async purgeCDNCache(urls) {
    await this.cloudflare.zones.purgeCache(process.env.CF_ZONE_ID, {
      files: urls.map(url => `${process.env.CDN_BASE_URL}/${url}`)
    });
  }

  // Generate signed URLs for private files
  async generateSignedUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Expires: expiresIn
    };

    return await this.awsS3.getSignedUrlPromise('getObject', params);
  }
}
```

### 5. التوسع للبحث

#### Elasticsearch Cluster
```yaml
# Elasticsearch Cluster
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: saler-search
spec:
  version: 8.5.0
  nodeSets:
  - name: master
    count: 3
    config:
      node.roles: ["master"]
      cluster.remote.connect: false
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            requests:
              memory: 2Gi
              cpu: 1
            limits:
              memory: 4Gi
              cpu: 2
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms2g -Xmx2g"
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
  - name: data
    count: 6
    config:
      node.roles: ["data", "ingest"]
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            requests:
              memory: 4Gi
              cpu: 2
            limits:
              memory: 8Gi
              cpu: 4
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms4g -Xmx4g"
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
```

#### Search Service with Auto-scaling
```javascript
// Scalable Search Service
class SearchService {
  constructor() {
    this.esClient = new elasticsearch.Client({
      node: process.env.ELASTICSEARCH_URLS.split(','),
      sniffOnStart: true,
      sniffInterval: 300000, // 5 minutes
      requestTimeout: 60000, // 1 minute
      maxRetries: 3,
      resurrection: true
    });
    
    this.indexConfigs = {
      products: {
        settings: {
          number_of_shards: 5,
          number_of_replicas: 2,
          max_result_window: 50000,
          analysis: {
            analyzer: {
              arabic_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "arabic_stop", "arabic_normalization"]
              }
            }
          }
        },
        mappings: {
          properties: {
            title: {
              type: "text",
              analyzer: "arabic_analyzer",
              fields: {
                keyword: { type: "keyword" }
              }
            },
            description: {
              type: "text",
              analyzer: "arabic_analyzer"
            },
            price: { type: "double" },
            store_id: { type: "keyword" },
            category_id: { type: "keyword" },
            created_at: { type: "date" }
          }
        }
      }
    };
  }

  // Initialize indexes
  async initializeIndexes() {
    for (const [indexName, config] of Object.entries(this.indexConfigs)) {
      const exists = await this.esClient.indices.exists({ index: indexName });
      
      if (!exists) {
        await this.esClient.indices.create({
          index: indexName,
          body: config
        });
      }
    }
  }

  // Scalable search operation
  async search(query, options = {}) {
    const {
      index = 'products',
      size = 20,
      from = 0,
      sort = '_score',
      order = 'desc'
    } = options;

    try {
      const searchBody = {
        query: this.buildSearchQuery(query),
        sort: [{ [sort]: { order } }],
        from,
        size,
        highlight: {
          fields: {
            title: {},
            description: {}
          }
        },
        aggs: {
          categories: {
            terms: { field: 'category_id' }
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 500 },
                { from: 500 }
              ]
            }
          }
        }
      };

      const response = await this.esClient.search({
        index,
        body: searchBody
      });

      return {
        results: response.hits.hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
          highlight: hit.highlight
        })),
        total: response.hits.total.value,
        aggregations: response.aggregations,
        took: response.took
      };
    } catch (error) {
      // Handle search failure
      throw new SearchError(`Search failed: ${error.message}`);
    }
  }

  // Build search query with filters
  buildSearchQuery(query) {
    const must = [];
    const filter = [];

    // Text search
    if (query.text) {
      must.push({
        multi_match: {
          query: query.text,
          fields: ['title^3', 'description^2', 'sku'],
          type: 'best_fields',
          operator: 'and'
        }
      });
    }

    // Filters
    if (query.storeId) {
      filter.push({ term: { store_id: query.storeId } });
    }

    if (query.categoryId) {
      filter.push({ term: { category_id: query.categoryId } });
    }

    if (query.priceMin || query.priceMax) {
      const range = {};
      if (query.priceMin) range.gte = query.priceMin;
      if (query.priceMax) range.lte = query.priceMax;
      filter.push({ range: { price: range } });
    }

    return {
      bool: {
        must,
        filter
      }
    };
  }

  // Index document with bulk operations
  async bulkIndex(documents) {
    const body = documents.flatMap(doc => [
      { index: { _index: 'products', _id: doc.id } },
      doc
    ]);

    const response = await this.esClient.bulk({
      body,
      refresh: 'wait_for'
    });

    if (response.errors) {
      console.error('Bulk indexing errors:', response.items);
      throw new IndexingError('Bulk indexing failed');
    }

    return response;
  }
}
```

## التوزيع الجغرافي

### 1. Multi-Region Setup

```yaml
# Multi-Region Kubernetes Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: region-config
data:
  REGION: "us-west-2"
  EDGE_REGIONS: "eu-west-1,ap-southeast-1"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: database-config
data:
  DATABASE_MASTER_REGION: "us-west-2"
  DATABASE_REPLICA_REGIONS: "eu-west-1,ap-southeast-1"
```

#### Regional Database Replication
```javascript
// Multi-Region Database Manager
class RegionalDatabaseManager {
  constructor() {
    this.regions = {
      'us-west-2': {
        master: true,
        readReplicas: ['eu-west-1', 'ap-southeast-1']
      },
      'eu-west-1': {
        master: false,
        readReplicas: []
      },
      'ap-southeast-1': {
        master: false,
        readReplicas: []
      }
    };
    
    this.connections = new Map();
    this.initializeConnections();
  }

  async initializeConnections() {
    for (const [regionName, config] of Object.entries(this.regions)) {
      const regionConnections = [];
      
      // Master connection
      if (config.master) {
        const master = new Database({
          host: `db-master-${regionName}.cluster.local`,
          port: 5432,
          database: 'saler',
          // ... other config
        });
        await master.connect();
        regionConnections.push(master);
      }

      // Read replicas
      for (const replicaRegion of config.readReplicas) {
        const replica = new Database({
          host: `db-replica-${replicaRegion}.cluster.local`,
          port: 5432,
          database: 'saler',
          // ... other config
        });
        await replica.connect();
        regionConnections.push(replica);
      }

      this.connections.set(regionName, regionConnections);
    }
  }

  // Route queries based on user region
  async executeQuery(query, userRegion = 'us-west-2') {
    // Use regional read replicas for queries
    const connections = this.connections.get(userRegion);
    if (!connections || connections.length === 0) {
      throw new Error(`No connections available for region: ${userRegion}`);
    }

    // Load balance across available connections
    const connection = this.getLeastLoadedConnection(connections);
    return await connection.query(query);
  }

  getLeastLoadedConnection(connections) {
    return connections.reduce((least, current) => 
      current.activeConnections < least.activeConnections ? current : least
    );
  }
}
```

### 2. Edge Computing

```yaml
# Edge Deployment with CloudFlare Workers
name: Saler Edge
main: worker.js
compatibility_date: "2023-05-18"

# wrangler.toml
name = "saler-edge"
main = "worker.js"
compatibility_date = "2023-05-18"

[vars]
ORIGIN_API = "https://api.saler.com"
CDN_CACHE_TTL = "3600"

[[kv_namespaces]]
binding = "CACHE_KV"
id = "cache-namespace-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "saler-files"

[dev]
port = 8787
local_protocol = "http"
```

```javascript
// Cloudflare Worker for Edge Processing
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle different routes
    if (path.startsWith('/api/products/search')) {
      return await handleProductSearch(request, env);
    }
    
    if (path.startsWith('/api/orders/status')) {
      return await handleOrderStatus(request, env);
    }
    
    if (path.startsWith('/files/')) {
      return await handleFileRequest(request, env);
    }

    // Default: route to origin
    return await handleOriginRequest(request, env);
  },

  async scheduled(controller, env, ctx) {
    // Cache warming
    await warmCache(env);
  }
};

async function handleProductSearch(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const storeId = url.searchParams.get('store_id');

  // Check cache first
  const cacheKey = `search:${query}:${storeId}`;
  const cached = await env.CACHE_KV.get(cacheKey);
  
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }

  // Forward to origin API
  const originUrl = `${env.ORIGIN_API}/api/products/search?q=${query}&store_id=${storeId}`;
  const originResponse = await fetch(originUrl, {
    headers: { 'Authorization': request.headers.get('Authorization') }
  });

  const response = await originResponse.json();
  
  // Cache the response
  await env.CACHE_KV.put(cacheKey, JSON.stringify(response), {
    expirationTtl: 300 // 5 minutes
  });

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
```

## مراقبة الأداء والتوسع

### 1. Metrics and Monitoring

```yaml
# Prometheus Configuration for Scalability Monitoring
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "scaling_rules.yml"

scrape_configs:
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

  - job_name: 'redis-exporter'
    static_configs:
    - targets: ['redis-exporter:9121']

  - job_name: 'postgres-exporter'
    static_configs:
    - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093
```

### 2. Auto-scaling Rules

```yaml
# Prometheus Alert Rules for Scaling
groups:
- name: scaling_rules
  rules:
  - alert: HighCPUUsage
    expr: cpu_usage_percent > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is {{ $value }}% for {{ $labels.instance }}"

  - alert: HighMemoryUsage
    expr: memory_usage_percent > 85
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is {{ $value }}% for {{ $labels.instance }}"

  - alert: DatabaseConnectionsHigh
    expr: postgres_connections_active > 150
    for: 1m
    labels:
      severity: warning
    annotations:
      summary: "High database connections"
      description: "Active connections: {{ $value }}"

  - alert: RedisMemoryUsage
    expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Redis memory usage high"
      description: "Redis memory usage: {{ $value }}%"
```

### 3. Performance Testing

```javascript
// Load Testing Script
const k6 = require('k6');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function () {
  // Test product search
  const searchResponse = http.get('https://api.saler.com/api/products/search?q=phone&limit=20');
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test product details
  const productId = searchResponse.json('products.0.id');
  const productResponse = http.get(`https://api.saler.com/api/products/${productId}`);
  check(productResponse, {
    'product status is 200': (r) => r.status === 200,
    'product response time < 300ms': (r) => r.timings.duration < 300,
  });

  // Test order creation (with fixed data)
  const orderData = {
    items: [{ product_id: productId, quantity: 1, price: 99.99 }],
    customer_info: { email: 'test@example.com' },
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address_line_1: 'Test Address',
      city: 'Riyadh',
      country: 'SA'
    }
  };

  const orderResponse = http.post('https://api.saler.com/api/orders', JSON.stringify(orderData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(orderResponse, {
    'order creation status is 201': (r) => r.status === 201,
    'order creation response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

هذا النظام الشامل لقابلية التوسع يضمن قدرة المشروع على النمو والتعامل مع ملايين المستخدمين بكفاءة عالية.

---

**آخر تحديث**: 2 نوفمبر 2025