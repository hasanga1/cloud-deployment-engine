import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, icon, className, ...props }: InputProps) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
            error ? 'border-red-400 focus:border-red-500' : 'border-slate-200'
          } ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};