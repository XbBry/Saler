import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ===============================
// Types and Schemas
// ===============================

const ShopifyConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  storeUrl: z.string().url('Valid store URL is required').refine(
    (url) => url.includes('.myshopify.com'),
    'Store URL must be a Shopify store'
  ),
  privateAppName: z.string().min(1, 'Private app name is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  webhooks: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()),
    secret: z.string().min(8, 'Webhook secret must be at least 8 characters')
  }),
  syncSettings: z.object({
    autoSync: z.boolean(),
    frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']),
    conflictResolution: z.enum(['shopify', 'saler', 'manual']),
    importProducts: z.boolean(),
    importCustomers: z.boolean(),
    importOrders: z.boolean()
  }),
  fieldMapping: z.object({
    customer: z.record(z.string()),
    order: z.record(z.string()),
    product: z.record(z.string())
  })
});

const TestConnectionSchema = ShopifyConfigSchema;

// Type definitions
type ShopifyConfig = z.infer<typeof ShopifyConfigSchema>;
type ShopifyConnection = {
  status: 'connected' | 'disconnected' | 'error';
  lastTestAt?: string;
  error?: string;
  storeInfo?: {
    name: string;
    currency: string;
    timezone: string;
    country: string;
  };
};

// Mock database - In production, this would be a real database
let mockConfig: ShopifyConfig | null = null;
let mockSyncStatus = {
  lastSync: 'لم يتم المزامنة بعد',
  syncProgress: 0,
  activeSyncs: 0,
  failedSyncs: 0,
  totalRecords: 0,
  syncHistory: [] as Array<{
    id: string;
    type: 'products' | 'customers' | 'orders';
    status: 'success' | 'failed' | 'in_progress';
    startedAt: string;
    completedAt?: string;
    recordsProcessed: number;
    error?: string;
  }>
};

// ===============================
// Utility Functions
// ===============================

