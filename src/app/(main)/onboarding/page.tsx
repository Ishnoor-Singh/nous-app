"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Heart, Sparkles, BookOpen, 
  ArrowRight, Check, Star
} from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    component: WelcomeStep,
  },
  {
    id: "name",
    component: NameStep,
  },
  {
    id: "interests",
    component: InterestsStep,
  },
  {
    id: "style",
    component: StyleStep,
  },
  {
    id: "ready",
    component: ReadyStep,
  },
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

  // If user already completed onboarding, redirect
  useEffect(() => {
    if (userData?.learningProgress?.preferredStyle) {
      router.push("/home");
    }
  }, [userData, router]);

  const updateData = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <main className="min-h-dvh flex flex-col p-6 safe-top safe-bottom">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((_, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{
              width: index === currentStep ? 24 : 8,
              backgroundColor: index <= currentStep ? "var(--color-accent)" : "var(--color-secondary)",
            }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
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
    </main>
  );
}

function WelcomeStep({ onNext }: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-accent/25"
      >
        <Brain className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold mb-4"
      >
        Hello, I'm Nous
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 text-muted-foreground max-w-xs"
      >
        <p>I'm not a chatbot, and I won't pretend to be human.</p>
        <p>I'm something different — a companion that learns with you, remembers what matters, and grows over time.</p>
        <p>Let me get to know you.</p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="mt-12 px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-semibold flex items-center gap-2 hover:bg-accent/90 transition-colors"
      >
        Let's begin
        <ArrowRight className="w-5 h-5" />
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
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-8"
        >
          <Heart className="w-8 h-8 text-white" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">What should I call you?</h2>
        <p className="text-muted-foreground mb-8">I'll remember this.</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full max-w-xs p-4 text-xl text-center bg-muted rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent"
          autoFocus
        />
      </div>

      <button
        onClick={handleContinue}
        disabled={!name.trim()}
        className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function InterestsStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState<string[]>(data.interests || []);

  const topics = [
    { id: "philosophy", label: "Philosophy", icon: "🤔", desc: "Meaning, ethics, existence" },
    { id: "history", label: "History", icon: "📜", desc: "Patterns across time" },
    { id: "economics", label: "Economics", icon: "📈", desc: "Incentives & systems" },
    { id: "art", label: "Art", icon: "🎨", desc: "Beauty & expression" },
    { id: "psychology", label: "Psychology", icon: "🧠", desc: "Mind & behavior" },
  ];

  const toggle = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData("interests", selected);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">What fascinates you?</h2>
          <p className="text-muted-foreground">Pick what you're curious about. You can explore everything.</p>
        </div>

        <div className="space-y-3">
          {topics.map((topic, index) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggle(topic.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                selected.includes(topic.id)
                  ? "bg-accent/10 ring-2 ring-accent"
                  : "bg-muted hover:bg-secondary"
              }`}
            >
              <span className="text-2xl">{topic.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold">{topic.label}</p>
                <p className="text-sm text-muted-foreground">{topic.desc}</p>
              </div>
              {selected.includes(topic.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={selected.length === 0}
        className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function StyleStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState(data.learningStyle || "");

  const styles = [
    { id: "socratic", label: "Question Me", icon: "❓", desc: "Learn through questions that make you think" },
    { id: "narrative", label: "Tell Stories", icon: "📖", desc: "Learn through engaging narratives" },
    { id: "analytical", label: "Show Logic", icon: "🔬", desc: "Learn through systematic analysis" },
    { id: "visual", label: "Give Examples", icon: "💡", desc: "Learn through concrete examples" },
  ];

  const handleContinue = () => {
    updateData("learningStyle", selected);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">How do you learn best?</h2>
          <p className="text-muted-foreground">I'll adapt to your style.</p>
        </div>

        <div className="space-y-3">
          {styles.map((style, index) => (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelected(style.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                selected === style.id
                  ? "bg-accent/10 ring-2 ring-accent"
                  : "bg-muted hover:bg-secondary"
              }`}
            >
              <span className="text-2xl">{style.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold">{style.label}</p>
                <p className="text-sm text-muted-foreground">{style.desc}</p>
              </div>
              {selected === style.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
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
    const timer = setTimeout(() => setIsReady(true), 1500);
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
      // Still redirect on error to not block user
      router.push("/home");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-accent/25"
      >
        <Star className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold mb-4"
      >
        Nice to meet you, {data.preferredName}
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 text-muted-foreground max-w-xs mb-8"
      >
        <p>I'm excited to explore {data.interests?.join(", ")} with you.</p>
        <p>I'll remember your preferences and grow with every conversation.</p>
        <p className="text-foreground font-medium">Let's start learning.</p>
      </motion.div>

      <AnimatePresence>
        {isReady && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleStart}
            className="px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-semibold flex items-center gap-2 hover:bg-accent/90 transition-colors animate-pulse-glow"
          >
            {isSaving ? "Setting up..." : "Begin your journey"}
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
