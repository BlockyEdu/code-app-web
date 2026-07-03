import type { CSSProperties } from 'react';
import { appBrandTitle } from '../lib/deploy-profile';

const MARK_SRC = '/logo-mark.png';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src={MARK_SRC}
      width={size}
      height={size}
      alt="BlockyEdu"
      style={{ display: 'block', borderRadius: Math.round(size * 0.22) }}
    />
  );
}

export function Logo({ showSub = true, style }: { showSub?: boolean; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
      <LogoMark />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3' }}>{appBrandTitle()}</span>
        {showSub && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', letterSpacing: 1 }}>编程工作台</span>
        )}
      </span>
    </span>
  );
}
