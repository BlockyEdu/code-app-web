import type { ToyState } from "./targets";

/** Twin state returned by `/api/v1/toy` SimulationSession / EventResult. */
export type ToyServerState = {
  x?: number;
  y?: number;
  heading?: number;
  speed?: number;
  moving?: string;
  led?: string;
  sensors?: Record<string, number>;
  sound?: string;
  speech?: string;
  timeline?: string[];
  arena?: { width?: number; height?: number };
  sku?: string;
};

export function asToyServerState(raw: unknown): ToyServerState | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as ToyServerState;
}

export function applyServerStateToToy(
  prev: ToyState | undefined,
  state: ToyServerState | null | undefined,
): ToyState {
  const base: ToyState = prev ?? {
    x: 50,
    y: 70,
    heading: 0,
    speed: 0,
    moving: "idle",
    led: "off",
    servos: { head: 90, arm: 90, claw: 90 },
    sensors: { line: 1, distance: 80, light: 400 },
    sound: "",
    speech: "",
    timeline: [],
  };
  if (!state) return base;
  return {
    ...base,
    x: typeof state.x === "number" ? state.x : base.x,
    y: typeof state.y === "number" ? state.y : base.y,
    heading: typeof state.heading === "number" ? state.heading : base.heading,
    speed: typeof state.speed === "number" ? state.speed : base.speed,
    moving: typeof state.moving === "string" ? state.moving : base.moving,
    led: typeof state.led === "string" ? state.led : base.led,
    sensors: { ...base.sensors, ...(state.sensors ?? {}) },
    sound: typeof state.sound === "string" ? state.sound : base.sound,
    speech: typeof state.speech === "string" ? state.speech : base.speech,
    timeline: Array.isArray(state.timeline) ? state.timeline.slice(-8) : base.timeline,
  };
}
