export function PawDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`paw-divider ${className}`} aria-hidden="true">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="shrink-0 opacity-40"
      >
        <ellipse cx="7" cy="5.5" rx="2.2" ry="2.8" />
        <ellipse cx="17" cy="5.5" rx="2.2" ry="2.8" />
        <ellipse cx="3.5" cy="11" rx="2" ry="2.5" />
        <ellipse cx="20.5" cy="11" rx="2" ry="2.5" />
        <path d="M12 22c-4.5 0-7-3-7-5.5S7.5 11 12 11s7 3 7 5.5S16.5 22 12 22z" />
      </svg>
    </div>
  );
}
