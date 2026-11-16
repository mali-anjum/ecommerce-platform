import { HOME_PARTICLES } from "../constants/homeContent";

export function HomeFloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      <div className="error-grid absolute inset-0" />
      {HOME_PARTICLES.map((particle, index) => (
        <div
          key={index}
          className="error-particle absolute"
          style={{
            top: `${particle[0] * 100}%`,
            left: `${particle[1] * 100}%`,
            width: `${particle[2] * 3 + 1}px`,
            height: `${particle[3] * 3 + 1}px`,
            animationDelay: `${particle[4] * 2}s`,
            animationDuration: `${particle[5] * 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}
