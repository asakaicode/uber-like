import { ORTOOLS_URL } from "./config.js";

export interface MatchRequest {
  orderIds: string[];
  driverIds: string[];
  costMatrix: number[][];
}

export async function matchWithOrtools(req: MatchRequest): Promise<Map<string, string | null>> {
  if (!ORTOOLS_URL) return new Map();

  try {
    const res = await fetch(`${ORTOOLS_URL}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_ids: req.orderIds,
        driver_ids: req.driverIds,
        cost_matrix: req.costMatrix,
      }),
    });
    if (!res.ok) return new Map();
    const data = (await res.json()) as { assignments: Record<string, string | null> };
    return new Map(Object.entries(data.assignments));
  } catch {
    return new Map();
  }
}
