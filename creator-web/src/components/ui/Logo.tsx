import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Controls the height of the mark; width scales proportionally */
  size?: number;
  /** Show the wordmark next to the icon */
  showWordmark?: boolean;
  className?: string;
}

/** The red rounded-square icon from the TravelHues brand mark */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Red rounded square background */}
      <rect width="100" height="100" rx="22" fill="#E8342A" />

      {/* Vertical stem of the "t" */}
      <rect x="43" y="18" width="14" height="52" rx="7" fill="white" />

      {/* Horizontal crossbar of the "t" */}
      <rect x="26" y="30" width="48" height="13" rx="6.5" fill="white" />

      {/* Three dots at the bottom (location / navigation motif) */}
      <circle cx="36" cy="84" r="6" fill="white" />
      <circle cx="50" cy="84" r="6" fill="white" />
      <circle cx="64" cy="84" r="6" fill="white" />
    </svg>
  );
}

/** Full logo: icon + "Trave1hues" wordmark */
export function Logo({ size = 32, showWordmark = true, className }: LogoProps) {
  const fontSize = size * 0.6;
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="font-black tracking-tight text-gray-900"
          style={{ fontSize, lineHeight: 1 }}
        >
          Trave<span className="font-black">1</span>hues
        </span>
      )}
    </div>
  );
}
