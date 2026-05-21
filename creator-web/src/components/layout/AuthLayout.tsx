import React from 'react';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={44} className="mb-2" />
          <span className="text-sm text-gray-500 font-medium tracking-wide uppercase mt-1">
            Creator Dashboard
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 text-center">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-500 text-center mt-1 text-sm">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Trave1hues. All rights reserved.
        </p>
      </div>
    </div>
  );
}
