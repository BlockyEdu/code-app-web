export const FLOAT_MIN_WIDTH = 450;
export const FLOAT_MIN_HEIGHT = 600;
export const FLOAT_DEFAULT_WIDTH = 480;
export const FLOAT_DEFAULT_HEIGHT = 640;

export interface FloatingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

const STORAGE_KEY = "blockyedu-ai-float-rect";

export function viewportSize(): ViewportSize {
  if (typeof window === "undefined") return { width: 1280, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function clampFloatingRect(rect: FloatingRect, viewport: ViewportSize): FloatingRect {
  const minW = Math.min(FLOAT_MIN_WIDTH, viewport.width);
  const minH = Math.min(FLOAT_MIN_HEIGHT, viewport.height);
  const width = Math.min(viewport.width, Math.max(rect.width, minW));
  const height = Math.min(viewport.height, Math.max(rect.height, minH));
  const maxX = Math.max(0, viewport.width - width);
  const maxY = Math.max(0, viewport.height - height);
  return {
    x: Math.min(Math.max(rect.x, 0), maxX),
    y: Math.min(Math.max(rect.y, 0), maxY),
    width,
    height,
  };
}

/** Default open position: right edge, vertically centered. */
export function defaultFloatingRect(viewport: ViewportSize): FloatingRect {
  const width = Math.min(FLOAT_DEFAULT_WIDTH, viewport.width);
  const height = Math.min(FLOAT_DEFAULT_HEIGHT, viewport.height);
  return clampFloatingRect(
    {
      x: Math.max(0, viewport.width - width - 24),
      y: Math.round((viewport.height - height) / 2),
      width,
      height,
    },
    viewport,
  );
}

export function loadFloatingRect(viewport: ViewportSize = viewportSize()): FloatingRect {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FloatingRect>;
      if (
        typeof parsed.x === "number" &&
        typeof parsed.y === "number" &&
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        return clampFloatingRect(parsed as FloatingRect, viewport);
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return defaultFloatingRect(viewport);
}

export function saveFloatingRect(rect: FloatingRect): FloatingRect {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rect));
    }
  } catch {
    /* quota / private mode */
  }
  return rect;
}
