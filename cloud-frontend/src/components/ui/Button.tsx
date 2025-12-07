import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'outline';
}

export const Button = ({ children, isLoading, variant = 'primary', className, ...props }: ButtonProps) => {
  const baseStyles = "w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex justify-center items-center gap-2";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]",
    outline: "border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-[0.98]",
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};