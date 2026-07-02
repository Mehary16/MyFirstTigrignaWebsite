export default function EritreanHeritagePattern({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="heritage-diamond" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 2 L38 20 L20 38 L2 20 Z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
          <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="400" height="120" fill="url(#heritage-diamond)" />
      <path
        d="M0 60 Q50 30 100 60 T200 60 T300 60 T400 60"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.25"
        fill="none"
      />
    </svg>
  );
}
