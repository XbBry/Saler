# استراتيجية الاختبار - مشروع Saler

## نظرة عامة

اختبار مشروع Saler يتم باستخدام استراتيجية شاملة تغطي جميع طبقات التطبيق لضمان جودة الكود والاعتمادية العالية.

### أهداف الاختبار

- **الجودة**: ضمان عدم وجود أخطاء في الكود
- **الاعتمادية**: ضمان استقرار النظام تحت الضغط
- **الأمان**: التحقق من سلامة البيانات والحماية
- **الأداء**: ضمان استجابة سريعة وفعالة
- **تجربة المستخدم**: ضمان تجربة سلسة ومفيدة

## طبقات الاختبار

### 1. Unit Testing (اختبار الوحدات)

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000
};
```

####单元测试示例
```javascript
// tests/unit/UserService.test.js
const UserService = require('../../src/services/UserService');
const UserRepository = require('../../src/repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mocking dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userService;
  let mockUserRepository;

  beforeEach(() => {
    mockUserRepository = new UserRepository();
    userService = new UserService(mockUserRepository);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const expectedUser = {
        id: '123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password: 'hashedPassword',
        firstName: userData.firstName,
        lastName: userData.lastName
      });
    });

    it('should throw error for existing email', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '456',
        email: 'existing@example.com'
      });

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
      
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: '123', // weak password
        firstName: 'Test',
        lastName: 'User'
      };

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Password must be at least 8 characters');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const user = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken');

      // Act
      const result = await userService.authenticateUser(credentials);

      // Assert
      expect(result).toEqual({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        token: 'mockToken'
      });
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, user.password);
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const user = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(userService.authenticateUser(credentials))
        .rejects
        .toThrow('Invalid credentials');
    });
  });
});
```

#### React Component Testing
```javascript
// tests/components/ProductCard.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from '../../src/components/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    currency: 'SAR',
    imageUrl: '/test-image.jpg',
    inStock: true
  };

  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    mockOnAddToCart.mockClear();
  });

  it('should render product information correctly', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('SAR 99.99')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should call onAddToCart when add to cart button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );

    const addButton = screen.getByRole('button', { name: /أضف للسلة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
    });
  });

  it('should disable add to cart button when product is out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      inStock: false
    };

    render(
      <ProductCard 
        product={outOfStockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );

    const addButton = screen.getByRole('button', { name: /أضف للسلة/i });
    expect(addButton).toBeDisabled();
  });

  it('should show loading state when adding to cart', async () => {
    const user = userEvent.setup();
    
    // Mock slow operation
    mockOnAddToCart.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );

    const addButton = screen.getByRole('button');
    await user.click(addButton);

    expect(screen.getByText(/جاري الإضافة.../i)).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/أضف للسلة/i)).toBeInTheDocument();
    });
  });

  it('should not show description when showDescription is false', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart}
        showDescription={false}
      />
    );

    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });
});
```

### 2. Integration Testing (اختبار التكامل)

#### API Integration Tests
```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { connectTestDatabase, disconnectTestDatabase } = require('../helpers/database');

