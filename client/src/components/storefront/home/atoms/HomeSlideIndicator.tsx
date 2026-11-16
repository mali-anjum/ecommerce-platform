type HomeSlideIndicatorProps = {
  count: number;
  current: number;
  onChange: (index: number) => void;
};

export function HomeSlideIndicator({
  count,
  current,
  onChange,
}: HomeSlideIndicatorProps) {
  return (
    <div
      role="group"
      className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 space-x-3"
      aria-label="Hero slides"
    >
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(index)}
          className={`h-3 w-3 rounded-full transition-all duration-300 theme-transition ${
            current === index
              ? "w-8 bg-primary neon-border"
              : "bg-primary/30 backdrop-blur-xs hover:bg-primary/50"
          }`}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={current === index ? "true" : undefined}
        />
      ))}
    </div>
  );
}
