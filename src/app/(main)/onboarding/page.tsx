"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PencilFilter,
  TapeStrip,
  StickyNote,
  Doodle,
  PencilCheckbox,
  WashiTape,
  PaperClip,
} from "@/components/paper/PaperElements";

const STEPS = [
  { id: "welcome", component: WelcomeStep },
  { id: "name", component: NameStep },
  { id: "interests", component: InterestsStep },
  { id: "style", component: StyleStep },
  { id: "ready", component: ReadyStep },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    preferredName: "",
    interests: [] as string[],
    learningStyle: "",
  });

  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });

  useEffect(() => {
    if (userData?.learningProgress?.preferredStyle) {
      router.push("/home");
    }
  }, [userData, router]);

  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#d4c4a8",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PencilFilter />
      
      {/* Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;600&family=Permanent+Marker&family=Indie+Flower&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: 420, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Progress - torn paper tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {STEPS.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentStep ? 32 : 12,
                height: 12,
                background: index <= currentStep ? "#2d5016" : "#e8dcd0",
                borderRadius: 2,
                transform: `rotate(${(index - 2) * 2}deg)`,
                transition: "all 0.3s",
                boxShadow: index <= currentStep ? "1px 1px 2px rgba(0,0,0,0.2)" : "none",
              }}
            />
          ))}
        </div>

        {/* Main paper */}
        <div
          style={{
            flex: 1,
            background: "#fefcf6",
            backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e8dcd0 28px)",
            backgroundSize: "100% 28px",
            padding: "32px 24px",
            paddingLeft: 48,
            position: "relative",
            boxShadow: "4px 5px 15px rgba(0,0,0,0.2)",
            borderLeft: "3px solid #e8b4b4",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Red margin line */}
          <div
            style={{
              position: "absolute",
              left: 38,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#ffcccb",
            }}
          />

          <TapeStrip style={{ top: -8, left: 30 }} rotation={-3} color="cream" />
          <TapeStrip style={{ top: -6, right: 40 }} rotation={4} color="blue" />
          <PaperClip style={{ top: -20, right: 60 }} rotation={12} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <CurrentStepComponent
                data={data}
                updateData={updateData}
                onNext={nextStep}
                user={user}
                userData={userData}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: any) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", position: "relative" }}>
      {/* Hand-drawn notebook sketch */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ delay: 0.2 }}
        style={{
          width: 100,
          height: 100,
          margin: "0 auto 32px",
          position: "relative",
        }}
      >
        {/* Notebook */}
        <div style={{
          width: 80,
          height: 100,
          background: "#f5f0e6",
          border: "3px solid #4a4a4a",
          borderRadius: 4,
          position: "absolute",
          left: 10,
          boxShadow: "3px 3px 0 #4a4a4a",
        }}>
          {/* Spiral binding */}
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              position: "absolute",
              left: -8,
              top: 12 + i * 18,
              width: 12,
              height: 12,
              border: "2px solid #666",
              borderRadius: "50%",
              background: "#d4c4a8",
            }} />
          ))}
          {/* Lines */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              position: "absolute",
              left: 15,
              right: 8,
              top: 20 + i * 12,
              height: 1,
              background: "#ccc",
            }} />
          ))}
        </div>
        {/* Pencil */}
        <div style={{
          position: "absolute",
          right: -5,
          bottom: 5,
          width: 8,
          height: 60,
          background: "linear-gradient(90deg, #ffd93d 0%, #f4c430 50%, #daa520 100%)",
          transform: "rotate(30deg)",
          borderRadius: "0 0 2px 2px",
        }}>
          <div style={{
            position: "absolute",
            bottom: -12,
            left: 0,
            width: 0,
            height: 0,
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: "14px solid #f5deb3",
          }} />
          <div style={{
            position: "absolute",
            bottom: -8,
            left: 2,
            width: 4,
            height: 4,
            background: "#2c2c2c",
            borderRadius: "0 0 2px 2px",
          }} />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: "'Permanent Marker', cursive",
          fontSize: 32,
          color: "#2c2c2c",
          margin: "0 0 24px 0",
          transform: "rotate(-1deg)",
        }}
      >
        Hello, I'm Nous
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 20,
          color: "#555",
          lineHeight: 1.6,
          maxWidth: 280,
          margin: "0 auto",
        }}
      >
        <p style={{ marginBottom: 16 }}>I'm not a chatbot, and I won't pretend to be human.</p>
        <p style={{ marginBottom: 16 }}>I'm something different — a companion that learns with you, remembers what matters, and grows over time.</p>
        <p style={{ fontStyle: "italic" }}>Let me get to know you.</p>
      </motion.div>

      <Doodle type="star" style={{ bottom: 80, right: 10 }} />
      <Doodle type="arrow" style={{ bottom: 20, left: -20 }} />

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        style={{
          marginTop: 40,
          padding: "14px 32px",
          background: "#fff9c4",
          border: "2px solid #4a4a4a",
          borderRadius: 4,
          fontFamily: "'Architects Daughter', cursive",
          fontSize: 18,
          color: "#2c2c2c",
          cursor: "pointer",
          transform: "rotate(1deg)",
          boxShadow: "3px 3px 0 #4a4a4a",
          transition: "transform 0.2s, box-shadow 0.2s",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          alignSelf: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "rotate(0deg) translateY(-2px)";
          e.currentTarget.style.boxShadow = "4px 4px 0 #4a4a4a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "rotate(1deg)";
          e.currentTarget.style.boxShadow = "3px 3px 0 #4a4a4a";
        }}
      >
        Let's begin →
      </motion.button>
    </div>
  );
}

