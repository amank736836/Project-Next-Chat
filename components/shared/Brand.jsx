/** Shared wordmark and mark from the login page. */
export function ChampMark({ className = "" }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 8a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v16a5 5 0 0 1-5 5H19L9 36v-9a5 5 0 0 1-3-4V8Z"
        fill="currentColor"
      />
      <path
        d="M14 14h13M14 20h8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Brand({ className = "" }) {
  return (
    <span className={`champ-wordmark ${className}`.trim()}>
      <ChampMark />
      <span className="champ-wordmark-text">
        chat<span className="brand-light">champ</span>
        <span className="brand-period">.</span>
      </span>
    </span>
  );
}
