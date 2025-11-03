import React from 'react';
import { cn } from '@/lib/utils';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, children, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'text-gray-600 hover:text-gray-900',
      primary: 'text-blue-600 hover:text-blue-700',
    };

    return (
      <a
        href={href}
        ref={ref}
        className={cn(
          'underline-offset-4 hover:underline transition-colors',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = 'Link';