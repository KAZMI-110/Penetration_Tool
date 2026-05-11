// Real API client for Deep Eye SOC
// Supports dynamic backend URL via VITE_API_URL environment variable

const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_URL = `${BASE_URL}/api`;

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchRecentScans() {
  const res = await fetch(`${API_URL}/recent-scans`);
  if (!res.ok) throw new Error("Failed to fetch recent scans");
  return res.json();
}

export async function fetchFindings() {
  const res = await fetch(`${API_URL}/findings`);
  if (!res.ok) throw new Error("Failed to fetch findings");
  return res.json();
}

export async function fetchSeverityDistribution() {
  const res = await fetch(`${API_URL}/severity-distribution`);
  if (!res.ok) throw new Error("Failed to fetch severity distribution");
  return res.json();
}

export async function fetchModuleFrequency() {
  const res = await fetch(`${API_URL}/module-frequency`);
  if (!res.ok) throw new Error("Failed to fetch module frequency");
  return res.json();
}

export async function fetchTrend() {
  const res = await fetch(`${API_URL}/trend`);
  if (!res.ok) throw new Error("Failed to fetch trend data");
  return res.json();
}

export interface ScanConfig {
  target: string;
  mode: string;
  depth: number;
  threads: number;
  recon: boolean;
  ai_payloads: boolean;
  modules: string[];
}

export async function createScan(config: ScanConfig) {
  const res = await fetch(`${API_URL}/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to create scan");
  return res.json();
}

export async function downloadReport(scanId: string, format: string = "pdf") {
  const res = await fetch(`${API_URL}/report/${scanId}?format=${format}`);
  if (!res.ok) throw new Error("Failed to download report");
  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
  const filename = filenameMatch?.[1] ?? `${scanId}_report.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchReports() {
  const res = await fetch(`${API_URL}/reports`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}
