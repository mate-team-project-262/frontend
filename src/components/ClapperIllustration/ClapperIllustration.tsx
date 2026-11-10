/** Stand-in for the clapperboard illustration of the "No match" frame (needs the designer's asset). */
export default function ClapperIllustration() {
  return (
    <svg
      className="results-hero__clapper"
      width="132"
      height="132"
      viewBox="0 0 132 132"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="clapper-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f6bff" />
          <stop offset="1" stopColor="#4f2bd6" />
        </linearGradient>
      </defs>
      <rect x="10" y="50" width="112" height="72" rx="12" fill="url(#clapper-body)" />
      <g transform="rotate(-14 16 46)">
        <rect x="10" y="26" width="112" height="22" rx="6" fill="#d9ccff" />
        <path
          d="M24 26h14l-12 22H12Zm28 0h14L54 48H40Zm28 0h14L82 48H68Zm28 0h14l-12 22H96Z"
          fill="#6a45f0"
        />
      </g>
      <rect x="10" y="50" width="112" height="16" rx="6" fill="#e6dcff" />
      <path
        d="M24 50h14l-6 16H18Zm28 0h14l-6 16H46Zm28 0h14l-6 16H74Zm28 0h14l-6 16h-14Z"
        fill="#6a45f0"
      />
      <circle cx="20" cy="38" r="4" fill="#4f2bd6" transform="rotate(-14 16 46)" />
      <path d="M58 76v32l26-16Z" fill="#fff9ea" />
    </svg>
  );
}
