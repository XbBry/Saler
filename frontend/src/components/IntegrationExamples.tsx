/**
 * مثال شامل لاستخدام نظام إدارة التكاملات
 * Complete example for using the integration management system
 */

import React, { useState } from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import {
  Integration,
  IntegrationOperation,
  IntegrationStats,
} from '../hooks/useIntegrations';

// ===============================
// Example Component: Integration Dashboard
// مثال: لوحة تحكم التكاملات
// ===============================

export function IntegrationDashboard() {
  const {
    integrations,
    stats,
    isLoading,
    isError,
    error,
    filters,
    setFilters,
    activeOperations,
    
    // Actions
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncIntegration,
    pushData,
    pullData,
    cancelOperation,
    retryOperation,
    refresh,
  } = useIntegrations({
    autoRefresh: true,
    refreshInterval: 30000,
    enableMetrics: true,
    enableHealthChecks: true,
  });

  // ===============================
  // Example: Create New Integration
  // مثال: إنشاء تكامل جديد
  // ===============================

  const handleCreateIntegration = async () => {
    const newIntegration = {
      name: 'Salesforce CRM',
      type: 'crm' as const,
      config: {
        instanceUrl: 'https://mydomain.salesforce.com',
        apiVersion: 'v58.0',
      },
      credentials: {
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
      },
    };

    try {
      await createIntegration(newIntegration);
    } catch (error) {
      console.error('Failed to create integration:', error);
    }
  };

  // ===============================
  // Example: Test Connection
  // مثال: اختبار الاتصال
  // ===============================

  const handleTestConnection = async (integrationId: string) => {
    try {
      const isConnected = await testConnection(integrationId);
      if (isConnected) {
        console.log('Connection successful!');
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // ===============================
  // Example: Sync Integration Data
  // مثال: مزامنة بيانات التكامل
  // ===============================

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      const operation = await syncIntegration(integrationId, {
        direction: 'both',
        dataTypes: ['contacts', 'deals', 'activities'],
      });
      
      console.log('Sync operation:', operation);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // ===============================
  // Example: Push Data to Integration
  // مثال: إرسال بيانات إلى التكامل
  // ===============================

  const handlePushData = async (integrationId: string) => {
    const data = {
      contact: {
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'ahmed@example.com',
        phone: '+966501234567',
      },
    };

    try {
      const result = await pushData(integrationId, data, 'contacts');
      console.log('Data pushed successfully:', result);
    } catch (error) {
      console.error('Push failed:', error);
    }
  };

  // ===============================
  // Example: Pull Data from Integration
  // مثال: جلب بيانات من التكامل
  // ===============================

  const handlePullData = async (integrationId: string) => {
    const params = {
      limit: 10,
      offset: 0,
      status: 'active',
    };

    try {
      const data = await pullData(integrationId, 'contacts', params);
      console.log('Data pulled successfully:', data);
    } catch (error) {
      console.error('Pull failed:', error);
    }
  };

  // ===============================
  // Example: Filter and Search
  // مثال: الفلترة والبحث
  // ===============================

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  // ===============================
  // UI Components
  // مكونات واجهة المستخدم
  // ===============================

  if (isLoading) {
    return <div>Loading integrations...</div>;
  }

  if (isError) {
    return (
      <div>
        <h2>Error loading integrations</h2>
        <p>{error?.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="integration-dashboard">
      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Integrations</h3>
            <span>{stats.totalIntegrations}</span>
          </div>
          <div className="stat-card">
            <h3>Active</h3>
            <span>{stats.activeIntegrations}</span>
          </div>
          <div className="stat-card">
            <h3>Failed</h3>
            <span>{stats.failedIntegrations}</span>
          </div>
          <div className="stat-card">
            <h3>Success Rate</h3>
            <span>{stats.successRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <select
          value={filters.type || ''}
          onChange={(e) => handleFilterChange({ type: e.target.value as any })}
        >
          <option value="">All Types</option>
          <option value="crm">CRM</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="webhook">Webhook</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ status: e.target.value as any })}
        >
          <option value="">All Statuses</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="error">Error</option>
          <option value="connecting">Connecting</option>
        </select>

        <input
          type="text"
          placeholder="Search integrations..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>

      {/* Integration List */}
      <div className="integrations-list">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onTestConnection={() => handleTestConnection(integration.id)}
            onSync={() => handleSyncIntegration(integration.id)}
            onPushData={() => handlePushData(integration.id)}
            onPullData={() => handlePullData(integration.id)}
            onDelete={() => deleteIntegration(integration.id)}
          />
        ))}
      </div>

      {/* Active Operations */}
      {activeOperations.length > 0 && (
        <div className="active-operations">
          <h3>Active Operations</h3>
          {activeOperations.map((operation) => (
            <OperationCard
              key={operation.id}
              operation={operation}
              onCancel={() => cancelOperation(operation.id)}
              onRetry={() => retryOperation(operation.id)}
            />
          ))}
        </div>
      )}

      {/* Add New Integration Button */}
      <button onClick={handleCreateIntegration} className="add-integration-btn">
        Add New Integration
      </button>
    </div>
  );
}

