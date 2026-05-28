import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function MessengerIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} {...props}>
      <path
        fill="#00B2FF"
        d="M12 2.25c-5.48 0-9.75 4.02-9.75 9.18 0 2.92 1.36 5.5 3.58 7.17v3.15l3.27-1.8c.92.25 1.9.38 2.9.38 5.48 0 9.75-4.02 9.75-9.18S17.48 2.25 12 2.25Z"
      />
      <path
        fill="#fff"
        d="m6.45 13.68 3.03-4.83 3.04 2.45 5.03-2.45-3.03 4.83-3.04-2.45-5.03 2.45Z"
      />
    </svg>
  );
}

export function FacebookIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} {...props}>
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        fill="#fff"
        d="M14.7 12.64h-1.78v6.58h-2.7v-6.58H8.9v-2.3h1.32V8.9c0-1.05.5-2.7 2.7-2.7h1.98v2.2h-1.44c-.24 0-.54.12-.54.6v1.34h1.98l-.2 2.3Z"
      />
    </svg>
  );
}

export function CopyLinkIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5.03" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-2.12 2.12a5 5 0 0 0 7.07 7.07l1.22-1.22" />
    </svg>
  );
}

export function ViewDetailsIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