describe('Authentication API', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for existing email', async () => {
      // Create user first
      await User.create({
        email: 'existing@example.com',
        password: 'hashedPassword',
        firstName: 'Existing',
        lastName: 'User'
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(credentials.email);
    });

    it('should return 401 for invalid email', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
```

#### Database Integration Tests
```javascript
// tests/integration/products.test.js
const request = require('supertest');
const app = require('../../src/app');
const { connectTestDatabase, disconnectTestDatabase } = require('../helpers/database');

describe('Products API Integration', () => {
  let authToken;
  let testStore;
  let testUser;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // Clean up database
    await Product.deleteMany({});
    await Store.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 12),
      firstName: 'Test',
      lastName: 'User'
    });

    // Create test store
    testStore = await Store.create({
      name: 'Test Store',
      handle: 'test-store',
      owner_id: testUser._id
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await Product.insertMany([
        {
          title: 'Product 1',
          price: 99.99,
          store_id: testStore._id,
          status: 'active'
        },
        {
          title: 'Product 2',
          price: 149.99,
          store_id: testStore._id,
          status: 'active'
        }
      ]);
    });

    it('should return products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter products by store', async () => {
      const response = await request(app)
        .get(`/api/products?store_id=${testStore._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
    });

    it('should search products by title', async () => {
      const response = await request(app)
        .get('/api/products?search=Product 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].title).toBe('Product 1');
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products?min_price=100&max_price=150')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].title).toBe('Product 2');
    });
  });

  describe('POST /api/products', () => {
    it('should create new product', async () => {
      const productData = {
        title: 'New Product',
        description: 'Test description',
        price: 199.99,
        store_id: testStore._id,
        sku: 'NEW-001'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(productData.title);
      expect(response.body.data.price).toBe(productData.price);
    });

    it('should return 400 for invalid data', async () => {
      const invalidProductData = {
        // missing required fields
        price: 199.99
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProductData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate SKU', async () => {
      // Create product with SKU first
      await Product.create({
        title: 'Existing Product',
        price: 99.99,
        store_id: testStore._id,
        sku: 'DUPLICATE-001'
      });

      const productData = {
        title: 'New Product',
        price: 199.99,
        store_id: testStore._id,
        sku: 'DUPLICATE-001'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SKU_EXISTS');
    });
  });
});
```

### 3. End-to-End Testing (اختبار طرف لطرف)

#### Cypress Configuration
```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
});
```

#### E2E Tests
```javascript
// cypress/e2e/product-search.cy.js
describe('Product Search Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should search for products and display results', () => {
    // Open search
    cy.get('[data-testid="search-input"]').type('phone');
    cy.get('[data-testid="search-button"]').click();

    // Wait for results
    cy.get('[data-testid="search-results"]', { timeout: 10000 })
      .should('be.visible');

    // Verify results
    cy.get('[data-testid="product-card"]').should('have.length.gte', 1);
    cy.get('[data-testid="product-card"]').first()
      .find('[data-testid="product-title"]')
      .should('contain.text', 'phone');
  });

  it('should filter products by category', () => {
    cy.visit('/products');

    // Select category filter
    cy.get('[data-testid="category-filter"]').click();
    cy.get('[data-testid="category-option-electronics"]').click();

    // Verify filtered results
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card)
        .find('[data-testid="product-category"]')
        .should('contain.text', 'إلكترونيات');
    });
  });

  it('should add product to cart', () => {
    cy.visit('/products');

    // Add first product to cart
    cy.get('[data-testid="add-to-cart-button"]').first().click();

    // Verify cart count updated
    cy.get('[data-testid="cart-count"]').should('contain.text', '1');

    // Verify success message
    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .and('contain.text', 'تم إضافة المنتج للسلة');
  });
});
```

#### Authentication Flow E2E
```javascript
// cypress/e2e/authentication.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    // Login with test credentials
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    // Verify error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain.text', 'بيانات الدخول غير صحيحة');
  });

  it('should register new user', () => {
    cy.visit('/register');

    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      confirmPassword: 'password123'
    };

    cy.get('[data-testid="first-name-input"]').type(userData.firstName);
    cy.get('[data-testid="last-name-input"]').type(userData.lastName);
    cy.get('[data-testid="email-input"]').type(userData.email);
    cy.get('[data-testid="password-input"]').type(userData.password);
    cy.get('[data-testid="confirm-password-input"]').type(userData.confirmPassword);
    cy.get('[data-testid="register-button"]').click();

    // Verify success
    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .and('contain.text', 'تم إنشاء الحساب بنجاح');
  });
});
```

### 4. Performance Testing (اختبار الأداء)

#### Load Testing with K6
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    checks: ['rate>0.95'],             // 95% of checks should pass
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test product search
  const searchResponse = http.get(`${BASE_URL}/api/products/search?q=phone&limit=20`);
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
    'search returns products': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.items.length > 0;
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test product details
  const productId = JSON.parse(searchResponse.body).data.items[0].id;
  const productResponse = http.get(`${BASE_URL}/api/products/${productId}`);
  check(productResponse, {
    'product details status is 200': (r) => r.status === 200,
    'product details response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // Test cart operations (if authenticated)
  const cartResponse = http.get(`${BASE_URL}/api/cart`);
  check(cartResponse, {
    'cart status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
}
```

### 5. Security Testing (اختبار الأمان)

#### Security Test Suite
```javascript
// tests/security/auth-security.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should not allow SQL injection in login', async () => {
      const maliciousPayload = {
        email: "admin' OR '1'='1",
        password: "password' OR '1'='1"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should implement rate limiting on login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const requests = Array(101).fill(null).map(() =>
        request(app).post('/api/auth/login').send(credentials)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should not expose sensitive data in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error.message).not.toContain('password');
      expect(response.body.error.message).not.toContain('hash');
    });
  });

  describe('Input Validation', () => {
    it('should prevent XSS in user input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: maliciousInput,
          price: 99.99
        });

      // Response should not contain unescaped script tag
      expect(response.body.data.title).not.toContain('<script>');
    });

    it('should validate file upload types', async () => {
      const maliciousFile = {
        filename: 'malicious.exe',
        content: 'malicious content'
      };

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from(maliciousFile.content), maliciousFile.filename)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('Authorization', () => {
    it('should prevent unauthorized access to protected routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should enforce role-based access control', async () => {
      // Get token with limited permissions
      const limitedToken = await getLimitedUserToken();

      const response = await request(app)
        .delete('/api/products/123')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
```

### 6. Accessibility Testing (اختبار إمكانية الوصول)

#### Accessibility Tests
```javascript
// tests/accessibility/accessibility.test.js
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

describe('Accessibility Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  it('should not have accessibility violations on home page', async () => {
    await page.goto('http://localhost:3000');
    
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  it('should have proper form labels', async () => {
    await page.goto('http://localhost:3000/register');

    // Check for proper labels on form inputs
    const labels = await page.$$eval('label', labels => 
      labels.map(label => label.getAttribute('for'))
    );

    // All inputs should have associated labels
    const inputs = await page.$$eval('input', inputs => 
      inputs.map(input => input.id || input.name)
    );

    expect(inputs.every(id => labels.includes(id))).toBe(true);
  });

  it('should support keyboard navigation', async () => {
    await page.goto('http://localhost:3000');

    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBe('A'); // First link should be focused

    // Test Enter key on button
    await page.keyboard.press('Tab'); // Navigate to first button
    await page.keyboard.press('Enter');
    
    // Should not throw errors
    expect(page.url()).toBeTruthy();
  });

  it('should have proper ARIA attributes', async () => {
    await page.goto('http://localhost:3000');

    // Check for ARIA labels on interactive elements
    const interactiveElements = await page.$$eval('button, [role="button"], [aria-label]', 
      elements => elements.map(el => ({
        tagName: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        role: el.getAttribute('role')
      }))
    );

    // Interactive elements should have proper ARIA attributes
    expect(interactiveElements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ariaLabel: expect.any(String),
          role: expect.any(String)
        })
      ])
    );
  });
});
```

## إعداد بيئة الاختبار

### 1. Test Database Setup
```javascript
// tests/helpers/database.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function connectTestDatabase() {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'saler_test',
    },
  });

  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}