function NameStep({ data, updateData, onNext, user }: any) {
  const [name, setName] = useState(data.preferredName || user?.firstName || "");

  const handleContinue = () => {
    updateData("preferredName", name);
    onNext();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
        {/* Heart doodle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          <svg width="60" height="55" viewBox="0 0 60 55" style={{ margin: "0 auto" }}>
            <path
              d="M30 50 C15 35 5 25 5 15 C5 8 10 3 18 3 C24 3 28 7 30 12 C32 7 36 3 42 3 C50 3 55 8 55 15 C55 25 45 35 30 50Z"
              fill="none"
              stroke="#e74c3c"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        <h2
          style={{
            fontFamily: "'Permanent Marker', cursive",
            fontSize: 24,
            color: "#2c2c2c",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          What should I call you?
        </h2>
        <p
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 18,
            color: "#666",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          I'll remember this ✨
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          autoFocus
          style={{
            width: "100%",
            maxWidth: 280,
            margin: "0 auto",
            padding: "16px 20px",
            background: "transparent",
            border: "none",
            borderBottom: "3px solid #4a4a4a",
            fontFamily: "'Architects Daughter', cursive",
            fontSize: 24,
            textAlign: "center",
            color: "#2c2c2c",
            outline: "none",
          }}
        />

        <div style={{ position: "absolute", top: 20, right: 0 }}>
          <StickyNote color="yellow" rotation={6} style={{ padding: "8px 10px", fontSize: 14 }}>
            nice to meet you!
          </StickyNote>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!name.trim()}
        style={{
          padding: "14px 32px",
          background: name.trim() ? "#c8e6c9" : "#e8e5e0",
          border: "2px solid #4a4a4a",
          borderRadius: 4,
          fontFamily: "'Architects Daughter', cursive",
          fontSize: 18,
          color: name.trim() ? "#2c2c2c" : "#999",
          cursor: name.trim() ? "pointer" : "not-allowed",
          boxShadow: "3px 3px 0 #4a4a4a",
          opacity: name.trim() ? 1 : 0.7,
        }}
      >
        Continue →
      </button>
    </div>
  );
}

function InterestsStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState<string[]>(data.interests || []);

  const topics = [
    { id: "philosophy", label: "Philosophy", icon: "🤔", color: "#e8d4f8" },
    { id: "history", label: "History", icon: "📜", color: "#fff3cd" },
    { id: "economics", label: "Economics", icon: "📈", color: "#c8e6c9" },
    { id: "art", label: "Art", icon: "🎨", color: "#ffcccb" },
    { id: "psychology", label: "Psychology", icon: "🧠", color: "#bbdefb" },
  ];

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData("interests", selected);
    onNext();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <Doodle type="star" style={{ position: "relative", display: "inline-block", marginBottom: 8 }} />
        <h2
          style={{
            fontFamily: "'Permanent Marker', cursive",
            fontSize: 22,
            color: "#2c2c2c",
            marginBottom: 8,
          }}
        >
          What fascinates you?
        </h2>
        <p
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 16,
            color: "#666",
          }}
        >
          Pick what you're curious about
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {topics.map((topic, index) => {
          const isSelected = selected.includes(topic.id);
          const rotation = (index - 2) * 1.5;

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => toggle(topic.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                marginBottom: 8,
                background: isSelected ? topic.color : "transparent",
                borderRadius: 4,
                cursor: "pointer",
                transform: `rotate(${rotation}deg)`,
                transition: "background 0.2s",
                border: isSelected ? "2px solid #4a4a4a" : "2px solid transparent",
              }}
            >
              <PencilCheckbox checked={isSelected} onChange={() => toggle(topic.id)} />
              <span style={{ fontSize: 24 }}>{topic.icon}</span>
              <span
                style={{
                  fontFamily: "'Architects Daughter', cursive",
                  fontSize: 18,
                  color: "#2c2c2c",
                }}
              >
                {topic.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={selected.length === 0}
        style={{
          padding: "14px 32px",
          background: selected.length > 0 ? "#c8e6c9" : "#e8e5e0",
          border: "2px solid #4a4a4a",
          borderRadius: 4,
          fontFamily: "'Architects Daughter', cursive",
          fontSize: 18,
          color: selected.length > 0 ? "#2c2c2c" : "#999",
          cursor: selected.length > 0 ? "pointer" : "not-allowed",
          boxShadow: "3px 3px 0 #4a4a4a",
          opacity: selected.length > 0 ? 1 : 0.7,
        }}
      >
        Continue →
      </button>
    </div>
  );
}

function StyleStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState(data.learningStyle || "");

  const styles = [
    { id: "socratic", label: "Question Me", icon: "❓", desc: "make me think" },
    { id: "narrative", label: "Tell Stories", icon: "📖", desc: "engaging narratives" },
    { id: "analytical", label: "Show Logic", icon: "🔬", desc: "systematic analysis" },
    { id: "visual", label: "Give Examples", icon: "💡", desc: "concrete examples" },
  ];

  const handleContinue = () => {
    updateData("learningStyle", selected);
    onNext();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 24, textAlign: "center", position: "relative" }}>
        {/* Book doodle */}
        <svg width="50" height="40" viewBox="0 0 50 40" style={{ margin: "0 auto 12px" }}>
          <path
            d="M5 35 L5 5 Q25 0 25 8 L25 38 Q25 30 5 35 M45 35 L45 5 Q25 0 25 8 L25 38 Q25 30 45 35"
            fill="none"
            stroke="#2d5016"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <h2
          style={{
            fontFamily: "'Permanent Marker', cursive",
            fontSize: 22,
            color: "#2c2c2c",
            marginBottom: 8,
          }}
        >
          How do you learn best?
        </h2>
        <p
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 16,
            color: "#666",
          }}
        >
          I'll adapt to your style
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {styles.map((style, index) => {
          const isSelected = selected === style.id;
          const colors = ["#fff9c4", "#ffcccb", "#bbdefb", "#c8e6c9"];
          const rotation = (index - 1.5) * 2;

          return (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => setSelected(style.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                marginBottom: 10,
                background: isSelected ? colors[index] : "transparent",
                borderRadius: 4,
                cursor: "pointer",
                transform: `rotate(${rotation}deg)`,
                transition: "background 0.2s",
                border: isSelected ? "2px solid #4a4a4a" : "2px solid transparent",
                boxShadow: isSelected ? "2px 2px 0 rgba(0,0,0,0.1)" : "none",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "2px solid #4a4a4a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#2d5016",
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: 22 }}>{style.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: "'Architects Daughter', cursive",
                    fontSize: 17,
                    color: "#2c2c2c",
                  }}
                >
                  {style.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 14,
                    color: "#666",
                  }}
                >
                  {style.desc}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        style={{
          padding: "14px 32px",
          background: selected ? "#c8e6c9" : "#e8e5e0",
          border: "2px solid #4a4a4a",
          borderRadius: 4,
          fontFamily: "'Architects Daughter', cursive",
          fontSize: 18,
          color: selected ? "#2c2c2c" : "#999",
          cursor: selected ? "pointer" : "not-allowed",
          boxShadow: "3px 3px 0 #4a4a4a",
          opacity: selected ? 1 : 0.7,
        }}
      >
        Continue →
      </button>
    </div>
  );
}

