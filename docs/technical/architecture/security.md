# معايير الأمان - مشروع Saler

## نظرة عامة

الأمان في مشروع Saler مدمج في كل طبقة من طبقات النظام، بدءاً من تصميم قاعدة البيانات وصولاً إلى الواجهات الأمامية. نتبع أفضل الممارسات العالمية لحماية البيانات وضمان سلامة النظام.

### المبادئ الأساسية للأمان

- **Security by Design**: الأمان من البداية
- **Zero Trust**: عدم الثقة في أي طبقة
- **Defense in Depth**: طبقات متعددة من الحماية
- **Principle of Least Privilege**: أقل الصلاحيات الممكنة
- **Data Minimization**: أقل بيانات ممكنة

## طبقات الأمان

### 1. أمان الشبكة (Network Security)

#### جدار الحماية (Firewall)
```yaml
# UFW Firewall Rules
#!/bin/bash

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (restrict to specific IPs)
ufw allow from 192.168.1.0/24 to any port 22

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow database connections (internal only)
ufw allow from 10.0.0.0/8 to any port 5432

# Allow Redis connections (internal only)
ufw allow from 10.0.0.0/8 to any port 6379

# Enable firewall
ufw --force enable
```

#### SSL/TLS Configuration
```nginx
# NGINX SSL Configuration
server {
    listen 443 ssl http2;
    server_name saler.com;

    # SSL Certificates
    ssl_certificate /etc/ssl/certs/saler.com.crt;
    ssl_certificate_key /etc/ssl/private/saler.com.key;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';" always;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Location blocks
    location / {
        proxy_pass http://saler-api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### VPC Configuration
```yaml
# AWS VPC Configuration
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Saler VPC Security Configuration'

Resources:
  # VPC
  SalerVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: saler-vpc

  # Public Subnet
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SalerVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: saler-public-subnet

  # Private Subnet
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SalerVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: saler-private-subnet

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: saler-igw

  # NAT Gateway
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: saler-nat-gw

  # Security Group for Load Balancer
  LoadBalancerSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: !Ref SalerVPC
      GroupDescription: Security group for load balancer
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          SourceSecurityGroupId: !Ref AppSG

  # Security Group for Application
  AppSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: !Ref SalerVPC
      GroupDescription: Security group for application servers
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          SourceSecurityGroupId: !Ref LoadBalancerSG
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref DatabaseSG

  # Security Group for Database
  DatabaseSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: !Ref SalerVPC
      GroupDescription: Security group for database
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSG
```

### 2. أمان التطبيق (Application Security)

#### Authentication Middleware
```javascript
// JWT Authentication with Security Features
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

class SecurityMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
  }

  // Rate Limiting
  createRateLimiter(windowMs, max, message) {
    return rateLimit({
      windowMs,
      max,
      message: { error: message },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        // Log suspicious activity
        this.logSuspiciousActivity(req, 'rate_limit_exceeded');
        res.status(429).json({ error: message });
      }
    });
  }

  // JWT Token Validation
  validateJWT(req, res, next) {
    const token = this.extractToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check token expiration
      if (decoded.exp < Date.now() / 1000) {
        return res.status(401).json({ error: 'Token expired' });
      }

      // Validate token purpose
      if (decoded.purpose !== 'access') {
        return res.status(401).json({ error: 'Invalid token purpose' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      // Log token validation failure
      this.logSecurityEvent(req, 'invalid_token', error.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
  }

  // Password Security
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Input Validation and Sanitization
  validateInput(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        // Log injection attempts
        this.logSuspiciousActivity(req, 'invalid_input', error.details);
        return res.status(400).json({ 
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR'
        });
      }

      // Sanitize input
      req.sanitizedBody = this.sanitizeInput(value);
      next();
    };
  }

  sanitizeInput(data) {
    if (typeof data === 'string') {
      return data
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  // SQL Injection Prevention
  validateSQLInput(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?\b)/i,
      /(\b(EXEC|EXECUTE)\s*\(/i,
      /(;|\'|\"|\|)/,
      /(\b(CHAR|ASCII|SUBSTRING|REVERSE)\s*\()/i
    ];

    return !sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS Prevention
  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // CSRF Protection
  generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  validateCSRFToken(req, res, next) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      this.logSecurityEvent(req, 'csrf_validation_failed');
      return res.status(403).json({ error: 'CSRF token validation failed' });
    }

    next();
  }

  // Security Headers
  setSecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  }

  // Suspicious Activity Logging
  logSuspiciousActivity(req, type, details = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      type,
      details,
      url: req.originalUrl,
      method: req.method
    };

    // Send to security monitoring service
    this.securityMonitor.log(logData);
  }

  // Security Event Logging
  logSecurityEvent(req, event, details = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      ip: req.ip,
      event,
      details,
      url: req.originalUrl,
      method: req.method
    };

    this.securityMonitor.log(logData);
  }
}
```

#### Data Encryption Service
```javascript
// Encryption Service
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.ENCRYPTION_KEY;
    this.keyLength = 32; // 256 bits
  }

  // Generate encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Encrypt data
  encrypt(text, key = this.key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm
    };
  }

  // Decrypt data
  decrypt(encryptedData, key = this.key) {
    const decipher = crypto.createDecipher(
      encryptedData.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash sensitive data
  hash(data, salt = crypto.randomBytes(16)) {
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return {
      hash: hash.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  // Verify hash
  verifyHash(data, hash, salt) {
    const testHash = crypto.pbkdf2Sync(data, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      testHash
    );
  }

  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}
```

### 3. أمان قاعدة البيانات (Database Security)

#### Database Security Configuration
```sql
-- PostgreSQL Security Configuration

-- Create security roles
CREATE ROLE saler_app NOINHERIT;
CREATE ROLE saler_readonly NOINHERIT;
CREATE ROLE saler_admin NOINHERIT;

-- Grant appropriate permissions
GRANT CONNECT ON DATABASE saler_db TO saler_app;
GRANT USAGE ON SCHEMA public TO saler_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saler_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saler_app;

-- Read-only access
GRANT CONNECT ON DATABASE saler_db TO saler_readonly;
GRANT USAGE ON SCHEMA public TO saler_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO saler_readonly;

-- Admin access (restricted)
GRANT ALL PRIVILEGES ON DATABASE saler_db TO saler_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO saler_admin;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY user_own_data ON users
    USING (auth.uid() = id);

CREATE POLICY store_access ON stores
    USING (
        auth.uid() = owner_id OR
        auth.uid() IN (
            SELECT user_id FROM user_permissions 
            WHERE resource = 'stores' AND action = 'read'
        )
    );

CREATE POLICY product_store_access ON products
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY order_customer_access ON orders
    USING (
        customer_id = auth.uid() OR
        store_id IN (
            SELECT id FROM stores 
            WHERE owner_id = auth.uid()
        )
    );

-- Database encryption at rest (PostgreSQL)
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
ALTER SYSTEM SET ssl_ca_file = 'ca.crt';

-- Audit logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = '/var/log/postgresql';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
```

#### Data Masking and Anonymization
```sql
-- Data Masking Functions
CREATE OR REPLACE FUNCTION mask_email(email VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF email IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN 
        SUBSTRING(email FROM 1 FOR 2) ||
        REPEAT('*', LENGTH(SPLIT_PART(email, '@', 1)) - 2) ||
        '@' ||
        SPLIT_PART(email, '@', 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_phone(phone VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF phone IS NULL OR LENGTH(phone) < 4 THEN
        RETURN NULL;
    END IF;
    
    RETURN REPEAT('*', LENGTH(phone) - 4) || SUBSTRING(phone FROM -4);
END;
$$ LANGUAGE plpgsql;

-- Anonymize sensitive data
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        email = 'anonymous_' || id || '@example.com',
        first_name = 'Anonymous',
        last_name = 'User',
        phone = NULL,
        avatar_url = NULL
    WHERE id = user_id;
    
    UPDATE customer_addresses SET
        first_name = 'Anonymous',
        last_name = 'User',
        company = 'Anonymous Company',
        address_line_1 = 'Anonymous Address',
        address_line_2 = NULL,
        phone = NULL
    WHERE customer_id = user_id;
    
    UPDATE orders SET
        email = 'anonymous_' || id || '@example.com',
        notes = '[ANONYMIZED]'
    WHERE customer_id = user_id;
END;
$$ LANGUAGE plpgsql;
```

### 4. أمان البيانات (Data Protection)

#### Sensitive Data Classification
```javascript
// Data Classification
const DataClassification = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted'
};

// Field Classification
const FieldClassification = {
  // Public data
  productTitle: DataClassification.PUBLIC,
  productDescription: DataClassification.PUBLIC,
  categoryName: DataClassification.PUBLIC,
  
  // Internal data
  storeSettings: DataClassification.INTERNAL,
  orderTotal: DataClassification.INTERNAL,
  
  // Confidential data
  userEmail: DataClassification.CONFIDENTIAL,
  userPhone: DataClassification.CONFIDENTIAL,
  customerAddress: DataClassification.CONFIDENTIAL,
  
  // Restricted data
  passwordHash: DataClassification.RESTRICTED,
  paymentCard: DataClassification.RESTRICTED,
  personalId: DataClassification.RESTRICTED
};

// Data Protection Service
class DataProtectionService {
  constructor() {
    this.encryptionService = new EncryptionService();
  }

  // Classify and protect data
  async protectData(data, classification) {
    switch (classification) {
      case DataClassification.RESTRICTED:
        return this.encryptSensitiveData(data);
      case DataClassification.CONFIDENTIAL:
        return this.maskConfidentialData(data);
      case DataClassification.INTERNAL:
        return this.hashInternalData(data);
      default:
        return data; // Public data
    }
  }

  // Encrypt sensitive data
  encryptSensitiveData(data) {
    if (typeof data === 'string') {
      return this.encryptionService.encrypt(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const encrypted = {};
      for (const [key, value] of Object.entries(data)) {
        encrypted[key] = this.encryptSensitiveData(value);
      }
      return encrypted;
    }
    
    return data;
  }

  // Mask confidential data
  maskConfidentialData(data) {
    if (typeof data === 'string') {
      if (data.includes('@')) {
        return this.maskEmail(data);
      }
      if (data.match(/^\+?[\d\s-()]+$/)) {
        return this.maskPhone(data);
      }
      return this.maskString(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const masked = {};
      for (const [key, value] of Object.entries(data)) {
        const fieldClass = this.getFieldClassification(key);
        masked[key] = this.protectData(value, fieldClass);
      }
      return masked;
    }
    
    return data;
  }

  // Get field classification
  getFieldClassification(fieldName) {
    return FieldClassification[fieldName] || DataClassification.PUBLIC;
  }

  // Mask email
  maskEmail(email) {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return '***@' + domain;
    }
    return localPart.substring(0, 2) + '***' + '@' + domain;
  }

  // Mask phone
  maskPhone(phone) {
    const last4 = phone.slice(-4);
    return '***-***-' + last4;
  }

  // Mask string
  maskString(str) {
    if (str.length <= 4) {
      return '****';
    }
    return str.substring(0, 2) + '***' + str.slice(-2);
  }
}
```

### 5. أمان API (API Security)

#### API Security Middleware
```javascript
// API Security Middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');

class APISecurityMiddleware {
  constructor() {
    this.rateLimiters = new Map();
  }

  // API Rate Limiting
  createAPIRateLimiter(identifier, limits) {
    const limiter = rateLimit({
      windowMs: limits.windowMs || 15 * 60 * 1000, // 15 minutes
      max: limits.max || 100, // limit each IP to 100 requests per windowMs
      keyGenerator: (req) => {
        return identifier === 'user' ? req.user?.id : req.ip;
      },
      handler: (req, res) => {
        this.logAPILimitExceeded(req, identifier);
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.rateLimiters.set(identifier, limiter);
    return limiter;
  }

  // Input Validation
  validateRegistration() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .custom(this.checkEmailUniqueness),
      body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
      body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Zأ-ي\s]+$/),
      body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Zأ-ي\s]+$/)
    ];
  }

  validateProductCreation() {
    return [
      body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .escape(),
      body('description')
        .trim()
        .isLength({ min: 0, max: 2000 })
        .escape(),
      body('price')
        .isFloat({ min: 0 })
        .toFloat(),
      body('sku')
        .trim()
        .isLength({ min: 1, max: 100 })
        .matches(/^[a-zA-Z0-9-_]+$/)
    ];
  }

  validateOrderCreation() {
    return [
      body('items')
        .isArray({ min: 1 })
        .custom(this.validateOrderItems),
      body('shippingAddress')
        .isObject()
        .custom(this.validateAddress),
      body('paymentMethod')
        .isIn(['cod', 'bank_transfer', 'credit_card', 'paypal'])
    ];
  }

  // API Response Security
  secureAPIResponse() {
    return (req, res, next) => {
      // Remove sensitive fields from response
      const originalSend = res.send;
      res.send = function(data) {
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        
        // Remove sensitive fields
        if (data.user) {
          delete data.user.passwordHash;
          delete data.user.passwordResetToken;
          delete data.user.emailVerificationToken;
        }
        
        if (data.payment) {
          delete data.payment.gatewaySecret;
          delete data.payment.encryptionKey;
        }
        
        res.send = originalSend;
        res.send(JSON.stringify(data));
      };
      
      next();
    };
  }

  // API Key Security
  validateAPIKey() {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
      }
      
      // Validate API key format
      if (!this.isValidAPIKeyFormat(apiKey)) {
        this.logSecurityEvent(req, 'invalid_api_key_format');
        return res.status(401).json({ error: 'Invalid API key format' });
      }
      
      // Check API key in database
      this.validateAPIKeyInDB(apiKey)
        .then(isValid => {
          if (!isValid) {
            this.logSecurityEvent(req, 'invalid_api_key');
            return res.status(401).json({ error: 'Invalid API key' });
          }
          
          req.apiKey = apiKey;
          next();
        })
        .catch(error => {
          this.logSecurityEvent(req, 'api_key_validation_error', error);
          res.status(500).json({ error: 'Internal server error' });
        });
    };
  }

  // Logging and Monitoring
  logAPILimitExceeded(req, identifier) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      identifier,
      type: 'rate_limit_exceeded',
      url: req.originalUrl,
      method: req.method
    };
    
    this.securityLogger.warn('API rate limit exceeded', logData);
  }

  logSecurityEvent(req, event, details = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      event,
      details,
      url: req.originalUrl,
      method: req.method
    };
    
    this.securityLogger.warn('Security event', logData);
  }

  // Helper methods
  isValidAPIKeyFormat(apiKey) {
    return /^[a-zA-Z0-9]{32,128}$/.test(apiKey);
  }

  async checkEmailUniqueness(email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }
    return true;
  }

  validateOrderItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid order item');
      }
    }
    
    return true;
  }

  validateAddress(address) {
    const required = ['firstName', 'lastName', 'addressLine1', 'city', 'country'];
    
    for (const field of required) {
      if (!address[field]) {
        throw new Error(`Missing required address field: ${field}`);
      }
    }
    
    return true;
  }
}
```

### 6. أمان DevOps (DevSecOps)

#### Security Scanning Pipeline
```yaml
# GitHub Actions Security Pipeline
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: OWASP ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'https://staging.saler.com'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### Container Security
```dockerfile
# Secure Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=nextjs:nodejs . .

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

#### Infrastructure as Code Security
```yaml
# Secure Terraform Configuration
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "saler-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-west-2"
    
    # Enable encryption
    encrypt = true
    
    # DynamoDB for state locking
    dynamodb_table = "saler-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Saler"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "devops@saler.com"
    }
  }
}

