import { RuntimeState } from "../../shared/types";

export const TRANSITIONS: Record<RuntimeState, RuntimeState[]> = {
  initializing: ["booting"],
  booting: ["unregistered", "authenticating", "error"],
  unregistered: ["registering"],
  registering: ["authenticating", "error"],
  authenticating: ["loading_config", "error"],
  loading_config: ["ready", "error"],
  ready: ["offline", "error", "authenticating", "shutting_down"],
  offline: ["ready", "error"],
  error: ["booting", "shutting_down"],
  shutting_down: [],
};

export function canTransition(from: RuntimeState, to: RuntimeState): boolean {
  return TRANSITIONS[from]?.includes(to) || to === "shutting_down";
}

export function getValidTransitions(from: RuntimeState): RuntimeState[] {
  return TRANSITIONS[from] || [];
}
