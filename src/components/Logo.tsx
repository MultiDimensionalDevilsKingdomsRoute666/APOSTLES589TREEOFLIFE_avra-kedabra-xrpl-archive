export interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="XRPL Memo Scanner logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14 L12 14 L12 50 L20 50" />
        <path d="M44 14 L52 14 L52 50 L44 50" />
        <circle cx="30" cy="26" r="8" />
        <line x1="35.66" y1="31.66" x2="42" y2="38" />
      </g>
    </svg>
  );
}
