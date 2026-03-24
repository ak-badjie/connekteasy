import React from "react";
import { cn } from "@/app/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg";

const variants = {
  primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500 border border-transparent",
  accent: "bg-mustard-500 text-gray-900 hover:bg-mustard-600 focus:ring-mustard-500 border border-transparent",
  secondary: "bg-teal-50 text-teal-700 hover:bg-teal-100 focus:ring-teal-500 border border-transparent",
  outline: "bg-transparent text-teal-600 border border-teal-500 hover:bg-teal-50 focus:ring-teal-500",
  ghost: "bg-transparent text-gray-600 hover:text-teal-600 hover:bg-teal-50 focus:ring-teal-500 border border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
};

export function buttonVariants({ variant = "primary", size = "md", className }: { variant?: keyof typeof variants, size?: keyof typeof sizes, className?: string } = {}) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
