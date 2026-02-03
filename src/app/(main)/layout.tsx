"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, MessageCircle, User, Target, BookOpen } from "lucide-react";
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
      <div 
        style={{ 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          background: "#f0e6d8",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 60,
            height: 60,
            background: "linear-gradient(145deg, #c4956a, #b38656)",
            borderRadius: 16,
            boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(255, 255, 255, 0.5)",
          }}
        />
      </div>
    );
  }

  return (
    <div 
      style={{
        minHeight: "100vh",
        background: "#f0e6d8",
        paddingBottom: 90,
      }}
    >
      {children}

      {/* Tactile Bottom Navigation */}
      <nav 
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(180deg, #f7f0e6 0%, #f0e6d8 100%)",
          borderTop: "none",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08), 0 -1px 0 rgba(255,255,255,0.8)",
          zIndex: 50,
          padding: "8px 0 12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 500, margin: "0 auto" }}>
          <TactileNavItem href="/home" icon={Home} label="Home" active={pathname === "/home"} />
          <TactileNavItem href="/chat" icon={MessageCircle} label="Chat" active={pathname === "/chat"} />
          <TactileNavItem href="/habits" icon={Target} label="Habits" active={pathname === "/habits"} />
          <TactileNavItem href="/journal" icon={BookOpen} label="Journal" active={pathname === "/journal"} />
          <TactileNavItem href="/profile" icon={User} label="Profile" active={pathname === "/profile"} />
        </div>
      </nav>
    </div>
  );
}

function TactileNavItem({
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
    <Link href={href} style={{ textDecoration: "none" }}>
      <motion.div 
        whileTap={{ scale: 0.9 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          padding: "8px 14px",
          borderRadius: 16,
          background: active 
            ? "linear-gradient(145deg, #fdf8f2, #f7f0e6)"
            : "transparent",
          boxShadow: active 
            ? "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
            : "none",
          transition: "all 0.2s",
        }}
      >
        <Icon 
          size={24} 
          style={{ 
            color: active ? "#c4956a" : "#8a7b6d",
            strokeWidth: active ? 2.5 : 2,
          }} 
        />
        <span 
          style={{ 
            fontSize: 11,
            fontWeight: active ? 600 : 500,
            color: active ? "#4a4035" : "#8a7b6d",
          }}
        >
          {label}
        </span>
      </motion.div>
    </Link>
  );
}
