import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        {label && <label className="form-label">{label}</label>}
        <div className={icon ? 'input-with-icon' : ''}>
          {icon}
          <input
            ref={ref}
            className={`input-field${error ? ' input-error' : ''}`}
            {...props}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';