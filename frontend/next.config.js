/** @type {import('next').NextConfig} */

// Optional bundle analyzer
let withBundleAnalyzer = (config) => config;
try {
  const bundleAnalyzer = require('@next/bundle-analyzer');
  if (bundleAnalyzer) {
    withBundleAnalyzer = bundleAnalyzer({
      enabled: process.env.ANALYZE === 'true',
    });
  }
} catch (e) {
  console.log('Bundle analyzer not available - skipping');
}

const nextConfig = {
  // ==== BASIC CONFIGURATION ====
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
  
  // ==== BUILD PERFORMANCE OPTIMIZATIONS ====
  // Enable standalone output for better production builds
  output: 'standalone',
  
  // ==== EXPERIMENTAL FEATURES ====
  experimental: {
    // Turbo bundler for faster development
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    },
    // Server Components external packages
    serverComponentsExternalPackages: [
      'sharp', 
      'lucide-react',
      'date-fns',
      'recharts'
    ],
    // CSS optimizations
    optimizeCss: true,
    // Package imports optimization for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      'framer-motion',
      'date-fns',
      'recharts'
    ],
    // Bundle analyzer in development
    bundlePagesExternals: true,
    // Enhanced tree shaking optimizations
    optimizeCss: true,
    // Webpack 5 optimizations
    webpackBuildWorker: true,
    // PPR (Partial Prerendering) for better performance
    ppr: true,
    turbo: {
      rules: {
        '*.svg': ['@svgr/webpack']
      }
    },
    // Server Actions optimization
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
    // Link prefetch optimization
    prefetchOnPara: 'top'
  },

  // ==== IMAGE CONFIGURATION ====
  images: {
    domains: [
      'localhost',
      'saler.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'github.com',
      'res.cloudinary.com',
      'images.unsplash.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Performance optimizations
    unoptimized: process.env.NODE_ENV === 'development'
  },

  // ==== ASSET PREFIX & CDN ====
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_CDN_URL : '',
  
  // ==== BUILD OPTIMIZATIONS ====
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Optimize styled-components
    styledComponents: true
  },

  // ==== ENHANCED WEBPACK CONFIGURATION ====
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'dist/bundle-report.html',
          gzipSize: true,
          brotliSize: true
        })
      );
    }

    // Enhanced SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
      issuer: {
        and: [/\.(js|jsx|ts|tsx)$/]
      }
    });

    // Enhanced performance optimizations
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': './src',
        '@/components': './src/components',
        '@/lib': './src/lib',
        '@/hooks': './src/hooks',
        '@/types': './src/types',
        '@/utils': './src/utils',
        '@/store': './src/store'
      };

      // Advanced split chunks strategy (from Vite/Webpack optimization)
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // React ecosystem with highest priority
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            name: 'react-vendor',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // UI libraries (from Vite config)
          'ui-vendor': {
            test: /[\\/]node_modules[\\/](@radix-ui[\\/]|framer-motion|lucide-react)[\\/]/,
            name: 'ui-vendor',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Utilities (from Vite config)
          utilities: {
            test: /[\\/]node_modules[\\/](date-fns|lodash-es|axios|clsx|tailwind-merge)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 18,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Charts and data visualization (from Vite config)
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3|@visx)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Heavy vendor libraries (from Vite config)
          'heavy-vendor': {
            test: /[\\/]node_modules[\\/](moment|chart.js|react-query)[\\/]/,
            name: 'heavy-vendor',
            chunks: 'all',
            priority: 12,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Common chunks for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 8,
            reuseExistingChunk: true
          },
          
          // Application utilities
          utils: {
            test: /[\\/]src[\\/]lib[\\/]/,
            name: 'app-utils',
            chunks: 'all',
            priority: 8,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Application components
          components: {
            test: /[\\/]src[\\/]components[\\/]/,
            name: 'app-components',
            chunks: 'all',
            priority: 8,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Async chunks
          'async-chunks': {
            name: 'async',
            minChunks: 1,
            chunks: 'async',
            priority: 1,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      };

      // Runtime chunk optimization
      config.optimization.runtimeChunk = {
        name: 'runtime'
      };

      // Performance hints
      config.performance = {
        maxEntrypointSize: 1000 * 1024, // 1MB
        maxAssetSize: 1000 * 1024, // 1MB
        hints: 'warning'
      };

      // Advanced optimization settings (from Vite/Webpack)
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.concatenateModules = true;
      config.optimization.innerGraph = true;
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
      config.optimization.mangleExports = 'deterministic';
    }

    // Server-side optimizations
    if (isServer) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.concatenateModules = true;
    }

    // Enhanced asset handling (from Webpack config)
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'fonts/[name].[hash][ext]'
      }
    });

    // Enhanced image handling
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif|svg)$/,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 8 * 1024 // 8kb
        }
      },
      generator: {
        filename: 'images/[name].[hash][ext]'
      }
    });

    // Performance monitoring and compression (from Webpack config)
    if (!dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          '__DEV__': JSON.stringify(false),
          '__PROD__': JSON.stringify(true),
          '__BUILD_TIME__': JSON.stringify(new Date().toISOString())
        })
      );
      
      // Enable compression
      const CompressionPlugin = require('compression-webpack-plugin');
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        }),
        new CompressionPlugin({
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: { level: 11 },
          threshold: 8192,
          minRatio: 0.8
        })
      );
    }

    // Development optimizations
    if (dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          '__DEV__': JSON.stringify(true),
          '__PROD__': JSON.stringify(false),
          '__BUILD_TIME__': JSON.stringify(new Date().toISOString())
        })
      );
    }

    return config;
  },

  // ==== ENHANCED HEAD CONFIGURATION ====
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Enhanced security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.saler.com wss://api.saler.com; media-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'self' blob:;"
          },
          // Enhanced performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Performance-Optimizations',
            value: 'enabled'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding'
          }
        ]
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*\\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2))$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },

  // ==== REDIRECTS & rewrites ====
  async redirects() {
    return [];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
      }
    ];
  },

  // ==== CONFIGURATION OPTIMIZATIONS ====
  trailingSlash: false,
  distDir: '.next',

  // ==== ENHANCED BUILD ID ====
  generateBuildId: async () => {
    return 'saler-build-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },

  // ==== ESLINT CONFIGURATION ====
  eslint: {
    dirs: ['pages', 'utils', 'src'],
    ignoreDuringBuilds: false
  },

  // ==== TYPESCRIPT CONFIGURATION ====
  typescript: {
    ignoreBuildErrors: false
  },

  // ==== ENHANCED ANALYTICS ====
  analyticsId: process.env.VERCEL_ANALYTICS_ID,

  // ==== OUTPUT CONFIGURATION ====
  // output: 'standalone', // Enable for containerized deployments

  // ==== SERVER RUNTIME CONFIGURATION ====
  serverRuntimeConfig: {
    // Will only be available on the server-side
    mySecret: 'secret',
    // Performance settings
    compression: true,
    keepAlive: true
  },

  // ==== PUBLIC CONFIGURATION ====
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
    // Performance settings
    enableGzip: true
  },

  // ==== COMPILER OPTIMIZATIONS ====
  compiler: {
    // Remove console in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Optimize styled-components
    styledComponents: true,
    // React compiler optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Remove React development warnings in production
    noEmitOnError: process.env.NODE_ENV === 'production'
  }
};

// Export with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);