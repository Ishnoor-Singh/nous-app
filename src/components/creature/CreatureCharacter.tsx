"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// CREATURE ROSTER - GLASS STYLE
// ============================================
interface CreatureConfig {
  name: string;
  personality: string;
  bodyColor: string;
  bodyHighlight: string;
  bodyBorder: string;
  innerGlow: string;
  eyeCount: number;
  eyeSize: string;
  bodyShape: string;
  limbStyle: string;
  hasHorns?: boolean;
  hornColor?: string;
  hasSpots?: boolean;
  spotColor?: string;
  hasBlush?: boolean;
  hasTendrils?: boolean;
  tendrilColor?: string;
  hasTrail?: boolean;
  trailColor?: string;
  hasRipples?: boolean;
}

export const CREATURES: Record<string, CreatureConfig> = {
  glob: {
    name: "Glob",
    personality: "Curious and watchful",
    bodyColor: "rgba(127, 216, 127, 0.6)",
    bodyHighlight: "rgba(200, 255, 200, 0.4)",
    bodyBorder: "rgba(255, 255, 255, 0.3)",
    innerGlow: "rgba(180, 255, 180, 0.5)",
    eyeCount: 1,
    eyeSize: "giant",
    bodyShape: "round",
    limbStyle: "thin",
  },
  fluff: {
    name: "Fluff",
    personality: "Playful and cuddly",
    bodyColor: "rgba(107, 163, 214, 0.6)",
    bodyHighlight: "rgba(180, 220, 255, 0.4)",
    bodyBorder: "rgba(255, 255, 255, 0.3)",
    innerGlow: "rgba(150, 200, 255, 0.5)",
    eyeCount: 2,
    eyeSize: "normal",
    bodyShape: "fuzzy",
    hasHorns: true,
    hornColor: "rgba(74, 55, 40, 0.7)",
    hasSpots: true,
    spotColor: "rgba(155, 107, 155, 0.5)",
    limbStyle: "thick",
  },
  puff: {
    name: "Puff",
    personality: "Sweet and supportive",
    bodyColor: "rgba(255, 200, 220, 0.6)",
    bodyHighlight: "rgba(255, 230, 240, 0.5)",
    bodyBorder: "rgba(255, 255, 255, 0.4)",
    innerGlow: "rgba(255, 220, 235, 0.5)",
    eyeCount: 2,
    eyeSize: "sparkle",
    bodyShape: "puffball",
    hasBlush: true,
    limbStyle: "stubby",
  },
  jello: {
    name: "Jello",
    personality: "Calm and thoughtful",
    bodyColor: "rgba(180, 120, 255, 0.45)",
    bodyHighlight: "rgba(220, 180, 255, 0.5)",
    bodyBorder: "rgba(255, 255, 255, 0.35)",
    innerGlow: "rgba(200, 150, 255, 0.6)",
    eyeCount: 2,
    eyeSize: "droopy",
    bodyShape: "jellyfish",
    hasTendrils: true,
    tendrilColor: "rgba(180, 120, 255, 0.35)",
    limbStyle: "none",
  },
  bloop: {
    name: "Bloop",
    personality: "Wise and gentle",
    bodyColor: "rgba(100, 180, 255, 0.5)",
    bodyHighlight: "rgba(150, 210, 255, 0.45)",
    bodyBorder: "rgba(255, 255, 255, 0.35)",
    innerGlow: "rgba(130, 200, 255, 0.5)",
    eyeCount: 1,
    eyeSize: "wide",
    bodyShape: "droplet",
    hasRipples: true,
    limbStyle: "none",
  },
  wisp: {
    name: "Wisp",
    personality: "Mysterious and dreamy",
    bodyColor: "rgba(200, 220, 255, 0.35)",
    bodyHighlight: "rgba(230, 240, 255, 0.4)",
    bodyBorder: "rgba(255, 255, 255, 0.25)",
    innerGlow: "rgba(220, 235, 255, 0.6)",
    eyeCount: 2,
    eyeSize: "glowing",
    bodyShape: "ghost",
    hasTrail: true,
    trailColor: "rgba(200, 220, 255, 0.2)",
    limbStyle: "none",
  },
};

export type CreatureId = keyof typeof CREATURES;

