export function DeepEyeLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8 grid place-items-center rounded-md glass glow-emerald">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-emerald"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="font-mono text-[15px] font-semibold tracking-tight text-emerald text-glow">
          DEEP·EYE
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">v1.3.0 // soc</div>
      </div>
    </div>
  );
}
