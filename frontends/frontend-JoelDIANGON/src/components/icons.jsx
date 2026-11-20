/** Pictogrammes au trait fin (32×32), couleur héritée (currentColor). */

function Line({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------ objets de la scène */

export const BookIcon = (props) => (
  <Line {...props}>
    <path d="M4 8.6c3.3-1.5 7.2-1.4 12 1.1v15.1c-4.8-2.5-8.7-2.6-12-1.1z" />
    <path d="M28 8.6c-3.3-1.5-7.2-1.4-12 1.1v15.1c4.8-2.5 8.7-2.6 12-1.1z" />
    <path d="M7.4 13.1c2.1-.5 4.2-.2 5.9.6M7.4 17.1c2.1-.5 4.2-.2 5.9.6" opacity=".55" />
  </Line>
)

export const BriefcaseIcon = (props) => (
  <Line {...props}>
    <rect x="4" y="10" width="24" height="16" rx="2.6" />
    <path d="M12 10V7.6A1.6 1.6 0 0 1 13.6 6h4.8A1.6 1.6 0 0 1 20 7.6V10" />
    <path d="M4 16.4c7.6 3 16.4 3 24 0" opacity=".7" />
    <path d="M14.4 17.6h3.2" />
  </Line>
)

export const SphereIcon = (props) => (
  <Line {...props}>
    <circle cx="16" cy="16" r="8.6" />
    <ellipse cx="16" cy="16" rx="3.8" ry="8.6" opacity=".7" />
    <path d="M7.7 13.2h16.6M7.7 18.8h16.6" opacity=".45" />
    <ellipse cx="16" cy="16" rx="14" ry="4.4" transform="rotate(-20 16 16)" opacity=".55" />
  </Line>
)

export const ModulesIcon = (props) => (
  <Line {...props}>
    <rect x="5" y="5" width="9" height="9" rx="1.8" />
    <rect x="18" y="5" width="9" height="9" rx="1.8" />
    <rect x="5" y="18" width="9" height="9" rx="1.8" />
    <circle cx="22.5" cy="22.5" r="4.6" />
    <path d="M14 9.5h4M9.5 14v4" opacity=".55" />
  </Line>
)

export const CollabIcon = (props) => (
  <Line {...props}>
    <circle cx="12.2" cy="16" r="7" />
    <circle cx="19.8" cy="16" r="7" />
    <path d="M16 10.3v11.4" opacity=".45" />
  </Line>
)

export const GlobeIcon = (props) => (
  <Line {...props}>
    <circle cx="16" cy="16" r="10.4" />
    <path d="M5.6 16h20.8" opacity=".7" />
    <path d="M16 5.6c2.9 3 4.3 6.5 4.3 10.4S18.9 23.4 16 26.4c-2.9-3-4.3-6.5-4.3-10.4S13.1 8.6 16 5.6z" />
    <path d="M7.3 10.8h17.4M7.3 21.2h17.4" opacity=".45" />
  </Line>
)

export const EnvelopeIcon = (props) => (
  <Line {...props}>
    <rect x="4.6" y="8" width="22.8" height="16" rx="2.6" />
    <path d="M5.6 9.6 16 17.4l10.4-7.8" />
  </Line>
)

export const TimelineIcon = (props) => (
  <Line {...props}>
    <path d="M6 16h20" />
    <circle cx="9" cy="16" r="2.4" />
    <circle cx="16" cy="16" r="2.4" />
    <circle cx="23" cy="16" r="2.4" />
    <path d="M9 9.5v4M16 18.5v4M23 9.5v4" opacity=".5" />
  </Line>
)

/* ------------------------------------------------------------ interface */

export const ArrowLeftIcon = (props) => (
  <Line {...props}>
    <path d="M25 16H7M13.5 9.5 7 16l6.5 6.5" />
  </Line>
)

export const ArrowRightIcon = (props) => (
  <Line {...props}>
    <path d="M7 16h18M18.5 9.5 25 16l-6.5 6.5" />
  </Line>
)

export const CloseIcon = (props) => (
  <Line {...props}>
    <path d="M9 9l14 14M23 9 9 23" />
  </Line>
)

export const MenuIcon = (props) => (
  <Line {...props}>
    <path d="M6 11h20M6 16h20M6 21h12" />
  </Line>
)

export const ExternalIcon = (props) => (
  <Line {...props}>
    <path d="M18 6h8v8M26 6 14.5 17.5" />
    <path d="M23 18.5V24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h5.5" />
  </Line>
)

export const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
  </svg>
)

export const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
)
