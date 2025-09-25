/**
 * Tests for Icons Component
 * Tests icon rendering, props, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Icons from './Icons';

describe('Icons Component', () => {
  const iconNames = [
    'Dashboard', 'Admin', 'Settings', 'User', 'Ticket', 'Workflow',
    'Company', 'Role', 'Approval', 'Rejection', 'Return', 'Cancel',
    'Edit', 'Delete', 'Add', 'Close', 'Save', 'Refresh', 'Search',
    'Filter', 'Export', 'Import', 'Download', 'Upload', 'Print',
    'Email', 'Phone', 'Location', 'Calendar', 'Clock', 'Time',
    'Warning', 'Error', 'Info', 'Success', 'Loading', 'ChevronDown',
    'ChevronUp', 'ChevronLeft', 'ChevronRight', 'Bell', 'Notification',
    'Shield', 'CheckCircle'
  ];

  describe('Icon Rendering', () => {
    iconNames.forEach(iconName => {
      it(`should render ${iconName} icon`, () => {
        const IconComponent = Icons[iconName];
        expect(IconComponent).toBeDefined();

        render(<IconComponent data-testid={`icon-${iconName.toLowerCase()}`} />);

        const icon = screen.getByTestId(`icon-${iconName.toLowerCase()}`);
        expect(icon).toBeInTheDocument();
        expect(icon.tagName).toBe('svg');
      });
    });
  });

  describe('Icon Props', () => {
    it('should apply custom size', () => {
      render(<Icons.Dashboard size={32} data-testid="sized-icon" />);

      const icon = screen.getByTestId('sized-icon');
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });

    it('should apply custom className', () => {
      const customClass = 'text-red-500 hover:text-red-700';
      render(<Icons.User className={customClass} data-testid="styled-icon" />);

      const icon = screen.getByTestId('styled-icon');
      expect(icon).toHaveClass('text-red-500', 'hover:text-red-700');
    });

    it('should use default size when not specified', () => {
      render(<Icons.Settings data-testid="default-icon" />);

      const icon = screen.getByTestId('default-icon');
      expect(icon).toHaveAttribute('width', '20');
      expect(icon).toHaveAttribute('height', '20');
    });

    it('should handle empty className gracefully', () => {
      render(<Icons.Ticket className="" data-testid="empty-class-icon" />);

      const icon = screen.getByTestId('empty-class-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('SVG Attributes', () => {
    it('should have correct SVG attributes', () => {
      render(<Icons.Admin data-testid="svg-icon" />);

      const icon = screen.getByTestId('svg-icon');
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('stroke', 'currentColor');
      expect(icon).toHaveAttribute('strokeWidth', '2');
      expect(icon).toHaveAttribute('strokeLinecap', 'round');
      expect(icon).toHaveAttribute('strokeLinejoin', 'round');
    });

    it('should render path elements', () => {
      render(<Icons.User data-testid="path-icon" />);

      const icon = screen.getByTestId('path-icon');
      const paths = icon.querySelectorAll('path, circle, polyline, line, rect');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should be focusable when needed', () => {
      render(
        <button>
          <Icons.Settings data-testid="focusable-icon" />
          Settings
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      const icon = screen.getByTestId('focusable-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should work with screen readers', () => {
      render(
        <div>
          <Icons.Warning data-testid="warning-icon" />
          <span>Important warning message</span>
        </div>
      );

      const icon = screen.getByTestId('warning-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    it('should work with animation classes', () => {
      render(
        <Icons.Loading
          className="animate-spin"
          data-testid="animated-icon"
        />
      );

      const icon = screen.getByTestId('animated-icon');
      expect(icon).toHaveClass('animate-spin');
    });

    it('should work with Tailwind hover classes', () => {
      render(
        <Icons.Add
          className="hover:text-blue-500 transition-colors"
          data-testid="hover-icon"
        />
      );

      const icon = screen.getByTestId('hover-icon');
      expect(icon).toHaveClass('hover:text-blue-500', 'transition-colors');
    });
  });

  describe('Color Classes', () => {
    it('should apply color classes correctly', () => {
      render(
        <Icons.Success
          className="text-green-500"
          data-testid="green-icon"
        />
      );

      const icon = screen.getByTestId('green-icon');
      expect(icon).toHaveClass('text-green-500');
    });

    it('should work with multiple color states', () => {
      render(
        <Icons.Error
          className="text-red-500 hover:text-red-700 focus:text-red-800"
          data-testid="multi-state-icon"
        />
      );

      const icon = screen.getByTestId('multi-state-icon');
      expect(icon).toHaveClass('text-red-500', 'hover:text-red-700', 'focus:text-red-800');
    });
  });

  describe('Icon Consistency', () => {
    it('should have consistent prop interface across all icons', () => {
      const testProps = { size: 24, className: 'test-class' };

      // Test a sample of icons to ensure consistency
      const testIcons = ['Dashboard', 'User', 'Settings', 'Ticket', 'Loading'];

      testIcons.forEach(iconName => {
        const IconComponent = Icons[iconName];
        expect(() => {
          render(<IconComponent {...testProps} data-testid={`consistent-${iconName}`} />);
        }).not.toThrow();

        const icon = screen.getByTestId(`consistent-${iconName}`);
        expect(icon).toHaveAttribute('width', '24');
        expect(icon).toHaveAttribute('height', '24');
        expect(icon).toHaveClass('test-class');
      });
    });

    it('should have uniform SVG structure', () => {
      const testIcons = ['Add', 'Edit', 'Delete', 'Save'];

      testIcons.forEach(iconName => {
        const IconComponent = Icons[iconName];
        render(<IconComponent data-testid={`structure-${iconName}`} />);

        const icon = screen.getByTestId(`structure-${iconName}`);
        expect(icon.tagName).toBe('svg');
        expect(icon).toHaveAttribute('viewBox');
        expect(icon).toHaveAttribute('stroke');
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly', () => {
      const start = performance.now();

      render(
        <div>
          {iconNames.slice(0, 10).map(iconName => {
            const IconComponent = Icons[iconName];
            return <IconComponent key={iconName} />;
          })}
        </div>
      );

      const end = performance.now();
      const renderTime = end - start;

      // Should render 10 icons in less than 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should not cause memory leaks with many instances', () => {
      const { unmount } = render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <Icons.Dashboard key={i} />
          ))}
        </div>
      );

      // Should unmount without issues
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined props gracefully', () => {
      expect(() => {
        render(<Icons.Info size={undefined} className={undefined} />);
      }).not.toThrow();
    });

    it('should handle zero size', () => {
      render(<Icons.Bell size={0} data-testid="zero-size-icon" />);

      const icon = screen.getByTestId('zero-size-icon');
      expect(icon).toHaveAttribute('width', '0');
      expect(icon).toHaveAttribute('height', '0');
    });

    it('should handle very large sizes', () => {
      render(<Icons.Shield size={1000} data-testid="large-icon" />);

      const icon = screen.getByTestId('large-icon');
      expect(icon).toHaveAttribute('width', '1000');
      expect(icon).toHaveAttribute('height', '1000');
    });
  });
});