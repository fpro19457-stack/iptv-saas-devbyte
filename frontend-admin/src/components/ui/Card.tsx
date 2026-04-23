import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    action?: ReactNode;
  };
}

export function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {header && (
        <div className="card-header">
          <div className="card-title">
            {header.icon}
            <span>{header.title}</span>
          </div>
          {header.action && <div className="card-action">{header.action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}