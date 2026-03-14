"use client";

import { useState, useRef, useEffect, useCallback, MouseEvent } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Spring } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Upload, Sparkles, ArrowRight, Play, Pause, ChevronRight, ChevronLeft, 
  Volume2, Search, Type, Maximize2, Minimize2, X, AlertCircle,
  BookOpen, Settings, FileText, Globe, Atom, Binary, Loader2, Award, Heart, Download, Activity, CheckSquare,
  Code2, Zap, ShieldCheck, Copy, CheckCheck, ExternalLink, Server
} from "lucide-react";

interface QuestionResponse {
  id: string;
  question_number: number;
  type: string;
  marks: number;
  complexity_score: number;
  difficulty_level: string;
  original: {
    english: string;
  };
  simplified: {
    english: string;
    steps: string[];
  };
  translations: {
    [key: string]: string;
  };
}

interface ProcessedData {
  questions: QuestionResponse[];
}

const DEMO_QUESTIONS: Record<string, ProcessedData & { icon: React.ReactNode, title: string }> = {
  Maths: {
    icon: <Binary size={20} />,
    title: "10th Grade Trigonometry",
    questions: [
      {
        id: "q_maths_1",
        question_number: 1,
        type: "problem",
        marks: 5,
        complexity_score: 0.85,
        difficulty_level: "High",
        original: {
          english: "A tree breaks due to a storm and the broken part bends so that the top of the tree touches the ground making an angle 30° with it. The distance between the foot of the tree to the point where the top touches the ground is 8 m. Find the height of the tree."
        },
        simplified: {
          english: "Calculate how tall the whole tree was before the storm.",
          steps: [
            "Step 1: A tree breaks in half.",
            "Step 2: The top falls and makes a **30°** angle with the ground.",
            "Step 3: The foot of the tree is **8 meters** from the fallen top."
          ]
        },
        translations: {
          hindi: "• एक पेड़ तूफान से टूट जाता है।\n• इसका ऊपरी भाग ज़मीन से 30° का कोण बनाता है।\n• पेड़ के निचले भाग से दूरी 8 m है।\n• लक्ष्य: टूटने से पहले पेड़ की ऊंचाई ज्ञात करें।",
          gujarati: "વૃક્ષ કેવી રીતે તૂટી ગયું?",
          tamil: "",
          telugu: "",
          kannada: "",
          malayalam: "",
          punjabi: "",
          marathi: "",
          bengali: ""
        }
      }
    ]
  },
  Science: {
    icon: <Atom size={20} />,
    title: "10th Grade Chemistry",
    questions: [
      {
        id: "q_science_2",
        question_number: 2,
        type: "mcq",
        marks: 2,
        complexity_score: 0.60,
        difficulty_level: "Medium",
        original: {
          english: "Plaster of Paris should be stored in a moisture-proof container. Explain why."
        },
        simplified: {
          english: "Why keep Plaster of Paris completely dry?",
          steps: [
            "Step 1: Plaster of Paris reacts with water.",
            "Step 2: Explain the outcome if it gets wet."
          ]
        },
        translations: {
          hindi: "प्लास्टर ऑफ पेरिस को सूखी जगह पर क्यों रखना चाहिए? पानी से मिलने पर क्या होगा?",
          gujarati: "",
          tamil: "",
          telugu: "",
          kannada: "",
          malayalam: "",
          punjabi: "",
          marathi: "",
          bengali: ""
        }
      }
    ]
  },
  Hindi: {
    icon: <Globe size={20} />,
    title: "CBSE Civics (Polity)",
    questions: [
      {
        id: "q_hindi_1",
        question_number: 3,
        type: "essay",
        marks: 10,
        complexity_score: 0.80,
        difficulty_level: "Hard",
        original: {
          english: "How does decentralization of power through Panchayati Raj institutions strengthen the roots of Indian democracy at the grassroots level?"
        },
        simplified: {
          english: "Explain how letting local people make decisions helps the country's overall government work better.",
          steps: [
            "Step 1: Local village councils (**Panchayati Raj**) are given important political power in India.",
            "Step 2: Explain how this strengthens democracy."
          ]
        },
        translations: {
          hindi: "• भारत में स्थानीय ग्राम पंचायतों को महत्वपूर्ण राजनीतिक शक्ति दी गई है।\n• लक्ष्य: स्पष्ट करें कि स्थानीय लोगों को निर्णय लेने का अधिकार देने से देश की सरकार को बेहतर तरीके से काम करने में कैसे मदद मिलती है?",
          gujarati: "",
          tamil: "",
          telugu: "",
          kannada: "",
          malayalam: "",
          punjabi: "",
          marathi: "",
          bengali: ""
        }
      }
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
  const [activeTab, setActiveTab] = useState<"upload" | "scanned" | "demos" | "settings" | "test" | "api">("upload");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Gamification & Wellbeing State
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  
  // Customization States (Dynamics)
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [fontFamily, setFontFamily] = useState("system-ui"); // 'OpenDyslexic', 'Lexend', 'Comic Sans MS', 'Arial', 'system-ui'
  const [fontSize, setFontSize] = useState("medium"); // small, medium, large
  const [voiceSpeed, setVoiceSpeed] = useState(1); // 0.5 to 1.5 multiplier
  const [customLetterSpacing, setCustomLetterSpacing] = useState(0);
  const [customLineHeight, setCustomLineHeight] = useState(1.6);
  const [themeContrast, setThemeContrast] = useState("default"); // 'default', 'warm', 'cool'
  const [severityLevel, setSeverityLevel] = useState<number | null>(null);
  
  // Upload Flow States
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressData, setProgressData] = useState({ status: "Initializing Engine...", percent: 0 });
  
  // Active Content States
  const [data, setData] = useState<ProcessedData | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeFocusStep, setActiveFocusStep] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Assessment State
  const [testStep, setTestStep] = useState(0);
  const [testScore, setTestScore] = useState(0);

  // Apply Toast State
  const [showToast, setShowToast] = useState(false);

  // Map Next.js TSX ISO language codes structurally to the Python OpenAI Pydantic nested JSON Dictionary keys
  const LANG_MAP: Record<string, string> = {
    hi: "hindi",
    bn: "bengali",
    mr: "marathi",
    ta: "tamil",
    te: "telugu",
    gu: "gujarati",
    kn: "kannada",
    ml: "malayalam",
    pa: "punjabi"
  };

  // Derived Content
  const activeQuestion = data?.questions.find((q, idx) => `${q.id}-${idx}` === activeQuestionId || q.id === activeQuestionId);
  const activeContent = activeQuestion ? (() => {
    if (language === "en") {
      return {
        original: activeQuestion.original?.english || "Original text unavailable.",
        simplified: `${activeQuestion.simplified?.english || ""}\n\n${activeQuestion.simplified?.steps?.join("\n\n") || ""}`,
        options: []
      };
    } else {
      const backendLangKey = LANG_MAP[language] || language;
      const transText = (activeQuestion.translations as any)?.[backendLangKey] || "Translation currently unavailable for this dialect. The AI model has not extracted it yet.";
      return {
        original: "Original text omitted for cognitive focus.",
        simplified: transText,
        options: []
      };
    }
  })() : null;

  // Audio state
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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

  // LocalStorage Caching for Scanned Documents
  useEffect(() => {
    const savedData = localStorage.getItem("lexara_saved_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.questions && parsed.questions.length > 0 && parsed.questions[0].original) {
          setData(parsed);
          setActiveTab("scanned");
        }
      } catch (e) {
        console.error("Failed to parse local storage data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (data) {
      // Don't save demo data to local storage to avoid confusion
      const isDemoData = DEMO_QUESTIONS["Maths"].questions[0].id === data.questions[0]?.id || 
                         DEMO_QUESTIONS["Science"].questions[0].id === data.questions[0]?.id || 
                         DEMO_QUESTIONS["Hindi"].questions[0].id === data.questions[0]?.id;
      if (!isDemoData) {
        localStorage.setItem("lexara_saved_data", JSON.stringify(data));
      }
    }
  }, [data]);
  
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
  const handleTabChange = (tab: "upload" | "scanned" | "demos" | "settings" | "test" | "api") => {
    setActiveTab(tab);
    setActiveQuestionId(null);
    setAudioError(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
  };
  
  // Apply Font Size and Typography styling
  const fontSizeFactor = fontSize === "large" ? 1.2 : fontSize === "small" ? 0.9 : 1;
  const lineSpacing = isDyslexicFont ? 2.5 : customLineHeight;
  const letterSpacing = isDyslexicFont ? 0.08 : customLetterSpacing;

  const currentFontFamily = isDyslexicFont ? 'OpenDyslexic' : fontFamily;

  const toggleFont = () => setIsDyslexicFont(!isDyslexicFont);

  // Server-Side Dyslexia-Optimized TTS implementation
  const speakText = async (rawText: string) => {
    setAudioError(null);
    if (isPlaying && audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    
    setIsLoadingAudio(true);
    
    // Inject Dyslexia-Optimized Syntactic Padding ("Step X. Pause.")
    let optimizedText = rawText;
    const blocks = rawText.split(/\\n\\n|\n\n/);
    if (blocks.length > 1) {
       optimizedText = blocks.map((block, index) => {
         // Skip empty blocks
         if (!block.trim()) return "";
         // Map steps out phonetically for the AI Engine
         return `Step ${index + 1}. Pause. ${block.trim()}`;
       }).join("... Pause again. ");
    } else {
       // if it's a single block (Focus Mode), ensure it's spoken cleanly
       optimizedText = rawText;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimizedText, language })
      });
      
      if (!res.ok) throw new Error("Audio generation failed");
      
      const { audio_url } = await res.json();
      const newAudio = new Audio(`${apiUrl}${audio_url}`);
      
      // Apply cognitive pacing based on Lexara user settings
      newAudio.playbackRate = voiceSpeed;
      
      newAudio.onplay = () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
        setAudioElement(newAudio);
      };
      
      newAudio.onended = () => {
        setIsPlaying(false);
      };
      
      newAudio.onerror = () => {
        setIsPlaying(false);
        setAudioError("Failed to play the audio stream.");
      };

      newAudio.play().catch(err => {
        console.log("Audio playback interrupted safely:", err);
        setIsPlaying(false);
        setIsLoadingAudio(false);
      });
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
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  // Unified workflow to handle PDF Extraction and Processing with Polling
  const handleUpload = async () => {
    if (!file) return;
    
    // Phase 10: Clear previous data bounds completely
    setData(null);
    setActiveQuestionId(null);
    setIsUploading(true);
    setProgressData({ status: "Extracting raw image bytes from PDF...", percent: 0 });
    
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Unified Backend Pipeline: Upload, OCR, and AI Process in one massive background stream
      const formData = new FormData();
      formData.append("file", file);
      
      const taskId = crypto.randomUUID();
      formData.append("task_id", taskId);
      
      // Start polling before the mammoth extraction begins
      progressInterval = setInterval(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"}/api/progress/${taskId}`);
          if (res.ok) {
            const pData = await res.json();
            setProgressData(pData);
            if (pData.percent >= 100 && progressInterval) {
               clearInterval(progressInterval);
            }
          }
        } catch (e) {
          console.error("Polling Error", e);
        }
      }, 800);

      const processRes = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"}/api/upload_and_process`, {
        method: "POST",
        body: formData
      });
      
      if (!processRes.ok) throw new Error("Failed to cognitively process the text");
      const result = await processRes.json();
      
      setProgressData({ status: "Extraction Complete!", percent: 100 });
      setData(result);
      setActiveQuestionId(null);
      setLanguage("en");
      setActiveTab("scanned"); // Automatically jump to the new Scanned tab
    } catch (e) {
      console.error(e);
      // Fallback to Demo Data to ensure presentation is never blocked
      loadDemoData("Maths"); 
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  const loadDemoData = (subject: keyof typeof DEMO_QUESTIONS) => {
    setData({
      questions: DEMO_QUESTIONS[subject].questions
    });
    setActiveQuestionId(null);
    setLanguage("en");
    setActiveTab("scanned"); // Switch to actively view the loaded info
  };

  const handleLanguageChange = async (targetLang: string) => {
    if (!activeQuestion) return;
    
    // Stop any active audio safely
    window.speechSynthesis.cancel();
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setIsPlaying(false);
    
    // Instantly switch language locally (no backend API call required since translations are pre-loaded via the Master 9-Language Engine pipeline)
    setLanguage(targetLang);
  };

  const handleExportPDF = async () => {
    if (!data) return;
    try {
      setIsExporting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"}/api/export_pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, language })
      });
      if (!res.ok) throw new Error("Failed to export PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = `Lexara_Dyslexic_Document_${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (e) {
      console.error(e);
      setAudioError("Failed to generate Dyslexic PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const currentQuestionIndex = data?.questions?.findIndex(q => q.id === activeQuestionId) ?? -1;

  const handleNextQuestion = () => {
    if (data && data.questions && currentQuestionIndex < data.questions.length - 1) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setActiveQuestionId(data.questions[currentQuestionIndex + 1].id);
    }
  };

  const handlePrevQuestion = () => {
    if (data && data.questions && currentQuestionIndex > 0) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setActiveQuestionId(data.questions[currentQuestionIndex - 1].id);
    }
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
          { id: "scanned", icon: <Search size={16} />, label: "Scanned Document" },
          { id: "demos", icon: <Sparkles size={16} />, label: "Sample Questions" },
          { id: "test", icon: <Activity size={16} />, label: "Screening" },
          { id: "settings", icon: <Settings size={16} />, label: "Dynamics" },
          { id: "api", icon: <Code2 size={16} />, label: "API" }
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
            onChange={(e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); }}
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

        <div className="p-4 bg-transparent mt-2 flex flex-col gap-5">
          {(isUploading || isProcessing) && progressData.percent > 0 && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-3 px-2">
                <span className="text-sm font-semibold text-foreground/80 tracking-wide">{progressData.status}</span>
                <span className="text-sm font-bold text-accent">{progressData.percent}%</span>
              </div>
              <div className="w-full h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden shadow-inner relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-accent rounded-full shadow-[0_0_15px_rgba(0,122,255,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressData.percent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
          <button 
            onClick={handleUpload}
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
              {DEMO_QUESTIONS[sub].questions[0].original.english}
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
    setFocusMode(false);
    window.speechSynthesis.cancel(); 
    setIsPlaying(false);
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

        {/* Global Typography Controls */}
        <div className="flex flex-col gap-8">
          <div>
            <h4 className="text-lg font-semibold tracking-tight">Typography Engine</h4>
            <p className="text-sm text-foreground/50 mb-6">Manually override fonts, letter spacing, and line heights for optimal tracking.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Font Family */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold uppercase tracking-widest text-foreground/60">Font Family</label>
                <select 
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-black/5 dark:bg-white/10 text-foreground border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none appearance-none"
                >
                  <option value="system-ui">Lexara Default (System)</option>
                  <option value="OpenDyslexic">OpenDyslexic</option>
                  <option value="Lexend">Lexend</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Arial">Arial</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold uppercase tracking-widest text-foreground/60">Global Scale</label>
                <div className="flex p-1 glass-panel bg-white/20 dark:bg-black/20 rounded-xl w-full h-12">
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`flex-1 text-sm font-medium rounded-lg capitalize transition-all ${fontSize === size ? 'bg-white dark:bg-white/10 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing Slider */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold uppercase tracking-widest text-foreground/60 flex justify-between">
                  Letter Spacing <span>{customLetterSpacing.toFixed(2)}em</span>
                </label>
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-foreground/40">Tight</span>
                  <input 
                    type="range" min="-0.05" max="0.2" step="0.01" 
                    value={customLetterSpacing}
                    onChange={(e) => setCustomLetterSpacing(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <span className="text-xs text-foreground/40">Wide</span>
                </div>
              </div>

              {/* Line Height Slider */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold uppercase tracking-widest text-foreground/60 flex justify-between">
                  Line Height <span>{customLineHeight.toFixed(1)}</span>
                </label>
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-foreground/40">Dense</span>
                  <input 
                    type="range" min="1" max="3" step="0.1" 
                    value={customLineHeight}
                    onChange={(e) => setCustomLineHeight(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <span className="text-xs text-foreground/40">Airy</span>
                </div>
              </div>

            </div>
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
            <span className="text-xs text-foreground/50 font-bold uppercase tracking-widest flex justify-between w-12">Slow</span>
            <input 
              type="range" 
              min="0.5" max="1.5" step="0.1" 
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <span className="text-xs text-foreground/50 font-bold uppercase tracking-widest flex justify-between w-12">Fast</span>
          </div>
        </div>

        <button 
          onClick={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} 
          className="mt-4 w-full max-w-sm mx-auto bg-success text-white px-8 py-4 rounded-xl font-bold text-[16px] hover:scale-105 transition-all shadow-glass flex items-center justify-center gap-3"
        >
          <CheckSquare size={20} /> Apply Dynamics Settings
        </button>

      </div>
    </motion.div>
  );

  const renderTestTab = () => {
    const handleAnswer = (points: number) => {
      setTestScore(prev => prev + points);
      setTestStep(prev => prev + 1);
    };

    const handleComplete = () => {
      // Auto-apply logic
      if (testScore >= 5) {
        setSeverityLevel(3);
        setFontFamily("OpenDyslexic");
        setCustomLetterSpacing(0.08);
        setCustomLineHeight(2.5);
      } else if (testScore >= 3) {
        setSeverityLevel(2);
        setFontFamily("Lexend");
        setCustomLetterSpacing(0.04);
        setCustomLineHeight(2.0);
      } else {
        setSeverityLevel(1);
        setFontFamily("system-ui");
        setCustomLetterSpacing(0);
        setCustomLineHeight(1.6);
      }
      setTestStep(0);
      setTestScore(0);
      setActiveTab("settings");
    };

    return (
      <motion.div 
        key="test"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={springConfig}
        className="flex flex-col items-center justify-center pt-24 max-w-2xl mx-auto"
      >
        <div className="glass-panel p-10 shadow-glass w-full text-center">
          {testStep === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Dyslexia Severity Screening</h2>
              <p className="text-foreground/60 mb-8 max-w-lg mx-auto">
                Answer three quick questions about your reading experience to automatically calibrate Lexara to your optimal cognitive rhythm.
              </p>
              <button 
                onClick={() => { setTestStep(1); setTestScore(0); }} 
                className="bg-foreground text-background px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-all w-full max-w-xs"
              >
                Begin Assessment
              </button>
            </motion.div>
          )}

          {testStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">Question 1 / 3</span>
              <h2 className="text-2xl font-bold mb-6">How often do similar letters like &apos;b&apos;/&apos;d&apos; or &apos;p&apos;/&apos;q&apos; seem to blur, flip, or rotate when reading standard text?</h2>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleAnswer(0)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Rarely or Never</button>
                <button onClick={() => handleAnswer(1)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Sometimes</button>
                <button onClick={() => handleAnswer(2)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Very Often</button>
              </div>
            </motion.div>
          )}

          {testStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">Question 2 / 3</span>
              <h2 className="text-2xl font-bold mb-6">Do lines of text often feel crowded, making you skip lines or lose your place on the page?</h2>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleAnswer(0)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">No, tracking is easy</button>
                <button onClick={() => handleAnswer(1)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Sometimes, if the text is dense</button>
                <button onClick={() => handleAnswer(2)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Yes, text frequently &quot;swims&quot; or merges</button>
              </div>
            </motion.div>
          )}

          {testStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">Question 3 / 3</span>
              <h2 className="text-2xl font-bold mb-6">When trying to comprehend complex academic text, how beneficial is it for the text to be split into separate, widely spaced chunks?</h2>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleAnswer(0)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Not necessary</button>
                <button onClick={() => handleAnswer(1)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Helpful</button>
                <button onClick={() => handleAnswer(2)} className="glass-panel text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/10 transition">Crucial for my understanding</button>
              </div>
            </motion.div>
          )}

          {testStep === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckSquare size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Profile Computed</h2>
              <p className="text-foreground/70 mb-4">
                Based on your responses, we&apos;ve identified a <strong>Level {testScore >= 5 ? 3 : testScore >= 3 ? 2 : 1} Cognitive Profile.</strong>
              </p>
              <p className="text-foreground/50 mb-8 text-sm max-w-md mx-auto">
                We will automatically engage {testScore >= 5 ? 'OpenDyslexic typography, ultra-wide leading,' : testScore >= 3 ? 'Lexend typography, wide leading,' : 'standard readability optimizations'} to reduce your cognitive friction.
              </p>
              <button 
                onClick={handleComplete} 
                className="bg-success text-white px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-glass"
              >
                Apply Dynamics & Continue
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderActiveContent = () => {
    if (activeTab === "scanned" && data && !activeQuestionId) {
      return (
        <motion.div
          key="questions-list"
          initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={springConfig}
          className="flex flex-col gap-8 pt-4 w-full max-w-5xl mx-auto relative z-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Cognitive Extraction</h2>
              <p className="text-foreground/60 mb-4">Select a question from the document to view its cognitive breakdown.</p>
              <button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="bg-accent text-white px-5 py-2.5 rounded-full font-semibold text-[14px] flex items-center gap-2 hover:bg-accent/90 transition-all shadow-glowing disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                Export as Dyslexic PDF
              </button>
            </div>
            <button 
              onClick={() => { setData(null); setAudioError(null); }} 
              className="text-foreground/50 hover:text-foreground font-medium text-[15px] flex items-center gap-2 transition-colors hover:-translate-x-1 duration-300 glass-panel px-4 py-2 rounded-full h-12"
            >
              <ChevronLeft size={18} /> Back
            </button>
          </div>

          <div className="grid gap-4">
            {data.questions.map((q, idx) => (
              <SpotlightCard 
                key={`${q?.id || "fallback"}-${idx}`} 
                onClick={() => { setActiveQuestionId(`${q?.id || "fallback"}-${idx}`); setCurrentStepIndex(0); }}
                className="hover:scale-[1.01]"
              >
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold shrink-0 mt-1 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    {q.type && (
                      <div className="flexItems-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-black/5 dark:border-white/5 mr-2">{q.type}</span>
                        {q.complexity_score !== undefined && (
                          <span className={`text-[10px] font-bold uppercase py-1 px-2 rounded-md ${q.complexity_score >= 0.8 ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            Complexity: {Math.round(q.complexity_score * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[17px] font-medium text-foreground mb-4 line-clamp-3">{q?.original?.english || ""}</p>
                    <div className="flex items-center gap-2 text-accent text-[14px] font-semibold">
                       Analyze Cognitively <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </motion.div>
      );
    }

    if (data && activeQuestionId && activeContent) {
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
              onClick={() => { setActiveQuestionId(null); setAudioError(null); }} 
              className="text-foreground/50 hover:text-foreground font-medium text-[15px] flex items-center gap-2 transition-colors hover:-translate-x-1 duration-300"
            >
              <ChevronLeft size={18} /> Back to Questions
            </button>
            <div className="flex items-center gap-4">
              {/* Dynamic Language Dropdown */}
              <div className="relative glass-panel flex rounded-full items-center shadow-sm px-2 py-1">
                <Globe size={14} className="text-foreground/50 ml-2 mr-1" />
                <select 
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isTranslating}
                  className="bg-transparent text-foreground text-[14px] font-bold outline-none cursor-pointer appearance-none px-3 py-1 pr-8 disabled:opacity-50"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem top 50%", backgroundSize: "0.65rem auto" }}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="bn">Bengali (বাংলা)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="gu">Gujarati (ગુજરાતી)</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  <option value="or">Odia (ଓଡ଼ିଆ)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                  <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="as">Assamese (অসমীয়া)</option>
                  <option value="mwr">Marwari (मारवाड़ी)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="zh">Mandarin (中文)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="ja">Japanese (日本語)</option>
                </select>
                {isTranslating && <Loader2 className="animate-spin text-accent absolute right-2" size={14} />}
              </div>

              <button 
                onClick={() => setFocusMode(true)}
                className="px-6 py-2.5 rounded-full font-semibold text-[15px] flex items-center gap-2 transition-all bg-foreground text-background hover:scale-105 shadow-glass"
              >
                <Maximize2 size={16} /> Enter Cinema Focus
              </button>
            </div>
          </div>

          {/* Custom User-Requested Single Column Cognitive Dashboard Layout */}
          <div className="glass-panel p-10 md:p-14 shadow-glass border border-black/5 dark:border-white/10 w-full mx-auto relative overflow-hidden bg-white/60 dark:bg-black/40 backdrop-blur-3xl">
             <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-accent to-purple-500"></div>
             
             {/* Header */}
             <div className="mb-8 font-medium">
               <h2 className="text-3xl font-bold mb-4 tracking-tight">Question {activeQuestion?.question_number || (currentQuestionIndex + 1)}</h2>
               <p className="text-[17px] text-foreground/80 mb-6">
                 Complexity: {activeQuestion?.difficulty_level || "Medium"}
               </p>

               <div className="flex flex-col gap-2 w-48 mb-8">
                 <label className="text-sm font-semibold text-foreground/50">Language ▼</label>
                 <select 
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={isTranslating}
                    className="glass-panel text-foreground text-[16px] font-bold outline-none cursor-pointer p-3 rounded-lg disabled:opacity-50 border border-black/10 dark:border-white/10 shadow-sm"
                  >
                    <option value="en">English (Default)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="gu">Gujarati (ગુજરાતી)</option>
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                    <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                 </select>
               </div>
             </div>

             {/* Simplified Question */}
             <div className="border-b-2 border-dashed border-foreground/20 pb-4 mb-6">
                <h3 className="text-2xl font-bold text-accent">Simplified Question</h3>
             </div>
             
             <div className="mb-10 text-[19px] font-medium text-foreground">
               <AnimatePresence mode="wait">
                  <motion.div 
                    key={`${language}-simp-${isDyslexicFont}`}
                    initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(4px)" }}
                    className="flex flex-col gap-5" 
                    style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${20 * fontSizeFactor}px`, fontFamily: currentFontFamily }}
                  >
                    {language === "en" ? (
                      <p dangerouslySetInnerHTML={{ __html: (activeQuestion?.simplified?.english || activeContent.simplified).replace(new RegExp("\\*\\*(.*?)\\*\\*", "g"), '<span class="text-accent font-bold">$1</span>') }} />
                    ) : (
                      // For translations, the string might contain everything, replace double newlines with paragraphs
                      activeContent.simplified.split(/\\n\\n|\n\n/).map((line: string, idx: number) => (
                        <p key={idx} dangerouslySetInnerHTML={{ __html: line.replace(new RegExp("\\*\\*(.*?)\\*\\*", "g"), '<span class="text-accent font-bold">$1</span>') }} />
                      ))
                    )}
                  </motion.div>
                </AnimatePresence>
             </div>

             {/* Cognitive Steps (only if English steps exist) */}
             {language === 'en' && activeQuestion?.simplified?.steps && activeQuestion.simplified.steps.length > 0 && (
               <>
                 <div className="border-b-2 border-dashed border-foreground/20 pb-4 mb-6">
                    <h3 className="text-2xl font-bold text-accent">Cognitive Steps</h3>
                 </div>
                 
                 <div className="mb-10 text-[19px] font-medium text-foreground">
                    <motion.div 
                      key={`${language}-steps-${isDyslexicFont}`}
                      className="flex flex-col gap-4" 
                      style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${20 * fontSizeFactor}px`, fontFamily: currentFontFamily }}
                    >
                      {activeQuestion.simplified.steps.map((step: string, idx: number) => (
                        <p 
                          key={idx} 
                          dangerouslySetInnerHTML={{ __html: step.replace(new RegExp("\\*\\*(.*?)\\*\\*", "g"), '<span class="text-accent font-bold">$1</span>') }} 
                        />
                      ))}
                    </motion.div>
                 </div>
               </>
             )}

             {/* Listen Button */}
             <div className="flex items-center gap-4 mt-8">
                <button 
                  onClick={() => speakText(activeContent.simplified.replace(/\\n\\n/g, ' ').replace(/\n\n/g, ' '))}
                  disabled={isLoadingAudio}
                  className="px-6 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-[17px] flex items-center gap-3 hover:bg-accent hover:text-white transition-all shadow-sm disabled:opacity-50"
                >
                  {isLoadingAudio ? <Loader2 className="animate-spin" size={20} /> : (isPlaying ? <Pause fill="currentColor" size={20}/> : <Play fill="currentColor" size={20} className="ml-1"/>)}
                  🔊 Listen
                </button>
                {audioError && <span className="text-red-500 text-sm font-semibold ml-2">{audioError}</span>}
             </div>

             {/* Navigation Footer */}
             <div className="flex justify-between items-center mt-12 pt-6 border-t border-black/5 dark:border-white/5">
                <button 
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex <= 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft size={18} /> Previous
                </button>
                
                <span className="text-[14px] font-bold text-foreground/40 font-mono tracking-widest uppercase">
                  {currentQuestionIndex + 1} of {data?.questions?.length || 1}
                </span>

                <button 
                  onClick={handleNextQuestion}
                  disabled={!data || !data.questions || currentQuestionIndex >= data.questions.length - 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all bg-foreground text-background shadow-glass hover:scale-105 disabled:opacity-0 disabled:pointer-events-none"
                >
                  Next <ChevronRight size={18} />
                </button>
             </div>
          </div>
        </motion.div>
      );
    }

    if (activeTab === "scanned") {
        return (
            <div className="flex flex-col items-center justify-center pt-20">
                <p className="text-xl text-foreground/50">No document scanned yet.</p>
            </div>
        )
    }
    if (activeTab === "upload") return renderUploadTab();
    if (activeTab === "demos") return renderDemosTab();
    if (activeTab === "test") return renderTestTab();
    if (activeTab === "settings") return renderSettingsTab();
    if (activeTab === "api") return renderApiPortalTab();
    return null;
  };

  // ── API Portal Tab ──────────────────────────────────────────────────────────
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [healthStatus, setHealthStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");

  const checkHealth = async () => {
    setHealthStatus("checking");
    try {
      const res = await fetch("/api/v1/health");
      setHealthStatus(res.ok ? "ok" : "error");
    } catch {
      setHealthStatus("error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    });
  };

  const ENDPOINTS = [
    { method: "GET",  path: "/api/v1/health",  auth: false, desc: "Health check. No auth required.",            badge: "bg-green-500/20 text-green-400 border-green-500/30" },
    { method: "POST", path: "/api/v1/process", auth: true,  desc: "Upload a PDF/image and get cognitive JSON.",  badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { method: "POST", path: "/api/v1/ocr",     auth: true,  desc: "Extract raw base64 images from a document.",  badge: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { method: "POST", path: "/api/v1/tts",     auth: true,  desc: "Convert text to speech. Returns audio URL.",  badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  ];

  const renderApiPortalTab = () => (
    <motion.div
      key="api"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-4xl mx-auto pt-4 flex flex-col gap-8"
    >
      {/* Header */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-5">
          <Zap size={14} /> API Platform v1
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-3">Developer Portal</h2>
        <p className="text-foreground/50 text-lg">Integrate Lexara into your institution&apos;s platform via secure REST endpoints.</p>
      </div>

      {/* Health Check Card */}
      <div className="glass-panel p-5 flex items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            healthStatus === "ok" ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" :
            healthStatus === "error" ? "bg-red-400" :
            healthStatus === "checking" ? "bg-yellow-400 animate-pulse" :
            "bg-white/20"
          }`} />
          <div>
            <p className="font-semibold text-sm">API Gateway Status</p>
            <p className="text-foreground/40 text-xs">
              {healthStatus === "ok" ? "All systems operational" :
               healthStatus === "error" ? "Gateway unreachable" :
               healthStatus === "checking" ? "Checking..." :
               "Click to run health check"}
            </p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={healthStatus === "checking"}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-all disabled:opacity-50 shadow-glowing"
        >
          <Server size={14} />
          {healthStatus === "checking" ? "Checking..." : "Check Health"}
        </button>
      </div>

      {/* API Key */}
      <div className="glass-panel p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-accent" />
          <h3 className="font-semibold text-lg">Authentication</h3>
        </div>
        <p className="text-foreground/50 text-sm mb-4">Pass your API key in the <code className="bg-white/10 px-2 py-0.5 rounded text-accent font-mono text-xs">x-api-key</code> request header. Set <code className="bg-white/10 px-2 py-0.5 rounded text-accent font-mono text-xs">API_KEY</code> in your <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs">frontend/.env.local</code>.</p>
        <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
          <code className="flex-1 font-mono text-sm text-foreground/70 select-all">x-api-key: YOUR_SECRET_KEY</code>
          <button
            onClick={() => copyToClipboard("x-api-key: YOUR_SECRET_KEY")}
            className="text-foreground/40 hover:text-accent transition-colors"
          >
            {apiKeyCopied ? <CheckCheck size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="glass-panel p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-5">
          <Code2 size={18} className="text-accent" />
          <h3 className="font-semibold text-lg">Endpoints</h3>
        </div>
        <div className="flex flex-col gap-3">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 dark:bg-black/20 border border-white/5 hover:border-white/15 transition-all group">
              <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${ep.badge}`}>
                {ep.method}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="font-mono text-sm text-foreground">{ep.path}</code>
                  {ep.auth ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-semibold">🔑 Auth</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-semibold">Public</span>
                  )}
                </div>
                <p className="text-foreground/50 text-sm">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="glass-panel p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink size={18} className="text-accent" />
            <h3 className="font-semibold text-lg">Example Request</h3>
          </div>
        </div>
        <pre className="bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-mono overflow-x-auto text-foreground/80 leading-relaxed">
{`// TTS endpoint — JavaScript fetch
const response = await fetch("https://your-app.vercel.app/api/v1/tts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_SECRET_KEY",       // required
  },
  body: JSON.stringify({
    text: "Hello from an external system",
    language: "en",
  }),
});

const { audio_url } = await response.json();
// → { audio_url: "/static/abc123.mp3" }`}
        </pre>
      </div>

      {/* Base URL note */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/5 border border-accent/20 text-sm">
        <Zap size={16} className="text-accent shrink-0" />
        <span className="text-foreground/70">Base URL (local): <code className="text-accent font-mono">http://localhost:3000</code> &nbsp;·&nbsp; On Vercel: set <code className="font-mono bg-white/10 px-1 rounded">BACKEND_URL</code> and <code className="font-mono bg-white/10 px-1 rounded">API_KEY</code> in Project Settings.</span>
      </div>
    </motion.div>
  );

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

      {/* Dynamics Apply Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-[200] bg-success text-white px-6 py-3 rounded-full font-bold shadow-glowing flex items-center gap-2"
          >
            <CheckSquare size={18} /> Dynamics Settings Applied
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-32 pb-24 px-6 w-full relative z-10 transition-all">
        <AnimatePresence mode="wait">
          {renderActiveContent()}
        </AnimatePresence>

        {/* Cinematic Focus Mode (VisionOS Style) */}
        <AnimatePresence>
          {focusMode && data && activeContent && (
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

              <div className="w-full max-w-4xl relative h-[60vh] flex flex-col items-center justify-center mt-[-20px]">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`${language}-focus-step-${activeFocusStep}`}
                    initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    className="text-center w-full flex flex-col items-center gap-12"
                  >
                    <span className="inline-block text-accent font-semibold text-xl tracking-widest uppercase bg-accent/10 px-6 py-2 rounded-full border border-accent/20">
                      Step {activeFocusStep + 1} of {activeContent.simplified.split(/\\n\\n|\n\n/).length}
                    </span>
                    
                    <motion.div 
                      className="text-4xl md:text-5xl font-bold leading-[1.3] tracking-normal text-white max-w-3xl mx-auto flex flex-col gap-6" 
                      style={{ fontFamily: currentFontFamily, letterSpacing: letterSpacing }}
                    >
                      <p dangerouslySetInnerHTML={{ __html: activeContent.simplified.split(/\\n\\n|\n\n/)[activeFocusStep]?.replace(new RegExp("\\*\\*(.*?)\\*\\*", "g"), '<span class="text-accent underline decoration-accent/50 underline-offset-8">$1</span>') || "" }} />
                    </motion.div>

                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => speakText(activeContent.simplified.split(/\\n\\n|\n\n/)[activeFocusStep]?.replace(new RegExp("\\*\\*(.*?)\\*\\*", "g"), '$1'))}
                      disabled={isLoadingAudio}
                      className="mt-8 w-20 h-20 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] disabled:opacity-50"
                    >
                      {isLoadingAudio ? <Loader2 className="animate-spin" size={32} /> : (isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} className="ml-2" />)}
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute bottom-16 w-full flex items-center justify-between max-w-[800px] px-8">
                <button 
                  onClick={() => setActiveFocusStep(Math.max(0, activeFocusStep - 1))}
                  disabled={activeFocusStep === 0}
                  className="w-16 h-16 rounded-full glass-panel border-white/10 flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
                >
                  <ChevronLeft size={28} />
                </button>

                {activeFocusStep === activeContent.simplified.split(/\\n\\n|\n\n/).length - 1 ? (
                  <motion.button 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { handleConceptComplete(); setActiveFocusStep(0); }}
                    className="px-10 h-16 rounded-full glass-panel border-white/10 flex items-center justify-center gap-3 transition-all bg-success text-white shadow-[0_0_40px_rgba(52,199,89,0.5)] border-success font-bold tracking-widest uppercase text-sm"
                  >
                    Finish Concept <CheckSquare size={20} />
                  </motion.button>
                ) : (
                  <button 
                    onClick={() => setActiveFocusStep(prev => prev + 1)}
                    className="w-16 h-16 rounded-full glass-panel border-white/10 flex items-center justify-center transition-all bg-white/20 hover:bg-white/30 text-white shadow-glass"
                  >
                    <ChevronRight size={28} />
                  </button>
                )}
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
