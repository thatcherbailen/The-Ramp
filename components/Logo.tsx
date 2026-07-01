export function RampMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <rect width="32" height="32" rx="9" fill="#F5552E" />
      <path d="M7.5 22 L14 15.5 L18 18.5 L24.5 10.5" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.5 10.5 L18.6 10.5 M24.5 10.5 L24.5 16.4" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
