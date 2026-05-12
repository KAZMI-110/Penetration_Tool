import { createFileRoute } from "@tanstack/react-router";
import { FileText, FileCode, FileJson, Download, Share2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { SEVERITY_DIST, TIMELINE_DATA } from "@/lib/mock-data";
import { downloadReport, fetchReports, fetchRecentScans } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Deep Eye" },
      {
        name: "description",
        content:
          "Generate, view, and share PDF, HTML, and JSON vulnerability reports with executive charts.",
      },
    ],
  }),
  component: Reports,
});

const STATIC_REPORTS = [
  {
    id: "RPT-2401",
    target: "api.acme.io",
    date: "2026-05-02",
    findings: 14,
    formats: ["PDF", "HTML", "JSON"],
    size: "1.2 MB",
  },
  {
    id: "RPT-2400",
    target: "shop.lumen.dev",
    date: "2026-05-01",
    findings: 23,
    formats: ["PDF", "JSON"],
    size: "2.4 MB",
  },
  {
    id: "RPT-2399",
    target: "dash.northwind.io",
    date: "2026-04-30",
    findings: 8,
    formats: ["HTML"],
    size: "640 KB",
  },
  {
    id: "RPT-2398",
    target: "gateway.atlas.cloud",
    date: "2026-04-28",
    findings: 41,
    formats: ["PDF", "HTML", "JSON"],
    size: "3.1 MB",
  },
];

const fmtIcon = (f: string) => (f === "PDF" ? FileText : f === "HTML" ? FileCode : FileJson);

function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Fetch real completed scans from API
  const { data: recentScans } = useQuery({ queryKey: ["recent-scans"], queryFn: fetchRecentScans });

  // Build combined report list: real scans first, then static fallbacks
  const realReports = (recentScans || [])
    .filter((s: any) => s.status === "complete")
    .map((s: any) => ({
      id: s.id,
      target: s.target,
      date: new Date().toISOString().split("T")[0],
      findings: s.findings,
      formats: ["PDF", "JSON"],
      size: "—",
      scanId: s.id, // real scan ID for API calls
    }));

  const allReports = [...realReports, ...STATIC_REPORTS.map((r) => ({ ...r, scanId: null }))];

  // Use the most recent real scan for the "latest report" preview, fallback to static
  const latestReal = realReports[0];
  const latestReport = latestReal || {
    id: "RPT-2401",
    target: "api.acme.io",
    findings: 14,
    scanId: null,
  };

  const handleDownload = async (scanId: string | null, format: string = "pdf") => {
    if (!scanId) {
      toast.info("Demo report — run a real scan to download");
      return;
    }
    const key = `${scanId}-${format}`;
    setDownloading(key);
    try {
      await downloadReport(scanId, format);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      toast.error(`Failed to generate ${format.toUpperCase()} report`);
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = (scanId: string | null) => {
    if (!scanId) {
      toast.info("Demo report — run a real scan to share");
      return;
    }
    const url = `${window.location.origin}/api/report/${scanId}?format=json`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Report link copied to clipboard");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Reporting <span className="text-emerald text-glow">Hub</span>
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          executive summaries · technical breakdowns · compliance-ready exports
        </p>
      </div>

      {/* Executive preview */}
      <div className="glass-strong rounded-xl p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            latest report
          </div>
          <div className="text-lg font-semibold">
            {latestReport.id} · {latestReport.target}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1">
            {latestReal
              ? `${latestReport.findings} findings`
              : "generated 2 minutes ago · 14 findings · 3 critical"}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat
              label="Risk Score"
              value={latestReal ? String(Math.min(99, latestReport.findings * 6)) : "78"}
              tone="var(--severity-critical)"
            />
            <Stat label="OWASP" value="9/10" tone="var(--emerald)" />
            <Stat label="Coverage" value="94%" tone="var(--cyber-cyan)" />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleDownload(latestReport.scanId, "pdf")}
              disabled={downloading === `${latestReport.scanId}-pdf`}
              className="glass-strong glow-emerald px-3 py-1.5 rounded-md font-mono text-[12px] text-emerald flex items-center gap-1.5 hover:bg-emerald/10 transition disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading === `${latestReport.scanId}-pdf` ? "generating..." : "PDF"}
            </button>
            <button
              onClick={() => handleShare(latestReport.scanId)}
              className="glass px-3 py-1.5 rounded-md font-mono text-[12px] flex items-center gap-1.5 hover:bg-muted/30 transition"
            >
              <Share2 className="h-3.5 w-3.5" /> share
            </button>
          </div>
        </div>
        <div className="h-[200px]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            severity mix
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SEVERITY_DIST}
                dataKey="value"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                stroke="none"
              >
                {SEVERITY_DIST.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[200px]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            trend (14d)
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TIMELINE_DATA}>
              <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="critical"
                stroke="var(--severity-critical)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="high"
                stroke="var(--severity-high)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="medium"
                stroke="var(--severity-medium)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports list */}
      <div className="glass rounded-lg p-4">
        <div className="font-semibold text-sm mb-3">Archive</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
              <tr className="text-left">
                <th className="py-2 pr-3">ID</th>
                <th className="pr-3">Target</th>
                <th className="pr-3">Date</th>
                <th className="pr-3">Findings</th>
                <th className="pr-3">Formats</th>
                <th className="pr-3">Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="font-mono text-[12px]">
              {allReports.map((r) => (
                <tr key={r.id} className="border-t border-border/40 hover:bg-emerald/5">
                  <td className="py-2 pr-3 text-emerald">{r.id}</td>
                  <td className="pr-3">{r.target}</td>
                  <td className="pr-3 text-muted-foreground">{r.date}</td>
                  <td className="pr-3">{r.findings}</td>
                  <td className="pr-3">
                    <div className="flex gap-1.5">
                      {r.formats.map((f) => {
                        const Icon = fmtIcon(f);
                        return (
                          <span
                            key={f}
                            className="px-1.5 py-0.5 rounded border border-emerald/30 text-emerald text-[10px] flex items-center gap-1"
                          >
                            <Icon className="h-3 w-3" /> {f}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="pr-3 text-muted-foreground">{r.size}</td>
                  <td>
                    <button
                      onClick={() => handleDownload(r.scanId, "pdf")}
                      disabled={downloading === `${r.scanId}-pdf`}
                      className="text-emerald hover:underline text-[11px] disabled:opacity-50"
                    >
                      {downloading === `${r.scanId}-pdf` ? "generating..." : "download ↓"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="glass rounded-md p-2">
      <div className="font-mono text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono text-xl" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}
