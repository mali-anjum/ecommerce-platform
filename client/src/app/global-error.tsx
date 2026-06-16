"use client";

import { useEffect } from "react";
import { sentryTracker } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    sentryTracker(error, { source: "global-error" });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">Application error</h2>
          <p className="max-w-md text-sm text-gray-600">
            A critical error occurred. Our team has been notified.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
