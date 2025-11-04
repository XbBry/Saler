import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ShopifyConfigSchema } from '../route';

const TestConnectionSchema = ShopifyConfigSchema;

async function testShopifyConnection(config: any): Promise<{
  success: boolean;
  storeInfo?: any;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Validate Shopify API credentials format
    if (!config.apiKey.trim()) {
      throw new Error('API Key is required');
    }

    if (!config.apiKey.startsWith('shppa_')) {
      throw new Error('Invalid Shopify API key format. Must start with "shppa_"');
    }

    if (!config.storeUrl.includes('.myshopify.com')) {
      throw new Error('Store URL must be a valid Shopify store URL ending with ".myshopify.com"');
    }

    // Simulate API call to Shopify
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Mock connection validation
    const storeUrl = config.storeUrl.replace('https://', '').replace('http://', '');
    const storeName = storeUrl.split('.')[0];

    // Simulate occasional connection failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Connection timeout - Shopify server not responding');
    }

    // Mock rate limiting (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Rate limit exceeded - too many requests');
    }

    // Mock successful connection
    const storeInfo = {
      name: `متجر ${storeName}`,
      currency: 'USD',
      timezone: 'UTC+3',
      country: 'SA',
      email: `owner@${storeName}.myshopify.com`,
      plan: 'Basic Plan',
      shopifyVersion: '2024-07',
      apiVersion: '2024-07'
    };

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      storeInfo,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      responseTime
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = TestConnectionSchema.parse(body);

    // Test connection
    const result = await testShopifyConnection(config);

    const responseTime = result.responseTime || 0;

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'تم الاتصال بـ Shopify بنجاح',
        storeInfo: result.storeInfo,
        metrics: {
          responseTime,
          testedAt: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'فشل في الاتصال بـ Shopify',
        error: result.error,
        metrics: {
          responseTime,
          testedAt: new Date().toISOString()
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error testing Shopify connection:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'بيانات غير صحيحة',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'خطأ في الخادم الداخلي',
        testedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for connection health check
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Shopify connection test endpoint',
      methods: {
        'POST': 'Test connection with configuration'
      },
      example: {
        apiKey: 'shppa_xxxxxxxxxxxxxxxxxxxxxx',
        storeUrl: 'https://your-store.myshopify.com'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/integrations/shopify/test:', error);
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