"""
VulneraX / Deep Eye — FastAPI Backend
Bridges the React frontend dashboard with the Deep Eye scanning engine.
"""

import os
import sys
import asyncio
import logging
import random
import tempfile
from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Deep Eye engine import — the engine lives in the same directory
# ---------------------------------------------------------------------------
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

ENGINE_AVAILABLE = False
try:
    from core.scanner_engine import ScannerEngine
    from utils.config_loader import ConfigLoader
    from ai_providers.provider_manager import AIProviderManager

    ENGINE_AVAILABLE = True
except ImportError as exc:
    logging.warning(f"Deep Eye engine not available ({exc}). Running in simulation mode.")

logger = logging.getLogger("vulnerax")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s")


# ---------------------------------------------------------------------------
# In-memory data store
# ---------------------------------------------------------------------------
class ScanStore:
    """Thread-safe in-memory store for scans and findings."""

    def __init__(self):
        self.scans: Dict[str, dict] = {}
        self.findings: List[dict] = []
        self._counter = 9912
        self._finding_counter = 7820
        self.completed_scan_ids: Set[str] = set()  # tracks scans that just finished

    # -- mutations ----------------------------------------------------------
    def create(self, target: str, config: dict) -> dict:
        self._counter += 1
        scan_id = f"SCN-{self._counter}"
        scan = {
            "id": scan_id,
            "target": target,
            "status": "queued",
            "progress": 0,
            "findings": 0,
            "started_at": datetime.now(),
            "config": config,
            "results": None,
            "error": None,
        }
        self.scans[scan_id] = scan
        return scan

    def add_findings_from_results(self, scan_id: str, results: dict):
        vulns = results.get("vulnerabilities", [])
        for v in vulns:
            self._finding_counter += 1
            self.findings.append({
                "id": f"DE-{self._finding_counter}",
                "scan_id": scan_id,
                "title": v.get("type", "Unknown"),
                "endpoint": v.get("url", "N/A"),
                "severity": v.get("severity", "info").capitalize(),
                "module": v.get("type", "Unknown"),
                "cwe": v.get("cwe", ""),
                "confidence": v.get("confidence", 85),
                "ai": v.get("ai_provider", "Deep Eye"),
            })

    # -- queries ------------------------------------------------------------
    def recent_scans(self, limit: int = 10) -> list:
        ordered = sorted(self.scans.values(), key=lambda s: s["started_at"], reverse=True)
        return [self._serialize_scan(s) for s in ordered[:limit]]

    def active_scans(self) -> list:
        return [s for s in self.scans.values() if s["status"] in ("running", "queued")]

    def severity_distribution(self) -> list:
        counts = Counter(f["severity"].capitalize() for f in self.findings)
        palette = {
            "Critical": "var(--severity-critical)",
            "High": "var(--severity-high)",
            "Medium": "var(--severity-medium)",
            "Low": "var(--severity-low)",
            "Info": "var(--severity-info)",
        }
        return [{"name": k, "value": counts.get(k, 0), "color": v} for k, v in palette.items()]

    def module_frequency(self) -> list:
        counts = Counter(f["module"] for f in self.findings)
        return [{"module": m, "count": c} for m, c in counts.most_common(7)]

    def trend(self, days: int = 14) -> list:
        """Return per-day severity counts for the last N days."""
        today = datetime.now().date()
        result = []
        for i in range(days):
            d = today - timedelta(days=days - 1 - i)
            day_findings = [
                f for f in self.findings
                if self.scans.get(f.get("scan_id"), {}).get("started_at", datetime.min).date() == d
            ]
            sev = Counter(f["severity"].lower() for f in day_findings)
            result.append({
                "day": f"D{i + 1}",
                "critical": sev.get("critical", 0),
                "high": sev.get("high", 0),
                "medium": sev.get("medium", 0),
            })
        return result

    @staticmethod
    def _serialize_scan(s: dict) -> dict:
        age = datetime.now() - s["started_at"]
        if age < timedelta(minutes=1):
            started = "Just now"
        elif age < timedelta(hours=1):
            started = f"{int(age.total_seconds() // 60)} min ago"
        elif age < timedelta(days=1):
            started = f"{int(age.total_seconds() // 3600)} h ago"
        else:
            started = f"{age.days} d ago"

        return {
            "id": s["id"],
            "target": s["target"],
            "status": "complete" if s["status"] == "complete" else s["status"],
            "progress": s["progress"],
            "findings": s["findings"],
            "started": started,
        }


