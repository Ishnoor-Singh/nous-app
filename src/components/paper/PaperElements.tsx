"use client";

import { ReactNode, CSSProperties } from "react";

// SVG filter for pencil effect
export function PencilFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <filter id="pencil-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
      </filter>
    </svg>
  );
}

// Tape strip
export function TapeStrip({ 
  rotation = 0, 
  color = "cream",
  width = 60,
  style 
}: { 
  rotation?: number;
  color?: "cream" | "blue" | "peach";
  width?: number;
  style?: CSSProperties;
}) {
  const colors = {
    cream: "rgba(255, 248, 220, 0.7)",
    blue: "rgba(173, 216, 230, 0.5)",
    peach: "rgba(255, 218, 185, 0.6)",
  };

  return (
    <div
      style={{
        position: "absolute",
        width,
        height: 20,
        background: colors[color],
        transform: `rotate(${rotation}deg)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        ...style,
      }}
    />
  );
}

// Sticky note
export function StickyNote({ 
  children, 
  color = "yellow",
  rotation = 0,
  style 
}: { 
  children: ReactNode;
  color?: "yellow" | "pink" | "blue" | "green";
  rotation?: number;
  style?: CSSProperties;
}) {
  const colors = {
    yellow: "#fff9c4",
    pink: "#ffcccb",
    blue: "#bbdefb",
    green: "#c8e6c9",
  };

  return (
    <div
      style={{
        background: colors[color],
        padding: "12px 14px",
        transform: `rotate(${rotation}deg)`,
        boxShadow: "2px 3px 8px rgba(0,0,0,0.15), inset 0 -40px 40px rgba(0,0,0,0.02)",
        fontFamily: "'Caveat', cursive",
        fontSize: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Coffee stain
export function CoffeeStain({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `radial-gradient(
          ellipse at center,
          transparent 40%,
          rgba(139, 90, 43, 0.08) 50%,
          rgba(139, 90, 43, 0.12) 60%,
          rgba(139, 90, 43, 0.05) 70%,
          transparent 80%
        )`,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

// Paper clip
export function PaperClip({ style, rotation = 15 }: { style?: CSSProperties; rotation?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 20,
        height: 50,
        borderRadius: "10px 10px 0 0",
        border: "3px solid #b8b8b8",
        borderBottom: "none",
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 12,
          height: 35,
          borderRadius: "6px 6px 0 0",
          border: "3px solid #b8b8b8",
          borderBottom: "none",
          top: 10,
          left: 1,
        }}
      />
    </div>
  );
}

// Doodles
export function Doodle({ 
  type, 
  style 
}: { 
  type: "star" | "arrow" | "circle" | "heart" | "underline";
  style?: CSSProperties;
}) {
  const doodles = {
    star: (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <path 
          d="M15 3 L17 11 L25 11 L19 16 L21 24 L15 19 L9 24 L11 16 L5 11 L13 11 Z" 
          fill="none" 
          stroke="#ffd93d" 
          strokeWidth="2" 
          strokeLinejoin="round"
        />
      </svg>
    ),
    arrow: (
      <svg width="40" height="20" viewBox="0 0 40 20">
        <path 
          d="M2 10 Q 20 5, 35 10 M30 5 L35 10 L30 15" 
          fill="none" 
          stroke="#4a4a4a" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
    ),
    circle: (
      <svg width="25" height="25" viewBox="0 0 25 25">
        <ellipse 
          cx="12" 
          cy="12" 
          rx="10" 
          ry="9" 
          fill="none" 
          stroke="#e74c3c" 
          strokeWidth="2" 
          transform="rotate(5 12 12)"
        />
      </svg>
    ),
    heart: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path 
          d="M12 21 C6 16 2 12 2 8 C2 5 4 3 7 3 C9 3 11 4 12 6 C13 4 15 3 17 3 C20 3 22 5 22 8 C22 12 18 16 12 21Z" 
          fill="none" 
          stroke="#e74c3c" 
          strokeWidth="2"
        />
      </svg>
    ),
    underline: (
      <svg width="60" height="10" viewBox="0 0 60 10">
        <path 
          d="M2 5 Q 15 8, 30 5 T 58 5" 
          fill="none" 
          stroke="#2d5016" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  return <div style={{ position: "absolute", ...style }}>{doodles[type]}</div>;
}

// Pencil checkbox
export function PencilCheckbox({ 
  checked, 
  onChange 
}: { 
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 22,
        height: 22,
        border: "2px solid #4a4a4a",
        borderRadius: 2,
        cursor: "pointer",
        position: "relative",
        transform: `rotate(${Math.random() * 2 - 1}deg)`,
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg 
          viewBox="0 0 24 24" 
          style={{ 
            position: "absolute", 
            top: -2, 
            left: -2, 
            width: 26, 
            height: 26 
          }}
        >
          <path 
            d="M4 12 L10 18 L20 6" 
            stroke="#2d5016" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

// Paper card wrapper
export function PaperCard({ 
  children,
  variant = "cream",
  lined = false,
  rotation = 0,
  style
}: {
  children: ReactNode;
  variant?: "cream" | "white" | "aged" | "kraft";
  lined?: boolean;
  rotation?: number;
  style?: CSSProperties;
}) {
  const backgrounds = {
    cream: "#fefcf6",
    white: "#fff",
    aged: "#f5f0e6",
    kraft: "#d4c4a8",
  };

  const linedBg = lined 
    ? "repeating-linear-gradient(transparent, transparent 27px, #e8dcd0 28px)"
    : "none";

  return (
    <div
      style={{
        background: backgrounds[variant],
        backgroundImage: linedBg,
        backgroundSize: lined ? "100% 28px" : "auto",
        padding: "20px 24px",
        boxShadow: "3px 4px 12px rgba(0,0,0,0.15)",
        transform: `rotate(${rotation}deg)`,
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Tab button (like sticky tabs)
export function TabButton({
  children,
  active,
  color = "yellow",
  rotation = 0,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  color?: "yellow" | "green" | "blue" | "pink";
  rotation?: number;
  onClick: () => void;
}) {
  const colors = {
    yellow: "#fff9c4",
    green: "#c8e6c9",
    blue: "#bbdefb",
    pink: "#ffcccb",
  };

  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Indie Flower', cursive",
        fontSize: 16,
        padding: "8px 16px",
        background: active ? colors[color] : "#f5f0e6",
        border: "none",
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
        transform: `rotate(${rotation}deg)`,
        boxShadow: active ? "0 -2px 5px rgba(0,0,0,0.1)" : "none",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

// Washi tape
export function WashiTape({
  pattern = "solid",
  color = "pink",
  width = 60,
  rotation = 0,
  style,
}: {
  pattern?: "solid" | "dots" | "stripes";
  color?: "pink" | "blue" | "mint" | "peach";
  width?: number;
  rotation?: number;
  style?: CSSProperties;
}) {
  const colors = {
    pink: "rgba(255, 182, 193, 0.7)",
    blue: "rgba(173, 216, 230, 0.7)",
    mint: "rgba(152, 251, 152, 0.6)",
    peach: "rgba(255, 218, 185, 0.7)",
  };

  const patterns = {
    solid: "",
    dots: "radial-gradient(circle, rgba(255,255,255,0.4) 20%, transparent 20%)",
    stripes: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)",
  };

  return (
    <div
      style={{
        position: "absolute",
        width,
        height: 22,
        background: colors[color],
        backgroundImage: patterns[pattern],
        backgroundSize: pattern === "dots" ? "8px 8px" : "auto",
        transform: `rotate(${rotation}deg)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        ...style,
      }}
    />
  );
}
