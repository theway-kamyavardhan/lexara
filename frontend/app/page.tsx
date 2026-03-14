"use client";

import { useState, useRef, useEffect, useCallback, MouseEvent } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Spring } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Upload, Sparkles, ArrowRight, Play, Pause, ChevronRight, ChevronLeft, 
  Volume2, Search, Type, Maximize2, Minimize2, X, AlertCircle,
  BookOpen, Settings, FileText, Globe, Atom, Binary, Loader2, Award, Heart, Download
} from "lucide-react";

interface CognitiveData {
  original: string;
  simplified: string;
  options?: string[];
}

interface QuestionResponse {
  id: string;
  en: CognitiveData;
  hi: CognitiveData;
}

interface ProcessedData {
  questions: QuestionResponse[];
}

// Mock Data for Demo Questions Strategy
const DEMO_QUESTIONS: Record<string, ProcessedData & { icon: React.ReactNode, title: string }> = {
  Maths: {
    icon: <Binary size={20} />,
    title: "Algebra & Logic",
    questions: [
      {
        id: "q_maths_1",
        en: {
          original: "A train travels 120 km in 2 hours. What is its average speed?",
          simplified: "A train goes 120 kilometers. It takes 2 hours. How fast is it going on average?",
          options: []
        },
        hi: {
          original: "एक ट्रेन 2 घंटे में 120 किमी की यात्रा करती है। इसकी औसत गति क्या है?",
          simplified: "एक ट्रेन 120 किलोमीटर जाती है। इसमें 2 घंटे लगते हैं। औसतन यह कितनी तेज जा रही है?",
          options: []
        }
      }
    ]
  },
  Science: {
    icon: <Atom size={20} />,
    title: "Physics & Energy",
    questions: [
       {
        id: "q_science_1",
        en: {
          original: "Explain the process of photosynthesis in plants and its role in the carbon cycle.",
          simplified: "Plants make their own food using sunlight. This process is called photosynthesis.",
        },
        hi: {
          original: "पौधों में प्रकाश संश्लेषण की प्रक्रिया और कार्बन चक्र में इसकी भूमिका की व्याख्या करें।",
          simplified: "पौधे सूर्य के प्रकाश का उपयोग करके अपना भोजन स्वयं बनाते हैं। इस प्रक्रिया को प्रकाश संश्लेषण कहा जाता है।",
        }
      },
      {
        id: "q_science_2",
        en: {
          original: "Which of the following is NOT a greenhouse gas?\n(A) Carbon dioxide\n(B) Methane\n(C) Nitrogen\n(D) Nitrous oxide",
          simplified: "Some gases trap heat in the Earth’s atmosphere. These are called greenhouse gases. Which option below is NOT one of them?",
          options: ["(A) Carbon dioxide", "(B) Methane", "(C) Nitrogen", "(D) Nitrous oxide"]
        },
        hi: {
          original: "निम्नलिखित में से कौन सी ग्रीनहाउस गैस नहीं है?\n(A) कार्बन डाईऑक्साइड\n(B) मीथेन\n(C) नाइट्रोजन\n(D) नाइट्रस ऑक्साइड",
          simplified: "कुछ गैसें पृथ्वी के वायुमंडल में गर्मी को रोकती हैं। इन्हें ग्रीनहाउस गैसें कहा जाता है। नीचे दिए गए विकल्पों में से कौन सी गैस ऐसी नहीं है?",
          options: ["(A) कार्बन डाईऑक्साइड", "(B) मीथेन", "(C) नाइट्रोजन", "(D) नाइट्रस ऑक्साइड"]
        }
      }
    ]
  },
  Hindi: {
    icon: <Globe size={20} />,
    title: "Literature",
    questions: [
      {
        id: "q_hindi_1",
        en: {
          original: "How is the realistic portrayal of the Indian farmer's plight depicted in Premchand's stories?",
          simplified: "Premchand's stories show the difficulties of poor farmers.",
        },
        hi: {
          original: "प्रेमचंद की कहानियों में भारतीय किसान की दुर्दशा का यथार्थवादी चित्रण कैसे किया गया है?",
          simplified: "प्रेमचंद की कहानियों में गरीब किसानों की मुश्किलें दिखाई गई हैं।",
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
  const [activeTab, setActiveTab] = useState<"upload" | "scanned" | "demos" | "settings">("upload");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Gamification & Wellbeing State
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
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Derived Content
  const activeQuestion = data?.questions.find(q => q.id === activeQuestionId);
  const activeContent = activeQuestion ? (activeQuestion as any)[language] || (activeQuestion as any)["en"] : null;

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
        if (parsed && parsed.questions) {
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
  const handleTabChange = (tab: "upload" | "scanned" | "demos" | "settings") => {
    setActiveTab(tab);
    // Remove data-clearing to preserve the scanned document state globally
    setAudioError(null);
  };
  
  // Apply Font Size dynamic styling
  const fontSizeFactor = fontSize === "large" ? 1.2 : fontSize === "small" ? 0.9 : 1;
  const lineSpacing = isDyslexicFont ? 2.5 : 1.6;
  const letterSpacing = isDyslexicFont ? 0.08 : -0.01;

  const toggleFont = () => setIsDyslexicFont(!isDyslexicFont);

  // Server-Side OpenAI TTS implementation
  const speakText = async (text: string) => {
    setAudioError(null);
    if (isPlaying && audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    
    setIsLoadingAudio(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
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

  // Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Step 1: Upload and Extract Text (OCR)
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"}/api/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error("Failed to upload and extract text");
      const uploadData = await uploadRes.json();
      
      setIsUploading(false);
      setIsProcessing(true);

      // Step 2: Send extracted Base64 Images for Vision Cognitive Processing
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"}/api/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: uploadData.images })
      });
      
      if (!processRes.ok) throw new Error("Failed to cognitively process the text");
      const result = await processRes.json();
      
      setData(result);
      setActiveQuestionId(null);
      setLanguage("en");
      setActiveTab("scanned"); // Automatically jump to the new Scanned tab
    } catch (e) {
      console.error(e);
      // Fallback to Demo Data to ensure presentation is never blocked
      loadDemoData("Maths"); 
    } finally {
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

    // If we already have the translation cached, switch instantly
    if ((activeQuestion as any)[targetLang]) {
      setLanguage(targetLang);
      return;
    }

    // Otherwise, translate using backend API
    try {
      setIsTranslating(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           data: (activeQuestion as any)["en"], // Always translate from English base to avoid degraded translations
           target_language: targetLang 
        })
      });

      if (!res.ok) throw new Error("Translation failed");
      const translatedData = await res.json();

      // Deep copy and update the data state to cache the new language forever
      setData(prev => {
        if (!prev) return prev;
        const newQuestions = prev.questions.map(q => {
          if (q.id === activeQuestionId) {
            return { ...q, [targetLang]: translatedData };
          }
          return q;
        });
        const newData = { ...prev, questions: newQuestions };
        
        // Auto-persist translated cache
        localStorage.setItem("lexara_saved_data", JSON.stringify(newData));
        return newData;
      });

      setLanguage(targetLang);
    } catch (e) {
      console.error(e);
      setAudioError("Translation service unavailable.");
    } finally {
      setIsTranslating(false);
    }
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
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = `Lexara_Dyslexic_Document_${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error(e);
      setAudioError("Failed to generate Dyslexic PDF.");
    } finally {
      setIsExporting(false);
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
          { id: "demos", icon: <Sparkles size={16} />, label: "Cognitive Demos" },
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
              {DEMO_QUESTIONS[sub].questions[0].en.original}
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
                key={q.id} 
                onClick={() => { setActiveQuestionId(q.id); setCurrentStepIndex(0); }}
                className="hover:scale-[1.01]"
              >
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold shrink-0 mt-1 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[17px] font-medium text-foreground mb-4 line-clamp-3">{q.en.original}</p>
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
                  key={`${language}-${isDyslexicFont ? 'dys-orig' : 'norm-orig'}`}
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  className="text-[17px] font-medium text-foreground/70" 
                  style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${17 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                >
                  {activeContent.original}
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
                      onClick={() => speakText(activeContent.simplified)}
                      disabled={isLoadingAudio}
                      className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      {isPlaying ? <Pause fill="currentColor" size={18}/> : <Play fill="currentColor" size={18} className="ml-1"/>}
                    </button>
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.h1 
                    key={`${language}-${isDyslexicFont ? 'dys-simp' : 'norm-simp'}`}
                    initial={{ opacity: 0, filter: "blur(8px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(8px)" }}
                    className="font-bold tracking-tight text-foreground" 
                    style={{ lineHeight: lineSpacing, letterSpacing: `${letterSpacing}em`, fontSize: `${32 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                  >
                    {activeContent.simplified}
                  </motion.h1>
                </AnimatePresence>

                {activeContent.options && activeContent.options.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...springConfig }}
                    className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {activeContent.options.map((opt: string, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => speakText(opt)}
                        disabled={isLoadingAudio}
                        className="p-6 rounded-2xl border-2 border-black/5 dark:border-white/5 hover:border-accent bg-white/40 dark:bg-black/20 text-left transition-all hover:shadow-glass hover:-translate-y-1 group flex items-start justify-between gap-4 disabled:opacity-50"
                      >
                        <span className="font-semibold text-foreground/80 group-hover:text-foreground/100 transition-colors" style={{ fontSize: `${22 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}>
                          {opt}
                        </span>
                        <div className="w-10 h-10 shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors text-foreground/50">
                          <Volume2 size={18} />
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
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
                    key={`${language}-focus-mode`}
                    initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    className="text-center w-full flex flex-col items-center gap-12"
                  >
                    <span className="inline-block text-accent font-semibold text-xl tracking-widest uppercase bg-accent/10 px-6 py-2 rounded-full border border-accent/20">
                      Dyslexic Adjusted
                    </span>
                    
                    {/* Add smooth wavy blur transition on font change */}
                    <AnimatePresence mode="wait">
                      <motion.h2 
                        key={`${language}-${isDyslexicFont ? 'dyslexic' : 'normal'}`}
                        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="text-4xl md:text-5xl font-bold leading-[1.3] tracking-normal text-white max-w-3xl mx-auto" 
                        style={{ fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit', letterSpacing: letterSpacing }}
                      >
                        {activeContent.simplified}
                      </motion.h2>
                    </AnimatePresence>

                    {activeContent.options && activeContent.options.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                        {activeContent.options.map((opt: string, i: number) => (
                          <button 
                            key={i}
                            onClick={() => speakText(opt)}
                            disabled={isLoadingAudio}
                            className="bg-white/10 hover:bg-white/20 border-2 border-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-300 rounded-3xl p-6 flex items-center justify-between group disabled:opacity-50 text-left"
                          >
                            <span 
                              className="text-white font-semibold flex-1 pr-4" 
                              style={{ fontSize: `${24 * fontSizeFactor}px`, fontFamily: isDyslexicFont ? 'OpenDyslexic' : 'inherit' }}
                            >
                              {opt}
                            </span>
                            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-accent group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                              <Volume2 size={20} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => speakText(activeContent.simplified)}
                      disabled={isLoadingAudio}
                      className="mt-4 w-20 h-20 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] disabled:opacity-50"
                    >
                      {isLoadingAudio ? <Loader2 className="animate-spin" size={32} /> : (isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} className="ml-2" />)}
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute bottom-16 w-full flex items-center justify-center">
                <motion.button 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConceptComplete}
                  className="w-20 h-20 rounded-full glass-panel border-white/10 flex items-center justify-center transition-all bg-success text-white shadow-[0_0_40px_rgba(52,199,89,0.5)] border-success"
                >
                  <span className="sr-only">Complete</span>
                  <Award size={32} />
                </motion.button>
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
