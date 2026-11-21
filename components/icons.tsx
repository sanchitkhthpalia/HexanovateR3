// Icons that change colour with state, inlined so they can use currentColor.
// Paths are copied from the Figma exports in public/icons (CaretDown, ArrowRight).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function CaretDown({ strokeWidth = 1, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" width={14} height={14} fill="none" aria-hidden {...props}>
      <path d="M3.5 5.5L7 8.5L10.5 5.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden {...props}>
      <path d="M17.3172 10.4422L11.6922 16.0672C11.5749 16.1845 11.4159 16.2503 11.25 16.2503C11.0841 16.2503 10.9251 16.1845 10.8078 16.0672C10.6905 15.9499 10.6247 15.7909 10.6247 15.625C10.6247 15.4591 10.6905 15.3001 10.8078 15.1828L15.3664 10.625H3.125C2.95924 10.625 2.80027 10.5592 2.68306 10.4419C2.56585 10.3247 2.5 10.1658 2.5 10C2.5 9.83424 2.56585 9.67527 2.68306 9.55806C2.80027 9.44085 2.95924 9.375 3.125 9.375H15.3664L10.8078 4.81719C10.6905 4.69991 10.6247 4.54085 10.6247 4.375C10.6247 4.20915 10.6905 4.05009 10.8078 3.93281C10.9251 3.81554 11.0841 3.74965 11.25 3.74965C11.4159 3.74965 11.5749 3.81554 11.6922 3.93281L17.3172 9.55781C17.3753 9.61586 17.4214 9.68479 17.4529 9.76066C17.4843 9.83654 17.5005 9.91787 17.5005 10C17.5005 10.0821 17.4843 10.1635 17.4529 10.2393C17.4214 10.3152 17.3753 10.3841 17.3172 10.4422Z" />
    </svg>
  );
}

// Not in the design (no mobile frames); drawn to match the 1.5px stroke style of the Figma carets.
export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" aria-hidden {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" aria-hidden {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}
