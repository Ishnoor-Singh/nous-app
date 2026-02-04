"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, MessageCircle, Target, BookOpen, User, CheckSquare } from "lucide-react";
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
      <div className="min-h-dvh gradient-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh gradient-bg pb-24 relative">
      <div className="relative z-10">
        {children}
      </div>

      {/* Bottom Navigation - Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-50">
        <div className="flex items-center justify-around py-3 max-w-lg mx-auto px-4">
          <NavItem href="/home" icon={Home} label="Home" active={pathname === "/home"} />
          <NavItem href="/chat" icon={MessageCircle} label="Chat" active={pathname === "/chat"} />
          <NavItem href="/tasks" icon={CheckSquare} label="Tasks" active={pathname === "/tasks"} />
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
      <motion.div 
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
          active 
            ? "text-white" 
            : "text-white/40 hover:text-white/70"
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`relative ${active ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" : ""}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium">{label}</span>
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute -bottom-1 w-8 h-1 rounded-full bg-gradient-to-r from-accent to-purple-500"
            style={{ boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)" }}
          />
        )}
      </motion.div>
    </Link>
  );
}
