import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Hash, Bell, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Alerts & Collaboration — Deep Eye" },
      { name: "description", content: "Configure email, Slack, and Discord notifications and severity-based alert rules." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [threshold, setThreshold] = useState([2]); // 0=info..4=critical

  const sevLabel = ["Info", "Low", "Medium", "High", "Critical"][threshold[0]];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Alerts &amp; <span className="text-emerald text-glow">Collaboration</span>
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          route findings to your team in real time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Channel
          icon={Mail} title="Email (SMTP)" tag="primary" defaultOn
          fields={[
            { label: "SMTP host", placeholder: "smtp.sendgrid.net" },
            { label: "From address", placeholder: "alerts@your-domain.com" },
            { label: "Recipients", placeholder: "soc@your-domain.com, oncall@..." },
          ]}
        />
        <Channel
          icon={Hash} title="Slack" tag="webhook" defaultOn
          fields={[
            { label: "Webhook URL", placeholder: "https://hooks.slack.com/services/..." },
            { label: "Channel", placeholder: "#deep-eye-alerts" },
          ]}
        />
        <Channel
          icon={MessageSquare} title="Discord" tag="webhook"
          fields={[
            { label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." },
            { label: "Mention role", placeholder: "@SecurityOps" },
          ]}
        />
      </div>

      {/* Alert rules */}
      <div className="glass rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4 text-emerald" />
          <div className="font-semibold text-sm">Alert Rules</div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">trigger conditions</div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label className="font-mono text-[12px]">Minimum severity to alert</Label>
              <span className="font-mono text-xs text-emerald">{sevLabel}</span>
            </div>
            <Slider min={0} max={4} step={1} value={threshold} onValueChange={setThreshold} className="mt-3" />
          </div>

          {[
            "Notify on scan complete",
            "Notify on new critical CVE match",
            "Notify on subdomain takeover candidate",
            "Daily executive summary digest",
            "Engine errors / dropped jobs",
          ].map((label, i) => (
            <div key={label} className="flex items-center justify-between border-t border-border/30 pt-3 first:border-0 first:pt-0">
              <div>
                <div className="text-sm">{label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">routes through all enabled channels</div>
              </div>
              <Switch defaultChecked={i < 3} />
            </div>
          ))}
        </div>

        <button
          onClick={() => toast.success("test alert dispatched to all channels")}
          className="mt-6 glass-strong glow-emerald px-4 py-2 rounded-md font-mono text-sm text-emerald flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" /> send test notification
        </button>
      </div>
    </div>
  );
}

function Channel({
  icon: Icon, title, tag, fields, defaultOn,
}: {
  icon: any; title: string; tag: string; defaultOn?: boolean;
  fields: { label: string; placeholder: string }[];
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="glass rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 grid place-items-center rounded-md glass">
            <Icon className="h-4 w-4 text-emerald" />
          </div>
          <div>
            <div className="font-semibold text-sm">{title}</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground">{tag}</div>
          </div>
        </div>
        <Switch checked={on} onCheckedChange={setOn} />
      </div>
      <div className="mt-4 space-y-3 opacity-100">
        {fields.map((f) => (
          <div key={f.label}>
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</Label>
            <Input placeholder={f.placeholder} className="mt-1 bg-background/40 border-border/60 font-mono text-[12px]" disabled={!on} />
          </div>
        ))}
      </div>
    </div>
  );
}