store = ScanStore()

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------
ws_connections: Set[WebSocket] = set()


async def broadcast(data: dict):
    dead: list = []
    for ws in ws_connections:
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_connections.discard(ws)


# ---------------------------------------------------------------------------
# Background scan runner
# ---------------------------------------------------------------------------
async def run_scan_task(scan_id: str):
    """Execute a scan — uses the real Deep Eye engine or simulation fallback."""
    scan = store.scans[scan_id]
    scan["status"] = "running"
    cfg = scan["config"]

    await broadcast({"scan_id": scan_id, "target": scan["target"], "progress": 0,
                      "status": "Initializing...", "timestamp": datetime.now().isoformat()})

    try:
        if ENGINE_AVAILABLE:
            await _run_real_scan(scan_id, scan, cfg)
        else:
            await _run_simulated_scan(scan_id, scan)
    except Exception as exc:
        logger.error(f"Scan {scan_id} failed: {exc}", exc_info=True)
        scan["status"] = "failed"
        scan["error"] = str(exc)
        await broadcast({"scan_id": scan_id, "target": scan["target"],
                          "progress": scan["progress"], "status": f"Failed: {exc}",
                          "timestamp": datetime.now().isoformat()})


async def _run_real_scan(scan_id: str, scan: dict, cfg: dict):
    """Run a real scan via the Deep Eye engine in a thread."""
    config_path = os.path.join(_backend_dir, "config", "config.yaml")
    if not os.path.exists(config_path):
        config_path = os.path.join(_backend_dir, "config", "config.example.yaml")
    deep_config = ConfigLoader.load(config_path)

    # Apply user overrides
    sc = deep_config.setdefault("scanner", {})
    sc["target_url"] = scan["target"]
    sc["default_depth"] = cfg.get("depth", 2)
    sc["default_threads"] = cfg.get("threads", 5)

    ai_provider = sc.get("ai_provider", "openai")
    ai_manager = AIProviderManager(deep_config)
    if not ai_manager.set_provider(ai_provider):
        providers = ai_manager.get_available_providers()
        if providers:
            ai_manager.set_provider(providers[0])

    scanner = ScannerEngine(
        target_url=scan["target"],
        config=deep_config,
        ai_manager=ai_manager,
        depth=cfg.get("depth", 2),
        threads=cfg.get("threads", 5),
        verbose=False,
    )

    mode = cfg.get("mode", "full")

    # Progress poller — checks scanner state every 2s
    async def progress_poller():
        while scan["status"] == "running":
            visited = len(scanner.visited_urls)
            found = len(scanner.vulnerabilities)
            scan["progress"] = min(95, visited * 5)
            scan["findings"] = found
            await broadcast({
                "scan_id": scan_id, "target": scan["target"],
                "progress": scan["progress"],
                "status": f"Scanning... {visited} URLs crawled, {found} findings",
                "timestamp": datetime.now().isoformat(),
            })
            await asyncio.sleep(2)

    poller = asyncio.create_task(progress_poller())

    try:
        results = await asyncio.to_thread(
            scanner.scan,
            enable_recon=cfg.get("recon", False),
            full_scan=(mode == "full"),
            quick_scan=(mode == "quick"),
        )
    finally:
        poller.cancel()

    scan["results"] = results
    scan["progress"] = 100
    scan["findings"] = len(results.get("vulnerabilities", []))
    scan["status"] = "complete"
    store.add_findings_from_results(scan_id, results)
    store.completed_scan_ids.add(scan_id)

    await broadcast({"scan_id": scan_id, "target": scan["target"], "progress": 100,
                      "status": "Complete", "timestamp": datetime.now().isoformat()})