// ============================================
// MOODS
// ============================================
const MOODS = {
  idle: { eyeScale: 1, mouthShape: "neutral", squash: { x: 1, y: 1 }, bounce: 1 },
  happy: { eyeScale: 1.1, mouthShape: "smile", squash: { x: 1.05, y: 0.95 }, bounce: 1.3 },
  curious: { eyeScale: 1.3, mouthShape: "o", squash: { x: 0.95, y: 1.08 }, bounce: 0.7 },
  thinking: { eyeScale: 0.85, mouthShape: "hmm", squash: { x: 1, y: 1 }, bounce: 0.5 },
  excited: { eyeScale: 1.4, mouthShape: "open", squash: { x: 0.9, y: 1.12 }, bounce: 2 },
  talking: { eyeScale: 1.05, mouthShape: "talking", squash: { x: 1, y: 1 }, bounce: 1 },
};

export type MoodType = keyof typeof MOODS;

// ============================================
// SVG FILTERS
// ============================================
const GlassFilters = () => (
  <defs>
    <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(0,0,0,0.15)" />
    </filter>
    <filter id="ambient-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
      <feComposite in="blur" in2="SourceGraphic" operator="over" />
    </filter>
    <linearGradient id="glass-shine-vertical" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
      <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
  </defs>
);

// ============================================
// SPEECH BUBBLE
// ============================================
const SpeechBubble = ({ message, visible }: { message: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && message && (
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <path
          d="M 10,-45 Q 5,-45 5,-35 L 5,-10 Q 5,0 15,0 L 40,0 L 50,12 L 52,0 L 95,0 Q 105,0 105,-10 L 105,-35 Q 105,-45 95,-45 Z"
          fill="rgba(255,255,255,0.9)"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
        />
        <text
          x="55"
          y="-22"
          textAnchor="middle"
          fontSize="8"
          fontFamily="system-ui, sans-serif"
          fill="rgba(0,0,0,0.7)"
          fontWeight="500"
        >
          {message.length > 24 ? message.substring(0, 24) + "..." : message}
        </text>
      </motion.g>
    )}
  </AnimatePresence>
);

