import Image from "next/image";
import { useState } from "react";
interface LoginBannerProps {
  title?: string;
  description?: string;
  showSparkles?: boolean;
}

export const LoginBanner = ({
  title = "Welcome to the Future",
  description = "Experience next-generation authentication with cutting-edge security and lightning-fast performance.",
  showSparkles = true,
}: LoginBannerProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden group bg-linear-to-br from-primary/20 to-secondary/20">
      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src="/images/banner.webp"
            alt="Login Banner"
            fill
            sizes="(max-width: 1023px) 100vw, 50vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
            onError={() => setImageError(true)}
            className="scale-110 group-hover:scale-100 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary to-secondary" />
        )}
      </div>

      <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/50 to-transparent" />

      {showSparkles && (
        <div className="hologram-effect absolute inset-0 opacity-30" />
      )}

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-primary/20 animate-float" />
      <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full border border-secondary/20 animate-float animation-delay-1000" />

      <div className="absolute bottom-10 left-10 max-w-md">
        <h2 className="text-4xl font-bold mb-4 text-foreground">
          {title.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {title.split(" ").slice(-1)}
          </span>
        </h2>

        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