// ===============================
// Integration Card Component
// مكون بطاقة التكامل
// ===============================

interface IntegrationCardProps {
  integration: Integration;
  onTestConnection: () => void;
  onSync: () => void;
  onPushData: () => void;
  onPullData: () => void;
  onDelete: () => void;
}

function IntegrationCard({
  integration,
  onTestConnection,
  onSync,
  onPushData,
  onPullData,
  onDelete,
}: IntegrationCardProps) {
  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'error':
        return 'red';
      case 'connecting':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <div className="integration-card">
      <div className="card-header">
        <h3>{integration.name}</h3>
        <span className={`status-badge ${integration.status}`}>
          {integration.status}
        </span>
      </div>

      <div className="card-content">
        <p>Type: {integration.type}</p>
        <p>Success Rate: {integration.metrics.successRate}%</p>
        <p>Avg Response: {integration.metrics.averageResponseTime}ms</p>
        <p>Total Requests: {integration.metrics.totalRequests}</p>
        {integration.lastSyncAt && (
          <p>Last Sync: {new Date(integration.lastSyncAt).toLocaleString()}</p>
        )}
        {integration.lastError && (
          <p className="error-message">Error: {integration.lastError}</p>
        )}
      </div>

      <div className="card-actions">
        <button onClick={onTestConnection} disabled={integration.status === 'connecting'}>
          Test Connection
        </button>
        <button onClick={onSync} disabled={integration.status !== 'connected'}>
          Sync Data
        </button>
        <button onClick={onPushData} disabled={integration.status !== 'connected'}>
          Push Data
        </button>
        <button onClick={onPullData} disabled={integration.status !== 'connected'}>
          Pull Data
        </button>
        <button onClick={onDelete} className="danger">
          Delete
        </button>
      </div>
    </div>
  );
}

// ===============================
// Operation Card Component
// مكون بطاقة العملية
// ===============================

interface OperationCardProps {
  operation: IntegrationOperation;
  onCancel: () => void;
  onRetry: () => void;
}

function OperationCard({ operation, onCancel, onRetry }: OperationCardProps) {
  const getStatusColor = (status: IntegrationOperation['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'running':
        return 'blue';
      case 'cancelled':
        return 'gray';
      default:
        return 'orange';
    }
  };

  return (
    <div className="operation-card">
      <div className="operation-header">
        <h4>{operation.type} operation</h4>
        <span className={`status-badge ${operation.status}`}>
          {operation.status}
        </span>
      </div>

      <div className="operation-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${operation.progress}%` }}
          />
        </div>
        <span>{operation.progress}%</span>
      </div>

      {operation.error && (
        <div className="operation-error">
          <p>Error: {operation.error}</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      )}

      <div className="operation-meta">
        <span>Retry Count: {operation.retryCount}</span>
        {operation.startedAt && (
          <span>Started: {new Date(operation.startedAt).toLocaleString()}</span>
        )}
        {operation.completedAt && (
          <span>Completed: {new Date(operation.completedAt).toLocaleString()}</span>
        )}
      </div>

      {operation.status === 'running' && (
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
      )}
    </div>
  );
}

