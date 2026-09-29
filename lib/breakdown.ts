/** One row of a "where the money goes" table, built by an engine and drawn by BreakdownTable. */
export type LineKind = "heading" | "income" | "cost" | "credit" | "subtotal" | "total" | "note";

export interface Line {
  label: string;
  /** Signed; what the sign means is up to the engine. Headings and notes may carry 0. */
  value: number;
  kind: LineKind;
}
