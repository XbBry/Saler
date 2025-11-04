import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ShopifyConfigSchema } from '../route';

const UpdateConfigSchema = z.object({
  config: ShopifyConfigSchema
});

// Mock database
let mockConfig: any = null;

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error fetching Shopify config:', error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = UpdateConfigSchema.parse(body);

    // Save configuration (in production, save to database)
    mockConfig = config;

    // Generate webhook URLs based on request origin
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    const baseUrl = origin || 'https://saler.app';

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
    console.error('Error saving Shopify config:', error);

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