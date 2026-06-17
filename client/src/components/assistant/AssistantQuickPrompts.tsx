"use client";

type AssistantQuickPromptsProps = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

const PROMPTS = [
  "Where is my order?",
  "What is your return policy?",
  "Shipping & delivery info",
  "Talk to agent",
] as const;

export function AssistantQuickPrompts({
  onSelect,
  disabled = false,
}: AssistantQuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
