import type { SVGProps } from "react";

/** Example SVG for Ant Design custom Icon (viewBox 1024). */
export function LayoutPanesSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <title>layout panes</title>
      <path d="M288 128h448v272H288z" fill="currentColor" opacity={0.45} />
      <path d="M288 464h448v432H288z" fill="currentColor" />
      <path
        d="M48 128h176v768H48a16 16 0 0 1-16-16V144a16 16 0 0 1 16-16z"
        fill="currentColor"
        opacity={0.7}
      />
      <path
        d="M976 128H800v768h176a16 16 0 0 0 16-16V144a16 16 0 0 0-16-16z"
        fill="currentColor"
        opacity={0.7}
      />
    </svg>
  );
}