// ============================================
// MAIN CREATURE COMPONENT
// ============================================
interface CreatureCharacterProps {
  creatureId: CreatureId;
  mood?: MoodType;
  size?: number;
  message?: string;
  showMessage?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CreatureCharacter({
  creatureId,
  mood = "idle",
  size = 120,
  message = "",
  showMessage = false,
  onClick,
  className = "",
}: CreatureCharacterProps) {
  const config = CREATURES[creatureId];
  const moodConfig = MOODS[mood];
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (frame % 2 === 0) setTime((t) => t + 0.08);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const borderWidth = 1.5;
  const bounce = Math.sin(time * moodConfig.bounce) * 3;
  const wobble1 = Math.sin(time * 2) * 4;
  const wobble2 = Math.cos(time * 1.5) * 3;
  const talkOffset = mood === "talking" ? Math.sin(time * 15) * 4 : 0;

  const getPupilOffset = () => {
    if (!containerRef?.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const dx = mousePosition.x - (rect.x + rect.width / 2);
    const dy = mousePosition.y - (rect.y + rect.height * 0.4);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = config.eyeSize === "giant" || config.eyeSize === "wide" ? 8 : 4;
    return dist === 0 ? { x: 0, y: 0 } : { x: (dx / dist) * Math.min(dist / 50, max), y: (dy / dist) * Math.min(dist / 50, max) };
  };

  const pupilOffset = getPupilOffset();

  const getBodyPath = () => {
    switch (config.bodyShape) {
      case "round":
        return `M 50,${15 + wobble1} C 85,${20 + wobble2} 90,60 85,80 C 80,95 65,100 50,100 C 35,100 20,95 15,80 C 10,60 15,${20 - wobble2} 50,${15 + wobble1} Z`;
      case "fuzzy":
        return `M 50,${10 + wobble1} C 20,15 10,40 15,70 C 18,90 35,100 50,100 C 65,100 82,90 85,70 C 90,40 80,15 50,${10 + wobble1} Z`;
      case "puffball":
        return `M 50,${18 + wobble1 * 0.5} C ${85 + wobble2},${25} 92,55 ${88 - wobble1},78 C 82,95 65,100 50,100 C 35,100 18,95 ${12 + wobble1},78 C ${8 - wobble2},55 15,25 50,${18 + wobble1 * 0.5} Z`;
      case "jellyfish":
        return `M 50,${15 + wobble1} C 80,${18 + wobble2} 88,40 85,55 C 82,65 75,70 50,70 C 25,70 18,65 15,55 C 12,40 20,${18 - wobble2} 50,${15 + wobble1} Z`;
      case "droplet":
        return `M 50,${8 + wobble1} C 52,8 58,15 70,40 C 85,70 80,95 50,100 C 20,95 15,70 30,40 C 42,15 48,8 50,${8 + wobble1} Z`;
      case "ghost":
        return `M 50,${15 + wobble1} C 80,20 90,45 88,70 Q 85,85 75,${95 + wobble2} Q 65,85 55,${95 - wobble1} Q 50,88 45,${95 + wobble1} Q 35,85 25,${95 - wobble2} Q 15,85 12,70 C 10,45 20,20 50,${15 + wobble1} Z`;
      default:
        return `M 50,${15 + wobble1} C 85,${20 + wobble2} 90,60 85,80 C 80,95 65,100 50,100 C 35,100 20,95 15,80 C 10,60 15,${20 - wobble2} 50,${15 + wobble1} Z`;
    }
  };

  const baseY = config.bodyShape === "jellyfish" ? 40 : config.bodyShape === "droplet" ? 45 : config.bodyShape === "ghost" ? 40 : 45;
  const mouthY = config.bodyShape === "jellyfish" ? 58 : config.bodyShape === "ghost" ? 60 : 75;

  const renderEyes = () => {
    // Giant single eye
    if (config.eyeCount === 1 && config.eyeSize === "giant") {
      return (
        <motion.g animate={{ scaleY: moodConfig.eyeScale }} style={{ originX: "50px", originY: `${baseY}px` }}>
          <ellipse cx="50" cy={baseY} rx="24" ry="26" fill="rgba(255,255,255,0.95)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
          <ellipse cx="50" cy={baseY - 8} rx="16" ry="8" fill="rgba(255,255,255,0.4)" />
          <motion.circle r="14" fill={config.bodyColor} animate={{ cx: 50 + pupilOffset.x, cy: baseY + pupilOffset.y }} />
          <motion.circle r="7" fill="rgba(0,0,0,0.85)" animate={{ cx: 50 + pupilOffset.x, cy: baseY + pupilOffset.y }} />
          <circle cx="58" cy={baseY - 10} r="5" fill="rgba(255,255,255,0.9)" />
        </motion.g>
      );
    }

    // Wide single eye
    if (config.eyeCount === 1 && config.eyeSize === "wide") {
      return (
        <motion.g animate={{ scaleY: moodConfig.eyeScale }} style={{ originX: "50px", originY: `${baseY}px` }}>
          <ellipse cx="50" cy={baseY} rx="28" ry="16" fill="rgba(255,255,255,0.95)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
          <motion.ellipse rx="12" ry="10" fill={config.bodyColor} animate={{ cx: 50 + pupilOffset.x, cy: baseY + pupilOffset.y }} />
          <motion.ellipse rx="5" ry="6" fill="rgba(0,0,0,0.85)" animate={{ cx: 50 + pupilOffset.x, cy: baseY + pupilOffset.y }} />
          <circle cx="60" cy={baseY - 5} r="4" fill="rgba(255,255,255,0.9)" />
        </motion.g>
      );
    }

    // Sparkle eyes
    if (config.eyeCount === 2 && config.eyeSize === "sparkle") {
      return (
        <motion.g animate={{ scaleY: moodConfig.eyeScale }}>
          {[38, 62].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy={baseY} r="10" fill="rgba(255,255,255,0.95)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
              <motion.circle r="6" fill="rgba(60,40,80,0.9)" animate={{ cx: cx + pupilOffset.x, cy: baseY + pupilOffset.y }} />
              <circle cx={cx + 2} cy={baseY - 3} r="2.5" fill="rgba(255,255,255,1)" />
              <circle cx={cx - 2} cy={baseY + 2} r="1.5" fill="rgba(255,255,255,0.8)" />
            </g>
          ))}
        </motion.g>
      );
    }

    // Droopy eyes
    if (config.eyeCount === 2 && config.eyeSize === "droopy") {
      return (
        <motion.g animate={{ scaleY: moodConfig.eyeScale }}>
          {[35, 65].map((cx, i) => {
            const droop = Math.sin(time * 1.5 + i) * 2;
            return (
              <g key={i}>
                <ellipse cx={cx} cy={baseY + droop} rx="10" ry="14" fill="rgba(255,255,255,0.9)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
                <motion.circle r="5" fill={config.bodyColor} animate={{ cx: cx + pupilOffset.x, cy: baseY + droop + pupilOffset.y }} />
                <motion.circle r="2.5" fill="rgba(0,0,0,0.85)" animate={{ cx: cx + pupilOffset.x, cy: baseY + droop + pupilOffset.y }} />
                <circle cx={cx + 2} cy={baseY - 4 + droop} r="2" fill="rgba(255,255,255,0.9)" />
              </g>
            );
          })}
        </motion.g>
      );
    }

    // Glowing eyes
    if (config.eyeCount === 2 && config.eyeSize === "glowing") {
      return (
        <motion.g animate={{ scaleY: moodConfig.eyeScale }}>
          {[38, 62].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy={baseY} r="14" fill="rgba(200,220,255,0.3)" filter="url(#ambient-glow)" />
              <circle cx={cx} cy={baseY} r="9" fill="rgba(220,235,255,0.9)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
              <motion.circle r="5" fill="rgba(100,150,255,0.8)" animate={{ cx: cx + pupilOffset.x, cy: baseY + pupilOffset.y }} />
              <motion.circle r="2" fill="rgba(255,255,255,0.95)" animate={{ cx: cx + pupilOffset.x, cy: baseY + pupilOffset.y }} />
            </g>
          ))}
        </motion.g>
      );
    }

    // Default 2 normal eyes
    return (
      <motion.g animate={{ scaleY: moodConfig.eyeScale }}>
        {[38, 62].map((cx, i) => (
          <g key={i}>
            <ellipse cx={cx} cy={baseY} rx="11" ry="13" fill="rgba(255,255,255,0.95)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
            <motion.circle r="6" fill={config.bodyColor} style={{ opacity: 0.9 }} animate={{ cx: cx + pupilOffset.x, cy: baseY + pupilOffset.y }} />
            <motion.circle r="3" fill="rgba(0,0,0,0.85)" animate={{ cx: cx + pupilOffset.x, cy: baseY + pupilOffset.y }} />
            <circle cx={cx + 2} cy={baseY - 4} r="2.5" fill="rgba(255,255,255,0.9)" />
          </g>
        ))}
      </motion.g>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-pointer ${className}`}
      style={{ width: size, height: size * 1.1 }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.svg
        width={size}
        height={size * 1.1}
        viewBox="-10 -50 120 160"
        overflow="visible"
      >
        <GlassFilters />
        <SpeechBubble message={message} visible={showMessage} />
        
        <motion.g
          animate={{ scaleX: moodConfig.squash.x, scaleY: moodConfig.squash.y, y: bounce }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          filter="url(#soft-shadow)"
        >
          {/* Ambient glow */}
          <ellipse cx="50" cy="60" rx="40" ry="45" fill={config.innerGlow} filter="url(#ambient-glow)" opacity="0.5" />
          
          {/* Shadow */}
          <ellipse cx="50" cy="98" rx="28" ry="5" fill="rgba(0,0,0,0.1)" />

          {/* Horns */}
          {config.hasHorns && (
            <g>
              <path d={`M 30,25 Q 20,10 25,${0 + wobble1}`} fill={config.hornColor} stroke={config.bodyBorder} strokeWidth={borderWidth} strokeLinecap="round" />
              <path d={`M 70,25 Q 80,10 75,${0 - wobble1}`} fill={config.hornColor} stroke={config.bodyBorder} strokeWidth={borderWidth} strokeLinecap="round" />
            </g>
          )}

          {/* Tendrils */}
          {config.hasTendrils && (
            <g>
              {[-20, -10, 0, 10, 20].map((offset, i) => (
                <path
                  key={i}
                  d={`M ${50 + offset},70 Q ${50 + offset + Math.sin(time * 2 + i) * 8},85 ${50 + offset + Math.cos(time * 1.5 + i) * 6},${100 + i * 5}`}
                  fill="none"
                  stroke={config.tendrilColor}
                  strokeWidth={4 - i * 0.5}
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}

          {/* Ghost trail */}
          {config.hasTrail && (
            <g>
              {[0, 1, 2].map((i) => (
                <path key={i} d={getBodyPath()} fill={config.trailColor} transform={`translate(0, ${-10 - i * 8}) scale(${1 - i * 0.1})`} opacity={0.3 - i * 0.1} />
              ))}
            </g>
          )}

          {/* Limbs */}
          {config.limbStyle === "thin" && (
            <g>
              <path d={`M 25,85 Q 15,90 10,${100 + bounce}`} fill="none" stroke={config.bodyColor} strokeWidth="7" strokeLinecap="round" />
              <path d={`M 75,85 Q 85,90 90,${100 + bounce}`} fill="none" stroke={config.bodyColor} strokeWidth="7" strokeLinecap="round" />
            </g>
          )}
          {config.limbStyle === "thick" && (
            <g>
              <ellipse cx="18" cy="85" rx="14" ry="20" fill={config.bodyColor} stroke={config.bodyBorder} strokeWidth={borderWidth} />
              <ellipse cx="82" cy="85" rx="14" ry="20" fill={config.bodyColor} stroke={config.bodyBorder} strokeWidth={borderWidth} />
            </g>
          )}
          {config.limbStyle === "stubby" && (
            <g>
              <ellipse cx="28" cy="92" rx="8" ry="10" fill={config.bodyColor} stroke={config.bodyBorder} strokeWidth={borderWidth} />
              <ellipse cx="72" cy="92" rx="8" ry="10" fill={config.bodyColor} stroke={config.bodyBorder} strokeWidth={borderWidth} />
            </g>
          )}

          {/* Body */}
          <path d={getBodyPath()} fill={config.bodyColor} stroke={config.bodyBorder} strokeWidth={borderWidth} />
          
          {/* Body highlight */}
          <ellipse cx="35" cy="35" rx="15" ry="12" fill={config.bodyHighlight} />
          <ellipse cx="50" cy="60" rx="25" ry="30" fill="url(#glass-shine-vertical)" opacity="0.3" />

          {/* Spots */}
          {config.hasSpots && (
            <g>
              {[[60, 55], [70, 70], [35, 75]].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx={6 + i} ry={5 + i * 0.5} fill={config.spotColor} />
              ))}
            </g>
          )}

          {/* Blush */}
          {config.hasBlush && (
            <g>
              <ellipse cx="28" cy="55" rx="8" ry="5" fill="rgba(255,150,180,0.4)" />
              <ellipse cx="72" cy="55" rx="8" ry="5" fill="rgba(255,150,180,0.4)" />
            </g>
          )}

          {/* Ripples */}
          {config.hasRipples && (
            <g>
              {[0, 1, 2].map((i) => (
                <ellipse key={i} cx="50" cy={95 - i * 3} rx={20 - i * 5} ry={3 - i * 0.5} fill="none" stroke={config.bodyHighlight} strokeWidth="1" opacity={0.5 - i * 0.15} />
              ))}
            </g>
          )}

          {/* Eyes */}
          {renderEyes()}

          {/* Mouth */}
          <g>
            {moodConfig.mouthShape === "neutral" && <path d={`M 43,${mouthY} Q 50,${mouthY + 2} 57,${mouthY}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" />}
            {moodConfig.mouthShape === "smile" && <path d={`M 41,${mouthY - 2} Q 50,${mouthY + 8} 59,${mouthY - 2}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" />}
            {moodConfig.mouthShape === "hmm" && <path d={`M 44,${mouthY} Q 50,${mouthY - 2} 56,${mouthY + 2}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" />}
            {moodConfig.mouthShape === "o" && <ellipse cx="50" cy={mouthY} rx="6" ry="7" fill="rgba(40,20,30,0.6)" stroke={config.bodyBorder} strokeWidth={borderWidth} />}
            {moodConfig.mouthShape === "open" && (
              <g>
                <ellipse cx="50" cy={mouthY} rx="12" ry="10" fill="rgba(40,20,30,0.6)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
                <ellipse cx="50" cy={mouthY - 4} rx="8" ry="2.5" fill="rgba(255,255,255,0.9)" />
              </g>
            )}
            {moodConfig.mouthShape === "talking" && (
              <g>
                <ellipse cx="50" cy={mouthY} rx="10" ry={6 + talkOffset * 0.5} fill="rgba(40,20,30,0.6)" stroke={config.bodyBorder} strokeWidth={borderWidth} />
                <ellipse cx="50" cy={mouthY - 3} rx="6" ry="2" fill="rgba(255,255,255,0.9)" />
              </g>
            )}
          </g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}

// ============================================
// CREATURE SELECTOR GRID
// ============================================
interface CreatureSelectorProps {
  selectedId: CreatureId | null;
  onSelect: (id: CreatureId) => void;
}

export function CreatureSelector({ selectedId, onSelect }: CreatureSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {(Object.keys(CREATURES) as CreatureId[]).map((id) => {
        const creature = CREATURES[id];
        const isSelected = selectedId === id;
        
        return (
          <motion.button
            key={id}
            onClick={() => onSelect(id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
              isSelected
                ? "ring-2 ring-white/50"
                : ""
            }`}
            style={{
              background: isSelected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <CreatureCharacter creatureId={id} size={60} mood={isSelected ? "happy" : "idle"} />
            <span className="text-white text-sm font-medium">{creature.name}</span>
            <span className="text-white/50 text-xs">{creature.personality}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
