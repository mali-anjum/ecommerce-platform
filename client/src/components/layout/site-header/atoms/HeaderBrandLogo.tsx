import Link from "next/link";

/** Store logo and wordmark linking to the home page. */
export function HeaderBrandLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
          <span className="text-xl font-bold text-white">F</span>
        </div>
        <div className="absolute -inset-1 animate-pulse rounded-full bg-primary/20" />
      </div>
      <div>
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
          FUTURESHOP
        </span>
        <p className="text-xs text-muted-foreground">Next-Gen Commerce</p>
      </div>
    </Link>
  );
}
