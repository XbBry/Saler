/**
 * Advanced Progress Indicators
 * مؤشرات التقدم المتقدمة
 */

import React from 'react';
import { useGlobalLoading } from '../store/loadingStore';
import { useLoading } from './LoadingProvider';

// Circular Progress Component
export function CircularProgress({
  progress = 0,
  size = 100,
  strokeWidth = 8,
  color = '#3182ce',
  backgroundColor = '#e2e8f0',
  showLabel = true,
  label,
  children,
  className = '',
  ...props
}: {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div 
      className={`circular-progress ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="circular-progress-svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="circular-progress-circle"
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transform: `rotate(-90deg)`,
            transition: 'stroke-dasharray 0.3s ease-in-out'
          }}
        />
      </svg>
      
      {children || (showLabel && (
        <div className="circular-progress-label">
          <span className="circular-progress-text">
            {label || `${Math.round(progress)}%`}
          </span>
        </div>
      ))}
      
      <style jsx>{`
        .circular-progress {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .circular-progress-svg {
          transform: rotate(-90deg);
        }
        
        .circular-progress-circle {
          transition: stroke-dasharray 0.3s ease-in-out;
        }
        
        .circular-progress-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .circular-progress-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
        }
      `}</style>
    </div>
  );
}

// Linear Progress Component
export function LinearProgress({
  progress = 0,
  height = 8,
  color = '#3182ce',
  backgroundColor = '#e2e8f0',
  showLabel = true,
  label,
  animated = true,
  striped = false,
  className = '',
  children,
  ...props
}: {
  progress?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`linear-progress ${className}`} {...props}>
      {showLabel && (
        <div className="linear-progress-header">
          <span className="linear-progress-label">
            {label || 'التقدم'}
          </span>
          <span className="linear-progress-value">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      <div 
        className="linear-progress-track"
        style={{ 
          height,
          backgroundColor,
          borderRadius: height / 2
        }}
      >
        <div
          className={`linear-progress-bar ${
            animated ? 'animated' : ''
          } ${striped ? 'striped' : ''}`}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: height / 2,
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>
      
      {children}
      
      <style jsx>{`
        .linear-progress {
          width: 100%;
        }
        
        .linear-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .linear-progress-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
        }
        
        .linear-progress-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .linear-progress-track {
          position: relative;
          overflow: hidden;
        }
        
        .linear-progress-bar {
          position: relative;
        }
        
        .linear-progress-bar.animated {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
          animation: linear-progress-stripes 1s linear infinite;
        }
        
        .linear-progress-bar.striped {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
        }
        
        @keyframes linear-progress-stripes {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

// Step Progress Component
export function StepProgress({
  steps,
  currentStep = 0,
  orientation = 'horizontal',
  showLabels = true,
  className = ''
}: {
  steps: Array<{
    label: string;
    description?: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }>;
  currentStep?: number;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}) {
  return (
    <div className={`step-progress ${orientation} ${className}`}>
      <div className="step-progress-container">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isError = step.status === 'error';
          const isPending = step.status === 'pending';
          
          return (
            <div 
              key={index} 
              className={`step-progress-item ${step.status} ${isActive ? 'active' : ''}`}
            >
              <div className="step-progress-marker">
                <div className="step-progress-circle">
                  {step.status === 'completed' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.173 12.067L2.53 8.423l1.06-1.06 2.583 2.583 6.583-6.583 1.06 1.06-7.643 7.643z"/>
                    </svg>
                  )}
                  {step.status === 'error' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 10H7v-2h2v2zm0-3H7V4h2v3z"/>
                    </svg>
                  )}
                  {(step.status === 'pending' || step.status === 'active') && !isCompleted && !isError && (
                    <span className="step-progress-number">{index + 1}</span>
                  )}
                </div>
              </div>
              
              {showLabels && (
                <div className="step-progress-content">
                  <h4 className="step-progress-title">{step.label}</h4>
                  {step.description && (
                    <p className="step-progress-description">{step.description}</p>
                  )}
                </div>
              )}
              
              {index < steps.length - 1 && (
                <div className="step-progress-connector">
                  <div className={`step-progress-line ${isCompleted ? 'completed' : ''}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .step-progress {
          width: 100%;
        }
        
        .step-progress.horizontal {
          .step-progress-container {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }
          
          .step-progress-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }
          
          .step-progress-marker {
            position: relative;
            z-index: 2;
          }
          
          .step-progress-content {
            text-align: center;
            margin-top: 1rem;
            max-width: 120px;
          }
          
          .step-progress-connector {
            position: absolute;
            top: 20px;
            left: 50%;
            width: 100%;
            height: 2px;
            transform: translateX(calc(-50% + 20px));
          }
        }
        
        .step-progress.vertical {
          .step-progress-container {
            display: flex;
            flex-direction: column;
          }
          
          .step-progress-item {
            display: flex;
            align-items: flex-start;
            position: relative;
          }
          
          .step-progress-marker {
            position: relative;
            z-index: 2;
            margin-left: 1rem;
          }
          
          .step-progress-content {
            flex: 1;
            margin-bottom: 2rem;
          }
          
          .step-progress-connector {
            position: absolute;
            left: 20px;
            top: 40px;
            width: 2px;
            height: calc(100% - 40px);
            transform: translateX(-50%);
          }
        }
        
        .step-progress-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        
        .step-progress-item.pending .step-progress-circle {
          background-color: #f7fafc;
          border: 2px solid #e2e8f0;
          color: #a0aec0;
        }
        
        .step-progress-item.active .step-progress-circle {
          background-color: #3182ce;
          border: 2px solid #3182ce;
          color: white;
        }
        
        .step-progress-item.completed .step-progress-circle {
          background-color: #48bb78;
          border: 2px solid #48bb78;
          color: white;
        }
        
        .step-progress-item.error .step-progress-circle {
          background-color: #e53e3e;
          border: 2px solid #e53e3e;
          color: white;
        }
        
        .step-progress-line {
          width: 100%;
          height: 2px;
          background-color: #e2e8f0;
          transition: background-color 0.2s ease;
        }
        
        .step-progress-line.completed {
          background-color: #48bb78;
        }
        
        .step-progress-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.25rem 0;
        }
        
        .step-progress-description {
          font-size: 0.75rem;
          color: #718096;
          margin: 0;
          line-height: 1.4;
        }
        
        .step-progress-number {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

// Upload Progress Component
export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status = 'uploading',
  uploadSpeed,
  timeRemaining,
  onCancel,
  className = ''
}: {
  fileName: string;
  fileSize: number;
  progress: number;
  status?: 'uploading' | 'completed' | 'error' | 'paused' | 'cancelled';
  uploadSpeed?: string;
  timeRemaining?: string;
  onCancel?: () => void;
  className?: string;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      case 'paused':
        return '⏸️';
      case 'cancelled':
        return '🚫';
      default:
        return '📤';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#48bb78';
      case 'error':
        return '#e53e3e';
      case 'paused':
        return '#ed8936';
      case 'cancelled':
        return '#a0aec0';
      default:
        return '#3182ce';
    }
  };

  const uploadedBytes = (progress / 100) * fileSize;

  return (
    <div className={`upload-progress ${className}`}>
      <div className="upload-progress-header">
        <div className="upload-progress-info">
          <span className="upload-progress-icon">{getStatusIcon()}</span>
          <div className="upload-progress-details">
            <h4 className="upload-progress-filename">{fileName}</h4>
            <p className="upload-progress-size">
              {formatFileSize(uploadedBytes)} من {formatFileSize(fileSize)}
            </p>
          </div>
        </div>
        
        {onCancel && status === 'uploading' && (
          <button 
            className="upload-progress-cancel"
            onClick={onCancel}
            aria-label="إلغاء الرفع"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="upload-progress-bar">
        <LinearProgress
          progress={progress}
          color={getStatusColor()}
          height={6}
          showLabel={false}
          animated={status === 'uploading'}
        />
      </div>
      
      <div className="upload-progress-stats">
        <div className="upload-progress-stat">
          <span className="upload-progress-label">التقدم:</span>
          <span className="upload-progress-value">{Math.round(progress)}%</span>
        </div>
        
        {uploadSpeed && (
          <div className="upload-progress-stat">
            <span className="upload-progress-label">السرعة:</span>
            <span className="upload-progress-value">{uploadSpeed}</span>
          </div>
        )}
        
        {timeRemaining && status === 'uploading' && (
          <div className="upload-progress-stat">
            <span className="upload-progress-label">متبقي:</span>
            <span className="upload-progress-value">{timeRemaining}</span>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .upload-progress {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .upload-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .upload-progress-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }
        
        .upload-progress-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .upload-progress-details {
          flex: 1;
          min-width: 0;
        }
        
        .upload-progress-filename {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.25rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .upload-progress-size {
          font-size: 0.75rem;
          color: #718096;
          margin: 0;
        }
        
        .upload-progress-cancel {
          background: none;
          border: none;
          color: #718096;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.2s ease;
        }
        
        .upload-progress-cancel:hover {
          color: #e53e3e;
        }
        
        .upload-progress-bar {
          margin-bottom: 1rem;
        }
        
        .upload-progress-stats {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }
        
        .upload-progress-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .upload-progress-label {
          font-size: 0.75rem;
          color: #718096;
          margin-bottom: 0.25rem;
        }
        
        .upload-progress-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        @media (max-width: 640px) {
          .upload-progress-header {
            flex-direction: column;
            gap: 1rem;
          }
          
          .upload-progress-cancel {
            align-self: flex-end;
          }
          
          .upload-progress-stats {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

// Global Loading Overlay
export function GlobalLoadingOverlay({
  operations,
  message,
  showOperations = true,
  className = ''
}: {
  operations?: ReturnType<typeof useGlobalLoading>['activeOperations'];
  message?: string;
  showOperations?: boolean;
  className?: string;
}) {
  const { activeOperations: globalOperations } = useGlobalLoading();
  const displayOperations = operations || globalOperations;
  
  if (displayOperations.length === 0) return null;

  const totalProgress = displayOperations.length > 0 
    ? displayOperations.reduce((sum, op) => sum + op.progress, 0) / displayOperations.length
    : 0;

  const activeOperations = displayOperations.filter(op => op.isActive);
  const mainOperation = activeOperations[0];

  return (
    <div className={`global-loading-overlay ${className}`}>
      <div className="global-loading-backdrop" />
      
      <div className="global-loading-content">
        <div className="global-loading-header">
          <CircularProgress 
            progress={totalProgress} 
            size={80}
            color="#3182ce"
          />
          <h3 className="global-loading-title">
            {message || mainOperation?.message || 'جاري التحميل...'}
          </h3>
          <p className="global-loading-subtitle">
            {activeOperations.length} عملية نشطة
          </p>
        </div>

        {showOperations && displayOperations.length > 1 && (
          <div className="global-loading-operations">
            {displayOperations.slice(0, 5).map((operation) => (
              <div key={operation.id} className="global-loading-operation">
                <div className="operation-info">
                  <span className="operation-type">{operation.type}</span>
                  <span className="operation-message">{operation.message}</span>
                </div>
                <div className="operation-progress">
                  <span className="operation-percentage">{Math.round(operation.progress)}%</span>
                </div>
              </div>
            ))}
            
            {displayOperations.length > 5 && (
              <p className="global-loading-more">
                و {displayOperations.length - 5} عمليات أخرى...
              </p>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .global-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .global-loading-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .global-loading-content {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .global-loading-header {
          margin-bottom: 2rem;
        }
        
        .global-loading-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          margin: 1rem 0 0.5rem 0;
        }
        
        .global-loading-subtitle {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }
        
        .global-loading-operations {
          text-align: right;
        }
        
        .global-loading-operation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }
        
        .operation-info {
          flex: 1;
          min-width: 0;
        }
        
        .operation-type {
          font-size: 0.75rem;
          font-weight: 600;
          color: #3182ce;
          text-transform: uppercase;
          display: block;
        }
        
        .operation-message {
          font-size: 0.875rem;
          color: #2d3748;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .operation-progress {
          margin-left: 1rem;
        }
        
        .operation-percentage {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .global-loading-more {
          font-size: 0.875rem;
          color: #718096;
          text-align: center;
          margin-top: 1rem;
        }
        
        @media (max-width: 640px) {
          .global-loading-content {
            padding: 1.5rem;
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
}

// Export all components
export default {
  CircularProgress,
  LinearProgress,
  StepProgress,
  UploadProgress,
  GlobalLoadingOverlay
};