"use client";

import { useState, useRef, useEffect, useCallback, MouseEvent } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Spring } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Upload, Sparkles, ArrowRight, Play, Pause, ChevronRight, ChevronLeft, 
  Volume2, Search, Type, Maximize2, Minimize2, X, AlertCircle,
  BookOpen, Settings, FileText, Globe, Atom, Binary, Loader2, Award, Heart
} from "lucide-react";

type CognitiveStep = string;

interface ProcessedData {
  original: string;
  simplified: string;
  steps: CognitiveStep[];
}

// Mock Data for Demo Questions Strategy
const DEMO_QUESTIONS = {
  Maths: {
    icon: <Binary size={20} />,
    title: "Algebra & Logic",
    original: "A train travels 120 km in 2 hours. What is its average speed?",
    simplified: "A train goes 120 kilometers. It takes 2 hours. How fast is it going on average?",
    steps: [
      "Distance = 120 km",
      "Time = 2 hours",
      "Formula -> Speed = Distance ÷ Time",
      "Calculate -> 120 ÷ 2 = 60",
      "Answer -> 60 km/h"
    ]
  },
  Science: {
    icon: <Atom size={20} />,
    title: "Physics & Energy",
    original: "Explain the process of photosynthesis in plants and its role in the carbon cycle.",
    simplified: "Plants make their own food using sunlight. This process is called photosynthesis.",
    steps: [
      "Plants take in sunlight, water, and carbon dioxide.",
      "Sunlight gives energy to turn water and gas into food (sugar).",
      "As a result, plants release oxygen back into the air.",
      "This process helps keep Earth's carbon cycle balanced."
    ]
  },
  Hindi: {
    icon: <Globe size={20} />,
    title: "Hindi Literature",
    original: "प्रेमचंद की कहानियों में भारतीय किसान की दुर्दशा का यथार्थवादी चित्रण कैसे किया गया है?",
    simplified: "प्रेमचंद की कहानियों में गरीब किसानों की मुश्किलें दिखाई गई हैं।",
    steps: [
      "मुंशी प्रेमचंद हिंदी के महान लेखक थे।",
      "उन्होंने अपनी कहानियों में गाँव समाज को मुख्य विषय बनाया।",
      "उनकी कहानियों में जमींदारों द्वारा किसानों का शोषण दिखाया गया है।",
      "यह यथार्थवादी, यानी सच्ची घटनाओं जैसा चित्रण है।"
    ]
  }
};