# VPC with security groups
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.environment}-vpc"
  }
}

# Security group with minimal access
resource "aws_security_group" "api" {
  name        = "${var.environment}-api-sg"
  description = "Security group for API servers"
  vpc_id      = aws_vpc.main.id
  
  # Outbound rules
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }
  
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP outbound"
  }
  
  # Inbound rules (load balancer only)
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "API traffic from load balancer"
  }
  
  tags = {
    Name = "${var.environment}-api-sg"
  }
}

# Database encryption at rest
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.environment}-db"
  engine                 = "aurora-postgresql"
  engine_version         = "13.7"
  database_name          = "saler"
  master_username        = var.db_master_username
  master_password        = var.db_master_password
  
  # Encryption
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.db.arn
  
  # Backup
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  
  # Security
  publicly_accessible   = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  tags = {
    Name = "${var.environment}-db"
  }
}
```

## مراقبة الأمان

### 1. Security Information and Event Management (SIEM)

```javascript
// Security Monitoring Service
class SecurityMonitoringService {
  constructor() {
    this.alerts = new Map();
    this.thresholds = {
      failedLogins: 5,
      apiCallsPerMinute: 1000,
      unusualAccessPatterns: 10
    };
  }

  // Monitor authentication attempts
  monitorAuthenticationAttempt(attemptData) {
    const { userId, ip, success } = attemptData;
    
    if (!success) {
      this.incrementFailedLogins(ip, userId);
      
      if (this.getFailedLoginCount(ip) >= this.thresholds.failedLogins) {
        this.triggerAlert('excessive_failed_logins', {
          ip,
          userId,
          count: this.getFailedLoginCount(ip)
        });
      }
    } else {
      this.resetFailedLogins(ip);
      this.logSuccessfulLogin(userId, ip);
    }
  }