async def _run_simulated_scan(scan_id: str, scan: dict):
    """Simulate scan progress when the engine is unavailable."""
    for pct in range(0, 101, 5):
        if scan["status"] == "failed":
            return
        scan["progress"] = pct
        await broadcast({
            "scan_id": scan_id, "target": scan["target"],
            "progress": pct,
            "status": f"Scanning (simulated)... {pct}%",
            "timestamp": datetime.now().isoformat(),
        })
        await asyncio.sleep(0.8)

    scan["progress"] = 100

    # Generate mock findings for demo purposes
    mock_vulns = {
        "vulnerabilities": [
            {"type": "SQL Injection", "severity": "critical", "url": scan["target"] + "/api/search"},
            {"type": "XSS (Reflected)", "severity": "high", "url": scan["target"] + "/search"},
            {"type": "CORS Misconfiguration", "severity": "medium", "url": scan["target"]},
            {"type": "Missing HSTS", "severity": "low", "url": scan["target"]},
        ]
    }
    scan["findings"] = len(mock_vulns["vulnerabilities"])
    scan["status"] = "complete"
    store.add_findings_from_results(scan_id, mock_vulns)
    store.completed_scan_ids.add(scan_id)

    await broadcast({"scan_id": scan_id, "target": scan["target"], "progress": 100,
                      "status": "Complete", "timestamp": datetime.now().isoformat()})


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(title="VulneraX Deep Eye API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -- Request / Response models -----------------------------------------------
class ScanCreate(BaseModel):
    target: str
    mode: str = "full"
    depth: int = 2
    threads: int = 5
    recon: bool = False
    ai_payloads: bool = True
    modules: List[str] = []


# -- Endpoints ---------------------------------------------------------------
@app.get("/api/stats")
async def get_stats():
    active = len(store.active_scans())
    total_scans = len(store.scans)
    critical = sum(1 for f in store.findings if f["severity"].lower() == "critical")
    total_findings = len(store.findings)

    return [
        {"label": "Active Scans", "value": str(active), "delta": f"{total_scans} total",
         "icon": "Activity", "color": "var(--emerald)"},
        {"label": "Critical Findings", "value": str(critical), "delta": f"{total_findings} total findings",
         "icon": "AlertTriangle", "color": "var(--severity-critical)"},
        {"label": "Targets Scanned", "value": str(total_scans), "delta": "all time",
         "icon": "Server", "color": "var(--cyber-cyan)"},
        {"label": "Engine Status", "value": "Online" if ENGINE_AVAILABLE else "Sim",
         "delta": "Deep Eye" if ENGINE_AVAILABLE else "simulation mode",
         "icon": "Cpu", "color": "var(--severity-medium)"},
    ]


@app.get("/api/recent-scans")
async def get_recent_scans():
    return store.recent_scans()


@app.get("/api/findings")
async def get_findings():
    return store.findings


@app.post("/api/scans")
async def create_scan(body: ScanCreate):
    if not body.target.strip():
        raise HTTPException(status_code=400, detail="Target URL is required")

    scan = store.create(body.target, body.model_dump())
    # Fire-and-forget background task
    asyncio.create_task(run_scan_task(scan["id"]))
    return store._serialize_scan(scan)


@app.get("/api/severity-distribution")
async def get_severity_distribution():
    return store.severity_distribution()


@app.get("/api/module-frequency")
async def get_module_frequency():
    return store.module_frequency()


@app.get("/api/trend")
async def get_trend():
    return store.trend()


@app.get("/api/report/{scan_id}")
async def download_report(scan_id: str, format: str = "pdf"):
    """Generate and download a report for a completed scan."""
    scan = store.scans.get(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    # Build results payload from store data
    scan_findings = [f for f in store.findings if f.get("scan_id") == scan_id]
    severity_counts = Counter(f["severity"].lower() for f in scan_findings)

    results = {
        "target": scan["target"],
        "duration": str(datetime.now() - scan["started_at"]),
        "urls_crawled": scan.get("progress", 0),
        "severity_summary": {
            "critical": severity_counts.get("critical", 0),
            "high": severity_counts.get("high", 0),
            "medium": severity_counts.get("medium", 0),
            "low": severity_counts.get("low", 0),
        },
        "vulnerabilities": [
            {
                "type": f.get("title", f.get("module", "Unknown")),
                "severity": f.get("severity", "info").lower(),
                "url": f.get("endpoint", "N/A"),
                "parameter": "N/A",
                "description": f"Detected by {f.get('ai', 'Deep Eye')} with {f.get('confidence', 85)}% confidence",
                "evidence": f.get("cwe", ""),
                "remediation": "Review and remediate according to security best practices.",
                "payload": "",
            }
            for f in scan_findings
        ],
        "reconnaissance": scan.get("results", {}).get("reconnaissance", {}) if scan.get("results") else {},
    }

    if format == "json":
        return JSONResponse(content=results, headers={
            "Content-Disposition": f'attachment; filename="{scan_id}_report.json"'
        })

    # PDF generation
    try:
        from core.report_generator import ReportGenerator
        config_path = os.path.join(_backend_dir, "config", "config.yaml")
        if os.path.exists(config_path):
            from utils.config_loader import ConfigLoader
            deep_config = ConfigLoader.load(config_path)
        else:
            deep_config = {}

        generator = ReportGenerator(deep_config)
        tmp_dir = os.path.join(_backend_dir, "reports")
        os.makedirs(tmp_dir, exist_ok=True)
        output_path = os.path.join(tmp_dir, f"{scan_id}_report.pdf")
        generator.generate(results, output_path, format="pdf")

        # Check if PDF was generated (might fall back to HTML)
        if os.path.exists(output_path):
            return FileResponse(
                output_path,
                media_type="application/pdf",
                filename=f"{scan_id}_report.pdf",
            )
        # Fallback: HTML report
        html_path = output_path.replace(".pdf", ".html")
        if os.path.exists(html_path):
            return FileResponse(
                html_path,
                media_type="text/html",
                filename=f"{scan_id}_report.html",
            )
    except Exception as exc:
        logger.warning(f"Report generation failed: {exc}")

    # Final fallback: return JSON
    return JSONResponse(content=results, headers={
        "Content-Disposition": f'attachment; filename="{scan_id}_report.json"'
    })


@app.get("/api/reports")
async def list_reports():
    """List all completed scans available for report download."""
    completed = [
        {
            "id": s["id"],
            "target": s["target"],
            "date": s["started_at"].strftime("%Y-%m-%d"),
            "findings": s["findings"],
            "status": s["status"],
        }
        for s in store.scans.values()
        if s["status"] == "complete"
    ]
    return sorted(completed, key=lambda x: x["date"], reverse=True)


# -- WebSocket ---------------------------------------------------------------
@app.websocket("/ws/scan-status")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_connections.add(websocket)
    notified_complete: Set[str] = set()  # track which scan completions this socket has seen
    try:
        while True:
            active = store.active_scans()
            if active:
                s = active[0]
                await websocket.send_json({
                    "scan_id": s["id"], "target": s["target"],
                    "progress": s["progress"],
                    "status": "Scanning...",
                    "timestamp": datetime.now().isoformat(),
                })
            else:
                # Check if any scans just completed that this socket hasn't been told about
                newly_completed = store.completed_scan_ids - notified_complete
                if newly_completed:
                    for sid in newly_completed:
                        sc = store.scans.get(sid)
                        if sc:
                            await websocket.send_json({
                                "scan_id": sid, "target": sc["target"],
                                "progress": 100,
                                "status": "Complete",
                                "timestamp": datetime.now().isoformat(),
                            })
                        notified_complete.add(sid)
                else:
                    # Just keep alive with a lightweight ping
                    await websocket.send_json({"status": "Idle"})
            await asyncio.sleep(3)
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        ws_connections.discard(websocket)


# -- Error handling ----------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    logger.info(f"Engine available: {ENGINE_AVAILABLE}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