function ReadyStep({ data, userData }: any) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = async () => {
    if (!userData?.user?._id || isSaving) return;

    setIsSaving(true);
    try {
      await completeOnboarding({
        userId: userData.user._id,
        preferredName: data.preferredName,
        interests: data.interests || [],
        learningStyle: data.learningStyle || "narrative",
      });
      router.push("/home");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      router.push("/home");
    }
  };

  const interestLabels: Record<string, string> = {
    philosophy: "philosophy",
    history: "history",
    economics: "economics",
    art: "art",
    psychology: "psychology",
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Celebratory doodles */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        style={{ marginBottom: 24 }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: "0 auto" }}>
          {/* Confetti bits */}
          <rect x="10" y="20" width="6" height="6" fill="#ffd93d" transform="rotate(15 13 23)" />
          <rect x="65" y="15" width="5" height="5" fill="#e74c3c" transform="rotate(-20 67 17)" />
          <rect x="20" y="60" width="4" height="4" fill="#3498db" transform="rotate(30 22 62)" />
          <rect x="55" y="55" width="5" height="5" fill="#2ecc71" transform="rotate(-15 57 57)" />
          {/* Star */}
          <path
            d="M40 10 L44 28 L62 28 L48 38 L52 56 L40 46 L28 56 L32 38 L18 28 L36 28 Z"
            fill="#ffd93d"
            stroke="#e6a82c"
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: "'Permanent Marker', cursive",
          fontSize: 28,
          color: "#2c2c2c",
          margin: "0 0 20px 0",
        }}
      >
        Nice to meet you, {data.preferredName}!
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 18,
          color: "#555",
          lineHeight: 1.6,
          maxWidth: 260,
          margin: "0 auto",
        }}
      >
        <p style={{ marginBottom: 12 }}>
          I'm excited to explore{" "}
          <span style={{ color: "#2d5016", fontWeight: 600 }}>
            {data.interests?.map((i: string) => interestLabels[i] || i).join(", ")}
          </span>{" "}
          with you.
        </p>
        <p style={{ marginBottom: 12 }}>
          I'll remember your preferences and grow with every conversation.
        </p>
        <p style={{ fontFamily: "'Architects Daughter', cursive", color: "#2c2c2c", fontSize: 20 }}>
          Let's start learning ✨
        </p>
      </motion.div>

      <Doodle type="heart" style={{ top: 40, right: 0 }} />
      <Doodle type="star" style={{ bottom: 100, left: -10 }} />

      {/* Sticky notes */}
      <div style={{ position: "absolute", top: 10, left: -30 }}>
        <StickyNote color="green" rotation={-8} style={{ padding: "6px 8px", fontSize: 12 }}>
          you got this!
        </StickyNote>
      </div>

      <AnimatePresence>
        {isReady && (
          <motion.button
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            onClick={handleStart}
            style={{
              marginTop: 32,
              padding: "16px 36px",
              background: "linear-gradient(135deg, #fff9c4 0%, #ffd93d 100%)",
              border: "3px solid #4a4a4a",
              borderRadius: 6,
              fontFamily: "'Permanent Marker', cursive",
              fontSize: 20,
              color: "#2c2c2c",
              cursor: "pointer",
              boxShadow: "4px 4px 0 #4a4a4a",
              alignSelf: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "5px 5px 0 #4a4a4a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "4px 4px 0 #4a4a4a";
            }}
          >
            {isSaving ? "Setting up..." : "Begin your journey ✏️"}
          </motion.button>
        )}
      </AnimatePresence>

      <WashiTape pattern="dots" color="pink" style={{ bottom: 20, right: -20 }} rotation={-5} width={50} />
    </div>
  );
}
