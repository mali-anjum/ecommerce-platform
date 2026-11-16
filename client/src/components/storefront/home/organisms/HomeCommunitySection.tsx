import { Button } from "@/components/ui/button";

export function HomeCommunitySection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="futuristic-gradient relative mx-auto max-w-4xl overflow-hidden rounded-2xl p-8 md:p-12">
          <div className="hologram-effect absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 space-y-6 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
              JOIN OUR COMMUNITY
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-primary-foreground/90">
              Get exclusive access to new collections, special offers, and
              fashion insights
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-4 sm:flex-row">
              <label className="sr-only" htmlFor="community-email">
                Email address
              </label>
              <input
                id="community-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-white backdrop-blur-xs placeholder:text-white/50 focus:border-transparent focus:outline-hidden focus:ring-2 focus:ring-primary-light"
              />
              <Button
                type="button"
                className="rounded-lg bg-white px-8 py-3 font-semibold text-background transition-all duration-300 hover:scale-105 hover:bg-white/90"
              >
                SUBSCRIBE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
