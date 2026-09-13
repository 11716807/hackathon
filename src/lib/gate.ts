import type { Finding, GateDecision } from "./types";

export function decideGate(findings: Finding[]): {
  decision: GateDecision;
  summary: string;
} {
  const missing = findings.filter((item) => item.code === "slot_missing");
  const retakes = findings.filter((item) => item.severity === "retake");
  const mustFix = findings.filter((item) => item.severity === "must_fix");
  const warns = findings.filter((item) => item.severity === "warn");

  if (missing.length > 0) {
    return {
      decision: "HOLD",
      summary: `${missing.length} slot${missing.length === 1 ? "" : "s"} not captured.`,
    };
  }

  if (retakes.length > 0) {
    return {
      decision: "HOLD",
      summary: `Retake ${retakes.length} unclear photo${retakes.length === 1 ? "" : "s"} before the gate can decide.`,
    };
  }

  if (mustFix.length > 0) {
    const titles = mustFix.map((item) => item.title).join(" · ");
    return {
      decision: "HOLD",
      summary: `${mustFix.length} must-fix: ${titles}`,
    };
  }

  if (warns.length > 0) {
    return {
      decision: "CLEAR",
      summary: `Clear to run. ${warns.length} warning${warns.length === 1 ? "" : "s"} logged, not blocking.`,
    };
  }

  return {
    decision: "CLEAR",
    summary: "Clear to run. All five frames match the work order and golden.",
  };
}

export function mustFixSlotIds(findings: Finding[]): Finding["slotId"][] {
  return findings
    .filter(
      (item) => item.severity === "must_fix" || item.severity === "retake",
    )
    .map((item) => item.slotId);
}
