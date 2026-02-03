"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface MoodPoint {
  timestamp: number;
  valence: number;
  arousal: number;
  connection: number;
  label?: string;
}

interface MoodTimelineProps {
  points: MoodPoint[];
  onPointClick?: (point: MoodPoint) => void;
}

export function MoodTimeline({ points, onPointClick }: MoodTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (points.length < 2) return null;

  // Normalize values for visualization
  const width = 100;
  const height = 60;
  const padding = 10;

  // Create smooth path through points
  const getPath = () => {
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;
    
    return points.map((point, i) => {
      const x = padding + (i / (points.length - 1)) * effectiveWidth;
      // Map valence (-1 to 1) to y (bottom to top)
      const y = padding + ((1 - point.valence) / 2) * effectiveHeight;
      return { x, y, ...point };
    });
  };

  const pathPoints = getPath();
  
  // Create SVG path
  const pathD = pathPoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // Get color based on average mood
  const avgValence = points.reduce((sum, p) => sum + p.valence, 0) / points.length;
  const strokeColor = avgValence > 0.2 
    ? "url(#gradientPositive)" 
    : avgValence < -0.2 
      ? "url(#gradientNegative)" 
      : "url(#gradientNeutral)";

  return (
    <div className="w-full rounded-2xl bg-muted p-4">
      <p className="text-xs text-muted-foreground mb-2">Conversation mood</p>
      
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-16"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gradientPositive" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="gradientNegative" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="gradientNeutral" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a3a3a3" />
            <stop offset="100%" stopColor="#d4d4d4" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line 
          x1={padding} y1={height / 2} 
          x2={width - padding} y2={height / 2} 
          stroke="currentColor" 
          strokeOpacity="0.1" 
          strokeDasharray="2 2"
        />

        {/* The mood line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* Points */}
        {pathPoints.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 5 : 3}
            fill={point.valence > 0.2 ? "#22c55e" : point.valence < -0.2 ? "#3b82f6" : "#a3a3a3"}
            className="cursor-pointer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onPointClick?.(point)}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Start</span>
        <span className={avgValence > 0.2 ? "text-emerald-500" : avgValence < -0.2 ? "text-blue-500" : ""}>
          {avgValence > 0.2 ? "↑ Upward trend" : avgValence < -0.2 ? "↓ Reflective" : "→ Steady"}
        </span>
        <span>Now</span>
      </div>
    </div>
  );
}

// Mini version for inline use
export function MoodDot({ valence, size = "sm" }: { valence: number; size?: "sm" | "md" }) {
  const color = valence > 0.2 
    ? "bg-emerald-500" 
    : valence < -0.2 
      ? "bg-blue-500" 
      : "bg-gray-400";
  
  const sizeClass = size === "sm" ? "w-2 h-2" : "w-3 h-3";

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`${sizeClass} ${color} rounded-full`}
    />
  );
}
