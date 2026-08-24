import React from 'react';

interface CodemLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  className?: string;
  glow?: boolean;
}

export const CodemLogo: React.FC<CodemLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  glow = true,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { iconSize: 28, fontSize: 'text-base', subSize: 'text-[11px]', gap: 'gap-2.5' };
      case 'lg':
        return { iconSize: 48, fontSize: 'text-xl', subSize: 'text-xs', gap: 'gap-3.5' };
      case 'xl':
        return { iconSize: 68, fontSize: 'text-2xl', subSize: 'text-sm', gap: 'gap-4' };
      case 'md':
      default:
        return { iconSize: 36, fontSize: 'text-lg', subSize: 'text-xs', gap: 'gap-3' };
    }
  };

  const { iconSize, fontSize, subSize, gap } = getDimensions();

  const IconSvg = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(255,106,0,0.55)]' : ''}`}
    >
      {/* Outer Glow Ring */}
      <circle
        cx="100"
        cy="100"
        r="92"
        stroke="#FF6A00"
        strokeWidth="6"
        className="opacity-95"
      />

      {/* Inner Beaker Base Circle */}
      <circle
        cx="100"
        cy="100"
        r="68"
        stroke="#FF6A00"
        strokeWidth="5"
        className="opacity-90"
      />

      {/* Chemistry Beaker Flask Neck & Lip */}
      <path
        d="M86 42 H114 M90 42 V65 M110 42 V65"
        stroke="#FF6A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="83" y1="42" x2="117" y2="42" stroke="#FF6A00" strokeWidth="6" strokeLinecap="round" />

      {/* Measurement Ticks on Beaker */}
      <line x1="94" y1="52" x2="100" y2="52" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" />
      <line x1="94" y1="60" x2="103" y2="60" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" />
      <line x1="88" y1="78" x2="96" y2="78" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="88" x2="94" y2="88" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" />

      {/* Trend Breakout Line Slashing Upwards */}
      <path
        d="M74 135 L96 95 L112 110 L158 72"
        stroke="#FF6A00"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dashed confirmation extension */}
      <path
        d="M136 86 L154 75"
        stroke="#FF8C00"
        strokeWidth="4"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />

      {/* Candlestick 1 (Leftmost Small) */}
      <line x1="82" y1="126" x2="82" y2="140" stroke="#FF6A00" strokeWidth="3" />
      <rect x="78" y="130" width="8" height="8" fill="#FF6A00" rx="1" />

      {/* Candlestick 2 (Bullish Middle Left) */}
      <line x1="98" y1="110" x2="98" y2="145" stroke="#FF6A00" strokeWidth="3.5" />
      <rect x="93" y="116" width="10" height="24" fill="#FF6A00" rx="1.5" />

      {/* Candlestick 3 (Strong Bullish Core) */}
      <line x1="117" y1="98" x2="117" y2="148" stroke="#FF6A00" strokeWidth="3.5" />
      <rect x="112" y="104" width="10" height="36" fill="#FF6A00" rx="1.5" />

      {/* Candlestick 4 (Breakout High Right) */}
      <line x1="136" y1="86" x2="136" y2="140" stroke="#FF6A00" strokeWidth="3.5" />
      <rect x="131" y="94" width="10" height="34" fill="#FF6A00" rx="1.5" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{IconSvg}</div>;
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161412] border border-[#FF6A00]/40 text-white ${className}`}
      >
        {IconSvg}
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-[#FF6A00] font-sans text-xs">
            CODEM
          </span>
          <span className="text-[8px] font-mono tracking-[0.25em] text-[#E0A070] uppercase">
            TRADING LAB
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${gap} ${className}`}>
      {IconSvg}
      <div className="flex flex-col leading-none">
        <span
          className={`font-extrabold tracking-[0.08em] text-[#FF6A00] uppercase font-sans ${fontSize}`}
        >
          CODEM
        </span>
        <span
          className={`font-semibold tracking-[0.32em] text-[#CCCCCC] uppercase font-mono mt-1 ${subSize}`}
        >
          TRADING LAB
        </span>
      </div>
    </div>
  );
};