async function simulateApiCall(delay: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function testShopifyConnection(config: ShopifyConfig): Promise<ShopifyConnection> {
  try {
    // Validate Shopify API credentials (simplified)
    if (!config.apiKey.startsWith('shppa_')) {
      throw new Error('Invalid Shopify API key format');
    }

    if (!config.storeUrl.includes('.myshopify.com')) {
      throw new Error('Invalid Shopify store URL');
    }

    // Simulate API call to Shopify
    await simulateApiCall(2000);

    // Mock store info (in production, this would be actual Shopify API call)
    const mockStoreInfo = {
      name: 'متجر تجريبي',
      currency: 'USD',
      timezone: 'UTC',
      country: 'US'
    };

    return {
      status: 'connected',
      lastTestAt: new Date().toISOString(),
      storeInfo: mockStoreInfo
    };
  } catch (error) {
    return {
      status: 'error',
      lastTestAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

async function performShopifySync(dataTypes: string[]): Promise<{ success: boolean; recordsProcessed: number; errors: string[] }> {
  try {
    let totalRecordsProcessed = 0;
    const errors: string[] = [];

    // Simulate sync for each data type
    for (const dataType of dataTypes) {
      try {
        // Simulate processing delay
        await simulateApiCall(1500);

        // Mock sync process
        const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
        totalRecordsProcessed += recordsProcessed;

        // Add to sync history
        mockSyncStatus.syncHistory.unshift({
          id: `sync-${Date.now()}-${dataType}`,
          type: dataType as 'products' | 'customers' | 'orders',
          status: 'success',
          startedAt: new Date(Date.now() - 1500).toISOString(),
          completedAt: new Date().toISOString(),
          recordsProcessed
        });

        // Keep only last 10 sync history entries
        mockSyncStatus.syncHistory = mockSyncStatus.syncHistory.slice(0, 10);

      } catch (error) {
        const errorMessage = `Failed to sync ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);

        // Add failed sync to history
        mockSyncStatus.syncHistory.unshift({
          id: `sync-${Date.now()}-${dataType}`,
          type: dataType as 'products' | 'customers' | 'orders',
          status: 'failed',
          startedAt: new Date().toISOString(),
          recordsProcessed: 0,
          error: errorMessage
        });
      }
    }

    // Update sync status
    mockSyncStatus.lastSync = new Date().toLocaleString('ar-SA');
    mockSyncStatus.totalRecords += totalRecordsProcessed;

    return {
      success: errors.length === 0,
      recordsProcessed: totalRecordsProcessed,
      errors
    };
  } catch (error) {
    return {
      success: false,
      recordsProcessed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown sync error']
    };
  }
}

// ===============================
// API Route Handlers
// ===============================

// GET /api/integrations/shopify
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'config':
        // Return current configuration
        return NextResponse.json({
          success: true,
          config: mockConfig || {
            apiKey: '',
            storeUrl: '',
            privateAppName: 'Saler Integration',
            permissions: ['read_products', 'read_orders', 'read_customers', 'write_orders'],
            webhooks: {
              enabled: true,
              events: ['orders/create', 'orders/updated', 'customers/create', 'customers/update', 'products/create', 'products/update'],
              secret: ''
            },
            syncSettings: {
              autoSync: true,
              frequency: 'realtime',
              conflictResolution: 'shopify',
              importProducts: true,
              importCustomers: true,
              importOrders: true
            },
            fieldMapping: {
              customer: {
                'first_name': 'first_name',
                'last_name': 'last_name',
                'email': 'email',
                'phone': 'phone',
                'total_spent': 'score'
              },
              order: {
                'name': 'source',
                'total_price': 'score',
                'financial_status': 'status',
                'fulfillment_status': 'status'
              },
              product: {
                'title': 'name',
                'vendor': 'source',
                'product_type': 'tags'
              }
            }
          }
        });

      case 'sync-status':
        // Return sync status
        return NextResponse.json({
          success: true,
          syncStatus: mockSyncStatus
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Shopify Integration API',
          endpoints: {
            'GET /api/integrations/shopify?action=config': 'Get configuration',
            'GET /api/integrations/shopify?action=sync-status': 'Get sync status',
            'POST /api/integrations/shopify': 'Test connection',
            'PUT /api/integrations/shopify': 'Save configuration',
            'POST /api/integrations/shopify/sync': 'Trigger sync'
          }
        });
    }
  } catch (error) {
    console.error('Error in GET /api/integrations/shopify:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/integrations/shopify
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'test') {
      // Test connection
      const body = await request.json();
      const config = TestConnectionSchema.parse(body);

      const connection = await testShopifyConnection(config);

      return NextResponse.json({
        success: connection.status === 'connected',
        connection,
        message: connection.status === 'connected' 
          ? 'Connection successful' 
          : 'Connection failed'
      });
    }

    // Default: Save configuration
    const body = await request.json();
    const config = ShopifyConfigSchema.parse(body.config);

    // Save configuration (in production, save to database)
    mockConfig = config;

    // Generate webhook URLs based on request origin
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    const baseUrl = origin || 'https://saler.app';

    // Save webhook secret if provided
    if (config.webhooks.secret) {
      mockConfig.webhooks.secret = config.webhooks.secret;
    }

    return NextResponse.json({
      success: true,
      config: mockConfig,
      webhookUrls: {
        orders: `${baseUrl}/api/integrations/shopify/webhooks/orders`,
        customers: `${baseUrl}/api/integrations/shopify/webhooks/customers`,
        products: `${baseUrl}/api/integrations/shopify/webhooks/products`
      },
      message: 'Configuration saved successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/integrations/shopify:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/integrations/shopify (alternative to POST for saving config)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const config = ShopifyConfigSchema.parse(body.config);

    // Save configuration
    mockConfig = config;

    return NextResponse.json({
      success: true,
      config: mockConfig,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/integrations/shopify:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations/shopify (for partial updates)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Merge with existing config
    const updatedConfig = {
      ...mockConfig,
      ...body.config
    };

    const config = ShopifyConfigSchema.parse(updatedConfig);
    mockConfig = config;

    return NextResponse.json({
      success: true,
      config: mockConfig,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error in PATCH /api/integrations/shopify:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/shopify
export async function DELETE(request: NextRequest) {
  try {
    // Clear configuration
    mockConfig = null;
    mockSyncStatus = {
      lastSync: 'لم يتم المزامنة بعد',
      syncProgress: 0,
      activeSyncs: 0,
      failedSyncs: 0,
      totalRecords: 0,
      syncHistory: []
    };

    return NextResponse.json({
      success: true,
      message: 'Shopify integration removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/integrations/shopify:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}