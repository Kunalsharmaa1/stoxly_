import { useId } from 'react'

interface BrandLogoProps {
  iconSize: 28 | 36
  wordmarkSize: 16 | 22
  gap: 8 | 10
  wordmarkColor?: string
}

export default function BrandLogo({ iconSize, wordmarkSize, gap, wordmarkColor = 'var(--text-primary)' }: BrandLogoProps) {
  const radius = iconSize === 28 ? 6 : 8
  const gradientId = useId().replace(/:/g, '')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <span
        aria-hidden="true"
        style={{
          width: iconSize,
          height: iconSize,
          flexShrink: 0,
          borderRadius: radius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #06262a 0%, #06171d 62%, #0b302f 100%)',
          border: '1px solid rgba(45,212,191,0.24)',
          boxSizing: 'border-box',
        }}
      >
        <svg
          width={iconSize * 0.82}
          height={iconSize * 0.82}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
        >
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="5" y1="3" x2="22" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5BF6E1" />
              <stop offset="0.46" stopColor="#08C8B2" />
              <stop offset="1" stopColor="#07847F" />
            </linearGradient>
            <linearGradient id={`${gradientId}-fold`} x1="10" y1="10" x2="22" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#063A3D" />
              <stop offset="1" stopColor="#0B7D79" />
            </linearGradient>
          </defs>
          <path
            d="M4.3 9.55C4.48 7.91 5.52 6.67 7.17 6.12L22.57 1.18C22.98 1.05 23.37 1.42 23.26 1.84L22.31 5.3C22.08 6.14 21.47 6.82 20.65 7.12L10.12 10.94L15.69 14.02L20.56 12.2C22.29 11.55 24 12.82 24 14.66C24 15.82 23.3 16.86 22.22 17.31L5.4 24.22C4.98 24.4 4.55 24.01 4.66 23.57L5.64 19.72C5.85 18.9 6.45 18.23 7.25 17.92L17.79 14.05L12.18 10.95L7.55 12.6C5.79 13.23 4.09 11.88 4.3 10.02V9.55Z"
            fill={`url(#${gradientId}-fill)`}
          />
          <path
            d="M10.12 10.94L15.69 14.02L20.56 12.2C21.76 11.75 22.96 12.17 23.56 13.08C22.86 12.62 22.07 12.58 21.21 12.9L16.28 14.73L10.12 11.33V10.94Z"
            fill={`url(#${gradientId}-fold)`}
            opacity="0.9"
          />
          <path
            d="M7.35 6.13L21.9 1.47C22.35 1.33 22.79 1.3 23.17 1.4"
            stroke="#A5FFF1"
            strokeOpacity="0.6"
            strokeWidth="0.55"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span style={{ fontSize: wordmarkSize, fontWeight: 700, letterSpacing: '-0.02em', color: wordmarkColor }}>
        Stoxly
      </span>
    </div>
  )
}
