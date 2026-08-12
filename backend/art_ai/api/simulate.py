import random
import math
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from art_ai.dependencies.auth import get_current_user

router = APIRouter(prefix="/simulate", tags=["Simulation"])

ACTIONS = [
    "port_scan", "service_enumeration", "banner_grab",
    "credential_spray", "vulnerability_probe", "exploit_attempt",
    "privilege_escalation", "lateral_movement",
    "data_exfiltration", "persistence_install",
]

ACTION_REWARDS = {
    "port_scan": 1.0, "service_enumeration": 1.5, "banner_grab": 0.8,
    "credential_spray": 2.5, "vulnerability_probe": 2.0, "exploit_attempt": 4.0,
    "privilege_escalation": 5.0, "lateral_movement": 3.5,
    "data_exfiltration": 6.0, "persistence_install": 4.5,
}

ENVIRONMENTS = {
    "DVWA":           {"difficulty": 0.3, "description": "Damn Vulnerable Web Application"},
    "JuiceShop":      {"difficulty": 0.4, "description": "OWASP Juice Shop"},
    "Metasploitable": {"difficulty": 0.2, "description": "Metasploitable 2"},
    "CustomAPI":      {"difficulty": 0.5, "description": "Custom Vulnerable API"},
}


def _run_q_learning(environment: str, iterations: int) -> dict:
    env = ENVIRONMENTS.get(environment, ENVIRONMENTS["DVWA"])
    difficulty = env["difficulty"]
    num_states = 8
    q_table = [[0.0] * len(ACTIONS) for _ in range(num_states)]
    alpha, gamma = 0.1, 0.9
    epsilon, epsilon_min = 0.9, 0.05
    epsilon_decay = math.exp(math.log(epsilon_min / epsilon) / max(iterations, 1))
    events, rewards_history = [], []
    best_reward, best_path, current_path = -float("inf"), [], []
    total_success, state = 0, 0

    for i in range(iterations):
        if random.random() < epsilon:
            action_idx = random.randint(0, len(ACTIONS) - 1)
        else:
            action_idx = q_table[state].index(max(q_table[state]))

        action = ACTIONS[action_idx]
        success_prob = (1.0 - difficulty) * (0.5 + 0.5 * (1 - epsilon))
        success = random.random() < success_prob
        reward = ACTION_REWARDS[action] * (1.0 if success else -0.3) + random.uniform(-0.2, 0.2)

        next_state = random.randint(0, num_states - 1)
        old_q = q_table[state][action_idx]
        q_table[state][action_idx] = old_q + alpha * (reward + gamma * max(q_table[next_state]) - old_q)
        state = next_state
        epsilon = max(epsilon_min, epsilon * epsilon_decay)

        rewards_history.append(round(reward, 3))
        current_path.append(action)
        if success:
            total_success += 1

        events.append({
            "iteration": i + 1, "action": action,
            "reward": round(reward, 3),
            "outcome": "success" if success else "blocked",
            "state": state, "epsilon": round(epsilon, 4),
        })

        ep_total = sum(rewards_history)
        if ep_total > best_reward:
            best_reward = ep_total
            best_path = list(current_path)

    action_counts = {a: sum(1 for e in events if e["action"] == a) for a in ACTIONS}

    return {
        "environment": environment,
        "environment_description": env["description"],
        "iterations": iterations,
        "final_epsilon": round(epsilon, 4),
        "learning_rate": alpha,
        "discount_factor": gamma,
        "total_reward": round(sum(rewards_history), 3),
        "best_reward": round(best_reward, 3),
        "success_rate": round(total_success / iterations * 100, 1) if iterations > 0 else 0,
        "best_path": best_path[:10],
        "rewards_history": rewards_history[-100:],
        "action_distribution": action_counts,
        "recent_events": events[-50:],
    }


class SimulateRequest(BaseModel):
    environment: str = "DVWA"
    iterations: int = 50


@router.get("/environments")
def list_environments():
    return {"environments": list(ENVIRONMENTS.keys())}


@router.post("/run")
def run_simulation(req: SimulateRequest, current_user=Depends(get_current_user)):
    """Q-learning attack simulation — sandboxed environment only."""
    iterations = max(1, min(req.iterations, 500))
    started_at = datetime.utcnow().isoformat()
    result = _run_q_learning(req.environment, iterations)
    result["started_at"] = started_at
    result["completed_at"] = datetime.utcnow().isoformat()
    result["disclaimer"] = "Simulation runs in a controlled sandboxed environment only."
    return result
