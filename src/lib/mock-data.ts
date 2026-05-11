export const VULN_MODULES = [
  "SQL Injection", "XSS (Reflected)", "XSS (Stored)", "XSS (DOM)", "SSRF", "XXE",
  "RCE", "LFI", "RFI", "Open Redirect", "CSRF", "Clickjacking", "CORS Misconfig",
  "JWT Forgery", "JWT None Algo", "OAuth Flaws", "SAML Bypass", "LDAP Injection",
  "NoSQL Injection", "Command Injection", "Template Injection (SSTI)", "Prototype Pollution",
  "Deserialization", "HTTP Request Smuggling", "Cache Poisoning", "Host Header Injection",
  "Subdomain Takeover", "DNS Rebinding", "Race Conditions", "Mass Assignment",
  "IDOR", "Broken Access Control", "Privilege Escalation", "Business Logic",
  "API Security (REST)", "GraphQL Introspection", "GraphQL Batch Attack",
  "WebSocket Hijacking", "gRPC Probing", "Crypto Weakness", "TLS Downgrade",
  "Secrets in JS", "Exposed .git", "Exposed Backups", "Directory Traversal",
  "File Upload Bypass", "WebDAV", "HTTP/2 Smuggling", "Cache Deception",
];

export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const FINDINGS = [
  { id: "DE-7821", title: "Blind SQL Injection in /api/v1/search", endpoint: "POST /api/v1/search?q=", severity: "Critical", module: "SQL Injection", cwe: "CWE-89", confidence: 98, ai: "GPT-5" },
  { id: "DE-7822", title: "JWT 'none' algorithm accepted", endpoint: "Authorization header", severity: "Critical", module: "JWT Forgery", cwe: "CWE-347", confidence: 96, ai: "Claude" },
  { id: "DE-7823", title: "SSRF via image proxy", endpoint: "GET /img?url=", severity: "High", module: "SSRF", cwe: "CWE-918", confidence: 91, ai: "GPT-5" },
  { id: "DE-7824", title: "Stored XSS in profile bio", endpoint: "PUT /api/users/me", severity: "High", module: "XSS (Stored)", cwe: "CWE-79", confidence: 94, ai: "Grok" },
  { id: "DE-7825", title: "GraphQL introspection enabled in prod", endpoint: "POST /graphql", severity: "Medium", module: "GraphQL Introspection", cwe: "CWE-200", confidence: 99, ai: "OLLAMA" },
  { id: "DE-7826", title: "CORS allows arbitrary origin with credentials", endpoint: "OPTIONS /api/*", severity: "High", module: "CORS Misconfig", cwe: "CWE-942", confidence: 89, ai: "GPT-5" },
  { id: "DE-7827", title: "IDOR on /api/invoices/{id}", endpoint: "GET /api/invoices/12", severity: "Critical", module: "IDOR", cwe: "CWE-639", confidence: 97, ai: "Claude" },
  { id: "DE-7828", title: "WebSocket message origin not validated", endpoint: "wss://api.target.io/live", severity: "Medium", module: "WebSocket Hijacking", cwe: "CWE-345", confidence: 82, ai: "Grok" },
  { id: "DE-7829", title: "Open redirect in /logout?next=", endpoint: "GET /logout", severity: "Low", module: "Open Redirect", cwe: "CWE-601", confidence: 88, ai: "OLLAMA" },
  { id: "DE-7830", title: "Server fingerprint leaks framework version", endpoint: "Response headers", severity: "Info", module: "API Security (REST)", cwe: "CWE-200", confidence: 100, ai: "GPT-5" },
  { id: "DE-7831", title: "Weak TLS cipher suite (3DES)", endpoint: "TLS handshake", severity: "Medium", module: "TLS Downgrade", cwe: "CWE-326", confidence: 95, ai: "Claude" },
  { id: "DE-7832", title: "Subdomain takeover candidate (S3)", endpoint: "old.target.io", severity: "High", module: "Subdomain Takeover", cwe: "CWE-1104", confidence: 86, ai: "Grok" },
] as const;

export const RECENT_SCANS = [
  { id: "SCN-9912", target: "https://api.acme.io", started: "2 min ago", findings: 14, status: "running", progress: 64 },
  { id: "SCN-9911", target: "https://shop.lumen.dev", started: "1 h ago", findings: 23, status: "complete", progress: 100 },
  { id: "SCN-9910", target: "https://dash.northwind.io", started: "3 h ago", findings: 8, status: "complete", progress: 100 },
  { id: "SCN-9909", target: "https://gateway.atlas.cloud", started: "yesterday", findings: 41, status: "complete", progress: 100 },
  { id: "SCN-9908", target: "https://payments.helix.app", started: "2 d ago", findings: 5, status: "failed", progress: 38 },
];

export const TIMELINE_DATA = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  critical: Math.round(2 + Math.random() * 6),
  high: Math.round(4 + Math.random() * 8),
  medium: Math.round(6 + Math.random() * 12),
  low: Math.round(3 + Math.random() * 10),
}));

export const SEVERITY_DIST = [
  { name: "Critical", value: 12, color: "var(--severity-critical)" },
  { name: "High", value: 28, color: "var(--severity-high)" },
  { name: "Medium", value: 47, color: "var(--severity-medium)" },
  { name: "Low", value: 33, color: "var(--severity-low)" },
  { name: "Info", value: 21, color: "var(--severity-info)" },
];

export const MODULE_FREQ = [
  { module: "XSS", count: 38 },
  { module: "SQLi", count: 24 },
  { module: "IDOR", count: 19 },
  { module: "SSRF", count: 14 },
  { module: "JWT", count: 11 },
  { module: "GraphQL", count: 9 },
  { module: "CORS", count: 8 },
];

export const AI_PROVIDERS = [
  { name: "OpenAI", model: "gpt-5", status: "online", latency: 142 },
  { name: "Grok", model: "grok-4", status: "online", latency: 211 },
  { name: "OLLAMA", model: "llama3.1:70b", status: "degraded", latency: 612 },
  { name: "Claude", model: "claude-4.5", status: "online", latency: 168 },
] as const;

export function severityColor(s: string): string {
  switch (s) {
    case "Critical": return "var(--severity-critical)";
    case "High": return "var(--severity-high)";
    case "Medium": return "var(--severity-medium)";
    case "Low": return "var(--severity-low)";
    default: return "var(--severity-info)";
  }
}
