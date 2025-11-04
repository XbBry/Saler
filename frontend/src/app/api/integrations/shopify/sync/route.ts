import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SyncRequestSchema = z.object({
  dataTypes: z.array(z.enum(['products', 'customers', 'orders'])).optional().default(['products', 'customers', 'orders'])
});

type SyncRequest = z.infer<typeof SyncRequestSchema>;

// Mock sync status
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

async function simulateSync(dataTypes: string[]): Promise<{ success: boolean; recordsProcessed: number; errors: string[] }> {
  let totalRecordsProcessed = 0;
  const errors: string[] = [];

  // Increment active syncs
  mockSyncStatus.activeSyncs++;

  try {
    // Simulate sync for each data type
    for (let i = 0; i < dataTypes.length; i++) {
      const dataType = dataTypes[i];
      
      // Add to sync history as in progress
      const syncId = `sync-${Date.now()}-${dataType}`;
      mockSyncStatus.syncHistory.unshift({
        id: syncId,
        type: dataType as 'products' | 'customers' | 'orders',
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        recordsProcessed: 0
      });

      try {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Mock sync results
        const recordsProcessed = Math.floor(Math.random() * 500) + 50;
        totalRecordsProcessed += recordsProcessed;

        // Update sync history entry
        const historyIndex = mockSyncStatus.syncHistory.findIndex(h => h.id === syncId);
        if (historyIndex !== -1) {
          mockSyncStatus.syncHistory[historyIndex] = {
            ...mockSyncStatus.syncHistory[historyIndex],
            status: 'success',
            completedAt: new Date().toISOString(),
            recordsProcessed
          };
        }

      } catch (error) {
        const errorMessage = `Failed to sync ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);

        // Update sync history entry as failed
        const historyIndex = mockSyncStatus.syncHistory.findIndex(h => h.id === syncId);
        if (historyIndex !== -1) {
          mockSyncStatus.syncHistory[historyIndex] = {
            ...mockSyncStatus.syncHistory[historyIndex],
            status: 'failed',
            completedAt: new Date().toISOString(),
            recordsProcessed: 0,
            error: errorMessage
          };
        }
      }
    }

    // Update overall sync status
    mockSyncStatus.lastSync = new Date().toLocaleString('ar-SA');
    mockSyncStatus.totalRecords += totalRecordsProcessed;
    
    if (errors.length > 0) {
      mockSyncStatus.failedSyncs++;
    }

    // Keep only last 20 sync history entries
    mockSyncStatus.syncHistory = mockSyncStatus.syncHistory.slice(0, 20);

    return {
      success: errors.length === 0,
      recordsProcessed: totalRecordsProcessed,
      errors
    };

  } finally {
    // Decrement active syncs
    mockSyncStatus.activeSyncs = Math.max(0, mockSyncStatus.activeSyncs - 1);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataTypes } = SyncRequestSchema.parse(body);

    // Start sync process
    const syncPromise = simulateSync(dataTypes);
    
    // Return immediately with sync started confirmation
    const syncResult = await syncPromise;

    return NextResponse.json({
      success: true,
      message: syncResult.success ? 'Sync completed successfully' : 'Sync completed with errors',
      data: {
        recordsProcessed: syncResult.recordsProcessed,
        errors: syncResult.errors,
        syncStatus: {
          lastSync: mockSyncStatus.lastSync,
          activeSyncs: mockSyncStatus.activeSyncs,
          totalRecords: mockSyncStatus.totalRecords,
          failedSyncs: mockSyncStatus.failedSyncs
        }
      }
    });

  } catch (error) {
    console.error('Error triggering Shopify sync:', error);

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

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      syncStatus: mockSyncStatus
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
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