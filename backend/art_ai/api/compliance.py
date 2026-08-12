from datetime import datetime
from fastapi import APIRouter, Depends
from art_ai.dependencies.auth import get_current_user

router = APIRouter(prefix="/compliance", tags=["Compliance"])

CHECKS = [
    {"id": "AC-01", "category": "Access Control",      "title": "Multi-Factor Authentication",    "description": "Verify MFA is enforced on all privileged accounts and remote access.", "weight": 10},
    {"id": "AC-02", "category": "Access Control",      "title": "Least Privilege Enforcement",    "description": "Ensure accounts are granted only the minimum necessary permissions.", "weight": 8},
    {"id": "AC-03", "category": "Access Control",      "title": "Account Lockout Policy",         "description": "Confirm lockout after repeated failed login attempts is configured.", "weight": 7},
    {"id": "NS-01", "category": "Network Security",    "title": "Firewall Rule Review",           "description": "Review ingress/egress firewall rules for overly permissive entries.", "weight": 9},
    {"id": "NS-02", "category": "Network Security",    "title": "Exposed Services Audit",         "description": "Identify services unnecessarily exposed to the public internet.", "weight": 10},
    {"id": "NS-03", "category": "Network Security",    "title": "TLS/SSL Configuration",          "description": "Confirm TLS 1.2+ is enforced and weak cipher suites are disabled.", "weight": 8},
    {"id": "AS-01", "category": "Application Security","title": "Input Validation",               "description": "Verify all user inputs are validated and sanitized server-side.", "weight": 9},
    {"id": "AS-02", "category": "Application Security","title": "Security Headers",               "description": "Confirm HSTS, CSP, X-Frame-Options, and related headers are set.", "weight": 7},
    {"id": "AS-03", "category": "Application Security","title": "Dependency Vulnerability Scan",  "description": "Scan third-party dependencies for known CVEs.", "weight": 8},
    {"id": "DP-01", "category": "Data Protection",     "title": "Encryption at Rest",             "description": "Confirm sensitive data is encrypted at rest using AES-256 or equivalent.", "weight": 9},
    {"id": "DP-02", "category": "Data Protection",     "title": "Secret Management",              "description": "Verify API keys and secrets are not hardcoded or committed to version control.", "weight": 10},
    {"id": "MO-01", "category": "Monitoring",          "title": "Audit Logging",                  "description": "Confirm authentication events and privileged actions are logged.", "weight": 8},
    {"id": "MO-02", "category": "Monitoring",          "title": "Intrusion Detection",            "description": "Verify an IDS/IPS solution is active and alerting on anomalous traffic.", "weight": 7},
]

FINDINGS = {
    "AC-01": {"status": "partial",    "evidence": "Auth flow exists but no MFA layer is configured.", "recommendation": "Add TOTP or hardware token support to the auth pipeline."},
    "AC-02": {"status": "pass",       "evidence": "Role column on users table with 'user' default. Admin escalation not exposed.", "recommendation": "Periodically audit role assignments."},
    "AC-03": {"status": "fail",       "evidence": "No brute-force lockout logic found in auth.py.", "recommendation": "Add rate-limiting and account lockout after N failed attempts."},
    "NS-01": {"status": "not_tested", "evidence": "Network layer not accessible from application scan.", "recommendation": "Review firewall rules manually or via infrastructure scan."},
    "NS-02": {"status": "partial",    "evidence": "Backend exposes /debug endpoint revealing CORS config — remove in production.", "recommendation": "Remove /debug in production. Audit all public routes."},
    "NS-03": {"status": "not_tested", "evidence": "TLS is handled by the deployment layer, not FastAPI directly.", "recommendation": "Verify TLS 1.2+ is enforced at the reverse proxy or load balancer."},
    "AS-01": {"status": "partial",    "evidence": "Pydantic v2 validates input types but no explicit length limits on most fields.", "recommendation": "Add max_length constraints to all string fields."},
    "AS-02": {"status": "fail",       "evidence": "No security headers middleware detected in main.py.", "recommendation": "Add HSTS, CSP, and X-Frame-Options headers via middleware."},
    "AS-03": {"status": "not_tested", "evidence": "requirements.txt uses open ranges (>=) instead of pinned versions.", "recommendation": "Pin all dependencies and run pip-audit regularly."},
    "DP-01": {"status": "pass",       "evidence": "Passwords hashed with bcrypt. JWT signed with HS256.", "recommendation": "Consider RS256 for JWT to support key rotation."},
    "DP-02": {"status": "fail",       "evidence": "SECRET_KEY defaults to a hardcoded weak value in jwt.py.", "recommendation": "Enforce a strong randomly-generated SECRET_KEY via environment variable."},
    "MO-01": {"status": "fail",       "evidence": "No logging of authentication events found in auth.py.", "recommendation": "Log login attempts, token issuance, and failed authorization events."},
    "MO-02": {"status": "not_tested", "evidence": "IDS/IPS configuration is outside the application layer.", "recommendation": "Deploy network-level IDS and application WAF."},
}

STATUS_SCORES = {"pass": 1.0, "partial": 0.5, "fail": 0.0, "not_tested": 0.0}


@router.get("/report")
def get_compliance_report(current_user=Depends(get_current_user)):
    total_weight = sum(c["weight"] for c in CHECKS)
    earned = sum(c["weight"] * STATUS_SCORES.get(FINDINGS.get(c["id"], {}).get("status", "not_tested"), 0.0) for c in CHECKS)
    score = round(earned / total_weight * 100, 1) if total_weight else 0.0

    cats = {}
    for check in CHECKS:
        cat = check["category"]
        if cat not in cats:
            cats[cat] = {"total": 0, "earned": 0.0, "checks": []}
        finding = FINDINGS.get(check["id"], {})
        status = finding.get("status", "not_tested")
        cats[cat]["total"] += check["weight"]
        cats[cat]["earned"] += check["weight"] * STATUS_SCORES.get(status, 0.0)
        cats[cat]["checks"].append({**check, "status": status, "evidence": finding.get("evidence", ""), "recommendation": finding.get("recommendation", "")})

    breakdown = [{"category": k, "score": round(v["earned"] / v["total"] * 100, 1) if v["total"] else 0.0, "checks": v["checks"]} for k, v in cats.items()]

    status_counts = {"pass": 0, "partial": 0, "fail": 0, "not_tested": 0}
    for check in CHECKS:
        s = FINDINGS.get(check["id"], {}).get("status", "not_tested")
        status_counts[s] += 1

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "overall_score": score,
        "posture": "Good" if score >= 75 else ("Moderate" if score >= 50 else "At Risk"),
        "summary": status_counts,
        "categories": breakdown,
        "total_checks": len(CHECKS),
        "note": "Assessment based on static analysis of the ART-AI backend codebase.",
    }
