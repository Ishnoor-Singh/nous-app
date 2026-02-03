"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PencilFilter,
  TapeStrip,
  StickyNote,
  CoffeeStain,
  PaperClip,
  Doodle,
  PencilCheckbox,
  PaperCard,
  TabButton,
  WashiTape,
} from "@/components/paper/PaperElements";

const TOPIC_CONFIG = {
  philosophy: { emoji: "🤔", label: "Philosophy" },
  history: { emoji: "📜", label: "History" },
  economics: { emoji: "📈", label: "Economics" },
  art: { emoji: "🎨", label: "Art" },
  psychology: { emoji: "🧠", label: "Psychology" },
};

export default function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const userData = useQuery(api.users.getUserWithState, {
    clerkId: user?.id || "",
  });
  const stats = useQuery(api.knowledge.getStats, {
    userId: userData?.user?._id || ("" as any),
  });
  const todayCards = useQuery(api.knowledge.getTodayCards, {
    userId: userData?.user?._id || ("" as any),
  });
  const habitProgress = useQuery(api.habits.getTodayProgress, {
    userId: userData?.user?._id || ("" as any),
  });
  const generateCards = useMutation(api.knowledge.generateDailyCards);
  const syncUser = useMutation(api.users.syncUser);
  const logHabit = useMutation(api.habits.logHabit);

  const [category, setCategory] = useState<"today" | "habits" | "journal">("today");

  // Sync user on first load
  useEffect(() => {
    if (user && !userData?.user) {
      syncUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, userData, syncUser]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (userData?.user && userData?.learningProgress && !userData.learningProgress.preferredStyle) {
      router.push("/onboarding");
    }
  }, [userData, router]);

  // Generate cards if needed
  useEffect(() => {
    if (userData?.user && todayCards?.length === 0) {
      generateCards({ userId: userData.user._id });
    }
  }, [userData, todayCards, generateCards]);

  if (!userData?.user) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#d4c4a8" }}>
        <div style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 24,
          color: "#2c2c2c",
        }}>
          Loading your notebook...
        </div>
      </div>
    );
  }

  const firstName = userData.user.name?.split(" ")[0] || "friend";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const completedHabits = habitProgress?.filter(h => h.isCompletedToday).length || 0;
  const totalHabits = habitProgress?.length || 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#d4c4a8",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        padding: "24px 16px",
        paddingBottom: 100,
      }}
    >
      <PencilFilter />
      
      {/* Import fonts */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;600&family=Permanent+Marker&family=Indie+Flower&display=swap" 
        rel="stylesheet" 
      />

      <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
        
        {/* Header - torn paper */}
        <div
          style={{
            background: "#f5f0e6",
            padding: "24px 28px",
            marginBottom: 24,
            position: "relative",
            boxShadow: "3px 4px 12px rgba(0,0,0,0.15)",
            clipPath: "polygon(0% 0%, 100% 2%, 99% 98%, 1% 100%)",
          }}
        >
          <TapeStrip style={{ top: -8, left: 30 }} rotation={-2} color="cream" />
          <TapeStrip style={{ top: -6, right: 40 }} rotation={3} color="blue" />
          
          <h1
            style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: 36,
              color: "#2c2c2c",
              margin: 0,
              transform: "rotate(-1deg)",
            }}
          >
            hey {firstName}
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                background: "#e74c3c",
                borderRadius: "50%",
                marginLeft: 8,
                transform: "translateY(-12px)",
              }}
            />
          </h1>
          
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
              color: "#666",
              marginTop: 4,
            }}
          >
            {today}
          </div>

          {/* Streak badge */}
          {stats && stats.currentStreak > 0 && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 100%)",
                color: "white",
                padding: "6px 12px",
                borderRadius: 4,
                fontFamily: "'Permanent Marker', cursive",
                fontSize: 14,
                transform: "rotate(3deg)",
              }}
            >
              🔥 {stats.currentStreak} day streak!
            </div>
          )}

          <Doodle type="star" style={{ bottom: 10, right: 80 }} />
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: -10, marginLeft: 16, position: "relative", zIndex: 10 }}>
          <TabButton active={category === "today"} color="yellow" rotation={-2} onClick={() => setCategory("today")}>
            today
          </TabButton>
          <TabButton active={category === "habits"} color="green" rotation={1} onClick={() => setCategory("habits")}>
            habits
          </TabButton>
          <TabButton active={category === "journal"} color="blue" rotation={2} onClick={() => setCategory("journal")}>
            journal
          </TabButton>
        </div>

        {/* Main content - lined paper */}
        <div
          style={{
            background: "#fefcf6",
            backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e8dcd0 28px)",
            backgroundSize: "100% 28px",
            padding: "28px 24px",
            paddingLeft: 56,
            position: "relative",
            minHeight: 400,
            boxShadow: "4px 5px 15px rgba(0,0,0,0.2)",
            borderLeft: "3px solid #e8b4b4",
          }}
        >
          {/* Red margin line */}
          <div
            style={{
              position: "absolute",
              left: 46,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#ffcccb",
            }}
          />

          <CoffeeStain style={{ bottom: 60, right: 20, opacity: 0.6 }} />
          <PaperClip style={{ top: -15, right: 30 }} />

          {category === "today" && (
            <>
              <h2
                style={{
                  fontFamily: "'Architects Daughter', cursive",
                  fontSize: 22,
                  color: "#2c2c2c",
                  marginBottom: 20,
                  borderBottom: "2px dashed #ccc",
                  paddingBottom: 12,
                }}
              >
                Today's Discoveries ✨
              </h2>

              {todayCards && todayCards.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {todayCards.map((card, index) => {
                    const config = TOPIC_CONFIG[card.topic as keyof typeof TOPIC_CONFIG];
                    const rotation = (index - 1) * 1.5;

                    return (
                      <Link key={card._id} href={`/explore/${card._id}`} style={{ textDecoration: "none" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            padding: "12px 0",
                            transform: `rotate(${rotation}deg)`,
                            transition: "transform 0.2s",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background: card.completed ? "#c8e6c9" : "#fff9c4",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 20,
                              boxShadow: "1px 2px 4px rgba(0,0,0,0.1)",
                              transform: `rotate(${-rotation}deg)`,
                            }}
                          >
                            {card.completed ? "✓" : config?.emoji || "📚"}
                          </div>
                          <div>
                            <p
                              style={{
                                fontFamily: "'Architects Daughter', cursive",
                                fontSize: 18,
                                color: card.completed ? "#888" : "#2c2c2c",
                                textDecoration: card.completed ? "line-through" : "none",
                                margin: 0,
                              }}
                            >
                              {config?.label || card.topic}
                            </p>
                            <p
                              style={{
                                fontFamily: "'Caveat', cursive",
                                fontSize: 14,
                                color: "#666",
                                margin: "4px 0 0 0",
                              }}
                            >
                              {card.completed ? card.title : "tap to explore →"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontFamily: "'Caveat', cursive", color: "#666", fontSize: 18 }}>
                  Loading your discoveries...
                </p>
              )}

              <Doodle type="arrow" style={{ bottom: 20, left: -30 }} />
            </>
          )}

          {category === "habits" && (
            <>
              <h2
                style={{
                  fontFamily: "'Architects Daughter', cursive",
                  fontSize: 22,
                  color: "#2c2c2c",
                  marginBottom: 20,
                  borderBottom: "2px dashed #ccc",
                  paddingBottom: 12,
                }}
              >
                Daily Habits 💪
              </h2>

              {habitProgress && habitProgress.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {habitProgress.map((habit, index) => {
                    const rotation = (Math.random() - 0.5) * 2;
                    return (
                      <div
                        key={habit._id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "8px 0",
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        <PencilCheckbox
                          checked={habit.isCompletedToday}
                          onChange={() => logHabit({
                            userId: userData.user._id,
                            habitId: habit._id,
                            completed: !habit.isCompletedToday,
                          })}
                        />
                        <div style={{ flex: 1 }}>
                          <span
                            style={{
                              fontFamily: "'Architects Daughter', cursive",
                              fontSize: 18,
                              color: habit.isCompletedToday ? "#888" : "#2c2c2c",
                              textDecoration: habit.isCompletedToday ? "line-through" : "none",
                              textDecorationColor: "#666",
                              textDecorationThickness: 2,
                            }}
                          >
                            {habit.icon} {habit.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Link href="/habits" style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      fontFamily: "'Caveat', cursive",
                      color: "#2980b9",
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                  >
                    + start tracking habits →
                  </div>
                </Link>
              )}
            </>
          )}

          {category === "journal" && (
            <>
              <h2
                style={{
                  fontFamily: "'Architects Daughter', cursive",
                  fontSize: 22,
                  color: "#2c2c2c",
                  marginBottom: 20,
                  borderBottom: "2px dashed #ccc",
                  paddingBottom: 12,
                }}
              >
                Quick Journal ✍️
              </h2>

              <Link href="/journal" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 18,
                    color: "#666",
                    padding: "16px 0",
                    borderBottom: "1px solid #e8dcd0",
                    cursor: "pointer",
                  }}
                >
                  What's on your mind today? →
                </div>
              </Link>

              <div style={{ marginTop: 20 }}>
                <p style={{ fontFamily: "'Indie Flower', cursive", fontSize: 14, color: "#888" }}>
                  prompts:
                </p>
                {[
                  "What are you grateful for?",
                  "What's one thing you learned today?",
                  "How are you really feeling?",
                ].map((prompt, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: 16,
                      color: "#666",
                      margin: "8px 0",
                      paddingLeft: 12,
                      borderLeft: "3px solid #ffd93d",
                    }}
                  >
                    • {prompt}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sticky note reminder */}
        <div style={{ position: "absolute", right: -20, top: 180, zIndex: 5 }}>
          <StickyNote color="yellow" rotation={8}>
            {totalHabits > 0 ? (
              <>
                {completedHabits}/{totalHabits} habits<br/>
                done today! {completedHabits === totalHabits ? "🎉" : "💪"}
              </>
            ) : (
              <>
                take it one<br/>
                step at a time ☀️
              </>
            )}
          </StickyNote>
        </div>

        {/* Stats - graph paper */}
        <div
          style={{
            marginTop: 24,
            background: "#f8f8f8",
            backgroundImage: "linear-gradient(#d4c4b0 1px, transparent 1px), linear-gradient(90deg, #d4c4b0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            padding: 20,
            position: "relative",
            boxShadow: "2px 3px 10px rgba(0,0,0,0.12)",
            transform: "rotate(0.5deg)",
          }}
        >
          <WashiTape pattern="dots" color="pink" style={{ top: -10, left: "50%", marginLeft: -30 }} />
          
          <div style={{ display: "flex", justifyContent: "space-around", fontFamily: "'Caveat', cursive" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: "#2d5016" }}>
                {todayCards?.filter(c => c.completed).length || 0}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>explored</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: "#c0392b" }}>
                {completedHabits}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>habits</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: "#2980b9" }}>
                {stats?.currentStreak || 0}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>streak</div>
            </div>
          </div>

          <Doodle type="circle" style={{ top: 8, right: 12 }} />
        </div>

        {/* Chat CTA */}
        <Link href="/chat" style={{ textDecoration: "none" }}>
          <div
            style={{
              marginTop: 24,
              background: "#f5f0e6",
              padding: 20,
              boxShadow: "2px 3px 8px rgba(0,0,0,0.12)",
              transform: "rotate(-0.5deg)",
              cursor: "pointer",
            }}
          >
            <WashiTape pattern="stripes" color="mint" style={{ top: -10, left: 20 }} rotation={-3} />
            <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 16, color: "#2c2c2c", margin: 0 }}>
              💬 chat with nous
            </p>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#666", margin: "4px 0 0 0" }}>
              ask anything, explore deeper...
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
