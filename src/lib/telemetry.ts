export type TelemetryEvent =
  | "pair.mission.started"
  | "pair.mission.completed"
  | "pair.patch.accepted"
  | "pair.patch.rejected"
  | "hardware.sim.started"
  | "hardware.sim.completed"
  | "mfg.validate.completed"
  | "launch.pack.generated";

export function track(event: TelemetryEvent, payload?: Record<string, unknown>): void {
  const detail = { event, payload: payload ?? {}, t: Date.now() };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("blockyedu:telemetry", { detail }));
  }
  if (import.meta.env.DEV) {
    console.debug("[telemetry]", event, payload);
  }
}

export function requestWorkspaceRun(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("workspace:run"));
  }
}
