/** Line icons of the signed-in pages (drawn in the style of the UI kit). */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      {...stroke}
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <path d="M3 8.2 9 3l6 5.2V15H3Z" />
      <path d="M7.2 15v-4h3.6v4" />
    </svg>
  );
}

/** A clock with an arrow going back: sessions history. */
export function HistoryIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      {...stroke}
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 12.5A16 16 0 1 1 4 20" />
      <path d="M5 5v8h8" />
      <path d="M20 11v9.5l6 4" />
    </svg>
  );
}

/** A head with a question mark: movie identity. */
export function HeadIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      {...stroke}
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M11 36v-7.5C7 26 5 22 5 17.5 5 10 11 4 19 4s14 5.5 14 13l3 6h-3v5a3 3 0 0 1-3 3h-4v5" />
      <path d="M15.5 14.5a4 4 0 1 1 5.8 3.6c-1 .5-1.5 1.3-1.5 2.4" />
      <circle cx="19.8" cy="24.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      {...stroke}
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
      <path d="M2.5 7.5h13M6 2v3M12 2v3" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 20 18"
      {...stroke}
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="17" height="11" rx="1" />
      <circle cx="6.5" cy="8" r="1.3" />
      <circle cx="10" cy="7.5" r="1.3" />
      <circle cx="13.5" cy="8" r="1.3" />
      <path d="M4 13.5c.3-1.8 1.2-2.7 2.5-2.7s2.2.9 2.5 2.7M8 13.5c.2-2 1-3.1 2-3.1s1.8 1.1 2 3.1M11 13.5c.3-1.8 1.2-2.7 2.5-2.7s2.2.9 2.5 2.7" />
    </svg>
  );
}

export function ArrowIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      {...stroke}
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M2.5 10H17M11.5 4.5 17 10l-5.5 5.5" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      {...stroke}
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <path d="M8 1.5v13M1.5 8h13" />
    </svg>
  );
}
