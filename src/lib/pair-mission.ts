export type PairPhase =
  | "diagnose"
  | "mission"
  | "hint_loop"
  | "implement_review"
  | "test"
  | "complete"
  | "stuck";

export type PairAction = "explain" | "hint" | "implement" | "test" | "review";

export type PairMission = {
  id: string;
  title: string;
  success: string;
  phase: PairPhase;
};

export const DEFAULT_PAIR_MISSION: PairMission = {
  id: "first-run",
  title: "Get a first successful run",
  success: "Console or preview produces output without an error line",
  phase: "mission",
};

export const PAIR_PHASE_LABEL: Record<PairPhase, string> = {
  diagnose: "Diagnose",
  mission: "Mission",
  hint_loop: "Hint",
  implement_review: "Review diff",
  test: "Test",
  complete: "Complete",
  stuck: "Stuck",
};

export function nextPhaseAfterAction(action: PairAction, current: PairPhase): PairPhase {
  if (current === "complete") return "complete";
  if (action === "hint") return "hint_loop";
  if (action === "implement") return "implement_review";
  if (action === "test") return "test";
  if (action === "review")
    return current === "test" || current === "implement_review" ? "complete" : current;
  return current;
}
