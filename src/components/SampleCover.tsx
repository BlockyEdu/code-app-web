import { useId } from "react";
import type { SamplePalette } from "../lib/official-samples";
import type { ArtifactKind } from "../types/artifact";
import { KIND_COLOR } from "../types/artifact";
import styles from "./SampleCover.module.scss";

export function paletteForKind(kind: ArtifactKind): SamplePalette {
  const accent = KIND_COLOR[kind];
  return { from: "#F8FAFC", to: accent, ink: "#0F172A", accent: "#FFFFFF" };
}

interface SampleCoverProps {
  kind: ArtifactKind;
  palette: SamplePalette;
  label: string;
}

export function SampleCover({ kind, palette, label }: SampleCoverProps) {
  const gradId = `cover-${useId().replace(/:/g, "")}`;
  return (
    <div className={styles.frame}>
      <svg viewBox="0 0 320 200" role="img" aria-label={label}>
        <title>{label}</title>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
        </defs>
        <rect width="320" height="200" fill={`url(#${gradId})`} />
        <circle cx="280" cy="28" r="46" fill="#ffffff" opacity="0.18" />
        <circle cx="36" cy="168" r="32" fill="#ffffff" opacity="0.12" />
        {sceneFor(kind, palette)}
      </svg>
    </div>
  );
}

function sceneFor(kind: ArtifactKind, palette: SamplePalette) {
  if (kind === "miniprogram") return <PhoneScene palette={palette} />;
  if (kind === "smarthome") return <RoomScene palette={palette} />;
  if (kind === "iot") return <BoardScene palette={palette} />;
  if (kind === "toy") return <ToyScene palette={palette} />;
  if (kind === "free" || kind === "exercise") return <BlocksScene palette={palette} />;
  return <BrowserScene palette={palette} />;
}

function BrowserScene({ palette }: { palette: SamplePalette }) {
  return (
    <g>
      <rect x="36" y="32" width="248" height="136" rx="14" fill="#ffffff" />
      <rect x="36" y="32" width="248" height="28" rx="14" fill={palette.ink} />
      <rect x="36" y="48" width="248" height="12" fill={palette.ink} />
      <circle cx="54" cy="46" r="4" fill="#FCA5A5" />
      <circle cx="68" cy="46" r="4" fill="#FCD34D" />
      <circle cx="82" cy="46" r="4" fill="#86EFAC" />
      <rect x="52" y="76" width="88" height="10" rx="5" fill={palette.to} />
      <rect x="52" y="96" width="148" height="6" rx="3" fill={palette.ink} opacity="0.2" />
      <rect x="52" y="110" width="120" height="6" rx="3" fill={palette.ink} opacity="0.14" />
      <rect x="52" y="128" width="64" height="22" rx="8" fill={palette.to} />
      <rect x="176" y="76" width="88" height="74" rx="10" fill={palette.from} />
      <rect x="188" y="90" width="64" height="8" rx="4" fill={palette.to} opacity="0.85" />
      <rect x="188" y="106" width="48" height="6" rx="3" fill={palette.ink} opacity="0.25" />
      <rect x="188" y="120" width="40" height="6" rx="3" fill={palette.ink} opacity="0.18" />
    </g>
  );
}

function PhoneScene({ palette }: { palette: SamplePalette }) {
  return (
    <g>
      <rect x="108" y="22" width="104" height="156" rx="18" fill="#ffffff" />
      <rect x="118" y="34" width="84" height="128" rx="8" fill={palette.accent} />
      <rect x="142" y="28" width="36" height="6" rx="3" fill={palette.ink} opacity="0.35" />
      <rect x="128" y="48" width="64" height="28" rx="6" fill={palette.to} />
      <rect x="128" y="84" width="64" height="8" rx="4" fill={palette.ink} opacity="0.2" />
      <rect x="128" y="98" width="48" height="6" rx="3" fill={palette.ink} opacity="0.14" />
      <rect x="128" y="114" width="64" height="8" rx="4" fill={palette.ink} opacity="0.2" />
      <rect x="128" y="128" width="40" height="6" rx="3" fill={palette.ink} opacity="0.14" />
      <circle cx="160" cy="166" r="4" fill={palette.ink} opacity="0.35" />
    </g>
  );
}

