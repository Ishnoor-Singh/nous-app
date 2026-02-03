"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  glow?: boolean;
}

export function GlowButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  glow = true,
}: GlowButtonProps) {
  const baseStyles = "relative font-semibold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-accent text-accent-foreground hover:bg-accent/90",
    secondary: "bg-muted text-foreground hover:bg-secondary",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const glowColors = {
    primary: "rgba(99, 102, 241, 0.4)",
    secondary: "rgba(156, 163, 175, 0.3)",
    ghost: "transparent",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={glow && variant === "primary" ? {
        boxShadow: `0 4px 20px ${glowColors[variant]}`,
      } : {}}
    >
      {/* Animated glow effect */}
      {glow && variant === "primary" && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-accent/20"
          animate={{
            boxShadow: [
              `0 0 20px ${glowColors[variant]}`,
              `0 0 40px ${glowColors[variant]}`,
              `0 0 20px ${glowColors[variant]}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

// Gradient border button for special actions
export function GradientButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-accent via-purple-500 to-pink-500 ${className}`}
    >
      <div className="bg-background rounded-[14px] px-6 py-3 font-semibold">
        {children}
      </div>
    </motion.button>
  );
}

// Floating action button
export function FloatingActionButton({
  children,
  onClick,
  position = "bottom-right",
}: {
  children: ReactNode;
  onClick?: () => void;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}) {
  const positions = {
    "bottom-right": "bottom-24 right-4",
    "bottom-left": "bottom-24 left-4",
    "bottom-center": "bottom-24 left-1/2 -translate-x-1/2",
  };

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`fixed ${positions[position]} w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 flex items-center justify-center z-40`}
    >
      {children}
    </motion.button>
  );
}
