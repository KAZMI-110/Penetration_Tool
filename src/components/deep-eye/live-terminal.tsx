import { useEffect, useRef } from "react";
import type { LogLine } from "@/hooks/use-real-scan";

const levelColor: Record<LogLine["level"], string> = {
  INFO: "text-cyan-cyber",
  TEST: "text-muted-foreground",
  HIT: "text-[var(--severity-critical)]",
  WARN: "text-[var(--severity-medium)]",
  OK: "text-emerald",
};

export function LiveTerminal({
  lines,
  height = "h-[420px]",
  title = "live scan feed",
}: {
  lines: LogLine[];
  height?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="glass rounded-lg overflow-hidden relative scanline">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-background/40">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--severity-critical)]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--severity-medium)]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald/80 pulse-dot" />
          <span className="ml-3 font-mono text-[11px] text-muted-foreground tracking-widest uppercase">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald">● streaming</span>
      </div>
      <div
        ref={ref}
        className={`${height} overflow-y-auto font-mono text-[12px] leading-relaxed p-3 space-y-0.5`}
      >
        {lines.length === 0 && <div className="text-muted-foreground">awaiting engine signal…</div>}
        {lines.map((l) => (
          <div key={l.id} className="flex gap-2 whitespace-pre-wrap">
            <span className="text-muted-foreground/70">{l.ts}</span>
            <span className={`w-12 ${levelColor[l.level]}`}>[{l.level}]</span>
            <span className="text-foreground/80">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
