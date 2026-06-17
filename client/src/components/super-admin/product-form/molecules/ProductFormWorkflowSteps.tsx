import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Product details", hint: "Name, catalog, description" },
  { id: 2, label: "Pricing & inventory", hint: "Price, stock, variants" },
  { id: 3, label: "SEO", hint: "Optional — search & social previews" },
] as const;

type ProductFormWorkflowStepsProps = {
  showSeoStep?: boolean;
};

/** Top-of-form guide so admins know this is one unified create flow. */
export function ProductFormWorkflowSteps({
  showSeoStep = true,
}: ProductFormWorkflowStepsProps) {
  const visibleSteps = showSeoStep ? STEPS : STEPS.slice(0, 2);

  return (
    <nav
      aria-label="Product creation steps"
      className="rounded-xl border border-border/60 bg-card/40 p-4 md:p-5"
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Complete each section on this page, then save once. AI SEO assist appears
        in step 3 when enabled.
      </p>
      <ol className="grid gap-3 md:grid-cols-3">
        {visibleSteps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "flex gap-3 rounded-lg border border-border/50 bg-background/60 p-3",
              index === visibleSteps.length - 1 && !showSeoStep && "md:col-span-1",
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {step.id}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-primary" />
        One page — no separate SEO tool required
      </p>
    </nav>
  );
}