// --- Custom Spotlight Card Component ---
function SpotlightCard({ children, onClick, className = "" }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -5 }}
      className={`relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-6 cursor-pointer shadow-glass border border-black/5 dark:border-white/10 group transition-all duration-300 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 dark:group-hover:opacity-60"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 113, 227, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </motion.div>
  );
}

// --- 4-7-8 Breathing Component ---
function BreathingExercise({ onClose, isDyslexicFont }: { onClose: () => void, isDyslexicFont: boolean }) {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (phase === "idle") return;

    let duration = 0;
    if (phase === "inhale") { duration = 4; setScale(1.8); }
    if (phase === "hold") { duration = 7; setScale(1.8); }
    if (phase === "exhale") { duration = 8; setScale(1); }

    setTimeLeft(duration);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (phase === "inhale") setPhase("hold");
          else if (phase === "hold") setPhase("exhale");
          else setPhase("idle"); // End after exhale
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Escape key support for Breathing Exercise
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const startExercise = () => setPhase("inhale");

  const getInstructions = () => {
   if (phase === "idle") return "Ready to relax your cognitive load?";
   if (phase === "inhale") return "Breathe In (Fill Lungs)";
   if (phase === "hold") return "Hold (Keep Air)";
   if (phase === "exhale") return "Breathe Out (Release Air)";
   return "";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-[150] bg-black/90 flex flex-col items-center justify-center p-8 text-white transition-all duration-700"
    >
      <div className="absolute top-10 right-10">
        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 hover:bg-red-500/80 focus:outline-none flex items-center justify-center backdrop-blur-md text-white transition-all">
          <X size={20} />
        </button>
      </div>
      
      <div className="text-center mb-16 h-32 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.h2 
            key={phase}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            className={`text-4xl md:text-5xl font-bold tracking-tight mb-6 ${phase === "hold" ? 'text-purple-400' : 'text-white'}`} 
            style={{ fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit', letterSpacing: isDyslexicFont ? '0.05em' : 'normal' }}
          >
            {getInstructions()}
          </motion.h2>
        </AnimatePresence>
        
        <AnimatePresence>
          {phase !== "idle" && (
            <motion.p 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-6xl font-bold font-mono text-accent drop-shadow-[0_0_15px_rgba(0,113,227,0.5)]"
            >
              {timeLeft}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex items-center justify-center w-64 h-64 mt-12">
        <motion.div 
          animate={{ scale }} 
          transition={{ duration: phase === "inhale" ? 4 : phase === "exhale" ? 8 : 0.5, ease: "linear" }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/50 to-green-500/50 blur-[50px]"
        />
        <motion.div 
          animate={{ scale }} 
          transition={{ duration: phase === "inhale" ? 4 : phase === "exhale" ? 8 : 0.5, ease: "linear" }}
          className="absolute inset-8 rounded-full bg-gradient-to-br from-accent to-green-400 shadow-[0_0_40px_rgba(52,199,89,0.4)] flex items-center justify-center border border-white/20"
        >
          {phase === "idle" && (
            <button 
              onClick={startExercise} 
              className="text-white font-bold tracking-widest uppercase flex items-center gap-2 hover:scale-110 transition-transform text-xl cursor-pointer"
            >
              <Play fill="currentColor" size={28}/> Start
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  // Global States
  const [activeTab, setActiveTab] = useState<"upload" | "demos" | "journey" | "settings">("upload");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Gamification & Wellbeing State
  const [completedConcepts, setCompletedConcepts] = useState<number>(0);
  const targetConcepts = 5;
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  
  // Customization States (Dynamics)
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [fontSize, setFontSize] = useState("medium"); // small, medium, large
  const [voiceSpeed, setVoiceSpeed] = useState(1); // 0.5 to 1.5 multiplier
  
  // Upload Flow States
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Active Content States
  const [data, setData] = useState<ProcessedData | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Playback/Error States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Handle Escape Key for Cinema Focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);
  
  // Fix Tab Navigation Bug by clearing data
  const handleTabChange = (tab: "upload" | "demos" | "journey" | "settings") => {
    setActiveTab(tab);
    if (tab !== "demos" && tab !== "upload" && tab !== "journey" && data) setData(null);
    if (tab === "upload" || tab === "settings" || tab === "journey") setData(null);
    setAudioError(null);
  };
  
  // Apply Font Size dynamic styling
  const fontSizeFactor = fontSize === "large" ? 1.2 : fontSize === "small" ? 0.9 : 1;
  const lineSpacing = isDyslexicFont ? 2.5 : 1.6;
  const letterSpacing = isDyslexicFont ? 0.08 : -0.01;

  const toggleFont = () => setIsDyslexicFont(!isDyslexicFont);

  // Bulletproof Client-Side Web Speech API (No backend reliance)
  const speakText = (text: string) => {
    setAudioError(null);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    setIsLoadingAudio(true);
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear any existing
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Detect Hindi vs English
        const isHindi = /[\u0900-\u097F]/.test(text);
        
        const voices = window.speechSynthesis.getVoices();
        if (isHindi) {
          utterance.lang = 'hi-IN';
          const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
          if (hindiVoice) utterance.voice = hindiVoice;
          utterance.rate = voiceSpeed; // Natural speed for Hindi
        } else {
          utterance.lang = 'en-US';
          const englishVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English') || v.lang.includes('en-US'));
          if (englishVoice) utterance.voice = englishVoice;
          // Apply cognitive pacing for English (slower reading for dyslexia)
          utterance.rate = voiceSpeed * 0.85; 
        }

        utterance.onstart = () => {
          setIsLoadingAudio(false);
          setIsPlaying(true);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = (e) => {
          console.error("Speech Synthesis Error", e);
          setIsPlaying(false);
          setAudioError("Browser audio failed to play.");
        };

        window.speechSynthesis.speak(utterance);
      } else {
        throw new Error("Speech Synthesis not supported in this browser.");
      }
    } catch(e: any) {
      console.error(e);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setAudioError(e.message || "Failed to generate audio.");
    }
  };

  // Ensure audio stops if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    setIsUploading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsUploading(false);
    setIsProcessing(true);
    
    try {
      const mockExtractedText = file ? file.name : "Math Question"; 
      const res = await fetch("http://localhost:8000/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: mockExtractedText })
      });
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
      loadDemoData("Maths"); // Fallback
    }
    setIsProcessing(false);
  };
  
  const loadDemoData = (subject: keyof typeof DEMO_QUESTIONS) => {
    setData({
      original: DEMO_QUESTIONS[subject].original,
      simplified: DEMO_QUESTIONS[subject].simplified,
      steps: DEMO_QUESTIONS[subject].steps
    });
  };

  const springConfig: any = { type: "spring", stiffness: 300, damping: 30 };

  // --- Rendering Functions ---

  const renderNavBar = () => (
    <nav className="fixed w-full top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none px-6 py-3 flex justify-between items-center bg-white/40 dark:bg-appleGray/40 backdrop-blur-2xl transition-all duration-500">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-accent text-white shadow-glowing">
          <BookOpen size={18} className="fill-white" />
        </div>
        <span className="font-semibold text-xl tracking-tight text-foreground">Lexara Air</span>
      </div>

      {/* Center Tabs Navigation */}
      <div className="hidden md:flex glass-panel bg-white/20 dark:bg-black/20 p-1 rounded-full border-black/5 dark:border-white/5">
        {[
          { id: "upload", icon: <FileText size={16} />, label: "PDF Scanner" },
          { id: "demos", icon: <Sparkles size={16} />, label: "Cognitive Demos" },
          { id: "journey", icon: <Award size={16} />, label: "Journey" },
          { id: "settings", icon: <Settings size={16} />, label: "Dynamics" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-white/10 text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={toggleFont}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[14px] font-medium shadow-sm ${isDyslexicFont ? 'bg-success text-white' : 'glass-panel text-foreground hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <Type size={16} />
          {isDyslexicFont ? "Dyslexic Active" : "Dyslexic Form"}
        </button>
      </div>
    </nav>
  );

  const renderUploadTab = () => (
     <motion.div 
      key="upload"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springConfig}
      className="flex flex-col items-center justify-center pt-10"
    >
      <div className="text-center max-w-3xl mb-14">
        <motion.h1 
          className="text-6xl md:text-7xl font-bold mb-6 tracking-tighter leading-[1.1] text-foreground"
        >
          Clarity in every <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500">document.</span>
        </motion.h1>
        <p className="text-xl text-foreground/60 font-medium leading-relaxed max-w-2xl mx-auto">
          Upload PDF exams or images. Lexara automatically extracts texts and structures them beautifully for the dyslexic mind.
        </p>
      </div>

      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="w-full max-w-2xl glass-panel p-2 shadow-glass overflow-hidden group"
      >
        <div className="border border-black/5 dark:border-white/5 rounded-[20px] p-16 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 relative cursor-pointer flex flex-col items-center justify-center gap-6">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            onChange={handleFileUpload}
          />
          <div className="w-20 h-20 rounded-full bg-white dark:bg-appleGray shadow-sm flex items-center justify-center text-accent group-hover:scale-110 group-hover:shadow-glowing transition-all duration-500">
             <Upload size={32} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground mb-1">
              {file ? file.name : "Drop PDF or Image here"}
            </p>
            <p className="text-[15px] text-foreground/50">Up to 50MB</p>
          </div>
        </div>

        <div className="p-4 bg-transparent mt-2">
          <button 
            onClick={processFile}
            disabled={isUploading || isProcessing}
            className="relative overflow-hidden bg-foreground text-background w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg"
          >
            {isProcessing && (
               <motion.div className="absolute inset-0 bg-accent/20" animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
            )}
            <span className="relative z-10">{isProcessing ? "Restructuring Cognitively..." : isUploading ? "Extracting..." : "Scan & Transform"}</span>
            {(!isUploading && !isProcessing) && <ArrowRight size={20} className="relative z-10" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderDemosTab = () => (
    <motion.div 
      key="demos"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springConfig}
      className="flex flex-col gap-10 pt-4 max-w-5xl mx-auto"
    >
      <div className="text-center mb-4">
        <h2 className="text-4xl font-bold tracking-tight mb-4">Subjects Overview</h2>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          See how Lexara adapts complex language into cognitive liquid formats instantly across any subject.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {(Object.keys(DEMO_QUESTIONS) as Array<keyof typeof DEMO_QUESTIONS>).map(sub => (
          <SpotlightCard 
            key={sub}
            onClick={() => loadDemoData(sub)}
            className="z-10"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-glowing">
              {DEMO_QUESTIONS[sub].icon}
            </div>
            <h3 className="text-2xl font-bold tracking-tight z-10">{DEMO_QUESTIONS[sub].title}</h3>
            <p className="text-[15px] font-medium text-foreground/60 line-clamp-2 z-10">
              {DEMO_QUESTIONS[sub].original}
            </p>
            <div className="mt-auto pt-4 flex items-center gap-2 text-accent font-semibold text-[14px] z-10">
              Translate & Simplify <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </div>
            
            {/* Apple Liquid Blob Overlay inside the card */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700 pointer-events-none"></div>
          </SpotlightCard>
        ))}
      </div>
    </motion.div>
  );

  const handleConceptComplete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0071e3', '#34c759', '#8e43e7', '#ffcc00']
    });
    setCompletedConcepts(prev => prev + 1);
    setFocusMode(false);
    window.speechSynthesis.cancel(); 
    setIsPlaying(false);
  };

  const renderJourneyTab = () => {
    const progressPercent = Math.min((completedConcepts / targetConcepts) * 100, 100);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
      <motion.div
        key="journey"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={springConfig}
        className="max-w-4xl mx-auto pt-4 px-6 flex flex-col gap-10"
      >
        <div className="text-center mb-4">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Your Journey</h2>
          <p className="text-foreground/60 max-w-xl mx-auto text-[17px]">
            Track your cognitive breakthroughs and maintain your personal wellbeing. Consistent learning builds lasting confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Apple Health Style Academic Progress Ring */}
          <div className="glass-panel p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-glass border border-black/5 dark:border-white/10">
            <h3 className="text-[15px] font-bold text-foreground/50 uppercase tracking-widest mb-6">Daily Academic Goals</h3>
            
            <div className="relative flex items-center justify-center mb-6">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-black/5 dark:text-white/10" />
                <motion.circle 
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  className="text-success drop-shadow-[0_0_10px_rgba(52,199,89,0.5)]" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold tracking-tighter">{completedConcepts}</span>
                <span className="text-[12px] font-medium text-foreground/50">/ {targetConcepts} Concepts</span>
              </div>
            </div>
            
            <p className="text-[15px] font-medium text-foreground/80">
              {completedConcepts >= targetConcepts 
                ? "Incredible job! You've met your daily cognitive mastery goal." 
                : `You are ${targetConcepts - completedConcepts} concepts away from today's active learning goal.`}
            </p>
          </div>

          {/* Personal Wellbeing Module */}
          <div className="glass-panel p-8 flex flex-col gap-6 relative overflow-hidden shadow-glass border border-black/5 dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
              <Heart size={24} fill="currentColor" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">Personal Wellbeing</h3>
              <p className="text-[15px] font-medium text-foreground/60 leading-relaxed">
                Dyslexia can bring academic fatigue. Take a moment to reset your cognitive load.
              </p>
            </div>

            <div className="mt-auto bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[14px]">4-7-8 Breathing</h4>
                <p className="text-[12px] text-foreground/50">Reduce cognitive overload (2 mins)</p>
              </div>
              <button onClick={() => setIsBreathingMode(true)} className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform shadow-md">
                <Play fill="currentColor" size={14} className="ml-1"/>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSettingsTab = () => (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springConfig}
      className="flex flex-col gap-10 pt-4 max-w-3xl mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold tracking-tight mb-4">Lexara Dynamics</h2>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          Personalize the cognitive interface to match individual neurological needs and preferences.
        </p>
      </div>

      <div className="glass-panel p-8 flex flex-col gap-10 shadow-glass">
        {/* Toggle Theme */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold tracking-tight">Interface Theme</h4>
            <p className="text-sm text-foreground/50">Switch between deep focus dark mode and clean light mode.</p>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative w-16 h-8 bg-black/10 dark:bg-white/20 rounded-full transition-colors"
          >
            <motion.div 
              layout
              className={`w-6 h-6 rounded-full absolute top-1 bg-white shadow-sm ${isDarkMode ? 'right-1' : 'left-1'}`}
            />
          </button>
        </div>
        
        <div className="h-px bg-black/5 dark:bg-white/5 w-full"/>

        {/* Font Size */}
        <div className="flex flex-col gap-4">
          <div className="mb-2">
            <h4 className="text-lg font-semibold tracking-tight">Typography Scale</h4>
            <p className="text-sm text-foreground/50">Adjust text size globally for maximum readability.</p>
          </div>
          <div className="flex p-1 glass-panel bg-white/20 dark:bg-black/20 rounded-2xl w-full max-w-[300px]">
            {['small', 'medium', 'large'].map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-2 text-sm font-medium rounded-xl capitalize transition-all ${fontSize === size ? 'bg-white dark:bg-white/10 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-black/5 dark:bg-white/5 w-full"/>

        {/* Voice Pacing */}
        <div className="flex flex-col gap-4">
          <div className="mb-2">
            <h4 className="text-lg font-semibold tracking-tight">Cognitive Audio Pacing</h4>
            <p className="text-sm text-foreground/50">Slow down the Voice tailored for lower cognitive overload.</p>
          </div>
          <div className="flex gap-4 items-center w-full max-w-[400px]">
            <span className="text-xs text-foreground/50 font-bold uppercase tracking-widest">Slow</span>
            <input 
              type="range" 
              min="0.5" max="1.5" step="0.1" 
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <span className="text-xs text-foreground/50 font-bold uppercase tracking-widest">Fast</span>
          </div>
        </div>

      </div>
    </motion.div>
  );

  const renderActiveContent = () => {
    if (data) {
      return (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={springConfig}
          className="flex flex-col gap-10 pt-4 relative z-10 w-full max-w-6xl mx-auto"
        >
          {/* Top Controls */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => { setData(null); setAudioError(null); }} 
              className="text-foreground/50 hover:text-foreground font-medium text-[15px] flex items-center gap-2 transition-colors hover:-translate-x-1 duration-300"
            >
              <ChevronLeft size={18} /> Back to Library
            </button>
            <button 
              onClick={() => setFocusMode(true)}
              className="px-6 py-2.5 rounded-full font-semibold text-[15px] flex items-center gap-2 transition-all bg-foreground text-background hover:scale-105 shadow-glass"
            >
              <Maximize2 size={16} /> Enter Cinema Focus
            </button>
          </div>

          {/* Cognitive Dashboard Layout */}
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-start">
            
            {/* Context/Before Pane */}
            <div className="glass-panel p-8 shadow-glass sticky top-28 border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/10 text-foreground/60">
                   <Search size={16} strokeWidth={2.5}/>
                </div>
                <span className="text-[13px] font-bold uppercase tracking-widest text-foreground/50">Original Examination Context</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={isDyslexicFont ? 'dys-orig' : 'norm-orig'}
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  className="text-[17px] font-medium text-foreground/70" 
                  style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${17 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                >
                  {data.original}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Steps & Simplified (After) Pane */}
            <div className="flex flex-col gap-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, ...springConfig }}
                className="glass-panel p-10 shadow-glass relative overflow-hidden bg-white/60 dark:bg-black/40 backdrop-blur-3xl"
              >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accent to-purple-500"></div>
                
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[13px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <Sparkles size={16}/> Simplified Concept
                  </span>
                  <div className="flex items-center gap-3">
                    {audioError && <span className="text-red-500 text-xs font-semibold bg-red-500/10 px-3 py-1.5 rounded-full flex items-center gap-1"><AlertCircle size={14}/> {audioError}</span>}
                    {isLoadingAudio && <Loader2 className="animate-spin text-accent" size={20} />}
                    <button 
                      onClick={() => speakText(data.simplified)}
                      disabled={isLoadingAudio}
                      className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      {isPlaying ? <Pause fill="currentColor" size={18}/> : <Play fill="currentColor" size={18} className="ml-1"/>}
                    </button>
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.h1 
                    key={isDyslexicFont ? 'dys-simp' : 'norm-simp'}
                    initial={{ opacity: 0, filter: "blur(8px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(8px)" }}
                    className="font-bold tracking-tight text-foreground" 
                    style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${32 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                  >
                    {data.simplified}
                  </motion.h1>
                </AnimatePresence>
              </motion.div>

              <div className="flex flex-col gap-4">
                {data.steps.map((step, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1), ...springConfig }}
                    key={idx} 
                    className="glass-panel p-8 flex items-center gap-6 relative group hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300 border border-black/5 dark:border-white/5"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/10 dark:to-white/5 flex items-center justify-center font-bold text-[18px] text-foreground/50 border border-black/5 dark:border-white/10">
                      {idx + 1}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={isDyslexicFont ? 'dys-step' : 'norm-step'}
                        initial={{ opacity: 0, filter: "blur(4px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(4px)" }}
                        className="font-semibold tracking-tight text-foreground flex-1" 
                        style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${20 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                      >
                        {step}
                      </motion.p>
                    </AnimatePresence>

                    <button 
                      onClick={() => speakText(step)}
                      disabled={isLoadingAudio}
                      className="ml-auto w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-all shadow-sm shrink-0 disabled:opacity-50"
                    >
                      {isLoadingAudio ? <Loader2 className="animate-spin text-foreground opacity-50" size={16} /> : <Volume2 size={18} strokeWidth={2}/>}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeTab === "upload") return renderUploadTab();
    if (activeTab === "demos") return renderDemosTab();
    if (activeTab === "journey") return renderJourneyTab();
    if (activeTab === "settings") return renderSettingsTab();
    return null;
  };

  return (
    <main 
      className={`min-h-screen transition-all duration-700 ease-in-out ${isDyslexicFont ? "dyslexic-mode" : ""} ${isDarkMode ? "dark" : ""}`}
      style={{ fontSize: fontSize === "large" ? "1.1rem" : fontSize === "small" ? "0.9rem" : "1rem" }}
    >
      <div className={`liquid-bg-container pointer-events-none ${isDarkMode ? 'dark' : ''}`}>
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      {renderNavBar()}

      <div className="pt-32 pb-24 px-6 w-full relative z-10 transition-all">
        <AnimatePresence mode="wait">
          {renderActiveContent()}
        </AnimatePresence>

        {/* Cinematic Focus Mode (VisionOS Style) */}
        <AnimatePresence>
          {focusMode && data && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 text-white transition-all duration-700"
            >
              <div className="absolute top-10 left-10 right-10 flex justify-between items-center max-w-[1400px] mx-auto w-full">
                <span className="text-white/40 font-bold uppercase tracking-[0.2em] text-[13px] flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                   Cinema Focus
                </span>
                <div className="flex items-center gap-4">
                  {audioError && <span className="text-red-500 text-xs font-bold uppercase bg-red-500/20 px-3 py-1 rounded-full"><AlertCircle size={12} className="inline mr-1"/> {audioError}</span>}
                  <button 
                    onClick={() => { setFocusMode(false); window.speechSynthesis.cancel(); setIsPlaying(false); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-red-500/80 transition-all flex items-center justify-center backdrop-blur-md border border-white/10 text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="w-full max-w-4xl relative h-[50vh] flex items-center justify-center mt-[-40px]">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    className="text-center w-full"
                  >
                    <span className="inline-block text-accent font-semibold text-xl mb-8 tracking-widest uppercase bg-accent/10 px-6 py-2 rounded-full border border-accent/20">
                      Step {currentStepIndex + 1}
                    </span>
                    
                    {/* Add smooth wavy blur transition on font change */}
                    <AnimatePresence mode="wait">
                      <motion.h2 
                        key={isDyslexicFont ? 'dyslexic' : 'normal'}
                        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="text-6xl md:text-7xl font-bold leading-[1.2] tracking-normal text-white" 
                        style={{ fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                      >
                        {data.steps[currentStepIndex]}
                      </motion.h2>
                    </AnimatePresence>
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => speakText(data.steps[currentStepIndex])}
                      disabled={isLoadingAudio}
                      className="mt-16 w-24 h-24 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] disabled:opacity-50"
                    >
                      {isLoadingAudio ? <Loader2 className="animate-spin" size={36} /> : (isPlaying ? <Pause fill="currentColor" size={36} /> : <Play fill="currentColor" size={36} className="ml-2" />)}
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute bottom-16 w-full max-w-[400px] flex items-center justify-between">
                <button 
                  onClick={() => { setCurrentStepIndex(Math.max(0, currentStepIndex - 1)); window.speechSynthesis.cancel(); setIsPlaying(false); }}
                  className={`w-16 h-16 rounded-full glass-panel border-white/10 flex items-center justify-center transition-all ${currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'}`}
                  disabled={currentStepIndex === 0}
                >
                  <ChevronLeft size={28} />
                </button>
                
                <div className="flex gap-3">
                  {data.steps.map((_, idx) => (
                    <div key={idx} className={`h-2.5 rounded-full transition-all duration-500 ${idx === currentStepIndex ? 'w-10 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'w-2.5 bg-white/20'}`} />
                  ))}
                </div>

                <AnimatePresence mode="popLayout" initial={false}>
                  {currentStepIndex === data.steps.length - 1 ? (
                    <motion.button 
                      key="complete-btn"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleConceptComplete}
                      className="w-16 h-16 rounded-full glass-panel border-white/10 flex items-center justify-center transition-all bg-success text-white shadow-[0_0_30px_rgba(52,199,89,0.5)] border-success"
                    >
                      <Award size={24} />
                    </motion.button>
                  ) : (
                    <motion.button 
                      key="next-btn"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => { setCurrentStepIndex(Math.min(data.steps.length - 1, currentStepIndex + 1)); window.speechSynthesis.cancel(); setIsPlaying(false); }}
                      className={`w-16 h-16 rounded-full glass-panel border-white/10 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-110 bg-white/10`}
                    >
                      <ChevronRight size={28} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4-7-8 Breathing Wellbeing Overlay */}
        <AnimatePresence>
          {isBreathingMode && (
             <BreathingExercise 
               onClose={() => setIsBreathingMode(false)} 
               isDyslexicFont={isDyslexicFont} 
             />
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
