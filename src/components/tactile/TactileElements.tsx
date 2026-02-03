"use client";

import { ReactNode, CSSProperties, useState } from "react";
import { motion } from "framer-motion";

// Tactile Card - raised, soft shadow
export function TactileCard({
  children,
  style,
  onClick,
  variant = "raised",
}: {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  variant?: "raised" | "pressed" | "floating";
}) {
  const shadows = {
    raised: "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
    pressed: "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
    floating: "8px 8px 24px rgba(0, 0, 0, 0.12), -4px -4px 16px rgba(255, 255, 255, 0.8)",
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: "linear-gradient(145deg, #fdf8f2, #f7f0e6)",
        borderRadius: 24,
        padding: 20,
        boxShadow: shadows[variant],
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// Tactile Button - pillow-like
export function TactileButton({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const colors = {
    primary: { bg: "#c4956a", text: "#fff" },
    secondary: { bg: "#f7f0e6", text: "#4a4035" },
    success: { bg: "#7d9b76", text: "#fff" },
    danger: { bg: "#c27c7c", text: "#fff" },
  };

  const sizes = {
    small: { padding: "8px 16px", fontSize: 14, borderRadius: 12 },
    medium: { padding: "12px 24px", fontSize: 16, borderRadius: 16 },
    large: { padding: "16px 32px", fontSize: 18, borderRadius: 20 },
  };

  const color = colors[variant];
  const sizeStyle = sizes[size];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={disabled ? undefined : onClick}
      style={{
        background: `linear-gradient(145deg, ${color.bg}, ${adjustColor(color.bg, -10)})`,
        color: color.text,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(255, 255, 255, 0.5)",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.15s ease",
        ...sizeStyle,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

// Tactile Checkbox
export function TactileCheckbox({
  checked,
  onChange,
  size = 28,
}: {
  checked: boolean;
  onChange: () => void;
  size?: number;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      onClick={onChange}
      style={{
        width: size,
        height: size,
        background: checked 
          ? "linear-gradient(145deg, #7d9b76, #6b8965)"
          : "#e8ddd0",
        borderRadius: 8,
        boxShadow: checked
          ? "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6)"
          : "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: size * 0.6,
        fontWeight: "bold",
        transition: "all 0.2s ease",
      }}
    >
      {checked && "✓"}
    </motion.div>
  );
}

// Tactile Toggle
export function TactileToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: () => void;
}) {
  return (
    <motion.div
      onClick={onChange}
      style={{
        width: 56,
        height: 32,
        background: active ? "#7d9b76" : "#e8ddd0",
        borderRadius: 16,
        position: "relative",
        cursor: "pointer",
        boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
        transition: "background 0.3s ease",
      }}
    >
      <motion.div
        animate={{ x: active ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "absolute",
          width: 26,
          height: 26,
          background: "linear-gradient(145deg, #fff, #f7f0e6)",
          borderRadius: "50%",
          top: 3,
          left: 3,
          boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.15)",
        }}
      />
    </motion.div>
  );
}

// Tactile Progress Bar
export function TactileProgress({
  value,
  max = 100,
  color = "#c4956a",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div
      style={{
        height: 12,
        background: "#e8ddd0",
        borderRadius: 6,
        boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${adjustColor(color, 20)})`,
          borderRadius: 6,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      />
    </div>
  );
}

// Tactile Badge
export function TactileBadge({
  children,
  color = "primary",
}: {
  children: ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const colors = {
    primary: "#c4956a",
    success: "#7d9b76",
    warning: "#d4a574",
    danger: "#c27c7c",
  };

  return (
    <span
      style={{
        background: `linear-gradient(145deg, ${colors[color]}, ${adjustColor(colors[color], -10)})`,
        color: "white",
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: `2px 2px 8px ${colors[color]}40`,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

// Tactile Input
export function TactileInput({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "#e8ddd0",
        border: "none",
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -1px -1px 4px rgba(255, 255, 255, 0.3)",
        color: "#4a4035",
        fontSize: 16,
        width: "100%",
        outline: "none",
        transition: "all 0.2s ease",
        ...style,
      }}
    />
  );
}

// Tactile Icon Button
export function TactileIconButton({
  icon,
  onClick,
  size = 48,
}: {
  icon: ReactNode;
  onClick?: () => void;
  size?: number;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, #fdf8f2, #f7f0e6)",
        borderRadius: size * 0.3,
        boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#4a4035",
        fontSize: size * 0.4,
      }}
    >
      {icon}
    </motion.button>
  );
}

// Tactile FAB
export function TactileFAB({
  icon,
  onClick,
}: {
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        width: 64,
        height: 64,
        background: "linear-gradient(145deg, #c4956a, #b38656)",
        borderRadius: 20,
        boxShadow: "6px 6px 16px rgba(0, 0, 0, 0.15), -3px -3px 10px rgba(255, 255, 255, 0.6)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 28,
        position: "fixed",
        bottom: 90,
        right: 20,
        zIndex: 50,
      }}
    >
      {icon}
    </motion.button>
  );
}

// Tactile List Item
export function TactileListItem({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: active 
          ? "linear-gradient(145deg, #fdf8f2, #f7f0e6)"
          : "#f7f0e6",
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 12,
        boxShadow: active
          ? "4px 4px 12px rgba(0, 0, 0, 0.08), -2px -2px 8px rgba(255, 255, 255, 0.6)"
          : "2px 2px 8px rgba(0, 0, 0, 0.05), -1px -1px 4px rgba(255, 255, 255, 0.5)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </motion.div>
  );
}

// Tactile Divider
export function TactileDivider() {
  return (
    <div
      style={{
        height: 2,
        background: "linear-gradient(90deg, transparent, #e8ddd0, transparent)",
        margin: "16px 0",
      }}
    />
  );
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