  // Monitor API usage patterns
  monitorAPIUsage(apiData) {
    const { userId, endpoint, method, ip, responseTime } = apiData;
    
    // Check for unusual patterns
    if (this.isUnusualAccessPattern(userId, endpoint)) {
      this.triggerAlert('unusual_access_pattern', {
        userId,
        endpoint,
        pattern: 'unusual_frequency'
      });
    }
    
    // Monitor response times
    if (responseTime > 5000) { // 5 seconds
      this.logSlowRequest(endpoint, responseTime, userId);
    }
  }

  // Detect intrusion attempts
  detectIntrusionAttempt(requestData) {
    const { url, method, headers, body } = requestData;
    
    // SQL injection detection
    if (this.detectSQLInjection(url, body)) {
      this.triggerAlert('sql_injection_attempt', {
        url,
        method,
        payload: body
      });
    }
    
    // XSS detection
    if (this.detectXSS(url, body, headers)) {
      this.triggerAlert('xss_attempt', {
        url,
        method,
        payload: body
      });
    }
    
    // Path traversal detection
    if (this.detectPathTraversal(url)) {
      this.triggerAlert('path_traversal_attempt', {
        url,
        method
      });
    }
  }

  // Generate security reports
  generateSecurityReport(timeframe) {
    return {
      period: timeframe,
      alerts: this.getAlertSummary(),
      trends: this.analyzeTrends(timeframe),
      recommendations: this.generateRecommendations()
    };
  }

  // Alert handling
  triggerAlert(type, data) {
    const alert = {
      id: generateUUID(),
      type,
      data,
      timestamp: new Date(),
      severity: this.getAlertSeverity(type),
      status: 'open'
    };
    
    this.alerts.set(alert.id, alert);
    this.sendAlertNotification(alert);
  }
}
```

هذا النظام الشامل للأمان يضمن حماية البيانات والنظام على جميع المستويات مع المراقبة المستمرة والاستجابة السريعة للتهديدات.

---

**آخر تحديث**: 2 نوفمبر 2025