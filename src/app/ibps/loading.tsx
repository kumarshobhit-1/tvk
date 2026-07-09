export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-32 rounded-full bg-muted" />
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4 rounded-3xl border border-border/60 bg-background p-6 shadow-sm">
            <div className="h-5 w-56 rounded-full bg-muted" />
            <div className="h-14 w-full rounded-2xl bg-muted/80" />
            <div className="h-6 w-3/4 rounded-full bg-muted/70" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-20 rounded-2xl bg-muted/70" />
              <div className="h-20 rounded-2xl bg-muted/70" />
              <div className="h-20 rounded-2xl bg-muted/70" />
            </div>
          </div>
          <div className="h-72 rounded-3xl border border-border/60 bg-muted/60 shadow-sm" />
        </div>
        <div className="space-y-3 rounded-3xl border border-border/60 bg-background p-6 shadow-sm">
          <div className="h-5 w-48 rounded-full bg-muted/80" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-24 rounded-2xl bg-muted/70" />
            <div className="h-24 rounded-2xl bg-muted/70" />
            <div className="h-24 rounded-2xl bg-muted/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
