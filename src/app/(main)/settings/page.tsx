"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { 
  Sun, Moon, Bell, BellOff, Volume2, VolumeX,
  Globe, Palette, Shield, Trash2, LogOut,
  ChevronRight, Check, RotateCcw, Loader2
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const userData = useQuery(api.users.getUser, { clerkId: user?.id || "" });
  const resetAccount = useMutation(api.users.resetAccount);
  const [isResetting, setIsResetting] = useState(false);
  const [settings, setSettings] = useState({
    theme: "system" as "light" | "dark" | "system",
    notifications: true,
    soundEffects: true,
    voiceMode: false,
    language: "en",
  });

  const handleResetAccount = async () => {
    if (!userData?._id) return;
    
    const confirmed = confirm(
      "⚠️ Reset Account?\n\nThis will delete ALL your data:\n• Conversations\n• Habits & logs\n• Tasks & projects\n• Notes & journal entries\n• AI learnings\n\nThis cannot be undone!"
    );
    
    if (confirmed) {
      setIsResetting(true);
      try {
        await resetAccount({ userId: userData._id });
        localStorage.clear();
        alert("Account reset complete! Refreshing...");
        window.location.href = "/home";
      } catch (error) {
        console.error("Reset failed:", error);
        alert("Failed to reset account. Please try again.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nous-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings to localStorage
  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("nous-settings", JSON.stringify(newSettings));
  };

  return (
    <main className="min-h-dvh p-6 safe-top">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold">Settings</h1>
      </motion.div>

      {/* Appearance */}
      <Section title="Appearance" delay={0.1}>
        <SettingRow
          icon={<Palette className="w-5 h-5" />}
          label="Theme"
          description="Choose your preferred appearance"
        >
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => updateSetting("theme", theme)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  settings.theme === theme
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {theme === "light" && <Sun className="w-4 h-4 inline mr-1" />}
                {theme === "dark" && <Moon className="w-4 h-4 inline mr-1" />}
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" delay={0.2}>
        <SettingRow
          icon={settings.notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          label="Push Notifications"
          description="Daily reminders and insights"
        >
          <Toggle
            enabled={settings.notifications}
            onChange={(v) => updateSetting("notifications", v)}
          />
        </SettingRow>
      </Section>

      {/* Sound & Voice */}
      <Section title="Sound & Voice" delay={0.3}>
        <SettingRow
          icon={settings.soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          label="Sound Effects"
          description="Subtle sounds for interactions"
        >
          <Toggle
            enabled={settings.soundEffects}
            onChange={(v) => updateSetting("soundEffects", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Volume2 className="w-5 h-5" />}
          label="Voice Mode"
          description="Speak to Nous instead of typing"
        >
          <Toggle
            enabled={settings.voiceMode}
            onChange={(v) => updateSetting("voiceMode", v)}
          />
        </SettingRow>
      </Section>

      {/* Language */}
      <Section title="Language" delay={0.4}>
        <SettingRow
          icon={<Globe className="w-5 h-5" />}
          label="Language"
          description="Content and interface language"
        >
          <select
            value={settings.language}
            onChange={(e) => updateSetting("language", e.target.value)}
            className="bg-secondary rounded-xl px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </SettingRow>
      </Section>

      {/* Data & Privacy */}
      <Section title="Data & Privacy" delay={0.5}>
        <SettingRow
          icon={<Shield className="w-5 h-5" />}
          label="Privacy Policy"
          description="How we handle your data"
          onClick={() => {}}
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </SettingRow>

        <SettingRow
          icon={isResetting ? <Loader2 className="w-5 h-5 text-orange-500 animate-spin" /> : <RotateCcw className="w-5 h-5 text-orange-500" />}
          label="Reset Account"
          description="Clear all data and start fresh"
          onClick={handleResetAccount}
          danger
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </SettingRow>

        <SettingRow
          icon={<Trash2 className="w-5 h-5 text-red-500" />}
          label="Delete Account"
          description="Permanently delete your account"
          onClick={() => {
            alert("To delete your account, please contact support.");
          }}
          danger
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </SettingRow>
      </Section>

      {/* Account */}
      <Section title="Account" delay={0.6}>
        <SignOutButton>
          <button className="w-full p-4 rounded-2xl bg-red-500/10 flex items-center gap-3 text-red-500 hover:bg-red-500/20 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </SignOutButton>
      </Section>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-sm text-muted-foreground mt-8"
      >
        Nous v0.1.0 • Made with 🧠
      </motion.p>
    </main>
  );
}

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="mb-8"
    >
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {title}
      </h2>
      <div className="bg-muted rounded-2xl divide-y divide-secondary">
        {children}
      </div>
    </motion.section>
  );
}

function SettingRow({ 
  icon, 
  label, 
  description, 
  children, 
  onClick,
  danger = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  description: string; 
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-4 p-4">
      <div className={danger ? "text-red-500" : "text-muted-foreground"}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${danger ? "text-red-500" : ""}`}>{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-secondary/50 transition-colors">
        {content}
      </button>
    );
  }

  return content;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-secondary"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}
