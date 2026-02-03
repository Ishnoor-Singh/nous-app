"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      {/* Confused brain */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: 3 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/50 to-orange-500/50 flex items-center justify-center mb-8"
      >
        <Brain className="w-12 h-12 text-red-500" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-4"
      >
        Mind glitch
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground mb-8 max-w-xs"
      >
        Something unexpected happened. Even AI has its moments. Let's try that again.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={reset}
          className="px-6 py-3 bg-accent text-accent-foreground rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>

        <Link
          href="/home"
          className="px-6 py-3 bg-muted rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
        >
          <Home className="w-4 h-4" />
          Go home
        </Link>
      </motion.div>

      {/* Error details for development */}
      {process.env.NODE_ENV === "development" && (
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-muted rounded-2xl text-left max-w-md w-full"
        >
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Error details
          </summary>
          <pre className="mt-2 text-xs overflow-auto text-red-500">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        </motion.details>
      )}
    </main>
  );
}
