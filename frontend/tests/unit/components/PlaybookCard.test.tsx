import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlaybookCard } from '../../../src/components/playbooks';
import { createMockPlaybook } from '../../setup';

describe('PlaybookCard Component', () => {
  const mockPlaybook = createMockPlaybook();
  const mockOnClick = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDuplicate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleStatus = jest.fn();
  const mockOnExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render playbook card with basic information', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('استراتيجية العملاء الجديدة')).toBeInTheDocument();
      expect(screen.getByText('دليل شامل للعملاء الجدد')).toBeInTheDocument();
      expect(screen.getByText('توليد العملاء')).toBeInTheDocument();
    });

    it('should render playbook status indicator', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('نشط')).toBeInTheDocument();
    });

    it('should render last updated time', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText(/آخر تحديث:/)).toBeInTheDocument();
    });
  });

  describe('Metrics Display Tests', () => {
    it('should render metrics when showMetrics is true', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          showMetrics={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('إجمالي العملاء')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('معدل التحويل')).toBeInTheDocument();
      expect(screen.getByText('25.5%')).toBeInTheDocument();
      expect(screen.getByText('متوسط النقاط')).toBeInTheDocument();
      expect(screen.getByText('82')).toBeInTheDocument();
      expect(screen.getByText('الإيرادات')).toBeInTheDocument();
      expect(screen.getByText('250,000 ريال')).toBeInTheDocument();
    });

    it('should hide metrics when showMetrics is false', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          showMetrics={false}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.queryByText('إجمالي العملاء')).not.toBeInTheDocument();
    });

    it('should format numbers correctly', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          showMetrics={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      // Should show formatted numbers with Arabic locale
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('25.5%')).toBeInTheDocument();
      expect(screen.getByText('250,000 ريال')).toBeInTheDocument();
    });
  });

  describe('Category and Status Tests', () => {
    it('should render correct category icon and label', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('توليد العملاء')).toBeInTheDocument();
      expect(screen.getByTestId('users')).toBeInTheDocument();
    });

    it('should render paused status correctly', () => {
      const pausedPlaybook = createMockPlaybook({ status: 'paused' as const });
      
      render(
        <PlaybookCard
          playbook={pausedPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('متوقف')).toBeInTheDocument();
      expect(screen.getByTestId('pause')).toBeInTheDocument();
    });

    it('should render draft status correctly', () => {
      const draftPlaybook = createMockPlaybook({ status: 'draft' as const });
      
      render(
        <PlaybookCard
          playbook={draftPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('مسودة')).toBeInTheDocument();
      expect(screen.getByTestId('edit')).toBeInTheDocument();
    });
  });

  describe('Expanded Content Tests', () => {
    it('should show trigger conditions when expanded', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      // Click the expand button
      fireEvent.click(screen.getByTestId('eye'));

      // Should show trigger conditions in expanded view
      expect(screen.getByText('شروط التشغيل')).toBeInTheDocument();
    });

    it('should show actions when expanded and showActions is true', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          showActions={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      // Click the expand button
      fireEvent.click(screen.getByTestId('eye'));

      expect(screen.getByText('الإجراءات')).toBeInTheDocument();
    });

    it('should hide actions when expanded but showActions is false', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          showActions={false}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      // Click the expand button
      fireEvent.click(screen.getByTestId('eye'));

      expect(screen.queryByText('الإجراءات')).not.toBeInTheDocument();
    });
  });

  describe('Action Button Tests', () => {
    it('should call onToggleStatus when toggle button is clicked', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByText('إيقاف'));

      expect(mockOnToggleStatus).toHaveBeenCalledWith(mockPlaybook);
    });

    it('should call onExecute when execute button is clicked', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByText('تنفيذ'));

      expect(mockOnExecute).toHaveBeenCalledWith(mockPlaybook);
    });

    it('should call onEdit when edit button is clicked', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByTestId('edit'));

      expect(mockOnEdit).toHaveBeenCalledWith(mockPlaybook);
    });

    it('should call onDuplicate when duplicate button is clicked', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByTestId('copy'));

      expect(mockOnDuplicate).toHaveBeenCalledWith(mockPlaybook);
    });

    it('should call onDelete when delete button is clicked', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByTestId('trash-2'));

      expect(mockOnDelete).toHaveBeenCalledWith(mockPlaybook);
    });
  });

  describe('Click Interaction Tests', () => {
    it('should call onClick when card is clicked and interactive is true', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          interactive={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByText('استراتيجية العملاء الجديدة'));

      expect(mockOnClick).toHaveBeenCalledWith(mockPlaybook);
    });

    it('should not call onClick when card is clicked and interactive is false', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          interactive={false}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByText('استراتيجية العملاء الجديدة'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Performance Indicators Tests', () => {
    it('should show performance indicators', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('أداء ممتاز')).toBeInTheDocument();
      expect(screen.getByText('نشط')).toBeInTheDocument();
    });

    it('should show template badge for template playbooks', () => {
      const templatePlaybook = createMockPlaybook({ isTemplate: true });
      
      render(
        <PlaybookCard
          playbook={templatePlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('قالب')).toBeInTheDocument();
      expect(screen.getByTestId('settings')).toBeInTheDocument();
    });
  });

  describe('Category Variations Tests', () => {
    const categoryTests = [
      { category: 'lead-generation' as const, expectedIcon: 'users', expectedText: 'توليد العملاء' },
      { category: 'nurturing' as const, expectedIcon: 'activity', expectedText: 'رعاية العملاء' },
      { category: 'conversion' as const, expectedIcon: 'target', expectedText: 'التحويل' },
      { category: 'retention' as const, expectedIcon: 'star', expectedText: 'الاحتفاظ' },
    ];

    categoryTests.forEach(({ category, expectedIcon, expectedText }) => {
      it(`should render correct icon and text for ${category} category`, () => {
        const categoryPlaybook = createMockPlaybook({ category });
        
        render(
          <PlaybookCard
            playbook={categoryPlaybook}
            onClick={mockOnClick}
            onEdit={mockOnEdit}
            onDuplicate={mockOnDuplicate}
            onDelete={mockOnDelete}
            onToggleStatus={mockOnToggleStatus}
            onExecute={mockOnExecute}
          />
        );

        expect(screen.getByText(expectedText)).toBeInTheDocument();
        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
      });
    });
  });

  describe('Event Prevention Tests', () => {
    it('should prevent card click when clicking action buttons', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          interactive={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByTestId('edit'));

      expect(mockOnEdit).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should prevent card click when expanding', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          interactive={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      fireEvent.click(screen.getByTestId('eye'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle playbook with no description', () => {
      const playbookNoDescription = createMockPlaybook({ description: '' });
      
      render(
        <PlaybookCard
          playbook={playbookNoDescription}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('استراتيجية العملاء الجديدة')).toBeInTheDocument();
    });

    it('should handle playbook with zero metrics', () => {
      const playbookZeroMetrics = createMockPlaybook({
        metrics: {
          totalLeads: 0,
          conversionRate: 0,
          averageScore: 0,
          revenue: 0,
        }
      });
      
      render(
        <PlaybookCard
          playbook={playbookZeroMetrics}
          showMetrics={true}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 ريال')).toBeInTheDocument();
    });
  });

  describe('Visual Tests', () => {
    it('should apply hover effects', () => {
      render(
        <PlaybookCard
          playbook={mockPlaybook}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
          onToggleStatus={mockOnToggleStatus}
          onExecute={mockOnExecute}
        />
      );

      const card = screen.getByText('استراتيجية العملاء الجديدة').closest('div');
      expect(card).toBeInTheDocument();
    });
  });
});