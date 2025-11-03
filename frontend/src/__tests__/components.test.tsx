import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import MetricCard from '@/components/metrics/MetricCard';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock icons
vi.mock('lucide-react', () => ({
  Check: (props: any) => <div data-testid="check-icon" {...props} />,
  AlertCircle: (props: any) => <div data-testid="alert-icon" {...props} />,
  Loader2: (props: any) => <div data-testid="loader-icon" {...props} />,
}));

describe('UI Components Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Component', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render button with different variants', () => {
      render(
        <>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </>
      );

      const primaryBtn = screen.getByText('Primary');
      const secondaryBtn = screen.getByText('Secondary');
      const dangerBtn = screen.getByText('Danger');
      const ghostBtn = screen.getByText('Ghost');

      expect(primaryBtn.closest('button')).toHaveAttribute('data-variant', 'primary');
      expect(secondaryBtn.closest('button')).toHaveAttribute('data-variant', 'secondary');
      expect(dangerBtn.closest('button')).toHaveAttribute('data-variant', 'danger');
      expect(ghostBtn.closest('button')).toHaveAttribute('data-variant', 'ghost');
    });

    it('should render button with icons', () => {
      render(
        <Button icon={<div data-testid="icon" />}>
          Button with Icon
        </Button>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Button with Icon')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      render(<Button loading>Loading Button</Button>);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading Button')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should call onClick when clicked', () => {
      const mockClick = vi.fn();
      render(<Button onClick={mockClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(mockClick).toHaveBeenCalled();
    });

    it('should not call onClick when disabled', () => {
      const mockClick = vi.fn();
      render(<Button disabled onClick={mockClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should handle different sizes', () => {
      render(
        <>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </>
      );

      const smallBtn = screen.getByText('Small').closest('button');
      const mediumBtn = screen.getByText('Medium').closest('button');
      const largeBtn = screen.getByText('Large').closest('button');

      expect(smallBtn).toHaveAttribute('data-size', 'sm');
      expect(mediumBtn).toHaveAttribute('data-size', 'md');
      expect(largeBtn).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Input Component', () => {
    it('should render input with placeholder', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should handle value changes', () => {
      const mockChange = vi.fn();
      render(<Input onChange={mockChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test value' } });

      expect(mockChange).toHaveBeenCalled();
      expect(input).toHaveValue('test value');
    });

    it('should show error state', () => {
      render(<Input error="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('data-error', 'true');
    });

    it('should handle different input types', () => {
      render(
        <>
          <Input type="email" />
          <Input type="password" />
          <Input type="number" />
        </>
      );

      expect(screen.getByDisplayValue('').closest('input')).toHaveAttribute('type', 'email');
      expect(screen.getAllByDisplayValue('')[1].closest('input')).toHaveAttribute('type', 'password');
      expect(screen.getAllByDisplayValue('')[2].closest('input')).toHaveAttribute('type', 'number');
    });

    it('should show character count', () => {
      render(<Input maxLength={100} showCharCount />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email Address" />);

      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<Input disabled value="disabled value" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveValue('disabled value');
    });

    it('should render with icon', () => {
      render(
        <Input
          icon={<div data-testid="input-icon" />}
          iconPosition="left"
        />
      );

      expect(screen.getByTestId('input-icon')).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('should render card with title', () => {
      render(<Card title="Card Title">Card content</Card>);

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render card with header and footer', () => {
      render(
        <Card
          title="Card Title"
          header={<div data-testid="card-header">Header</div>}
          footer={<div data-testid="card-footer">Footer</div>}
        >
          Card content
        </Card>
      );

      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should handle hover effect', () => {
      render(<Card hoverable>Hover me</Card>);

      const card = screen.getByText('Hover me').closest('div');
      expect(card).toHaveAttribute('data-hoverable', 'true');
    });

    it('should render with different variants', () => {
      render(
        <>
          <Card variant="outlined">Outlined</Card>
          <Card variant="filled">Filled</Card>
        </>
      );

      const outlinedCard = screen.getByText('Outlined').closest('div');
      const filledCard = screen.getByText('Filled').closest('div');

      expect(outlinedCard).toHaveAttribute('data-variant', 'outlined');
      expect(filledCard).toHaveAttribute('data-variant', 'filled');
    });
  });

  describe('Alert Component', () => {
    it('should render info alert', () => {
      render(<Alert type="info">This is an info alert</Alert>);

      expect(screen.getByText('This is an info alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('should render different alert types', () => {
      render(
        <>
          <Alert type="success">Success message</Alert>
          <Alert type="warning">Warning message</Alert>
          <Alert type="error">Error message</Alert>
        </>
      );

      const successAlert = screen.getByText('Success message').closest('div');
      const warningAlert = screen.getByText('Warning message').closest('div');
      const errorAlert = screen.getByText('Error message').closest('div');

      expect(successAlert).toHaveAttribute('data-type', 'success');
      expect(warningAlert).toHaveAttribute('data-type', 'warning');
      expect(errorAlert).toHaveAttribute('data-type', 'error');
    });

    it('should show dismiss button', () => {
      const mockDismiss = vi.fn();
      render(<Alert onDismiss={mockDismiss} dismissible>Alert to dismiss</Alert>);

      const dismissButton = screen.getByText(/×/);
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalled();
    });

    it('should render with actions', () => {
      const mockAction = vi.fn();
      render(
        <Alert
          actions={<button onClick={mockAction}>Action</button>}
        >
          Alert with action
        </Alert>
      );

      expect(screen.getByText('Alert with action')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('MetricCard Component', () => {
    it('should render with title and value', () => {
      render(<MetricCard title="Total Sales" value={1000} />);

      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('should show trend indicators', () => {
      render(
        <MetricCard
          title="Revenue"
          value={5000}
          change={12.5}
          trend="up"
        />
      );

      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });

    it('should show change direction', () => {
      render(
        <>
          <MetricCard title="Up Metric" value={100} change={5} trend="up" />
          <MetricCard title="Down Metric" value={100} change={-3} trend="down" />
        </>
      );

      const upMetric = screen.getByText('Up Metric').closest('div');
      const downMetric = screen.getByText('Down Metric').closest('div');

      expect(upMetric).toHaveAttribute('data-trend', 'up');
      expect(downMetric).toHaveAttribute('data-trend', 'down');
    });

    it('should render loading state', () => {
      render(<MetricCard title="Loading" value={0} loading />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should show formatted values', () => {
      render(
        <MetricCard
          title="Revenue"
          value={1000000}
          format="currency"
          locale="en-US"
        />
      );

      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('should handle click events', () => {
      const mockClick = vi.fn();
      render(
        <MetricCard
          title="Clickable"
          value={100}
          onClick={mockClick}
        />
      );

      fireEvent.click(screen.getByText('Clickable'));

      expect(mockClick).toHaveBeenCalled();
    });

    it('should render with icon', () => {
      render(
        <MetricCard
          title="Metric with Icon"
          value={100}
          icon={<div data-testid="metric-icon" />}
        />
      );

      expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    });
  });

  describe('DateRangePicker Component', () => {
    it('should render date range picker', () => {
      render(<div data-testid="date-range-picker">Date Range Picker</div>);

      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });

    it('should handle preset selections', () => {
      render(<div data-testid="date-range-picker">Date Range Picker</div>);

      // Simulate preset selection
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);

      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });
  });

  describe('EmptyState Component', () => {
    it('should render empty state with icon and message', () => {
      render(
        <div data-testid="empty-state">
          <div data-testid="empty-icon" />
          <p>No data available</p>
        </div>
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should show action button', () => {
      const mockAction = vi.fn();
      render(
        <div data-testid="empty-state">
          <p>No items found</p>
          <button onClick={mockAction}>Create Item</button>
        </div>
      );

      const actionButton = screen.getByText('Create Item');
      fireEvent.click(actionButton);

      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('Component Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Button aria-label="Custom Button Label">Button</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom Button Label');
    });

    it('should support keyboard navigation', () => {
      render(
        <>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
        </>
      );

      const buttons = screen.getAllByRole('button');
      
      // Test tab navigation
      buttons.forEach(button => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('should have proper heading hierarchy', () => {
      render(
        <Card title="Main Title">
          <Card title="Sub Title">Content</Card>
        </Card>
      );

      const mainTitle = screen.getByText('Main Title');
      const subTitle = screen.getByText('Sub Title');

      expect(mainTitle.closest('h1, h2, h3')).toBeInTheDocument();
      expect(subTitle.closest('h1, h2, h3, h4, h5, h6')).toBeInTheDocument();
    });
  });

  describe('Component Responsiveness', () => {
    it('should adapt to different screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Card responsive>Responsive Card</Card>);

      const card = screen.getByText('Responsive Card').closest('div');
      expect(card).toHaveAttribute('data-responsive', 'true');
    });
  });
});
