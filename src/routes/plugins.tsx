import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Star, Upload, Puzzle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/plugins")({
  head: () => ({
    meta: [
      { title: "Plugin Manager — Deep Eye" },
      { name: "description", content: "Extend Deep Eye with a marketplace of community and custom-built attack plugins." },
    ],
  }),
  component: Plugins,
});

const PLUGINS = [
  { name: "AWS S3 Hunter", author: "@cloudcat", version: "2.1.0", category: "Cloud", installs: "12.4k", rating: 4.8, installed: true, verified: true, desc: "Discovers misconfigured S3 buckets, IAM leaks, and exposed endpoints." },
  { name: "JWT Forge Pro", author: "@h4ck3r", version: "1.7.3", category: "Auth", installs: "8.1k", rating: 4.7, installed: true, verified: true, desc: "Advanced JWT manipulation: alg-confusion, kid-injection, key-cracking." },
  { name: "GraphQL Goat", author: "@apicrew", version: "0.9.4", category: "API", installs: "3.2k", rating: 4.5, installed: false, verified: true, desc: "Schema-aware GraphQL fuzzer with batching and alias-overload tests." },
  { name: "WebSocket Wraith", author: "@nightowl", version: "1.0.0", category: "Realtime", installs: "1.1k", rating: 4.4, installed: false, verified: false, desc: "Hijack, replay, and fuzz WebSocket streams in real time." },
  { name: "K8s Kraken", author: "@orchestrator", version: "3.0.1", category: "Cloud", installs: "5.6k", rating: 4.9, installed: false, verified: true, desc: "Kubernetes API surface mapping & RBAC privilege escalation paths." },
  { name: "Business Logic Bot", author: "@deepeye-labs", version: "2.4.0", category: "Logic", installs: "9.7k", rating: 4.8, installed: true, verified: true, desc: "AI-driven workflow abuse: race conditions, coupon stacking, IDOR chains." },
  { name: "SAML Slayer", author: "@idpwizard", version: "1.2.0", category: "Auth", installs: "2.8k", rating: 4.3, installed: false, verified: true, desc: "XSW, signature-wrapping and assertion-replay against SAML IdPs." },
  { name: "Crypto Inspector", author: "@aesghost", version: "0.6.2", category: "Crypto", installs: "1.9k", rating: 4.2, installed: false, verified: false, desc: "Detects weak ciphers, ECB usage, predictable IVs and oracle padding." },
];

function Plugins() {
  const [list, setList] = useState(PLUGINS);
  const toggle = (name: string) =>
    setList(list.map(p => p.name === name ? { ...p, installed: !p.installed } : p));

  const installed = list.filter(p => p.installed);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Plugin <span className="text-emerald text-glow">Marketplace</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            extend the engine · {list.length} plugins · {installed.length} installed
          </p>
        </div>
        <button className="glass-strong glow-emerald px-4 py-2 rounded-md font-mono text-sm text-emerald flex items-center gap-2">
          <Upload className="h-4 w-4" /> upload custom plugin
        </button>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="glass">
          <TabsTrigger value="browse" className="font-mono text-xs">Browse</TabsTrigger>
          <TabsTrigger value="installed" className="font-mono text-xs">Installed ({installed.length})</TabsTrigger>
          <TabsTrigger value="updates" className="font-mono text-xs">Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <Grid items={list} toggle={toggle} />
        </TabsContent>
        <TabsContent value="installed" className="mt-4">
          <Grid items={installed} toggle={toggle} />
        </TabsContent>
        <TabsContent value="updates" className="mt-4">
          <div className="glass rounded-lg p-8 text-center font-mono text-sm text-muted-foreground">
            <Puzzle className="h-6 w-6 mx-auto mb-2 text-emerald" />
            all plugins are up-to-date.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Grid({ items, toggle }: { items: typeof PLUGINS; toggle: (n: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((p) => (
        <div key={p.name} className="glass rounded-lg p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 grid place-items-center rounded-md glass glow-emerald">
                <Puzzle className="h-4 w-4 text-emerald" />
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  {p.name}
                  {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald" />}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">{p.author} · v{p.version}</div>
              </div>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-border/60 text-muted-foreground">{p.category}</span>
          </div>
          <p className="text-[12px] text-foreground/80 mt-3 flex-1">{p.desc}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[var(--severity-medium)] fill-current" />{p.rating}</span>
              <span>{p.installs}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{p.installed ? "enabled" : "install"}</span>
              <Switch checked={p.installed} onCheckedChange={() => toggle(p.name)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
