/**
 * ESLint configuration with optimized rules for performance and code quality
 * إعدادات ESLint محسنة لقواعد الأداء وجودة الكود
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'next/core-web-vitals',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'promise',
    'sonarjs'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/ban-types': 'error',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // Performance optimization rules
    'react/jsx-no-bind': ['error', {
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false,
    }],
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-expensive-context-values': 'warn',
    'react/jsx-no-new-object-as-prop': 'error',
    'react/jsx-no-array-index-key': 'warn',
    'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary'] }],
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',

    // Import optimization rules
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // Handled by TypeScript
    'import/named': 'off', // Handled by TypeScript
    'import/default': 'off', // Handled by TypeScript
    'import/no-absolute-path': 'error',
    'import/no-self-import': 'error',
    'import/no-cycle': ['error', { maxDepth: 10 }],
    'import/no-useless-path-segments': 'error',
    'import/export': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-deprecated': 'warn',
    'import/no-anonymous-default-export': 'warn',
    'import/group-exports': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'object',
        'type'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],

    // Code quality rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-await-in-loop': 'warn',
    'no-return-assign': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-throw-literal': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'prefer-destructuring': ['error', {
      object: true,
      array: false
    }],
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',

    // Error prevention
    'no-var': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    'no-undef': 'off', // Handled by TypeScript
    'no-redeclare': 'off', // Handled by TypeScript
    'no-unreachable': 'error',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-alert': 'error',

    // Promise rules
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-nesting': 'warn',

    // SonarJS rules for code quality
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-duplicate-string': 'error',
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/max-switch-cases': ['error', 50],
    'sonarjs/no-collapsible-if': 'error',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Handled by TypeScript
    'react/display-name': 'error',
    'react/no-unescaped-entities': 'error',
    'react/jsx-key': ['error', {
      checkFragmentShorthand: true,
      checkKeyMustBeforeSpread: true,
    }],
    'react/jsx-wrap-multilines': 'error',
    'react/jsx-curly-spacing': ['error', {
      when: 'never',
      children: true
    }],
    'react/jsx-equals-spacing': ['error', 'never'],
    'react/jsx-pascal-case': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-is-mounted': 'error',
    'react/no-render-return-value': 'error',
    'react/require-render-return': 'error',
    'react/style-prop-object': 'error',

    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',

    // Custom performance rules
    'prefer-optimized-destructuring': 'error',
    'no-mutable-object-keys-in-array': 'error',
    'optimize-array-operations': 'warn',
    'no-object-literal-shorthand-in-spread': 'warn',

    // Dependency management
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'moment',
          message: 'Use date-fns or dayjs instead of moment for better tree-shaking'
        },
        {
          name: 'lodash',
          message: 'Use lodash-es for tree-shaking support'
        },
        {
          name: 'axios',
          message: 'Use built-in fetch API or a lighter alternative like ky'
        }
      ]
    }],

    // Next.js specific rules
    'react/jsx-props-no-spreading': 'off',
    'react/function-component-definition': ['error', {
      namedComponents: 'function-declaration',
      unnamedComponents: 'arrow-function'
    }],

    // Code style rules
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],
    'computed-property-spacing': ['error', 'never'],
    'func-call-spacing': ['error', 'never'],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'spaced-comment': ['error', 'always'],
  },
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off'
      }
    },
    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react/display-name': 'off',
        'jsx-a11y/alt-text': 'off',
        'sonarjs/no-identical-functions': 'off',
      }
    },
    // Configuration files
    {
      files: ['**/*.config.js', '**/*.config.ts', '**/*.config.mjs'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    // Node.js files
    {
      files: ['**/*.node.js', '**/*.node.ts'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
        'no-undef': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
    '**/generated/**',
    '**/vendor/**'
  ]
};