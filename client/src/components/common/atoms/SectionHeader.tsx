"use client";

interface SectionHeaderProps {
  title: string;
  isOpen: boolean;
  icon?: React.ElementType;
}

export function SectionHeader({ title, isOpen, icon: Icon }: SectionHeaderProps) {
  if (!isOpen && !Icon) return null;
  
  return (
    <div className="px-4 py-2">
      {isOpen ? (
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
      ) : Icon ? (
        <div className="flex justify-center py-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      ) : null}
    </div>
  );
}