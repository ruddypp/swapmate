export type MissionPriority = "high" | "medium" | "low";

export type MissionKind = "rebalance" | "learn" | "risk" | "route";

export type MissionAction =
  | {
      type: "prepare_swap";
      tokenIn: string;
      tokenOut: string;
      amount: string;
      prompt?: string;
    }
  | {
      type: "ask_ai";
      prompt: string;
    };

export interface StrategyMission {
  id: string;
  title: string;
  kind: MissionKind;
  priority: MissionPriority;
  summary: string;
  rationale: string;
  actionLabel: string;
  action: MissionAction;
}

export interface StrategyMissionResponse {
  missions: StrategyMission[];
}
