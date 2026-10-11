type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {children}
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </Svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </Svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5L6 16Z" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </Svg>
  );
}

export function IconTarget({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconVideo({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="m15 10 6-3v10l-6-3v-4Z" />
    </Svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconStar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 3 2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 15.8 6.9 18.1 8.1 12.6 3.9 8.8l5.6-.6L12 3Z" />
    </Svg>
  );
}

export function IconHome({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  );
}

export function IconBook({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2V4Z" />
      <path d="M6 20a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

export function IconCard({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </Svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="9" r="3" />
      <path d="M6 19c1.2-2.5 3-3.8 6-3.8S16.8 16.5 18 19" strokeLinecap="round" />
    </Svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
