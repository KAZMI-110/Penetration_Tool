import { AI_PROVIDERS } from "@/lib/mock-data";
import { Activity } from "lucide-react";

function statusColor(s: string) {
  if (s === "online") return "bg-emerald";
  if (s === "degraded") return "bg-[var(--severity-medium)]";
  return "bg-[var(--severity-critical)]";
}

export function AiStatusBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[11px] text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-emerald" />
        AI&nbsp;GATEWAY
      </div>
      {AI_PROVIDERS.map((p) => (
        <div
          key={p.name}
          className="glass rounded-md px-2.5 py-1.5 flex items-center gap-2 font-mono text-[11px]"
          title={`${p.model} · ${p.latency}ms`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor(p.status)} pulse-dot`} />
          <span className="text-foreground/90">{p.name}</span>
          <span className="text-muted-foreground hidden sm:inline">{p.latency}ms</span>
        </div>
      ))}
    </div>
  );
}