// ===============================
// Example: Advanced Error Handling
// مثال: معالجة الأخطاء المتقدمة
// ===============================

export function AdvancedErrorHandlingExample() {
  const { syncIntegration, testConnection } = useIntegrations();

  const handleAdvancedOperation = async (integrationId: string) => {
    try {
      // Try with custom retry configuration
      const result = await syncIntegration(integrationId);
      console.log('Operation successful:', result);
    } catch (error) {
      // Handle specific error types
      if (error.name === 'RateLimitError') {
        console.log('Rate limited, will retry automatically');
        // Could show a user-friendly message
      } else if (error.name === 'ConnectionError') {
        console.log('Connection issue, check network');
        // Could offer offline mode
      } else if (error.name === 'IntegrationError') {
        console.log('Integration-specific error:', error.code);
        // Could suggest configuration review
      } else {
        console.log('Unexpected error:', error);
        // Could show generic error message
      }
    }
  };

  const handleConnectionTest = async (integrationId: string) => {
    try {
      const isConnected = await testConnection(integrationId);
      
      if (isConnected) {
        console.log('✅ Connection successful');
      } else {
        console.log('❌ Connection failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  return (
    <div className="advanced-example">
      <h2>Advanced Error Handling Example</h2>
      <button onClick={() => handleAdvancedOperation('integration-1')}>
        Advanced Sync with Error Handling
      </button>
      <button onClick={() => handleConnectionTest('integration-1')}>
        Advanced Connection Test
      </button>
    </div>
  );
}

// ===============================
// Example: Performance Monitoring
// مثال: مراقبة الأداء
// ===============================

export function PerformanceMonitoringExample() {
  const { integrations } = useIntegrations();

  const getPerformanceInsights = () => {
    return integrations.map(integration => ({
      name: integration.name,
      performance: {
        successRate: integration.metrics.successRate,
        responseTime: integration.metrics.averageResponseTime,
        reliability: integration.metrics.successRate > 90 ? 'High' : 
                    integration.metrics.successRate > 70 ? 'Medium' : 'Low',
      },
      recommendations: [
        integration.metrics.averageResponseTime > 1000 ? 'Consider optimizing API calls' : null,
        integration.metrics.successRate < 80 ? 'Review error handling' : null,
        integration.metrics.errorCount > 10 ? 'Investigate frequent errors' : null,
      ].filter(Boolean),
    }));
  };

  const insights = getPerformanceInsights();

  return (
    <div className="performance-monitoring">
      <h2>Performance Monitoring</h2>
      {insights.map((insight, index) => (
        <div key={index} className="performance-insight">
          <h3>{insight.name}</h3>
          <div className="metrics">
            <p>Success Rate: {insight.performance.successRate}%</p>
            <p>Response Time: {insight.performance.responseTime}ms</p>
            <p>Reliability: {insight.performance.reliability}</p>
          </div>
          {insight.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {insight.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===============================
// Example: Real-time Operations
// مثال: العمليات في الوقت الفعلي
// ===============================

export function RealtimeOperationsExample() {
  const { activeOperations, cancelOperation } = useIntegrations();

  return (
    <div className="realtime-operations">
      <h2>Real-time Operations</h2>
      
      {activeOperations.length === 0 ? (
        <p>No active operations</p>
      ) : (
        <div className="operations-list">
          {activeOperations.map((operation) => (
            <div key={operation.id} className="realtime-operation">
              <div className="operation-info">
                <strong>{operation.type}</strong> - {operation.status}
              </div>
              
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${operation.progress}%` }}
                  />
                </div>
                <span>{operation.progress}%</span>
              </div>

              <button 
                onClick={() => cancelOperation(operation.id)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IntegrationDashboard;