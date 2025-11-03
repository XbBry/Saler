import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeadCard from '../../../src/components/leads/LeadCard';
import { createMockLead } from '../../setup';

describe('LeadCard Component', () => {
  const mockLead = createMockLead();
  const mockOnClick = jest.fn();
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render lead card with basic information', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      expect(screen.getByText('مدير تقنية المعلومات')).toBeInTheDocument();
      expect(screen.getByText('شركة التقنية المتقدمة')).toBeInTheDocument();
    });

    it('should render lead score when showScore is true', () => {
      render(
        <LeadCard
          lead={mockLead}
          showScore={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('85')).toBeInTheDocument(); // Score from mock
      expect(screen.getByText('نقاط الجودة')).toBeInTheDocument();
    });

    it('should render temperature indicator when showTemperature is true', () => {
      render(
        <LeadCard
          lead={mockLead}
          showTemperature={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByTestId('thermometer')).toBeInTheDocument();
      expect(screen.getByText('warm')).toBeInTheDocument(); // Temperature level
    });

    it('should render predictions when showPredictions is true', () => {
      render(
        <LeadCard
          lead={mockLead}
          showPredictions={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('احتمالية التحويل')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('14 days')).toBeInTheDocument();
    });

    it('should render expected value in Saudi Riyal', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('150,000 ريال')).toBeInTheDocument();
    });

    it('should render tags when available', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('مستهدف')).toBeInTheDocument();
      expect(screen.getByText('تقني')).toBeInTheDocument();
    });

    it('should show high priority indicator for high priority leads', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // High priority leads should show star indicator
      expect(screen.getByTestId('star')).toBeInTheDocument();
    });
  });

  describe('Compact Mode Tests', () => {
    it('should render compact card when compact prop is true', () => {
      render(
        <LeadCard
          lead={mockLead}
          compact={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // Compact mode should show simplified view
      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument(); // Score in compact mode
    });

    it('should show priority indicator in compact mode', () => {
      render(
        <LeadCard
          lead={mockLead}
          compact={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // Should show priority indicator in compact mode
      const card = screen.getByText('أحمد محمد').closest('div');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should call onClick when card is clicked and interactive is true', () => {
      render(
        <LeadCard
          lead={mockLead}
          interactive={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByText('أحمد محمد'));

      expect(mockOnClick).toHaveBeenCalledWith(mockLead);
    });

    it('should not call onClick when card is clicked and interactive is false', () => {
      render(
        <LeadCard
          lead={mockLead}
          interactive={false}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByText('أحمد محمد'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should call onAction when call button is clicked', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByText('اتصال'));

      expect(mockOnAction).toHaveBeenCalledWith('call', mockLead);
    });

    it('should call onAction when email button is clicked', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByText('إيميل'));

      expect(mockOnAction).toHaveBeenCalledWith('email', mockLead);
    });

    it('should call onAction when message button is clicked', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByText('رسالة'));

      expect(mockOnAction).toHaveBeenCalledWith('message', mockLead);
    });

    it('should call onAction when more button is clicked', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByTestId('more-horizontal'));

      expect(mockOnAction).toHaveBeenCalledWith('more', mockLead);
    });
  });

  describe('Expandable Content Tests', () => {
    it('should toggle expanded state when details button is clicked', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      const detailsButton = screen.getByText('تفاصيل');
      fireEvent.click(detailsButton);

      // Should now show "إخفاء" instead of "تفاصيل"
      expect(screen.getByText('إخفاء')).toBeInTheDocument();
    });

    it('should show more heat sources when expanded', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      const detailsButton = screen.getByText('تفاصيل');
      fireEvent.click(detailsButton);

      // Heat sources should be visible in expanded mode
      expect(screen.getByText('مصادر الدفء')).toBeInTheDocument();
    });
  });

  describe('Next Action Section Tests', () => {
    it('should render next action recommendation', () => {
      render(
        <LeadCard
          lead={mockLead}
          showPredictions={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('التوصية التالية')).toBeInTheDocument();
      expect(screen.getByText('Follow up with email')).toBeInTheDocument();
      expect(screen.getByTestId('timer')).toBeInTheDocument();
      expect(screen.getByTestId('phone')).toBeInTheDocument();
      expect(screen.getByTestId('award')).toBeInTheDocument();
    });

    it('should show success probability in next action', () => {
      render(
        <LeadCard
          lead={mockLead}
          showPredictions={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('85% نجاح')).toBeInTheDocument();
    });

    it('should show next action timing', () => {
      render(
        <LeadCard
          lead={mockLead}
          showPredictions={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('2 hours')).toBeInTheDocument();
    });

    it('should show next action channel', () => {
      render(
        <LeadCard
          lead={mockLead}
          showPredictions={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('email')).toBeInTheDocument();
    });
  });

  describe('Prop Variation Tests', () => {
    it('should hide score when showScore is false', () => {
      render(
        <LeadCard
          lead={mockLead}
          showScore={false}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.queryByText('نقاط الجودة')).not.toBeInTheDocument();
    });

    it('should hide temperature when showTemperature is false', () => {
      render(
        <LeadCard
          lead={mockLead}
          showTemperature={false}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.queryByTestId('thermometer')).not.toBeInTheDocument();
    });

    it('should hide predictions when showPredictions is false', () => {
      render(
        <LeadCard
          lead={mockLead}
          showPredictions={false}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.queryByText('احتمالية التحويل')).not.toBeInTheDocument();
      expect(screen.queryByText('التوصية التالية')).not.toBeInTheDocument();
    });

    it('should hide activity when showActivity is false', () => {
      render(
        <LeadCard
          lead={mockLead}
          showActivity={false}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // Should still render but without activity details
      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle lead without company', () => {
      const leadWithoutCompany = createMockLead({ company: undefined });
      
      render(
        <LeadCard
          lead={leadWithoutCompany}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('ahmed@example.com')).toBeInTheDocument();
    });

    it('should handle lead without tags', () => {
      const leadWithoutTags = createMockLead({ tags: undefined });
      
      render(
        <LeadCard
          lead={leadWithoutTags}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // Tags section should not be rendered
      expect(screen.queryByText('مستهدف')).not.toBeInTheDocument();
    });

    it('should handle very long names', () => {
      const leadWithLongName = createMockLead({
        firstName: 'أحمد محمد علي حسن',
        lastName: 'عبدالرحمن الاستثنائي الطويل الاسم'
      });
      
      render(
        <LeadCard
          lead={leadWithLongName}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // Should handle long names gracefully
      expect(screen.getByText(/أحمد محمد علي حسن/)).toBeInTheDocument();
    });

    it('should handle zero value leads', () => {
      const leadWithZeroValue = createMockLead({ value: 0 });
      
      render(
        <LeadCard
          lead={leadWithZeroValue}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('0 ريال')).toBeInTheDocument();
    });
  });

  describe('Visual Tests', () => {
    it('should apply hover effects when mouse enters card', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      const card = screen.getByText('أحمد محمد').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('should show loading state when loading prop is true', () => {
      render(
        <LeadCard
          lead={mockLead}
          loading={true}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      // Should show loading indicators
      const card = screen.getByText('أحمد محمد').closest('div');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should render multiple cards efficiently', () => {
      const leads = Array.from({ length: 10 }, (_, i) => 
        createMockLead({ id: i.toString(), firstName: `أحمد${i}` })
      );

      const { container } = render(
        <div>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={mockOnClick}
              onAction={mockOnAction}
            />
          ))}
        </div>
      );

      expect(container.children.length).toBe(10);
    });

    it('should handle rapid clicks without breaking', () => {
      render(
        <LeadCard
          lead={mockLead}
          onClick={mockOnClick}
          onAction={mockOnAction}
        />
      );

      const callButton = screen.getByText('اتصال');
      
      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(callButton);
      }

      expect(mockOnAction).toHaveBeenCalledTimes(5);
    });
  });
});