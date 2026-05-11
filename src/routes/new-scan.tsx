import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Play, Square, Pause, Sparkles, Globe, CheckCircle, Download, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useRealScan } from "@/hooks/use-real-scan";
import { LiveTerminal } from "@/components/deep-eye/live-terminal";
import { VULN_MODULES } from "@/lib/mock-data";
import { toast } from "sonner";
import { createScan, downloadReport } from "@/lib/api";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/new-scan")({
  head: () => ({
    meta: [
      { title: "New Scan — Deep Eye" },
      { name: "description", content: "Configure crawl depth, threads, AI providers, and 45+ attack modules then launch a live scan." },
    ],
  }),
  component: NewScan,
});

function NewScan() {
  const [target, setTarget] = useState("https://api.acme.io");
  const [mode, setMode] = useState("full");
  const [depth, setDepth] = useState([4]);
  const [threads, setThreads] = useState([16]);
  const [osint, setOsint] = useState(true);
  const [subs, setSubs] = useState(true);
  const [authCrawl, setAuthCrawl] = useState(false);
  const [aiPayloads, setAiPayloads] = useState(true);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [enabledModules, setEnabledModules] = useState<string[]>(VULN_MODULES.slice(0, 24));
  const [scanCompleted, setScanCompleted] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const completedRef = useRef(false);

  const { lines, status } = useRealScan(running && !paused);
  const progress = status?.progress ?? 0;
  const isFailed = status?.status?.toLowerCase().includes("failed");
  const isComplete = status?.status === "Complete" || (running && progress >= 100);

  // Detect scan completion
  useEffect(() => {
    if (isComplete && running && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      setPaused(false);
      setScanCompleted(true);
      if (status?.scan_id) setActiveScanId(status.scan_id);
      toast.success("Scan completed successfully!", {
        description: `${status?.target || target} — all modules finished`,
        duration: 8000,
      });
    }
  }, [isComplete, running, status, target]);


  const toggleModule = (m: string) =>
    setEnabledModules((prev) => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const start = async () => {
    if (!target.trim()) return toast.error("target url required");
    try {
      const result = await createScan({
        target,
        mode,
        depth: depth[0],
        threads: threads[0],
        recon: osint,
        ai_payloads: aiPayloads,
        modules: enabledModules,
      });
      setRunning(true);
      setPaused(false);
      setScanCompleted(false);
      setActiveScanId(result?.id || null);
      completedRef.current = false;
      toast.success(`scan dispatched · ${enabledModules.length} modules · ${threads[0]} threads`);
    } catch (err) {
      toast.error("Failed to initiate scan via API");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Configure <span className="text-emerald text-glow">Engagement</span>
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          target the surface · tune the engine · arm the AI
        </p>
      </div>

      {/* Target panel */}
      <div className="glass-strong rounded-xl p-6 relative scanline overflow-hidden">
        <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">target url</Label>
        <div className="mt-2 flex items-center gap-2 glass rounded-md px-3 py-2 glow-emerald">
          <Globe className="h-4 w-4 text-emerald" />
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://target.example.com"
            className="border-0 bg-transparent text-base font-mono focus-visible:ring-0 px-0"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">scan mode</Label>
            <ToggleGroup
              type="single" value={mode} onValueChange={(v) => v && setMode(v)}
              className="mt-2 grid grid-cols-3 gap-2"
            >
              {["quick", "full", "deep"].map((m) => (
                <ToggleGroupItem
                  key={m} value={m}
                  className="font-mono text-xs uppercase data-[state=on]:bg-emerald/15 data-[state=on]:text-emerald data-[state=on]:border-emerald/40 border border-border rounded-md py-2"
                >{m}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div>
            <div className="flex justify-between">
              <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">crawl depth</Label>
              <span className="font-mono text-xs text-emerald">{depth[0]}</span>
            </div>
            <Slider min={1} max={10} step={1} value={depth} onValueChange={setDepth} className="mt-3" />
          </div>

          <div>
            <div className="flex justify-between">
              <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">thread count</Label>
              <span className="font-mono text-xs text-emerald">{threads[0]}</span>
            </div>
            <Slider min={1} max={64} step={1} value={threads} onValueChange={setThreads} className="mt-3" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Passive OSINT", v: osint, set: setOsint },
            { label: "Subdomain Discovery", v: subs, set: setSubs },
            { label: "Auth-aware Crawl", v: authCrawl, set: setAuthCrawl },
            { label: "AI Payload Synthesis", v: aiPayloads, set: setAiPayloads },
          ].map((t) => (
            <label key={t.label} className="glass rounded-md px-3 py-2.5 flex items-center justify-between cursor-pointer">
              <span className="font-mono text-xs text-foreground/90">{t.label}</span>
              <Switch checked={t.v} onCheckedChange={t.set} />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!running || isFailed ? (
            <button onClick={start} className="glass-strong glow-emerald px-5 py-2.5 rounded-md font-mono text-sm text-emerald hover:bg-emerald/10 flex items-center gap-2">
              <Play className="h-4 w-4" /> {isFailed ? "re-initiate scan" : "initiate scan"}
            </button>
          ) : (
            <>
              <button onClick={() => setPaused(p => !p)} className="glass px-4 py-2 rounded-md font-mono text-sm flex items-center gap-2">
                <Pause className="h-4 w-4" /> {paused ? "resume" : "pause"}
              </button>
              <button onClick={() => { setRunning(false); setPaused(false); toast("scan terminated"); }} className="glass px-4 py-2 rounded-md font-mono text-sm text-[var(--severity-critical)] flex items-center gap-2">
                <Square className="h-4 w-4" /> abort
              </button>
            </>
          )}
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-emerald" /> {enabledModules.length} modules armed
          </div>
        </div>

        {running && (
          <div className="mt-5">
            <div className="flex justify-between font-mono text-[11px] mb-1">
              <span className="text-muted-foreground">progress</span>
              <span className="text-emerald">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Scan Completed Banner */}
        {scanCompleted && (
          <div className="mt-5 glass-strong glow-emerald rounded-xl p-5 border border-emerald/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-15 blur-3xl bg-emerald" />
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-emerald" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-emerald">Scan Completed Successfully</div>
                <div className="font-mono text-[12px] text-muted-foreground mt-1">
                  {target} — all {enabledModules.length} modules finished · {status?.scan_id || activeScanId || "N/A"}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {activeScanId && (
                    <button
                      onClick={async () => {
                        setDownloading(true);
                        try {
                          await downloadReport(activeScanId, "pdf");
                          toast.success("PDF report downloaded");
                        } catch {
                          toast.error("Failed to generate report");
                        } finally {
                          setDownloading(false);
                        }
                      }}
                      disabled={downloading}
                      className="glass-strong glow-emerald px-4 py-2 rounded-md font-mono text-[12px] text-emerald hover:bg-emerald/10 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? "generating..." : "Download PDF Report"}
                    </button>
                  )}
                  <Link
                    to="/reports"
                    className="glass px-4 py-2 rounded-md font-mono text-[12px] hover:bg-muted/30 transition flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" /> View Reports
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => {
                      setScanCompleted(false);
                      completedRef.current = false;
                    }}
                    className="glass px-4 py-2 rounded-md font-mono text-[12px] text-emerald hover:bg-emerald/10 transition flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" /> New Scan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Modules */}
        <div className="glass rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Attack Modules</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {VULN_MODULES.length} available · {enabledModules.length} enabled
              </div>
            </div>
            <button
              onClick={() => setEnabledModules(enabledModules.length === VULN_MODULES.length ? [] : [...VULN_MODULES])}
              className="font-mono text-[11px] text-emerald hover:underline"
            >
              {enabledModules.length === VULN_MODULES.length ? "deselect all" : "select all"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
            {VULN_MODULES.map((m) => {
              const on = enabledModules.includes(m);
              return (
                <label key={m} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition ${on ? "border-emerald/40 bg-emerald/5" : "border-border/60 hover:bg-muted/30"}`}>
                  <Checkbox checked={on} onCheckedChange={() => toggleModule(m)} />
                  <span className="font-mono text-[12px]">{m}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Live feed */}
        <LiveTerminal lines={lines} height="h-[460px]" />
      </div>
    </div>
  );
}
