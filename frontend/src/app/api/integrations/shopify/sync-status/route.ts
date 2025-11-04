import { NextRequest, NextResponse } from 'next/server';

// Mock sync status data
const mockSyncStatus = {
  lastSync: '2025-11-04 02:30:00',
  syncProgress: 75,
  activeSyncs: 1,
  failedSyncs: 2,
  totalRecords: 15420,
  syncHistory: [
    {
      id: 'sync-1730671200000-products',
      type: 'products' as const,
      status: 'success' as const,
      startedAt: '2025-11-04T02:30:00Z',
      completedAt: '2025-11-04T02:31:45Z',
      recordsProcessed: 3420
    },
    {
      id: 'sync-1730670780000-customers',
      type: 'customers' as const,
      status: 'success' as const,
      startedAt: '2025-11-04T02:26:20Z',
      completedAt: '2025-11-04T02:26:58Z',
      recordsProcessed: 2156
    },
    {
      id: 'sync-1730670420000-orders',
      type: 'orders' as const,
      status: 'failed' as const,
      startedAt: '2025-11-04T02:20:20Z',
      completedAt: '2025-11-04T02:21:05Z',
      recordsProcessed: 0,
      error: 'Connection timeout - Shopify API rate limit exceeded'
    },
    {
      id: 'sync-1730669980000-products',
      type: 'products' as const,
      status: 'success' as const,
      startedAt: '2025-11-04T02:12:40Z',
      completedAt: '2025-11-04T02:13:22Z',
      recordsProcessed: 3389
    },
    {
      id: 'sync-1730669600000-customers',
      type: 'customers' as const,
      status: 'success' as const,
      startedAt: '2025-11-04T02:06:40Z',
      completedAt: '2025-11-04T02:07:15Z',
      recordsProcessed: 2134
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Simulate some dynamic updates
    const currentTime = new Date().toISOString();
    const isActiveSync = mockSyncStatus.activeSyncs > 0;
    
    // Simulate progress for active syncs
    if (isActiveSync) {
      mockSyncStatus.syncProgress = Math.min(95, mockSyncStatus.syncProgress + Math.random() * 5);
    } else {
      mockSyncStatus.syncProgress = 0;
    }

    return NextResponse.json({
      success: true,
      syncStatus: {
        ...mockSyncStatus,
        lastChecked: currentTime,
        isActive: isActiveSync
      }
    });
  } catch (error) {
    console.error('Error fetching Shopify sync status:', error);
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

// Optional: POST to reset sync status
export async function POST(request: NextRequest) {
  try {
    // Reset sync status
    mockSyncStatus.syncProgress = 0;
    mockSyncStatus.activeSyncs = 0;
    mockSyncStatus.lastSync = 'لم يتم المزامنة بعد';

    return NextResponse.json({
      success: true,
      message: 'Sync status reset successfully',
      syncStatus: mockSyncStatus
    });
  } catch (error) {
    console.error('Error resetting sync status:', error);
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