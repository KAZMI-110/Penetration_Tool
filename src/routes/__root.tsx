import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/deep-eye/app-sidebar";
import { AiStatusBar } from "@/components/deep-eye/ai-status-bar";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-xl p-10 text-center max-w-md">
        <h1 className="font-mono text-6xl text-emerald text-glow">404</h1>
        <p className="mt-3 text-muted-foreground">signal lost · target not in scope</p>
        <Link to="/" className="mt-6 inline-block font-mono text-sm text-emerald hover:underline">
          ← return to dashboard
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Deep Eye — AI Security Operations Center" },
      {
        name: "description",
        content:
          "Deep Eye is an AI-driven vulnerability scanner with 45+ attack modules, OSINT recon, and real-time SOC dashboard.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";

function RootComponent() {
  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-3 md:px-5 border-b border-border/60 backdrop-blur-xl bg-background/60">
              <SidebarTrigger className="text-muted-foreground hover:text-emerald" />
              <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="text-emerald">●</span> SOC // operator:{" "}
                <span className="text-foreground">root@deep-eye</span>
              </div>
              <div className="ml-auto">
                <AiStatusBar />
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster />
      </QueryClientProvider>
    </SidebarProvider>
  );
}
