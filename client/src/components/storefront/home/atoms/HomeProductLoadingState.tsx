export function HomeProductLoadingState() {
  return (
    <div className="py-12 text-center" role="status" aria-live="polite">
      <div className="glass-effect border-glass-border inline-block rounded-xl p-8">
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <p className="text-muted-foreground">Loading featured products...</p>
      </div>
    </div>
  );
}
