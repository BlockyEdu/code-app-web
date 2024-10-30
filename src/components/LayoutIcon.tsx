interface LayoutIconProps {
  width?: number;
  height?: number;
  showLeft?: boolean;
  showPreview?: boolean;
  showConsole?: boolean;
  showAi?: boolean;
  inMenu?: boolean;
}

/** Compact 4-pane layout glyph (inspired by DataLuminary LayoutIcon). */
export function LayoutIcon({
  width = 16,
  height = 16,
  showLeft = false,
  showPreview = false,
  showConsole = false,
  showAi = false,
  inMenu = false,
}: LayoutIconProps) {
  const fillColor = inMenu ? "#4c84f7" : "#8493aa";
  const off = "#3a4254";
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="layout"
    >
      <title>layout</title>
      <g fillRule="evenodd">
        <path d="M288 128H736V400H288V128z" fill={showConsole ? fillColor : off} />
        <path d="M288 464H736V896H288V464z" fill={showPreview ? fillColor : off} />
        <path
          d="M48 128L224 128 224 128 224 896 48 896C39.163444 896 32 888.8365552 32 880L32 144C32 135.163444 39.163444 128 48 128Z"
          fill={showLeft ? fillColor : off}
        />
        <path
          d="M976 128L800 128 800 128 800 896 976 896C984.8365552 896 992 888.8365552 992 880L992 144C992 135.163444 984.8365552 128 976 128Z"
          fill={showAi ? fillColor : off}
        />
      </g>
    </svg>
  );
}