function BoardScene({ palette }: { palette: SamplePalette }) {
  return (
    <g>
      <rect x="48" y="58" width="150" height="96" rx="12" fill={palette.ink} />
      <rect x="62" y="72" width="46" height="32" rx="4" fill={palette.accent} opacity="0.9" />
      <rect x="118" y="76" width="22" height="22" rx="3" fill={palette.to} />
      <g fill={palette.accent}>
        <rect x="64" y="122" width="6" height="14" rx="1" />
        <rect x="76" y="122" width="6" height="14" rx="1" />
        <rect x="88" y="122" width="6" height="14" rx="1" />
        <rect x="100" y="122" width="6" height="14" rx="1" />
        <rect x="112" y="122" width="6" height="14" rx="1" />
        <rect x="124" y="122" width="6" height="14" rx="1" />
      </g>
      <path
        d="M198 96 C230 96 230 48 262 48"
        fill="none"
        stroke="#F8FAFC"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="246" y="32" width="40" height="32" rx="8" fill="#ffffff" />
      <circle cx="266" cy="48" r="6" fill={palette.to} />
      <rect x="214" y="118" width="62" height="36" rx="8" fill="#ffffff" />
      <path d="M228 136 H262" stroke={palette.to} strokeWidth="4" strokeLinecap="round" />
      <path
        d="M198 118 C220 118 220 136 214 136"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function RoomScene({ palette }: { palette: SamplePalette }) {
  return (
    <g>
      <rect x="40" y="48" width="240" height="120" rx="16" fill="#ffffff" />
      <rect x="56" y="64" width="72" height="56" rx="6" fill={palette.from} />
      <path d="M92 64 V120" stroke={palette.ink} strokeWidth="3" />
      <path d="M56 92 H128" stroke={palette.ink} strokeWidth="3" opacity="0.35" />
      <rect x="148" y="72" width="16" height="48" rx="4" fill={palette.ink} opacity="0.25" />
      <path d="M156 72 V108" stroke={palette.to} strokeWidth="4" strokeLinecap="round" />
      <circle cx="156" cy="112" r="8" fill={palette.to} />
      <rect x="184" y="96" width="72" height="40" rx="8" fill={palette.ink} />
      <rect x="194" y="106" width="18" height="12" rx="2" fill={palette.accent} />
      <circle cx="230" cy="112" r="5" fill={palette.to} />
    </g>
  );
}

function ToyScene({ palette }: { palette: SamplePalette }) {
  return (
    <g>
      <circle cx="160" cy="58" r="22" fill="#ffffff" />
      <circle cx="152" cy="54" r="3" fill={palette.ink} />
      <circle cx="168" cy="54" r="3" fill={palette.ink} />
      <path d="M152 66 Q160 72 168 66" fill="none" stroke={palette.to} strokeWidth="3" />
      <rect x="128" y="84" width="64" height="52" rx="16" fill="#ffffff" />
      <rect x="96" y="92" width="28" height="14" rx="7" fill={palette.accent} />
      <rect x="196" y="92" width="28" height="14" rx="7" fill={palette.accent} />
      <rect x="140" y="140" width="14" height="28" rx="7" fill={palette.ink} />
      <rect x="166" y="140" width="14" height="28" rx="7" fill={palette.ink} />
    </g>
  );
}

function BlocksScene({ palette }: { palette: SamplePalette }) {
  return (
    <g>
      <rect x="36" y="48" width="140" height="36" rx="10" fill="#ffffff" />
      <rect x="36" y="48" width="16" height="36" rx="8" fill={palette.to} />
      <rect x="64" y="60" width="72" height="8" rx="4" fill={palette.ink} opacity="0.25" />
      <rect x="52" y="96" width="124" height="32" rx="10" fill="#ffffff" />
      <rect x="52" y="96" width="16" height="32" rx="8" fill={palette.ink} />
      <rect x="80" y="106" width="64" height="8" rx="4" fill={palette.ink} opacity="0.2" />
      <path d="M188 78 H214" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <path d="M206 70 L218 78 L206 86" fill="none" stroke="#ffffff" strokeWidth="4" />
      <rect x="228" y="52" width="60" height="8" rx="4" fill="#ffffff" opacity="0.9" />
      <rect x="228" y="70" width="48" height="8" rx="4" fill="#ffffff" opacity="0.7" />
      <rect x="228" y="88" width="56" height="8" rx="4" fill="#ffffff" opacity="0.8" />
      <rect x="228" y="112" width="40" height="8" rx="4" fill="#ffffff" opacity="0.55" />
    </g>
  );
}
