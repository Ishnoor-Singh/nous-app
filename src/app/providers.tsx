"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      // Return null during build time - this is fine
      return null;
    }
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    // During SSR/build without Convex URL, just render children
    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#faf8f5",
          colorText: "#1a1a1b",
        },
      }}
    >
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
