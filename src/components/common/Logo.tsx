import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 34,
  className = '',
  showText = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: size, height: size }}
      >
        {/* Dark mode: white translucent glass logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Velo Logo"
          width={size}
          height={size}
          className="hidden dark:block w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]"
        />
        {/* Light mode: dark translucent logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.png"
          alt="Velo Logo"
          width={size}
          height={size}
          className="block dark:hidden w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        />
      </div>

      {showText && (
        <div className="flex flex-col select-none justify-center">
          <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white leading-tight">
            Velo
          </span>
          <span className="text-[9.5px] tracking-wider uppercase font-semibold text-zinc-400 dark:text-zinc-500">
            Social • Spatial
          </span>
        </div>
      )}
    </div>
  );
};