async function disconnectTestDatabase() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = {
  connectTestDatabase,
  disconnectTestDatabase,
};
```

### 2. Test Environment Configuration
```javascript
// tests/setup.js
const { TextEncoder, TextDecoder } = 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock external services
jest.mock('../src/services/EmailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/FileStorageService', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://example.com/file.jpg',
    key: 'test-file-key'
  }),
  deleteFile: jest.fn().mockResolvedValue(true),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_URL = 'redis://localhost:6379/1';
```

### 3. CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: saler_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run unit tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/saler_test
        REDIS_URL: redis://localhost:6379
        
    - name: Generate coverage report
      run: npm run test:coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Start application
      run: npm run start:test &
      
    - name: Wait for application
      run: npx wait-on http://localhost:3000
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload E2E artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots
        
    - name: Upload videos
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: cypress-videos
        path: cypress/videos
```

## معايير الاختبار

### 1. Test Coverage Goals
- **Lines**: ≥ 80%
- **Functions**: ≥ 80%
- **Branches**: ≥ 75%
- **Statements**: ≥ 80%

### 2. Test Quality Checklist
- [ ] اختبارات سريعة ومستقرة
- [ ] تغطية جميع المسارات الحرجة
- [ ] اختبارات حالات الحافة
- [ ] تعليقات واضحة في الاختبارات
- [ ] استخدام descriptive test names
- [ ] تجنب interdependencies بين الاختبارات

### 3. Performance Test Benchmarks
- **API Response Time**: < 200ms (95th percentile)
- **Database Queries**: < 100ms (average)
- **Page Load Time**: < 3 seconds
- **Search Response**: < 500ms
- **File Upload**: < 5 seconds

هذا النظام الشامل للاختبار يضمن جودة عالية وموثوقية في جميع أجزاء مشروع Saler.

---

**آخر تحديث**: 2 نوفمبر 2025