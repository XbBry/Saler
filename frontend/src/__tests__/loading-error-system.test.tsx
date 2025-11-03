/**
 * Comprehensive Tests for Loading States and Error Boundaries System
 * اختبارات شاملة لنظام حالات التحميل ومعالجة الأخطاء
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Test utilities and setup
import {
  LoadingProvider,
  ApplicationErrorBoundary,
  ComponentErrorBoundary,
  NetworkErrorBoundary,
  useLoading,
  useLoadingState,
  useFormLoading,
  CircularProgress,
  LinearProgress,
  SkeletonCard,
  StepProgress,
  GlobalLoadingOverlay,
  useGlobalLoading
} from '../src/components/loading';

// Mock performance API
global.performance = {
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now())
};

// Mock intersection observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

describe('Loading States and Error Boundaries System', () => {
  // Test Loading Provider
  describe('LoadingProvider', () => {
    test('should provide loading context', () => {
      let contextValue;
      
      function TestComponent() {
        contextValue = useLoading();
        return <div>Test</div>;
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.setLoading).toBeDefined();
      expect(contextValue.isLoading).toBeDefined();
      expect(contextValue.withLoading).toBeDefined();
    });

    test('should handle loading operations', async () => {
      function TestComponent() {
        const { setLoading, isLoading } = useLoading();
        const [loadingKey, setLoadingKey] = React.useState('test');

        return (
          <div>
            <button 
              data-testid="start-loading"
              onClick={() => setLoading(loadingKey, true, { message: 'Testing...' })}
            >
              Start Loading
            </button>
            <button 
              data-testid="stop-loading"
              onClick={() => setLoading(loadingKey, false)}
            >
              Stop Loading
            </button>
            <span data-testid="loading-status">
              {isLoading(loadingKey) ? 'Loading' : 'Not Loading'}
            </span>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      
      fireEvent.click(screen.getByTestId('start-loading'));
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
      
      fireEvent.click(screen.getByTestId('stop-loading'));
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });

    test('should handle progress updates', async () => {
      function TestComponent() {
        const { setProgress, getLoadingState } = useLoading();
        const [key] = React.useState('progress-test');

        return (
          <div>
            <button 
              data-testid="update-progress"
              onClick={() => setProgress(key, 50, '50% complete')}
            >
              Update Progress
            </button>
            <span data-testid="progress-value">
              {getLoadingState(key)?.progress || 0}
            </span>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      fireEvent.click(screen.getByTestId('update-progress'));
      expect(screen.getByTestId('progress-value')).toHaveTextContent('50');
    });
  });

  // Test Loading Components
  describe('LoadingComponents', () => {
    test('should render LoadingSpinner correctly', () => {
      render(<CircularProgress progress={75} size={100} color="#3182ce" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });

    test('should render LinearProgress correctly', () => {
      render(<LinearProgress progress={60} height={8} />);
      const progressBar = document.querySelector('.linear-progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '60%' });
    });

    test('should render SkeletonCard correctly', () => {
      render(<SkeletonCard />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    test('should render StepProgress correctly', () => {
      const steps = [
        { label: 'Step 1', status: 'completed' as const },
        { label: 'Step 2', status: 'active' as const },
        { label: 'Step 3', status: 'pending' as const }
      ];

      render(<StepProgress steps={steps} currentStep={1} />);
      
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });
  });

  // Test Loading Hooks
  describe('Loading Hooks', () => {
    test('useLoadingState should manage loading state', () => {
      function TestComponent() {
        const { state, startLoading, updateProgress } = useLoadingState(
          'test-operation',
          { enableProgress: true, timeout: 5000 }
        );

        return (
          <div>
            <span data-testid="loading-status">{state.isLoading ? 'Loading' : 'Idle'}</span>
            <span data-testid="progress">{state.progress}</span>
            <button 
              data-testid="start"
              onClick={() => startLoading('Starting...')}
            >
              Start
            </button>
            <button 
              data-testid="progress"
              onClick={() => updateProgress(50, 'Half way')}
            >
              Update Progress
            </button>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(screen.getByTestId('loading-status')).toHaveTextContent('Idle');
      expect(screen.getByTestId('progress')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('start'));
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');

      fireEvent.click(screen.getByTestId('progress'));
      expect(screen.getByTestId('progress')).toHaveTextContent('50');
    });

    test('useFormLoading should manage form submission state', () => {
      function TestComponent() {
        const { state, startSubmission, completeSubmission } = useFormLoading();

        return (
          <div>
            <span data-testid="submitting">{state.isSubmitting ? 'Submitting' : 'Ready'}</span>
            <span data-testid="progress">{state.submitProgress}%</span>
            <button 
              data-testid="submit"
              onClick={() => {
                startSubmission('Submitting form...');
                setTimeout(() => completeSubmission(), 100);
              }}
            >
              Submit
            </button>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(screen.getByTestId('submitting')).toHaveTextContent('Ready');
      expect(screen.getByTestId('progress')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('submit'));
      expect(screen.getByTestId('submitting')).toHaveTextContent('Submitting');
    });
  });

  // Test Error Boundaries
  describe('Error Boundaries', () => {
    test('ApplicationErrorBoundary should catch errors', () => {
      function ErrorComponent() {
        throw new Error('Test error');
        return <div>This won't render</div>;
      }

      function TestComponent() {
        return (
          <ApplicationErrorBoundary
            maxRetries={0}
            enableErrorReporting={false}
          >
            <ErrorComponent />
          </ApplicationErrorBoundary>
        );
      }

      render(<TestComponent />);
      
      expect(screen.getByText(/حدث خطأ غير متوقع/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إعادة المحاولة/i })).toBeInTheDocument();
    });

    test('ComponentErrorBoundary should handle component errors', () => {
      function ErrorComponent() {
        throw new Error('Component error');
        return <div>This won't render</div>;
      }

      function TestComponent() {
        return (
          <ComponentErrorBoundary
            maxRetries={0}
            enableErrorReporting={false}
          >
            <ErrorComponent />
          </ComponentErrorBoundary>
        );
      }

      render(<TestComponent />);
      
      expect(screen.getByText(/حدث خطأ/i)).toBeInTheDocument();
    });

    test('ErrorBoundary should allow retry', async () => {
      let renderCount = 0;
      
      function SometimesErrorComponent() {
        renderCount++;
        if (renderCount === 1) {
          throw new Error('First render error');
        }
        return <div>Success!</div>;
      }

      function TestComponent() {
        return (
          <ComponentErrorBoundary
            maxRetries={1}
            retryDelay={100}
            enableErrorReporting={false}
          >
            <SometimesErrorComponent />
          </ComponentErrorBoundary>
        );
      }

      render(<TestComponent />);
      
      // Should show error on first render
      expect(screen.getByText(/حدث خطأ/i)).toBeInTheDocument();
      
      // Click retry button
      const retryButton = screen.getByRole('button', { name: /إعادة المحاولة/i });
      fireEvent.click(retryButton);
      
      // Should recover after retry
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  // Test Global State Management
  describe('Global State Management', () => {
    test('should manage global loading state', () => {
      function TestComponent() {
        const { isGlobalLoading, activeOperations, setGlobalLoading } = useGlobalLoading();

        return (
          <div>
            <span data-testid="global-status">
              {isGlobalLoading ? 'Global Loading' : 'Idle'}
            </span>
            <span data-testid="active-count">{activeOperations.length}</span>
            <button 
              data-testid="set-global"
              onClick={() => setGlobalLoading(true, 'Global operation')}
            >
              Set Global
            </button>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(screen.getByTestId('global-status')).toHaveTextContent('Idle');
      expect(screen.getByTestId('active-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('set-global'));
      expect(screen.getByTestId('global-status')).toHaveTextContent('Global Loading');
      expect(screen.getByTestId('active-count')).toHaveTextContent('1');
    });
  });

  // Test Performance Monitoring
  describe('Performance Monitoring', () => {
    test('should monitor component performance', async () => {
      let metrics = null;

      function TestComponent() {
        const { usePerformanceMonitor } = require('../src/hooks/usePerformance');
        metrics = usePerformanceMonitor('TestComponent');
        return <div>Test content</div>;
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(metrics).toBeDefined();
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.updateCount).toBe(1);
    });
  });

  // Test Edge Cases
  describe('Edge Cases', () => {
    test('should handle multiple concurrent loading operations', () => {
      function TestComponent() {
        const { setLoading, isLoading } = useLoading();

        return (
          <div>
            <button onClick={() => setLoading('op1', true)}>Start Op 1</button>
            <button onClick={() => setLoading('op2', true)}>Start Op 2</button>
            <button onClick={() => setLoading('op1', false)}>Stop Op 1</button>
            <span data-testid="op1">{isLoading('op1') ? 'Loading' : 'Idle'}</span>
            <span data-testid="op2">{isLoading('op2') ? 'Loading' : 'Idle'}</span>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(screen.getByTestId('op1')).toHaveTextContent('Idle');
      expect(screen.getByTestId('op2')).toHaveTextContent('Idle');

      fireEvent.click(screen.getByTestId('op1'));
      fireEvent.click(screen.getByTestId('op2'));
      
      expect(screen.getByTestId('op1')).toHaveTextContent('Loading');
      expect(screen.getByTestId('op2')).toHaveTextContent('Loading');

      fireEvent.click(screen.getByTestId('op1'));
      expect(screen.getByTestId('op1')).toHaveTextContent('Idle');
      expect(screen.getByTestId('op2')).toHaveTextContent('Loading');
    });

    test('should handle timeout scenarios', async () => {
      jest.useFakeTimers();

      function TestComponent() {
        const { state } = useLoadingState('timeout-test', { timeout: 1000 });

        return (
          <div>
            <span data-testid="is-loading">{state.isLoading ? 'Loading' : 'Idle'}</span>
            <span data-testid="error">{state.error || 'No error'}</span>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      // Simulate timeout
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(/انتهت مهلة الانتظار/i);
      });

      jest.useRealTimers();
    });

    test('should handle network errors gracefully', () => {
      function TestComponent() {
        return (
          <NetworkErrorBoundary
            maxRetries={0}
            enableErrorReporting={false}
          >
            <div>Network dependent content</div>
          </NetworkErrorBoundary>
        );
      }

      // Simulate network offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<TestComponent />);
      
      // Network error boundary should handle offline state
      expect(document.body.textContent).toContain('Network dependent content');

      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });
  });

  // Test Accessibility
  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<CircularProgress progress={75} />);
      
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    test('should announce loading states to screen readers', () => {
      function TestComponent() {
        const { state } = useLoadingState('a11y-test');

        return (
          <div>
            <div aria-live="polite" aria-atomic="true">
              {state.isLoading ? state.message : 'Ready'}
            </div>
          </div>
        );
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
  });

  // Test Memory Leaks
  describe('Memory Management', () => {
    test('should clean up subscriptions on unmount', () => {
      const cleanup = jest.fn();
      jest.spyOn(React, 'useEffect').mockImplementation((effect) => {
        const cleanupEffect = effect();
        if (typeof cleanupEffect === 'function') {
          jest.spyOn(React, 'useEffect').mockImplementation(() => cleanupEffect);
        }
        return cleanup;
      });

      function TestComponent() {
        const { startLoading } = useLoadingState('cleanup-test');
        React.useEffect(() => {
          startLoading('Testing cleanup');
        }, []);
        
        return <div>Test</div>;
      }

      const { unmount } = render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );

      unmount();
      expect(cleanup).toHaveBeenCalled();
    });
  });
});

// Integration Tests
describe('Integration Tests', () => {
  test('should work together as a complete system', async () => {
    function ComplexComponent() {
      const { state, startLoading, updateProgress, completeLoading } = useLoadingState(
        'complex-operation',
        { enableProgress: true }
      );

      const handleComplexOperation = async () => {
        startLoading('Starting complex operation...');
        
        updateProgress(25, 'Loading data...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        updateProgress(50, 'Processing...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        updateProgress(75, 'Finalizing...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        completeLoading();
      };

      return (
        <div>
          <div aria-live="polite">{state.message}</div>
          <div data-testid="progress">{state.progress}%</div>
          <button onClick={handleComplexOperation}>Start Complex</button>
        </div>
      );
    }

    render(
      <LoadingProvider>
        <ComplexComponent />
      </LoadingProvider>
    );

    fireEvent.click(screen.getByText('Start Complex'));
    
    await waitFor(() => {
      expect(screen.getByTestId('progress')).toHaveTextContent('25%');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('progress')).toHaveTextContent('50%');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('progress')).toHaveTextContent('75%');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('progress')).toHaveTextContent('100%');
    });
  });
});

// Performance Benchmarks
describe('Performance Benchmarks', () => {
  test('should render within acceptable time', () => {
    const startTime = performance.now();
    
    render(
      <LoadingProvider>
        <CircularProgress progress={50} />
        <LinearProgress progress={75} />
        <SkeletonCard />
        <StepProgress 
          steps={[
            { label: 'Step 1', status: 'completed' },
            { label: 'Step 2', status: 'active' }
          ]}
        />
      </LoadingProvider>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within 16ms (60fps) ideally, but allow 50ms for test environment
    expect(renderTime).toBeLessThan(50);
  });
});

export default {
  // Export test utilities
  createMockError: () => new Error('Mock error for testing'),
  createMockLoadingOperation: () => ({
    id: 'test-op',
    key: 'test-key',
    type: 'api' as const,
    isActive: true,
    progress: 50,
    message: 'Testing...',
    startedAt: Date.now(),
    priority: 'medium' as const,
    retryCount: 0,
    maxRetries: 3,
    status: 'running' as const
  }),
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),
  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0))
};