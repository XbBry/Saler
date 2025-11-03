/** @type {import('jest').Config} */
const config = {
  // مسارات الاختبارات
  roots: ['<rootDir>/src'],
  
  // نمط ملفات الاختبار
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(js|jsx|ts|tsx)'
  ],
  
  // إعدادات الملفات
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],
  
  // مسارات الوحدات
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src'
  ],
  
  // قواعد تعيين الوحدات
  moduleNameMapping: {
    // تعيين المسارات المختصرة
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1',
    
    // تعيين CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // تعيين الأصول
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(woff|woff2|ttf|eot)$': '<rootDir>/src/__mocks__/fontMock.js'
  },
  
  // المتغيرات البيئية
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    customExportConditions: ['node', 'node-addons']
  },
  
  // إعدادات المخصصة
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setupTests.js',
    '@testing-library/jest-dom/extend-expect'
  ],
  
  // إعداد Global Setup
  globalSetup: '<rootDir>/src/__tests__/globalSetup.js',
  
  // إعداد Global Teardown
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.js',
  
  // عناوين مختصرة للوحدات
  modulePaths: ['<rootDir>/src'],
  
  // إعدادات التحويل
  transform: {
    // تحويل ملفات TypeScript
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          allowJs: true
        },
        isolatedModules: true
      }
    ],
    
    // تحويل ملفات JavaScript
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript'
        ],
        plugins: [
          'babel-plugin-styled-components',
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator'
        ]
      }
    ],
    
    // تجاهل CSS في التحويل
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // الملفات التي يجب تجاهلها
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // الملفات التي يجب تجاهلها في التحويل
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library|@babel)/)',
    '\\.module\\.(css|sass|scss)$'
  ],
  
  // إعدادات التغطية
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,ts}',
    '!src/next.config.js',
    '!src/**/*.types.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // عتبات خاصة للمكونات الحرجة
    'src/components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/hooks/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/contexts/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // إعدادات التقارير
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/coverage',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'تقرير اختبارات Saler',
        inlineAssets: true
      }
    ]
  ],
  
  // إعدادات الحد الأقصى من الاتصالات المتزامنة
  maxWorkers: '50%',
  
  // إعدادات الذاكرة المؤقتة
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // إعدادات تنظيف الذاكرة المؤقتة
  clearCache: false,
  
  // إعدادات التوقيت
  testTimeout: 30000, // 30 ثانية
  
  // إعدادات النشر
  testResultsProcessor: undefined,
  
  // إعدادات النتائج
  verbose: true,
  silent: false,
  
  // إعدادات الإخراج
  noStackTrace: false,
  
  // إعدادات تفصيلية
  debug: false,
  
  // إعدادات التجاهل
  testLocationInResults: true,
  
  // إعدادات الملفات المصورة
  snapshotSerializers: [
    '@emotion/jest/serializer',
    'enzyme-to-json/serializer'
  ],
  
  // إعدادات المخصصة للجمل الفوضوية
  // هذه تساعد في استقرار اختبارات الواجهة
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(js|jsx|ts|tsx)'
  ],
  
  // إعدادات إضافية لـ Jest DOM
  setupFiles: [
    '<rootDir>/src/__tests__/setupTests.js'
  ],
  
  // إعدادات المخصصة لـ MSW (Mock Service Worker)
  workerIdleMemoryLimit: '2GB',
  
  // إعدادات للمهام
  projects: [
    {
      displayName: 'Frontend Tests',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/setupTests.js',
        '@testing-library/jest-dom/extend-expect'
      ],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
        '<rootDir>/src/**/*.test.(js|jsx|ts|tsx)'
      ],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        '^@/constants/(.*)$': '<rootDir>/src/constants/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              jsx: 'react-jsx',
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              allowJs: true
            },
            isolatedModules: true
          }
        ],
        '^.+\\.(js|jsx)$': [
          'babel-jest',
          {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        ],
        '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/__tests__/**/*',
        '!src/**/*.stories.{js,jsx,ts,tsx}'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
      testTimeout: 10000,
      verbose: true
    }
  ],
  
  // إعدادات لاختبارات خاصة
  testEnvironmentOptions: {
    resources: 'usable'
  },
  
  // إعدادات للتعامل مع الوقت
  fakeTimers: {
    enableGlobally: false
  }
};

module.exports = config;