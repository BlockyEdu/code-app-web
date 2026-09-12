import { t } from "./i18n";

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

export function defaultPairMission(): PairMission {
  return {
    id: "first-run",
    get title() {
      return t("pairMission.title");
    },
    get success() {
      return t("pairMission.success");
    },
    phase: "mission",
  };
}

export const DEFAULT_PAIR_MISSION: PairMission = defaultPairMission();

/** Keep live title/success getters; object spread would snapshot the current locale. */
export function withPairPhase(mission: PairMission, phase: PairPhase): PairMission {
  return Object.assign(defaultPairMission(), { id: mission.id, phase });
}

export function pairPhaseLabel(phase: PairPhase): string {
  return t(`pair.${phase}`);
}

export function nextPhaseAfterAction(action: PairAction, current: PairPhase): PairPhase {
  if (current === "complete") return "complete";
  if (action === "hint") return "hint_loop";
  if (action === "implement") return "implement_review";
  if (action === "test") return "test";
  if (action === "review")
    return current === "test" || current === "implement_review" ? "complete" : current;
  return current;
}
