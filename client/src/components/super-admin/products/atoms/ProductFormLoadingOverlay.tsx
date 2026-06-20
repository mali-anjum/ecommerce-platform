import { Loader2 } from "lucide-react";

type ProductFormLoadingOverlayProps = {
  show: boolean;
  message?: string;
};

export function ProductFormLoadingOverlay({
  show,
  message = "Loading product details...",
}: ProductFormLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-xs"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        {message}
      </div>
    </div>
  );
}

