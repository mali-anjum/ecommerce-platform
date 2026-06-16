import { Flame } from "lucide-react";

const HERO_PARTICLES = [
  { top: "12%", left: "18%", delay: "0s" },
  { top: "28%", left: "72%", delay: "0.5s" },
  { top: "45%", left: "35%", delay: "1s" },
  { top: "62%", left: "85%", delay: "1.5s" },
  { top: "78%", left: "22%", delay: "2s" },
  { top: "35%", left: "55%", delay: "2.5s" },
  { top: "55%", left: "8%", delay: "3s" },
  { top: "18%", left: "90%", delay: "3.5s" },
] as const;

const HERO_STATS = [
  { value: "500+", label: "Products", className: "text-primary" },
  { value: "24H", label: "Delivery", className: "text-secondary" },
  { value: "AI", label: "Curated", className: "text-accent" },
] as const;

/** Full-width hero at the top of the product listing page. */
export function ProductsHeroBanner() {
  return (
    <div className="relative h-[400px] overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-secondary/10 to-accent/5" />
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
          alt="Futuristic Collection"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/40 to-transparent" />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {HERO_PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 animate-pulse rounded-full bg-primary"
            style={{
              top: particle.top,
              left: particle.left,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative flex h-full items-center justify-center">
        <div className="max-w-4xl px-4 text-center">
          <div className="mb-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 backdrop-blur-xs">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">LIMITED TIME</span>
            </div>

            <h1 className="mb-4 text-5xl font-bold md:text-7xl">
              <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NEXUS
              </span>
              <br />
              <span className="text-foreground">COLLECTION 2.0</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              Discover the future of fashion with our AI-curated collection of futuristic designs
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="glass-effect min-w-[140px] rounded-xl border border-glass-border p-4"
              >
                <div className={`mb-1 text-2xl font-bold ${stat.className}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
