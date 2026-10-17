export type Role = "operator" | "supervisor";
export type Locale = "en" | "hi";
export type Severity = "must_fix" | "warn" | "ok" | "retake";
export type GateDecision = "HOLD" | "CLEAR";
export type EngineMode = "live" | "practice";
export type LayoutMode = "auto" | "phone" | "laptop";

export type VisualFlag =
  | "guard_open"
  | "guard_closed"
  | "label_present"
  | "jig_misaligned"
  | "jig_aligned"
  | "first_piece_defect"
  | "first_piece_ok"
  | "hopper_wrong_material"
  | "hopper_ok"
  | "hopper_messy"
  | "unreadable"
  | "mismatch";

export type FindingCode =
  | "label_mismatch"
  | "label_unreadable"
  | "guard_open"
  | "jig_misaligned"
  | "first_piece_defect"
  | "hopper_wrong_material"
  | "hopper_messy"
  | "slot_ok"
  | "slot_retake"
  | "slot_missing"
  | "slot_mismatch";

export type SlotId = string;

export interface SlotSpec {
  id: SlotId;
  titleEn: string;
  titleHi: string;
  hintEn: string;
  hintHi: string;
  sopLine: string;
}

export interface Album {
  id: string;
  industry: "packaging" | "electronics" | "custom";
  plantName: string;
  lineName: string;
  sku: string;
  skuName: string;
  workOrder: string;
  goldenDir: string;
  hourlyOverheadInr: number;
  unitMarginInr: number;
  scrapUnitsIfEscape: number;
  recallReserveInr: number;
  holdMinutes: number;
  slots: SlotSpec[];
}

export interface SlotExtraction {
  slotId: SlotId;
  extractedText: string;
  flags: VisualFlag[];
  visualSummary: string;
  confidence: number;
}

export interface Finding {
  slotId: SlotId;
  severity: Severity;
  code: FindingCode;
  title: string;
  detail: string;
  sopCite: string;
  extractedText?: string;
  confidence: number;
}

export interface ImpactEstimate {
  holdMinutes: number;
  holdCostInr: number;
  escapeCostInr: number;
  currency: "INR";
}

export interface InspectionResult {
  albumId: string;
  workOrderSku: string;
  engine: EngineMode | "rules";
  model?: string;
  findings: Finding[];
  decision: GateDecision;
  summary: string;
  toolTrace: string[];
  impact: ImpactEstimate;
  decidedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  albumId: string;
  sku: string;
  lineName: string;
  decision: GateDecision;
  actor: Role;
  summary: string;
  overrideReason?: string;
  findingCodes: FindingCode[];
}

export interface SlotCapture {
  slotId: SlotId;
  dataUrl: string;
  capturedAt: string;
}
