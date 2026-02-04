"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { CreatureCharacter, CreatureSelector, CREATURES, type CreatureId } from "@/components/creature/CreatureCharacter";

const STEPS = [
  { id: "welcome", component: WelcomeStep },
  { id: "creature", component: CreatureStep },
  { id: "name", component: NameStep },
  { id: "interests", component: InterestsStep },
  { id: "goals", component: GoalsStep },
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
    goals: [] as string[],
    learningStyle: "narrative" as "socratic" | "narrative" | "analytical" | "visual",
    responseStyle: "balanced" as "brief" | "balanced" | "detailed",
    creatureId: null as CreatureId | null,
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
    <main className="min-h-dvh flex flex-col p-6 safe-top safe-bottom">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((_, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{
              width: index === currentStep ? 28 : 10,
              background:
                index <= currentStep
                  ? "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)"
                  : "rgba(255, 255, 255, 0.1)",
              boxShadow: index <= currentStep ? "0 0 10px rgba(99, 102, 241, 0.5)" : "none",
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
            <CurrentStepComponent data={data} updateData={updateData} onNext={nextStep} user={user} userData={userData} />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function WelcomeStep({ onNext, data }: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      {/* Floating creatures preview */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 relative"
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -left-16 top-0"
        >
          <CreatureCharacter creatureId="glob" mood="happy" size={60} />
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <CreatureCharacter creatureId="puff" mood="excited" size={100} />
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          className="absolute -right-16 top-4"
        >
          <CreatureCharacter creatureId="jello" mood="happy" size={55} />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-white mb-4"
        style={{ textShadow: "0 0 30px rgba(255,255,255,0.3)" }}
      >
        Meet Your New Friend
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 text-white/60 max-w-xs"
      >
        <p>Choose a pocket creature to be your learning companion.</p>
        <p>They'll help you explore philosophy, history, economics, art, and psychology.</p>
        <p className="text-white/80">Your very own knowledge buddy! ✨</p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-12 px-8 py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center gap-2"
        style={{ boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)" }}
      >
        Let's go!
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

function CreatureStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState<CreatureId | null>(data.creatureId);

  const handleContinue = () => {
    updateData("creatureId", selected);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Buddy</h2>
        <p className="text-white/50">Who do you want to learn with?</p>
      </div>

      {/* Selected creature preview */}
      <div className="flex justify-center mb-6">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-32"
        >
          {selected ? (
            <CreatureCharacter creatureId={selected} mood="excited" size={120} />
          ) : (
            <div className="w-[120px] h-[132px] rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.2)" }}>
              <span className="text-white/30 text-4xl">?</span>
            </div>
          )}
        </motion.div>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h3 className="text-xl font-semibold text-white">{CREATURES[selected].name}</h3>
          <p className="text-white/50 text-sm">{CREATURES[selected].personality}</p>
        </motion.div>
      )}

      {/* Creature grid */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <CreatureSelector selectedId={selected} onSelect={setSelected} />
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={!selected}
        whileHover={{ scale: selected ? 1.02 : 1 }}
        whileTap={{ scale: selected ? 0.98 : 1 }}
        className="mt-4 w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: selected ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none" }}
      >
        This is my buddy!
        <Sparkles className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

function NameStep({ data, updateData, onNext, user }: any) {
  const [name, setName] = useState(data.preferredName || user?.firstName || "");
  const creature = data.creatureId ? CREATURES[data.creatureId as CreatureId] : null;

  const handleContinue = () => {
    updateData("preferredName", name);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center">
        {data.creatureId && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6"
          >
            <CreatureCharacter
              creatureId={data.creatureId}
              mood="curious"
              size={100}
              message="What's your name?"
              showMessage={true}
            />
          </motion.div>
        )}

        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {creature?.name} wants to know...
        </h2>
        <p className="text-white/50 mb-8 text-center">What should they call you?</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full max-w-xs p-4 text-xl text-center rounded-2xl text-white bg-transparent"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          autoFocus
        />
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={!name.trim()}
        whileHover={{ scale: name.trim() ? 1.02 : 1 }}
        whileTap={{ scale: name.trim() ? 0.98 : 1 }}
        className="w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: name.trim() ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none" }}
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
    { id: "philosophy", label: "Philosophy", icon: "🤔", color: "from-purple-500/30 to-violet-500/30" },
    { id: "history", label: "History", icon: "📜", color: "from-amber-500/30 to-yellow-500/30" },
    { id: "economics", label: "Economics", icon: "📈", color: "from-green-500/30 to-emerald-500/30" },
    { id: "art", label: "Art", icon: "🎨", color: "from-pink-500/30 to-rose-500/30" },
    { id: "psychology", label: "Psychology", icon: "🧠", color: "from-blue-500/30 to-cyan-500/30" },
  ];

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    updateData("interests", selected);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        {data.creatureId && (
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4">
            <CreatureCharacter creatureId={data.creatureId} mood={selected.length > 0 ? "excited" : "curious"} size={80} />
          </motion.div>
        )}
        <h2 className="text-3xl font-bold text-white mb-2">What fascinates you?</h2>
        <p className="text-white/50">Pick what you want to explore together</p>
      </div>

      <div className="flex-1 space-y-3">
        {topics.map((topic, index) => {
          const isSelected = selected.includes(topic.id);
          return (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggle(topic.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all bg-gradient-to-r ${
                isSelected ? topic.color : "from-white/5 to-white/10"
              }`}
              style={{
                border: isSelected ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isSelected ? "0 0 20px rgba(255,255,255,0.1)" : "none",
              }}
            >
              <span className="text-3xl">{topic.icon}</span>
              <span className="font-semibold text-white flex-1 text-left">{topic.label}</span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-7 h-7 rounded-full bg-gradient-to-r from-accent to-purple-600 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={selected.length === 0}
        whileHover={{ scale: selected.length > 0 ? 1.02 : 1 }}
        whileTap={{ scale: selected.length > 0 ? 0.98 : 1 }}
        className="mt-4 w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: selected.length > 0 ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none" }}
      >
        Let's explore!
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

function GoalsStep({ data, updateData, onNext }: any) {
  const [selected, setSelected] = useState<string[]>(data.goals || []);

  const goals = [
    { id: "learn", label: "Learn new things daily", icon: "📚", desc: "Build knowledge consistently" },
    { id: "habits", label: "Build better habits", icon: "🎯", desc: "Track and improve routines" },
    { id: "organize", label: "Stay organized", icon: "📋", desc: "Manage tasks and notes" },
    { id: "reflect", label: "Reflect & journal", icon: "✍️", desc: "Process thoughts and feelings" },
    { id: "focus", label: "Improve focus", icon: "🧘", desc: "Reduce distractions" },
    { id: "create", label: "Be more creative", icon: "💡", desc: "Generate ideas and explore" },
  ];

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    updateData("goals", selected);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        {data.creatureId && (
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4">
            <CreatureCharacter creatureId={data.creatureId} mood={selected.length > 0 ? "happy" : "curious"} size={80} />
          </motion.div>
        )}
        <h2 className="text-3xl font-bold text-white mb-2">What are your goals?</h2>
        <p className="text-white/50">Pick what you want to achieve</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {goals.map((goal, index) => {
          const isSelected = selected.includes(goal.id);
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => toggle(goal.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                isSelected ? "bg-gradient-to-r from-accent/30 to-purple-600/30" : "bg-white/5"
              }`}
              style={{
                border: isSelected ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-2xl">{goal.icon}</span>
              <div className="flex-1 text-left">
                <span className="font-semibold text-white">{goal.label}</span>
                <p className="text-xs text-white/50">{goal.desc}</p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-gradient-to-r from-accent to-purple-600 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={handleContinue}
        disabled={selected.length === 0}
        whileHover={{ scale: selected.length > 0 ? 1.02 : 1 }}
        whileTap={{ scale: selected.length > 0 ? 0.98 : 1 }}
        className="mt-4 w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

function StyleStep({ data, updateData, onNext }: any) {
  const [responseStyle, setResponseStyle] = useState(data.responseStyle || "balanced");
  const [learningStyle, setLearningStyle] = useState(data.learningStyle || "narrative");

  const responseStyles = [
    { id: "brief", label: "Brief & Direct", icon: "⚡", desc: "Short, to-the-point answers" },
    { id: "balanced", label: "Balanced", icon: "⚖️", desc: "Clear explanations with context" },
    { id: "detailed", label: "Deep & Thorough", icon: "📖", desc: "Comprehensive explorations" },
  ];

  const learningStyles = [
    { id: "socratic", label: "Socratic", icon: "❓", desc: "Learn through questions" },
    { id: "narrative", label: "Storytelling", icon: "📚", desc: "Learn through stories" },
    { id: "analytical", label: "Analytical", icon: "🔬", desc: "Data and logic focused" },
    { id: "visual", label: "Visual", icon: "🎨", desc: "Examples and analogies" },
  ];

  const handleContinue = () => {
    updateData("responseStyle", responseStyle);
    updateData("learningStyle", learningStyle);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        {data.creatureId && (
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4">
            <CreatureCharacter creatureId={data.creatureId} mood="curious" size={80} />
          </motion.div>
        )}
        <h2 className="text-3xl font-bold text-white mb-2">How should I talk?</h2>
        <p className="text-white/50">Customize your experience</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Response Style */}
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wide">Response Style</h3>
          <div className="space-y-2">
            {responseStyles.map((style) => (
              <motion.button
                key={style.id}
                onClick={() => setResponseStyle(style.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                  responseStyle === style.id ? "bg-accent/20 border-accent/50" : "bg-white/5 border-white/10"
                }`}
                style={{ border: "1px solid" }}
              >
                <span className="text-xl">{style.icon}</span>
                <div className="flex-1 text-left">
                  <span className="font-medium text-white">{style.label}</span>
                  <p className="text-xs text-white/50">{style.desc}</p>
                </div>
                {responseStyle === style.id && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Learning Style */}
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wide">Learning Style</h3>
          <div className="grid grid-cols-2 gap-2">
            {learningStyles.map((style) => (
              <motion.button
                key={style.id}
                onClick={() => setLearningStyle(style.id)}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  learningStyle === style.id ? "bg-accent/20 border-accent/50" : "bg-white/5 border-white/10"
                }`}
                style={{ border: "1px solid" }}
              >
                <span className="text-2xl">{style.icon}</span>
                <span className="font-medium text-white text-sm">{style.label}</span>
                <p className="text-xs text-white/50 text-center">{style.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <motion.button
        onClick={handleContinue}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full py-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
      >
        Almost done!
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
  const creature = data.creatureId ? CREATURES[data.creatureId as CreatureId] : null;

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
        goals: data.goals || [],
        learningStyle: data.learningStyle || "narrative",
        responseStyle: data.responseStyle || "balanced",
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
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="mb-8"
      >
        {data.creatureId && (
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CreatureCharacter
              creatureId={data.creatureId}
              mood="excited"
              size={140}
              message={`Let's go, ${data.preferredName}!`}
              showMessage={true}
            />
          </motion.div>
        )}
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-4xl font-bold text-white mb-4"
        style={{ textShadow: "0 0 30px rgba(255,255,255,0.3)" }}
      >
        You & {creature?.name}
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 text-white/60 max-w-xs mb-8"
      >
        <p>
          {creature?.name} is excited to explore{" "}
          <span className="text-white">{data.interests?.join(", ")}</span> with you!
        </p>
        <p className="text-white">Your pocket buddy is ready ✨</p>
      </motion.div>

      <AnimatePresence>
        {isReady && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl font-semibold flex items-center gap-3"
            style={{ boxShadow: "0 0 40px rgba(99, 102, 241, 0.5)" }}
          >
            {isSaving ? "Setting up..." : "Start our adventure!"}
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
