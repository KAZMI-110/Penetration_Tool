import { createFileRoute } from "@tanstack/react-router";
import { Globe, Server, KeyRound, Network, Fingerprint, Database } from "lucide-react";

export const Route = createFileRoute("/recon")({
  head: () => ({
    meta: [
      { title: "Advanced Recon (OSINT) — Deep Eye" },
      { name: "description", content: "Passive OSINT, subdomain discovery, WHOIS, DNS, tech-stack fingerprint, and leaked credentials." },
    ],
  }),
  component: Recon,
});

const SUBDOMAINS = [
  "api.acme.io", "auth.acme.io", "admin.acme.io", "stage.acme.io", "old.acme.io",
  "cdn.acme.io", "ws.acme.io", "metrics.acme.io", "git.acme.io", "vpn.acme.io",
  "dev.api.acme.io", "internal.acme.io",
];

const TECH = ["nginx 1.25", "Node.js 20", "React 19", "GraphQL", "PostgreSQL 16", "Redis 7", "Cloudflare", "Stripe", "Auth0"];

function Recon() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Advanced <span className="text-emerald text-glow">Recon</span>
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          passive intelligence · zero-touch fingerprinting · target: <span className="text-emerald">acme.io</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card icon={Globe} title="WHOIS" sub="ownership intel">
          <KV k="Registrar" v="Cloudflare, Inc." />
          <KV k="Created" v="2014-08-21" />
          <KV k="Expires" v="2027-08-21" />
          <KV k="Registrant" v="Privacy Service" />
        </Card>
        <Card icon={Network} title="DNS" sub="resolution map">
          <KV k="A" v="104.21.18.42" />
          <KV k="AAAA" v="2606:4700:3033::6815" />
          <KV k="MX" v="aspmx.l.google.com" />
          <KV k="NS" v="leila.ns.cloudflare.com" />
        </Card>
        <Card icon={Server} title="Tech Stack" sub="fingerprint">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {TECH.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded border border-emerald/30 text-emerald font-mono text-[11px]">{t}</span>
            ))}
          </div>
        </Card>
        <Card icon={KeyRound} title="Exposed Secrets" sub="js bundle scan" tone="warn">
          <KV k="api_keys" v="2 found (stripe_pk, sentry)" tone="warn" />
          <KV k=".env leak" v="not detected" tone="ok" />
          <KV k="source maps" v="exposed @ /static/*.map" tone="warn" />
        </Card>
        <Card icon={Database} title="Leaked Credentials" sub="haveibeenpwned + paste sites" tone="critical">
          <KV k="emails@acme.io" v="14 in breaches" tone="critical" />
          <KV k="paste hits (30d)" v="3" tone="warn" />
        </Card>
        <Card icon={Fingerprint} title="Cert Transparency" sub="crt.sh">
          <KV k="active certs" v="22" />
          <KV k="wildcard" v="*.acme.io (DigiCert)" />
        </Card>
      </div>

      {/* Subdomain map */}
      <div className="glass rounded-lg p-5">
        <div className="text-sm font-semibold">Subdomain Discovery</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {SUBDOMAINS.length} hosts mapped · 2 takeover candidates
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUBDOMAINS.map((s, i) => {
            const danger = s.startsWith("old") || s.startsWith("internal");
            return (
              <div
                key={s}
                className={`glass px-3 py-2 rounded-md font-mono text-[12px] flex items-center gap-2 ${danger ? "text-[var(--severity-critical)] border-[var(--severity-critical)]/40" : "text-foreground/90"}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${danger ? "bg-[var(--severity-critical)]" : "bg-emerald"} pulse-dot`} />
                {s}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, sub, children, tone }: any) {
  const toneColor = tone === "critical" ? "var(--severity-critical)" : tone === "warn" ? "var(--severity-medium)" : "var(--emerald)";
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>
        </div>
        <Icon className="h-4 w-4" style={{ color: toneColor }} />
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function KV({ k, v, tone }: { k: string; v: string; tone?: string }) {
  const c = tone === "critical" ? "var(--severity-critical)" : tone === "warn" ? "var(--severity-medium)" : tone === "ok" ? "var(--emerald)" : undefined;
  return (
    <div className="flex justify-between font-mono text-[12px] border-b border-border/30 pb-1 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span style={{ color: c }} className="text-right ml-2 truncate">{v}</span>
    </div>
  );
}
