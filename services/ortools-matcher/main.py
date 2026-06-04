from fastapi import FastAPI
from pydantic import BaseModel
from ortools.linear_solver import pywraplp

app = FastAPI(title="OR-Tools Matcher")


class AssignmentRequest(BaseModel):
    order_ids: list[str]
    driver_ids: list[str]
    cost_matrix: list[list[float]]


class AssignmentResponse(BaseModel):
    assignments: dict[str, str | None]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match", response_model=AssignmentResponse)
def match(req: AssignmentRequest):
    num_orders = len(req.order_ids)
    num_drivers = len(req.driver_ids)
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        return AssignmentResponse(assignments={oid: None for oid in req.order_ids})

    x = {}
    for i in range(num_orders):
        for j in range(num_drivers):
            x[i, j] = solver.BoolVar(f"x_{i}_{j}")

    for i in range(num_orders):
        solver.Add(solver.Sum(x[i, j] for j in range(num_drivers)) <= 1)

    for j in range(num_drivers):
        solver.Add(solver.Sum(x[i, j] for i in range(num_orders)) <= 1)

    objective = solver.Objective()
    for i in range(num_orders):
        for j in range(num_drivers):
            cost = req.cost_matrix[i][j] if i < len(req.cost_matrix) and j < len(req.cost_matrix[i]) else 1e9
            objective.SetCoefficient(x[i, j], cost)
    objective.SetMinimization()

    status = solver.Solve()
    assignments: dict[str, str | None] = {oid: None for oid in req.order_ids}

    if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        for i in range(num_orders):
            for j in range(num_drivers):
                if x[i, j].solution_value() > 0.5:
                    assignments[req.order_ids[i]] = req.driver_ids[j]

    return AssignmentResponse(assignments=assignments)
