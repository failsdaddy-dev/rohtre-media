import type { ReactNode } from "react";
import { DIAL_CODES } from "@/lib/career-application";

// Small drawn flags for the phone country picker. Emoji flags don't show on
// Windows (they appear as two letters), so these are inline SVGs: simplified,
// and no outside image requests.

const star = (x: number, y: number, r: number, fill = "#fff") => (
  <polygon
    fill={fill}
    points={Array.from({ length: 10 }, (_, i) => {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const d = i % 2 ? r * 0.42 : r;
      return `${(x + d * Math.cos(a)).toFixed(2)},${(y + d * Math.sin(a)).toFixed(2)}`;
    }).join(" ")}
  />
);

const unionJack = (
  <>
    <rect width="30" height="20" fill="#012169" />
    <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
    <path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="1.6" />
    <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
    <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.4" />
  </>
);

const FLAGS: Record<string, ReactNode> = {
  IN: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#ff9933" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.8" />
    </>
  ),
  US: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <path
        d="M0 1.54h30M0 4.62h30M0 7.69h30M0 10.77h30M0 13.85h30M0 16.92h30M0 20h30"
        stroke="#b22234"
        strokeWidth="1.54"
      />
      <rect width="13" height="10.77" fill="#3c3b6e" />
      {star(3.2, 3, 1.1)}
      {star(9.8, 3, 1.1)}
      {star(6.5, 5.4, 1.1)}
      {star(3.2, 7.8, 1.1)}
      {star(9.8, 7.8, 1.1)}
    </>
  ),
  AE: (
    <>
      <rect width="30" height="6.67" fill="#00732f" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#000" />
      <rect width="8" height="20" fill="#ff0000" />
    </>
  ),
  GB: unionJack,
  AU: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <svg width="15" height="10" viewBox="0 0 30 20">
        {unionJack}
      </svg>
      {star(7.5, 15, 2.4)}
      {star(23, 3.6, 1.3)}
      {star(19.5, 9, 1.3)}
      {star(26.5, 8, 1.3)}
      {star(23, 16, 1.3)}
    </>
  ),
  SG: (
    <>
      <rect width="30" height="10" fill="#ee2536" />
      <rect y="10" width="30" height="10" fill="#fff" />
      <circle cx="7" cy="5" r="3.6" fill="#fff" />
      <circle cx="8.4" cy="5" r="3.3" fill="#ee2536" />
      {star(9.4, 3.2, 0.7)}
      {star(12, 3.2, 0.7)}
      {star(10.7, 5, 0.7)}
      {star(9.4, 6.8, 0.7)}
      {star(12, 6.8, 0.7)}
    </>
  ),
  NP: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <path d="M8 0 22 9.5H12.5L22 20H8Z" fill="#dc143c" stroke="#003893" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="7.2" r="1.3" fill="#fff" />
      <circle cx="12" cy="14.8" r="1.5" fill="#fff" />
    </>
  ),
  BD: (
    <>
      <rect width="30" height="20" fill="#006a4e" />
      <circle cx="13.5" cy="10" r="6" fill="#f42a41" />
    </>
  ),
};

export function CountryFlag({ country }: { country: string }) {
  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 30 20"
      aria-hidden="true"
      className="block shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
    >
      {FLAGS[country]}
    </svg>
  );
}

/** The picker's options: flag and country name in the list, flag and code in the closed box. */
export const DIAL_OPTIONS = DIAL_CODES.map((d) => ({
  value: d.code,
  label: d.name,
  hint: d.code,
  short: d.code,
  icon: <CountryFlag country={d.country} />,
}));
