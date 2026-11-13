import type cors from "cors";

function getOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function createCorsOptions(
  frontendUrl = process.env.FRONTEND_URL,
): cors.CorsOptions {
  const allowedOrigins = new Set(
    [
      frontendUrl,
      "http://localhost:3000",
      "http://localhost:3012",
      "https://www.postman.com",
      "https://postman.com",
    ]
      .map(getOrigin)
      .filter((origin): origin is string => Boolean(origin)),
  );

  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const requestOrigin = getOrigin(origin);
      if (requestOrigin && allowedOrigins.has(requestOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy violation"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie", "Date", "ETag"],
    optionsSuccessStatus: 200,
    maxAge: 86400,
  };
}
