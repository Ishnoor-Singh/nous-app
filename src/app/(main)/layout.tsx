"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, MessageCircle, Brain, User, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      {children}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-secondary safe-bottom">
        <div className="flex items-center justify-around py-3 max-w-lg mx-auto">
          <NavItem href="/home" icon={Home} label="Home" active={pathname === "/home"} />
          <NavItem href="/chat" icon={MessageCircle} label="Chat" active={pathname === "/chat"} />
          <NavItem href="/habits" icon={Target} label="Habits" active={pathname === "/habits"} />
          <NavItem href="/profile" icon={User} label="Profile" active={pathname === "/profile"} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="relative">
      <div className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      }`}>
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium">{label}</span>
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute -bottom-1 w-1 h-1 rounded-full bg-accent"
          />
        )}
      </div>
    </Link>
  );
}
