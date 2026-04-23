import { ReactNode } from 'react';

type BadgeVariant = 'active' | 'suspended' | 'trial' | 'expired' | 'info' | 'warning' | 'danger' | 'SD' | 'HD' | 'FHD';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'info', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}