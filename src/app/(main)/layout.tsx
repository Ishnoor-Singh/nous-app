"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, MessageCircle, Target, BookOpen, User, CheckSquare, FileText, Sparkles } from "lucide-react";
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

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/tasks", icon: CheckSquare, label: "Tasks" },
    { href: "/notes", icon: FileText, label: "Notes" },
    { href: "/habits", icon: Target, label: "Habits" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-dvh gradient-bg relative">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col glass-nav border-r border-white/10 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/home" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Nous</span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/settings"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              pathname === "/settings"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content - with left margin on desktop */}
      <div className="lg:ml-64 pb-24 lg:pb-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-50">
        <div className="flex items-center justify-around py-3 max-w-lg mx-auto px-4">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function DesktopNavItem({
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
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        active
          ? "bg-gradient-to-r from-accent/20 to-purple-600/20 text-white border border-accent/30"
          : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? "text-accent" : ""}`} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function MobileNavItem({
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
