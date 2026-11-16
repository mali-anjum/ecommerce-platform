type HomeSectionHeaderProps = {
  title: string;
  subtitle: string;
};

export function HomeSectionHeader({
  title,
  subtitle,
}: HomeSectionHeaderProps) {
  return (
    <div className="mb-12 space-y-3 text-center">
      <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
        {subtitle}
      </p>
      <div className="mx-auto h-1 w-24 rounded-full bg-linear-to-r from-primary via-secondary to-accent" />
    </div>
  );
}
