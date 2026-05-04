import type { SVGProps } from 'react';

const baseProps: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Svg = (p: SVGProps<SVGSVGElement>) => <svg {...baseProps} {...p} />;

export const Icon = {
  Home:   (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/></Svg>,
  Library:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h7M8 11h7M8 15h4"/></Svg>,
  Chart:  (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/><path d="M7 17v-4M11 17V9M15 17v-7M19 17v-2"/></Svg>,
  Settings:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Svg>,
  Plus:   (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M12 5v14M5 12h14"/></Svg>,
  ArrowLeft:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Svg>,
  ArrowRight:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Svg>,
  Close:  (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M18 6L6 18M6 6l12 12"/></Svg>,
  Search: (p: SVGProps<SVGSVGElement>) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Svg>,
  Check:  (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M20 6L9 17l-5-5"/></Svg>,
  Edit:   (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>,
  Trash:  (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></Svg>,
  ThumbUp:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h3M15 5.88L14 10h5.76a2 2 0 0 1 1.94 2.5l-2.5 9A2 2 0 0 1 17.26 23H7V11l5-9 1.74 1.74A2 2 0 0 1 14 6.66z"/></Svg>,
  Video:  (p: SVGProps<SVGSVGElement>) => <Svg {...p}><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/></Svg>,
  Image:  (p: SVGProps<SVGSVGElement>) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></Svg>,
  Sparkle:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></Svg>,
  Bolt:   (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></Svg>,
  Lock:   (p: SVGProps<SVGSVGElement>) => <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Svg>,
  Upload: (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></Svg>,
  ChevronRight:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M9 6l6 6-6 6"/></Svg>,
  ChevronDown: (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M6 9l6 6 6-6"/></Svg>,
  Refresh:(p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M21 12a9 9 0 1 1-3.5-7.1L21 8"/><path d="M21 3v5h-5"/></Svg>,
  Filter: (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M3 6h18M6 12h12M10 18h4"/></Svg>,
  Box:    (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M21 8L12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></Svg>,
  Logout: (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Svg>,
  Plug:   (p: SVGProps<SVGSVGElement>) => <Svg {...p}><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0z"/><path d="M12 16v6"/></Svg>,
};
