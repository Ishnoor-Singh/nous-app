"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, MessageCircle, User, Target, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PencilFilter } from "@/components/paper/PaperElements";

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
          background: "#d4c4a8",
          fontFamily: "'Caveat', cursive",
        }}
      >
        <link 
          href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;600&family=Permanent+Marker&family=Indie+Flower&display=swap" 
          rel="stylesheet" 
        />
        <div style={{ fontSize: 24, color: "#2c2c2c" }}>
          Loading your notebook...
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        minHeight: "100vh",
        background: "#d4c4a8",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        paddingBottom: 80,
      }}
    >
      <PencilFilter />
      <link 
        href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;600&family=Permanent+Marker&family=Indie+Flower&family=Patrick+Hand&display=swap" 
        rel="stylesheet" 
      />
      
      {children}

      {/* Paper-style Bottom Navigation */}
      <nav 
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#f5f0e6",
          borderTop: "3px solid #e8dcd0",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0", maxWidth: 500, margin: "0 auto" }}>
          <PaperNavItem href="/home" icon={Home} label="home" active={pathname === "/home"} />
          <PaperNavItem href="/chat" icon={MessageCircle} label="chat" active={pathname === "/chat"} />
          <PaperNavItem href="/habits" icon={Target} label="habits" active={pathname === "/habits"} />
          <PaperNavItem href="/journal" icon={BookOpen} label="journal" active={pathname === "/journal"} />
          <PaperNavItem href="/profile" icon={User} label="me" active={pathname === "/profile"} />
        </div>
      </nav>
    </div>
  );
}

function PaperNavItem({
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
      <div 
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: "6px 12px",
          borderRadius: 8,
          background: active ? "#fff9c4" : "transparent",
          transform: active ? "rotate(-1deg)" : "none",
          boxShadow: active ? "2px 2px 4px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.2s",
        }}
      >
        <Icon 
          size={22} 
          style={{ 
            color: active ? "#2c2c2c" : "#8a7b6d",
            strokeWidth: active ? 2.5 : 2,
          }} 
        />
        <span 
          style={{ 
            fontFamily: "'Caveat', cursive",
            fontSize: 13,
            color: active ? "#2c2c2c" : "#8a7b6d",
            fontWeight: active ? 600 : 400,
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
