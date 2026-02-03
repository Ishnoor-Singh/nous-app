"use client";

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, Heart, Zap } from "lucide-react";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-2xl shadow-accent/25"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-3"
        >
          <h1 className="text-5xl font-bold tracking-tight">
            nous
          </h1>
          <p className="text-xl text-muted-foreground">
            Your knowledge companion
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 py-6"
        >
          <FeatureCard icon={<Heart className="w-5 h-5" />} label="Grows with you" />
          <FeatureCard icon={<Sparkles className="w-5 h-5" />} label="Depth over trivia" />
          <FeatureCard icon={<Zap className="w-5 h-5" />} label="5 min daily" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-muted-foreground leading-relaxed"
        >
          An AI that remembers, evolves, and develops genuine connection. 
          <span className="text-foreground font-medium"> Not a chatbot — a companion.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 pt-4"
        >
          <SignUpButton mode="modal">
            <button className="flex-1 py-4 px-6 bg-accent text-accent-foreground rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all active:scale-[0.98] shadow-lg shadow-accent/25">
              Begin your journey
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="flex-1 py-4 px-6 bg-secondary text-secondary-foreground rounded-2xl font-semibold text-lg hover:bg-secondary/80 transition-all active:scale-[0.98]">
              Sign in
            </button>
          </SignInButton>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-sm text-muted-foreground pt-6"
        >
          Philosophy • History • Economics • Art • Psychology
        </motion.p>
      </div>
    </main>
  );
}

function FeatureCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/50">
      <div className="text-accent">{icon}</div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
