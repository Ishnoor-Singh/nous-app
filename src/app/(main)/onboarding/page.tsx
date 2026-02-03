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
              width: index === currentStep ? 28 : 10,
              background: index <= currentStep 
                ? "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)" 
                : "rgba(255, 255, 255, 0.1)",
              boxShadow: index <= currentStep 
                ? "0 0 10px rgba(99, 102, 241, 0.5)" 
                : "none",
            }}
            className="h-2.5 rounded-full"
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
        className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mb-8 glow-accent"
        style={{ boxShadow: "0 0 50px rgba(99, 102, 241, 0.4)" }}
      >
        <Brain className="w-14 h-14 text-white" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-white mb-4 text-glow"
      >
        Hello, I'm Nous
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 text-white/60 max-w-xs"
      >
        <p>I'm not a chatbot, and I won't pretend to be human.</p>
        <p>I'm something different — a companion that learns with you, remembers what matters, and grows over time.</p>
        <p className="text-white/80">Let me get to know you.</p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-12 px-8 py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center gap-2 glow-accent"
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
          className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-8"
          style={{ boxShadow: "0 0 40px rgba(236, 72, 153, 0.4)" }}
        >
          <Heart className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-2">What should I call you?</h2>
        <p className="text-white/50 mb-8">I'll remember this.</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full max-w-xs p-4 text-xl text-center glass-input rounded-2xl text-white"
          autoFocus
        />
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={!name.trim()}
        whileHover={{ scale: name.trim() ? 1.02 : 1 }}
        whileTap={{ scale: name.trim() ? 0.98 : 1 }}
        className="w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-accent"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

function InterestsStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState<string[]>(data.interests || []);

  const topics = [
    { id: "philosophy", label: "Philosophy", icon: "🤔", desc: "Meaning, ethics, existence", color: "from-purple-500/30 to-violet-500/30 border-purple-500/40" },
    { id: "history", label: "History", icon: "📜", desc: "Patterns across time", color: "from-amber-500/30 to-yellow-500/30 border-amber-500/40" },
    { id: "economics", label: "Economics", icon: "📈", desc: "Incentives & systems", color: "from-green-500/30 to-emerald-500/30 border-green-500/40" },
    { id: "art", label: "Art", icon: "🎨", desc: "Beauty & expression", color: "from-pink-500/30 to-rose-500/30 border-pink-500/40" },
    { id: "psychology", label: "Psychology", icon: "🧠", desc: "Mind & behavior", color: "from-blue-500/30 to-cyan-500/30 border-blue-500/40" },
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
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4"
            style={{ boxShadow: "0 0 40px rgba(245, 158, 11, 0.4)" }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">What fascinates you?</h2>
          <p className="text-white/50">Pick what you're curious about.</p>
        </div>

        <div className="space-y-3">
          {topics.map((topic, index) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggle(topic.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all glass-card bg-gradient-to-r ${
                selected.includes(topic.id)
                  ? topic.color + " glow-accent"
                  : "from-white/5 to-white/10 border-white/10"
              }`}
            >
              <span className="text-3xl">{topic.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{topic.label}</p>
                <p className="text-sm text-white/50">{topic.desc}</p>
              </div>
              {selected.includes(topic.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-7 h-7 rounded-full bg-gradient-to-r from-accent to-purple-600 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={selected.length === 0}
        whileHover={{ scale: selected.length > 0 ? 1.02 : 1 }}
        whileTap={{ scale: selected.length > 0 ? 0.98 : 1 }}
        className="w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-accent mt-4"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </motion.button>
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
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4"
            style={{ boxShadow: "0 0 40px rgba(34, 197, 94, 0.4)" }}
          >
            <BookOpen className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">How do you learn best?</h2>
          <p className="text-white/50">I'll adapt to your style.</p>
        </div>

        <div className="space-y-3">
          {styles.map((style, index) => (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelected(style.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all glass-card ${
                selected === style.id
                  ? "glass-accent glow-accent"
                  : ""
              }`}
            >
              <span className="text-3xl">{style.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{style.label}</p>
                <p className="text-sm text-white/50">{style.desc}</p>
              </div>
              {selected === style.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-7 h-7 rounded-full bg-gradient-to-r from-accent to-purple-600 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={!selected}
        whileHover={{ scale: selected ? 1.02 : 1 }}
        whileTap={{ scale: selected ? 0.98 : 1 }}
        className="w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-accent mt-4"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </motion.button>
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
      router.push("/home");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mb-8"
        style={{ boxShadow: "0 0 60px rgba(99, 102, 241, 0.5)" }}
      >
        <Star className="w-14 h-14 text-white" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-4xl font-bold text-white mb-4 text-glow"
      >
        Nice to meet you, {data.preferredName}
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 text-white/60 max-w-xs mb-8"
      >
        <p>I'm excited to explore {data.interests?.join(", ")} with you.</p>
        <p>I'll remember your preferences and grow with every conversation.</p>
        <p className="text-white font-medium">Let's start learning.</p>
      </motion.div>

      <AnimatePresence>
        {isReady && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center gap-3 animate-pulse-glow"
          >
            {isSaving ? "Setting up..." : "Begin your journey"}
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
