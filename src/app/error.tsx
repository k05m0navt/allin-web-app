"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log error to an error reporting service
    // console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          Sorry, an unexpected error occurred. Please try refreshing the page or
          contact support if the problem persists.
        </p>
        <pre className="bg-muted text-xs rounded p-3 mb-4 overflow-x-auto text-left">
          {error.message}
        </pre>
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground px-4 py-2 rounded shadow hover:bg-primary/90 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
