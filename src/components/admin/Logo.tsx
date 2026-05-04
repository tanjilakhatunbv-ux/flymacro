import React from 'react'

export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}
  >
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#0ea5e9" />
      <path
        d="M8 14L12 10L16 14L20 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 18L12 14L16 18L20 14"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
    <span
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: '#0f172a',
        letterSpacing: '-0.01em',
      }}
    >
      FlyMacro
    </span>
  </div>
)

export const Icon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#0ea5e9" />
    <path
      d="M8 14L12 10L16 14L20 10"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 18L12 14L16 18L20 14"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
    />
  </svg>
)
