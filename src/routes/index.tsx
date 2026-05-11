import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Server, Cpu, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  TIMELINE_DATA, SEVERITY_DIST, MODULE_FREQ, RECENT_SCANS, severityColor,
} from "@/lib/mock-data";
import { useRealScan } from "@/hooks/use-real-scan";
import { LiveTerminal } from "@/components/deep-eye/live-terminal";
import { Badge } from "@/components/ui/badge";

import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchRecentScans, fetchSeverityDistribution, fetchModuleFrequency, fetchTrend } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Deep Eye SOC" },
      { name: "description", content: "Live overview of active scans, threat distribution, and AI-driven vulnerability findings." },
    ],
  }),
  component: Dashboard,
});

const KPIS = [
  { label: "Active Scans", value: "7", delta: "+2 today", icon: Activity, color: "var(--emerald)" },
  { label: "Critical Findings", value: "12", delta: "+3 last 24h", icon: AlertTriangle, color: "var(--severity-critical)" },
  { label: "Assets Monitored", value: "1,284", delta: "47 new", icon: Server, color: "var(--cyber-cyan)" },
  { label: "AI Tokens (24h)", value: "8.4M", delta: "across 4 models", icon: Cpu, color: "var(--severity-medium)" },
];

const ICON_MAP: Record<string, any> = {
  Activity, AlertTriangle, Server, Cpu
};

function Dashboard() {
  const { lines } = useRealScan(true);

  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: recentScans } = useQuery({ queryKey: ["recent-scans"], queryFn: fetchRecentScans });
  const { data: severityDist } = useQuery({ queryKey: ["severity-dist"], queryFn: fetchSeverityDistribution });
  const { data: moduleFreq } = useQuery({ queryKey: ["module-freq"], queryFn: fetchModuleFrequency });
  const { data: trendData } = useQuery({ queryKey: ["trend"], queryFn: fetchTrend });

  const activeStats = (stats || KPIS).map((k: any) => ({
    ...k,
    icon: typeof k.icon === "string" ? ICON_MAP[k.icon] || Activity : k.icon
  }));
  const scans = recentScans || RECENT_SCANS;
  const sDist = severityDist || SEVERITY_DIST;
  const mFreq = moduleFreq || MODULE_FREQ;
  const tData = trendData || TIMELINE_DATA;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Operations <span className="text-emerald text-glow">Overview</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            real-time threat intelligence · last sync {new Date().toLocaleTimeString()}
          </p>
        </div>
        <Link to="/new-scan" className="glass-strong glow-emerald px-4 py-2 rounded-md text-sm font-mono text-emerald hover:bg-emerald/10 transition">
          + initiate scan
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {activeStats.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-lg p-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4" style={{ color: k.color }} />
            </div>
            <div className="mt-2 font-mono text-3xl text-foreground text-glow" style={{ color: k.color }}>{k.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{k.delta}</div>
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: k.color }} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass rounded-lg p-4 xl:col-span-2 h-[320px]">
          <ChartHeader title="Vulnerabilities — 14d" subtitle="severity timeline" />
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={tData}>
              <defs>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--severity-critical)" stopOpacity={0.6}/><stop offset="100%" stopColor="var(--severity-critical)" stopOpacity={0}/></linearGradient>
                <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--severity-high)" stopOpacity={0.5}/><stop offset="100%" stopColor="var(--severity-high)" stopOpacity={0}/></linearGradient>
                <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--severity-medium)" stopOpacity={0.4}/><stop offset="100%" stopColor="var(--severity-medium)" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono", fontSize: 12 }} />
              <Area type="monotone" dataKey="medium" stroke="var(--severity-medium)" fill="url(#gM)" />
              <Area type="monotone" dataKey="high" stroke="var(--severity-high)" fill="url(#gH)" />
              <Area type="monotone" dataKey="critical" stroke="var(--severity-critical)" fill="url(#gC)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-lg p-4 h-[320px]">
          <ChartHeader title="Severity Distribution" subtitle="all open findings" />
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={sDist} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                {sDist.map((s) => (<Cell key={s.name} fill={s.color} />))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 -mt-6">
            {sDist.map((s) => (
              <span key={s.name} className="font-mono text-[10px] flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.name} {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass rounded-lg p-4 h-[300px]">
          <ChartHeader title="Top Modules" subtitle="hits / 7d" />
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={mFreq} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
              <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }}/>
              <YAxis type="category" dataKey="module" stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} width={70}/>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--emerald)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-lg p-4 xl:col-span-2 overflow-hidden">
          <ChartHeader title="Recent Scans" subtitle="last 5 operations" right={<Link to="/vulnerabilities" className="text-emerald font-mono text-[11px] flex items-center gap-1">view all <ArrowUpRight className="h-3 w-3"/></Link>} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
                <tr className="text-left">
                  <th className="py-2 pr-3">ID</th><th className="pr-3">Target</th><th className="pr-3">Started</th>
                  <th className="pr-3">Findings</th><th className="pr-3">Status</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[12px]">
                {scans.map((s) => (
                  <tr key={s.id} className="border-t border-border/40">
                    <td className="py-2 pr-3 text-emerald">{s.id}</td>
                    <td className="pr-3 truncate max-w-[200px]">{s.target}</td>
                    <td className="pr-3 text-muted-foreground">{s.started}</td>
                    <td className="pr-3">{s.findings}</td>
                    <td className="pr-3">
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px]"
                        style={{
                          color: s.status === "complete" ? "var(--emerald)" :
                            s.status === "running" ? "var(--cyber-cyan)" : "var(--severity-critical)",
                          borderColor: "currentColor",
                        }}
                      >
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <LiveTerminal lines={lines.slice(-30)} height="h-[260px]" title="global engine feed" />
    </div>
  );

  function ChartHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{subtitle}</div>}
        </div>
        {right}
      </div>
    );
  }
}

// helper unused — keep for reference
export { severityColor };
