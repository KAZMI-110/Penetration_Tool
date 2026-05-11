import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FINDINGS, SEVERITIES, severityColor } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchFindings } from "@/lib/api";

export const Route = createFileRoute("/vulnerabilities")({
  head: () => ({
    meta: [
      { title: "Vulnerability Modules — Deep Eye" },
      { name: "description", content: "Interactive vulnerability board categorized by severity with API, GraphQL, and WebSocket modules." },
    ],
  }),
  component: Vulns,
});

const FILTERS = ["All", "API Security", "GraphQL", "WebSocket", "Auth/JWT", "Crypto", "Business Logic"];

function Vulns() {
  const { data: findingsData } = useQuery({ queryKey: ["findings"], queryFn: fetchFindings });
  const findings = findingsData || FINDINGS;

  const [filter, setFilter] = useState("All");
  const [sel, setSel] = useState<typeof FINDINGS[number] | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return findings;
    return findings.filter((f: any) => {
      const m = f.module.toLowerCase();
      switch (filter) {
        case "API Security": return m.includes("api") || m.includes("idor") || m.includes("cors");
        case "GraphQL": return m.includes("graphql");
        case "WebSocket": return m.includes("websocket");
        case "Auth/JWT": return m.includes("jwt") || m.includes("auth");
        case "Crypto": return m.includes("tls") || m.includes("crypto");
        case "Business Logic": return m.includes("logic") || m.includes("idor");
        default: return true;
      }
    });
  }, [filter, findings]);

  const counts = SEVERITIES.map((s) => ({ s, n: filtered.filter(f => f.severity === s).length }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Vulnerability <span className="text-emerald text-glow">Board</span>
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          {filtered.length} active findings · ai-validated · drag through severity columns
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] border transition ${
              filter === f ? "bg-emerald/15 text-emerald border-emerald/40 glow-emerald" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Severity columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {counts.map(({ s, n }) => (
          <div key={s} className="glass rounded-lg p-3 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: severityColor(s) }} />
                <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: severityColor(s) }}>{s}</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{n}</span>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {filtered.filter(f => f.severity === s).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSel(f)}
                  className="w-full text-left glass rounded-md p-2.5 hover:border-emerald/40 hover:bg-emerald/5 transition border border-transparent"
                  style={{ borderLeft: `3px solid ${severityColor(s)}` }}
                >
                  <div className="font-mono text-[10px] text-muted-foreground">{f.id} · {f.cwe}</div>
                  <div className="text-[13px] font-medium mt-0.5 leading-snug">{f.title}</div>
                  <div className="font-mono text-[10px] text-emerald mt-1 truncate">{f.endpoint}</div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="font-mono text-[9px] border-border/60">{f.module}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">ai {f.confidence}%</span>
                  </div>
                </button>
              ))}
              {n === 0 && <div className="font-mono text-[11px] text-muted-foreground/60 text-center py-6">no findings</div>}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="bg-background/95 border-emerald/30 backdrop-blur-xl w-full sm:max-w-xl overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: severityColor(sel.severity) }} />
                  <span className="font-mono text-[11px]" style={{ color: severityColor(sel.severity) }}>{sel.severity}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">· {sel.id} · {sel.cwe}</span>
                </div>
                <SheetTitle className="text-xl">{sel.title}</SheetTitle>
                <SheetDescription className="font-mono text-emerald">{sel.endpoint}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <Section title="AI Analysis">
                  <div className="font-mono text-[11px] text-muted-foreground mb-1">model: {sel.ai} · confidence {sel.confidence}%</div>
                  <p className="text-sm text-foreground/85">
                    The endpoint reflects unsanitized input into a downstream subsystem. Observed behaviour matches the {sel.module.toLowerCase()} signature with high confidence.
                  </p>
                </Section>
                <Section title="Proof of Concept">
                  <pre className="glass rounded-md p-3 font-mono text-[11px] overflow-x-auto">
{`POST ${sel.endpoint} HTTP/1.1
Host: target.acme.io
Content-Type: application/json

{"q": "' OR sleep(5)--"}`}
                  </pre>
                </Section>
                <Section title="Remediation">
                  <ul className="list-disc list-inside text-sm text-foreground/85 space-y-1">
                    <li>Use parameterized queries / prepared statements.</li>
                    <li>Apply allow-list validation at the boundary.</li>
                    <li>Enable WAF rule pack DEEPEYE-{sel.cwe.replace("CWE-", "")}.</li>
                  </ul>
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-emerald mb-2">{title}</div>
      {children}
    </div>
  );
}
