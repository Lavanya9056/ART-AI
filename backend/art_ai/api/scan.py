import os
import socket
import concurrent.futures
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from art_ai.dependencies.auth import get_current_user

router = APIRouter(prefix="/scan", tags=["Scanner"])

PORT_META = {
    21:   {"service": "FTP",          "protocol": "tcp", "risk": "High",     "notes": "File transfer — check for anonymous access and cleartext credentials."},
    22:   {"service": "SSH",          "protocol": "tcp", "risk": "Medium",   "notes": "Verify banner, cipher suite, and key-based auth enforcement."},
    23:   {"service": "Telnet",       "protocol": "tcp", "risk": "Critical", "notes": "Cleartext protocol — should be disabled in favor of SSH."},
    25:   {"service": "SMTP",         "protocol": "tcp", "risk": "Medium",   "notes": "Check open-relay configuration and auth requirements."},
    53:   {"service": "DNS",          "protocol": "tcp", "risk": "Low",      "notes": "Verify zone transfer restrictions and recursive resolver exposure."},
    80:   {"service": "HTTP",         "protocol": "tcp", "risk": "Medium",   "notes": "Cleartext web — inspect security headers and enforce HTTPS redirect."},
    110:  {"service": "POP3",         "protocol": "tcp", "risk": "High",     "notes": "Cleartext email retrieval — use POP3S on port 995 instead."},
    135:  {"service": "RPC",          "protocol": "tcp", "risk": "High",     "notes": "Windows RPC endpoint mapper — common attack surface."},
    139:  {"service": "NetBIOS",      "protocol": "tcp", "risk": "High",     "notes": "Legacy Windows network service — restrict to trusted networks."},
    143:  {"service": "IMAP",         "protocol": "tcp", "risk": "Medium",   "notes": "Email access protocol — prefer IMAPS on port 993."},
    443:  {"service": "HTTPS",        "protocol": "tcp", "risk": "Low",      "notes": "Inspect TLS version, certificate validity, and cipher suite strength."},
    445:  {"service": "SMB",          "protocol": "tcp", "risk": "Critical", "notes": "Windows file sharing — patch against EternalBlue and related exploits."},
    1433: {"service": "MSSQL",        "protocol": "tcp", "risk": "High",     "notes": "SQL Server — verify authentication mode and network exposure."},
    3306: {"service": "MySQL",        "protocol": "tcp", "risk": "High",     "notes": "Database exposed to network — restrict access by IP."},
    3389: {"service": "RDP",          "protocol": "tcp", "risk": "Critical", "notes": "Remote Desktop — enable NLA, restrict by IP, monitor brute-force."},
    5432: {"service": "PostgreSQL",   "protocol": "tcp", "risk": "High",     "notes": "Database exposed — enforce strong credentials and network restrictions."},
    5900: {"service": "VNC",          "protocol": "tcp", "risk": "Critical", "notes": "Remote desktop with weak auth history — verify password complexity."},
    6379: {"service": "Redis",        "protocol": "tcp", "risk": "Critical", "notes": "Often deployed without auth — can lead to RCE."},
    8080: {"service": "HTTP-Alt",     "protocol": "tcp", "risk": "Medium",   "notes": "Alternate HTTP — may expose admin panels or dev servers."},
    8443: {"service": "HTTPS-Alt",    "protocol": "tcp", "risk": "Low",      "notes": "Alternate HTTPS — verify certificate and TLS configuration."},
    9200: {"service": "Elasticsearch","protocol": "tcp", "risk": "Critical", "notes": "Unauth access common — verify the security plugin is enabled."},
    27017:{"service": "MongoDB",      "protocol": "tcp", "risk": "Critical", "notes": "Often deployed without auth by default — verify access controls."},
}

QUICK_PORTS = [21, 22, 23, 25, 53, 80, 443, 445, 3306, 3389, 5900, 6379, 8080, 8443]
FULL_PORTS  = list(PORT_META.keys())


def _probe_port(host: str, port: int, timeout: float = 1.0):
    try:
        with socket.create_connection((host, port), timeout=timeout) as sock:
            meta = PORT_META.get(port, {
                "service": "Unknown", "protocol": "tcp",
                "risk": "Info", "notes": "Unrecognised port — investigate manually.",
            })
            banner = ""
            try:
                sock.settimeout(0.5)
                sock.sendall(b"\r\n")
                raw = sock.recv(256)
                banner = raw.decode(errors="replace").strip()[:120]
            except Exception:
                pass
            return {
                "port": port,
                "protocol": meta["protocol"],
                "service": meta["service"],
                "state": "open",
                "risk": meta["risk"],
                "banner": banner,
                "notes": meta["notes"],
            }
    except (socket.timeout, ConnectionRefusedError, OSError):
        return None


class ScanRequest(BaseModel):
    target: str
    scan_type: str = "quick"


@router.post("/run")
def run_scan(req: ScanRequest, current_user=Depends(get_current_user)):
    """Authorized TCP port scan. Use only on systems you own or have explicit written permission to test."""
    target = req.target.strip()
    if not target:
        return {"error": "Target is required."}

    try:
        resolved_ip = socket.gethostbyname(target)
    except socket.gaierror:
        return {
            "target": target,
            "error": f"Could not resolve '{target}'. Verify the target and try again.",
            "results": [],
        }

    ports = QUICK_PORTS if req.scan_type == "quick" else FULL_PORTS
    started_at = datetime.utcnow().isoformat()
    timeout = 0.8 if req.scan_type == "quick" else 1.2

    open_ports = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(_probe_port, resolved_ip, p, timeout): p for p in ports}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                open_ports.append(result)

    open_ports.sort(key=lambda x: x["port"])

    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for p in open_ports:
        key = p["risk"].lower()
        summary[key if key in summary else "info"] += 1

    return {
        "target": target,
        "resolved_ip": resolved_ip,
        "scan_type": req.scan_type,
        "ports_scanned": len(ports),
        "started_at": started_at,
        "completed_at": datetime.utcnow().isoformat(),
        "open_count": len(open_ports),
        "summary": summary,
        "results": open_ports,
        "disclaimer": "For authorized and sandboxed environments only.",
    }
