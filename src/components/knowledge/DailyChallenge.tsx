"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Sparkles, ChevronRight, Check, X, 
  Brain, Lightbulb, Trophy, Zap
} from "lucide-react";
import { Confetti } from "@/components/ui/Confetti";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

interface DailyChallengeProps {
  questions: Question[];
  onComplete?: (score: number) => void;
}

export function DailyChallenge({ questions, onComplete }: DailyChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion?.correctIndex;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (index: number) => {
    if (selectedOption !== null) return; // Already answered
    
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsComplete(true);
      setShowConfetti(true);
      onComplete?.(score + (isCorrect ? 1 : 0));
    }
  };

  if (isComplete) {
    const finalScore = score + (isCorrect ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);
    
    return (
      <>
        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">Challenge Complete!</h2>
          <p className="text-4xl font-bold text-accent mb-2">{percentage}%</p>
          <p className="text-muted-foreground mb-4">
            {finalScore} of {questions.length} correct
          </p>
          
          <p className="text-sm text-muted-foreground">
            {percentage >= 80 
              ? "Excellent! You really know your stuff! 🌟" 
              : percentage >= 60 
                ? "Good job! Keep learning! 📚"
                : "Every attempt makes you smarter! 🧠"}
          </p>
        </motion.div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="p-5 rounded-2xl bg-muted"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">
                {currentQuestion.topic}
              </p>
              <p className="font-medium">{currentQuestion.question}</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              const showResult = selectedOption !== null;

              let bgClass = "bg-background hover:bg-secondary";
              if (showResult) {
                if (isCorrectOption) {
                  bgClass = "bg-emerald-500/20 border-emerald-500";
                } else if (isSelected && !isCorrectOption) {
                  bgClass = "bg-red-500/20 border-red-500";
                } else {
                  bgClass = "bg-background opacity-50";
                }
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSelect(index)}
                  disabled={selectedOption !== null}
                  whileHover={selectedOption === null ? { scale: 1.01 } : {}}
                  whileTap={selectedOption === null ? { scale: 0.99 } : {}}
                  className={`w-full p-4 rounded-xl text-left border transition-all ${bgClass} ${
                    selectedOption === null ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      showResult && isCorrectOption 
                        ? "bg-emerald-500 border-emerald-500" 
                        : showResult && isSelected 
                          ? "bg-red-500 border-red-500" 
                          : "border-muted-foreground"
                    }`}>
                      {showResult && isCorrectOption && <Check className="w-4 h-4 text-white" />}
                      {showResult && isSelected && !isCorrectOption && <X className="w-4 h-4 text-white" />}
                    </div>
                    <span>{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl ${
              isCorrect ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <Lightbulb className={`w-5 h-5 mt-0.5 ${isCorrect ? "text-emerald-500" : "text-amber-500"}`} />
              <div>
                <p className="font-medium mb-1">
                  {isCorrect ? "Correct! 🎉" : "Not quite, but now you know!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {showExplanation && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleNext}
          className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          {currentIndex < questions.length - 1 ? (
            <>
              Next Question
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              See Results
              <Trophy className="w-5 h-5" />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

// Sample questions
export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "1",
    topic: "Philosophy",
    question: "Who said 'I think, therefore I am'?",
    options: ["Plato", "Descartes", "Aristotle", "Kant"],
    correctIndex: 1,
    explanation: "René Descartes wrote this famous phrase in Latin ('Cogito, ergo sum') in his 1637 work 'Discourse on the Method'. It became a foundational element of Western philosophy.",
  },
  {
    id: "2",
    topic: "Economics",
    question: "What does GDP stand for?",
    options: ["Gross Domestic Product", "General Distribution Profit", "Government Development Plan", "Global Debt Percentage"],
    correctIndex: 0,
    explanation: "GDP measures the total monetary value of all goods and services produced within a country's borders in a specific time period. It's the most common measure of a nation's economic output.",
  },
  {
    id: "3",
    topic: "Psychology",
    question: "What is cognitive dissonance?",
    options: ["A memory disorder", "Mental discomfort from conflicting beliefs", "A type of therapy", "A learning disability"],
    correctIndex: 1,
    explanation: "Cognitive dissonance is the mental discomfort we feel when holding contradictory beliefs or when our actions conflict with our values. We often resolve it by changing our beliefs to match our behavior.",
  },
];
