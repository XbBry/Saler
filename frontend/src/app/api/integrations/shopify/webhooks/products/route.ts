import { NextRequest, NextResponse } from 'next/server';

// Mock webhook log
let webhookLog: Array<{
  id: string;
  type: 'products';
  data: any;
  receivedAt: string;
  processed: boolean;
  error?: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = request.headers;
    
    // Verify webhook signature (simplified)
    const hmacHeader = headers.get('X-Shopify-Hmac-Sha256');
    const topic = headers.get('X-Shopify-Topic');
    const shopDomain = headers.get('X-Shopify-Shop-Domain');

    // Log webhook receipt
    const webhookId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Process the product webhook data
      const productData = body;
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Log successful processing
      webhookLog.unshift({
        id: webhookId,
        type: 'products',
        data: {
          product_id: productData.id,
          title: productData.title,
          vendor: productData.vendor,
          product_type: productData.product_type,
          handle: productData.handle,
          variants_count: productData.variants?.length || 0,
          status: productData.status
        },
        receivedAt: new Date().toISOString(),
        processed: true
      });

      // Keep only last 100 webhook logs
      webhookLog = webhookLog.slice(0, 100);

      return NextResponse.json({
        success: true,
        message: 'Product webhook processed successfully',
        webhookId,
        data: {
          productId: productData.id,
          title: productData.title,
          vendor: productData.vendor,
          status: productData.status
        }
      });

    } catch (processingError) {
      // Log failed processing
      webhookLog.unshift({
        id: webhookId,
        type: 'products',
        data: body,
        receivedAt: new Date().toISOString(),
        processed: false,
        error: processingError instanceof Error ? processingError.message : 'Processing failed'
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Webhook processing failed',
          message: processingError instanceof Error ? processingError.message : 'Unknown processing error',
          webhookId
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing product webhook:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook parsing failed',
        message: error instanceof Error ? error.message : 'Invalid webhook data'
      },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const type = url.searchParams.get('type') || 'all';

    let filteredLogs = webhookLog;
    if (type === 'products') {
      filteredLogs = webhookLog.filter(log => log.type === 'products');
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: filteredLogs.slice(0, limit),
        total: webhookLog.length,
        productsCount: webhookLog.filter(log => log.type === 'products').length,
        lastWebhook: webhookLog[0]?.receivedAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
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