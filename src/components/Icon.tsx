const iconPaths = {
  home: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  login: ["M10 17l5-5-5-5m5 5H3", "M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"],
  register: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M19 8v6m3-3h-6"],
  dashboard: ["M3 3h8v8H3z", "M13 3h8v5h-8z", "M13 10h8v11h-8z", "M3 13h8v8H3z"],
  students: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  classes: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  attendance: ["M8 2v4m8-4v4M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2", "m9 16 2 2 4-4"],
  reports: ["M3 3v18h18", "m8 15 4-4 4 3 5-7"],
  logout: ["M10 17l5-5-5-5m5 5H3", "M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"],
  clock: ["M12 8v4l3 2", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"],
  check: ["m5 12 4 4L19 6"],
  close: ["M18 6 6 18M6 6l12 12"],
  building: ["M3 21h18", "M5 21V7l8-4v18", "M19 21V11l-6-4"],
  arrowRight: ["M5 12h14", "m12 5 7 7-7 7"],
  plus: ["M12 5v14", "M5 12h14"],
  search: ["m21 21-4.34-4.34", "M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0z"],
  edit: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v5", "M14 11v5"],
} as const;

export type IconName = keyof typeof iconPaths;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}
