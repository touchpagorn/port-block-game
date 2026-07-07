import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Trophy, 
  Printer, 
  Database, 
  Volume2, 
  VolumeX, 
  Zap, 
  Terminal, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  RefreshCw, 
  Sparkles, 
  Flame, 
  Target, 
  Trash2,
  Lock,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import { SERVICE_POOL, generateRandomQuestions } from "./data/services";
import BarcodeSVG from "./components/BarcodeSVG";
import { LeaderboardEntry, GameSession, AnswerRecord, Question } from "./types";

// Audio Synthesis Helpers for tactile game sounds
const playSynthBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = "sine";
    osc.frequency.value = 1450; // crisp scanner beep
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported");
  }
};

const playSynthBuzz = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported");
  }
};

const playSynthDing = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
    };

    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    playTone(523.25, 0, 0.1); // C5
    playTone(659.25, 0.08, 0.1); // E5
    playTone(783.99, 0.16, 0.25); // G5
  } catch (e) {
    console.warn("Audio Context blocked or unsupported");
  }
};

export default function App() {
  // Tabs: "play" | "leaderboard" | "print" | "admin"
  const [activeTab, setActiveTab] = useState<"play" | "leaderboard" | "print" | "admin">("play");
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  
  // Current game session
  const [playerName, setPlayerName] = useState<string>("");
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  
  // Interactive Scan Simulation states
  const [isLaserGunMode, setIsLaserGunMode] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string>("");
  const [scanFeedbackMsg, setScanFeedbackMsg] = useState<string>("");
  
  // Question step navigation states
  const [showAnswerResult, setShowAnswerResult] = useState<boolean>(false);
  const [currentAnswerRecord, setCurrentAnswerRecord] = useState<AnswerRecord | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  
  // Manual text entry fallback for developers/scanners that type manually
  const [manualInput, setManualInput] = useState<string>("");
  const [keyboardScannerBuffer, setKeyboardScannerBuffer] = useState<string>("");
  
  // Countdown or ticking clock for game duration
  const [gameTimer, setGameTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch leaderboard helper
  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Poll leaderboard continuously if on leaderboard tab (real-time TV screen at booth!)
  useEffect(() => {
    fetchLeaderboard();
    if (activeTab === "leaderboard") {
      const interval = setInterval(fetchLeaderboard, 2500);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Handle ticking timer during active game play
  useEffect(() => {
    if (gameSession && !gameSession.isFinished && !showAnswerResult) {
      timerRef.current = setInterval(() => {
        setGameTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameSession, showAnswerResult]);

  // Hook physical barcode scanner key listeners
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore keys if typing in the user name input
      if (document.activeElement?.tagName === "INPUT") {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Barcode scanners feed inputs extremely rapidly (< 50ms per key)
      // or we can allow regular keyboard entries for testing
      if (e.key === "Enter") {
        if (buffer.trim()) {
          const finalCode = buffer.trim().toUpperCase();
          processScannedCode(finalCode);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        // Build the characters buffer
        if (timeDiff > 200) {
          // Slow typing: reset buffer unless it is building a clean code prefix
          if (!e.key.match(/[a-zA-Z0-9_]/)) {
            buffer = "";
          } else {
            buffer = e.key;
          }
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [gameSession, showAnswerResult]);

  // Process any scanned code (either virtual click, text input, or physical scanner gun)
  const processScannedCode = (code: string) => {
    if (!gameSession || gameSession.isFinished || showAnswerResult || currentQuestions.length === 0) return;

    const currentQuestion = currentQuestions[gameSession.currentQuestionIndex];
    // Check if the code belongs to one of the options of the current question
    const matchedOption = currentQuestion.options.find(
      (opt) => opt.code.toUpperCase() === code.toUpperCase()
    );

    if (matchedOption) {
      if (soundEnabled) playSynthBeep();
      setLastScannedCode(code);
      setScanFeedbackMsg(`เลือกบล็อกพอร์ต: "${matchedOption.code}"`);
      
      const isCorrect = code === currentQuestion.correctCode;
      const timeTakenMs = Date.now() - questionStartTime;
      
      // Points allocation: 100 base + time bonus (max 100, decaying over 30s)
      const maxTimeBonus = 100;
      const decayDuration = 30000; // 30 seconds
      const timeBonus = Math.max(0, Math.round(maxTimeBonus * (1 - timeTakenMs / decayDuration)));
      const questionScore = isCorrect ? (100 + timeBonus) : 0;

      const record: AnswerRecord = {
        questionId: currentQuestion.id,
        selectedCode: code,
        isCorrect,
        timeTakenMs
      };

      if (isCorrect) {
        if (soundEnabled) setTimeout(playSynthDing, 150);
      } else {
        if (soundEnabled) setTimeout(playSynthBuzz, 150);
      }

      setCurrentAnswerRecord(record);
      setShowAnswerResult(true);

      setGameSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          answers: [...prev.answers, record],
          score: prev.score + questionScore
        };
      });
    } else {
      // Not a valid option for this question
      setScanFeedbackMsg(`พอร์ตความปลอดภัยนี้ไม่มีในรายการเลือกหรือเลือกบล็อกพอร์ตไม่ถูกต้อง: "${code}"`);
      if (soundEnabled) playSynthBuzz();
      // Flash a quick error border on UI
      setTimeout(() => setScanFeedbackMsg(""), 3000);
    }
  };

  // Start new game action
  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    // Dynamically generate 5 randomized rounds of service port blocking
    const questions = generateRandomQuestions(5);
    setCurrentQuestions(questions);

    setGameTimer(0);
    setQuestionStartTime(Date.now());
    setShowAnswerResult(false);
    setCurrentAnswerRecord(null);
    setScanFeedbackMsg("");
    setLastScannedCode("");

    setGameSession({
      playerName: playerName.trim(),
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
      score: 0,
      isFinished: false
    });
  };

  // Move to next question or complete game
  const handleNextQuestion = async () => {
    if (!gameSession || currentQuestions.length === 0) return;

    const nextIndex = gameSession.currentQuestionIndex + 1;
    if (nextIndex < currentQuestions.length) {
      // Move to next
      setQuestionStartTime(Date.now());
      setShowAnswerResult(false);
      setCurrentAnswerRecord(null);
      setLastScannedCode("");
      setScanFeedbackMsg("");
      
      setGameSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentQuestionIndex: nextIndex
        };
      });
    } else {
      // Finish game!
      const totalTimeMs = gameTimer * 1000;
      const finalSession = {
        ...gameSession,
        isFinished: true
      };
      setGameSession(finalSession);

      // Trigger Confetti for high scores
      if (finalSession.score > 250) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#00FF41", "#10b981", "#3b82f6"]
        });
      }

      // Submit score to Express backend API
      try {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalSession.playerName,
            score: finalSession.score,
            timeMs: totalTimeMs
          })
        });
        fetchLeaderboard();
      } catch (err) {
        console.error("Failed to submit score", err);
      }
    }
  };

  // Reset/Restart game from beginning
  const handleResetGame = () => {
    setGameSession(null);
    setPlayerName("");
    setGameTimer(0);
    setCurrentQuestions([]);
  };

  // Generate simulated players for booth demo
  const handleAddDemoPlayers = async () => {
    const names = ["ZeroCool_95", "Alice_Crypto", "Malware_Slayer", "RedTeam_Lead", "BlueShield"];
    for (const name of names) {
      const score = Math.floor(Math.random() * 4) * 100 + 100 + Math.floor(Math.random() * 90);
      const timeMs = Math.floor(Math.random() * 30000) + 20000;
      try {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, score, timeMs })
        });
      } catch (err) {
        console.error(err);
      }
    }
    fetchLeaderboard();
  };

  // Clear leaderboard database
  const handleClearLeaderboard = async () => {
    if (confirm("Are you sure you want to reset the leaderboard for a new day?")) {
      try {
        await fetch("/api/leaderboard/reset", { method: "POST" });
        fetchLeaderboard();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex flex-col font-sans selection:bg-neon-green/30 selection:text-neon-green">
      
      {/* HEADER SECTION */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Subheading */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-950 border border-[#00FF41]/40 rounded-lg text-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.15)]">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-black italic tracking-tighter uppercase text-white leading-none">
                  PORT <span className="text-[#00FF41]">BLOCKER</span>
                </h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00FF41]/30 bg-[#00FF41]/10 text-[#00FF41] font-mono font-bold uppercase animate-pulse">
                  Booth Mode
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-1">
                Defend the Core Network &bull; Block the Attack Ports
              </p>
            </div>
          </div>

          {/* Real-time status bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="hidden md:flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-1.5 text-xs text-zinc-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF41] shadow-[0_0_10px_#00FF41] animate-ping"></span>
              <span className="tracking-widest uppercase">System Status: Monitoring Active Threats</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              title={soundEnabled ? "Mute Game Sounds" : "Enable Game Sounds"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="max-w-7xl mx-auto mt-3 flex border-t border-zinc-800 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("play")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === "play"
                ? "bg-[#00FF41] text-black shadow-[0_0_15px_#00FF41] border border-[#00FF41]"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Target size={14} />
            <span>เล่นเกม (Play Challenge)</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === "leaderboard"
                ? "bg-[#00FF41] text-black shadow-[0_0_15px_#00FF41] border border-[#00FF41]"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Trophy size={14} />
            <span>ลีดเดอร์บอร์ด (Live TV Board)</span>
          </button>

          <button
            onClick={() => setActiveTab("print")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === "print"
                ? "bg-[#00FF41] text-black shadow-[0_0_15px_#00FF41] border border-[#00FF41]"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Printer size={14} />
            <span>ปริ้นท์บาร์โค้ดการ์ด (Printed Codes)</span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === "admin"
                ? "bg-[#00FF41] text-black shadow-[0_0_15px_#00FF41] border border-[#00FF41]"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Database size={14} />
            <span>หลังบ้าน / รีเซ็ต (Booth Config)</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-start">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PLAY GAME */}
          {activeTab === "play" && (
            <motion.div
              key="play-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2"
            >
              
              {/* Left Column: Interactive Stage (Col Span 8) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* GAME ONBOARDING */}
                {!gameSession ? (
                  <motion.div 
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="p-8 rounded-2xl bg-zinc-900 border-2 border-zinc-800 shadow-[0_0_40px_rgba(0,255,65,0.05)]"
                  >
                    <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-950 border-2 border-[#00FF41]/40 flex items-center justify-center text-[#00FF41] animate-bounce shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                        <Terminal size={32} />
                      </div>
                      
                      <div>
                        <h1 className="text-5xl md:text-6xl font-display font-black italic tracking-tighter uppercase mb-2 leading-[0.85]">
                          PORT<br/><span className="text-[#00FF41]">BLOCKER</span>
                        </h1>
                        <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-md uppercase tracking-tight font-sans mt-3">
                          Analyze the randomized network services and block the correct ports under pressure.
                        </p>
                      </div>

                      {/* Setup Instructions for Mobile & Booth */}
                      <div className="w-full text-left bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs space-y-3 text-zinc-300 font-mono">
                        <div className="text-[#00FF41] font-black border-b border-zinc-800 pb-1.5 flex items-center gap-2 uppercase tracking-wider">
                          <Zap size={14} />
                          <span>คู่มือการรักษาความปลอดภัย (SECURITY MANUAL):</span>
                        </div>
                        <p className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#00FF41] font-bold">01/</span>
                          <span><strong>สำหรับผู้เล่นทางมือถือ:</strong> สามารถแตะที่ปุ่มพอร์ตตัวเลือกในหน้าจอเพื่อยืนยันคำตอบ "บล็อกพอร์ต" ได้ทันทีด้วยนิ้วเดียว</span>
                        </p>
                        <p className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#00FF41] font-bold">02/</span>
                          <span><strong>สำหรับบูธยิงปืนบาร์โค้ด:</strong> เล็งสแกนเนอร์แล้วยิงแถบบาร์โค้ดของพอร์ตที่ถูกต้องบนจอภาพ หรือยิงจากแผ่นรวมกระดาษปริ้นท์</span>
                        </p>
                        <p className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#00FF41] font-bold">03/</span>
                          <span><strong>การคำนวณคะแนน:</strong> คะแนนยืนพื้น 100 คะแนน และโบนัสความเร็วในการบล็อกสูงสุด +100 คะแนน (ยิ่งวิเคราะห์และบล็อกเร็ว ยิ่งได้คะแนนสูง!)</span>
                        </p>
                      </div>

                      <form onSubmit={handleStartGame} className="w-full flex flex-col gap-3">
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={20}
                            placeholder="กรอกชื่อแฮกเกอร์ / OPERATOR ALIAS"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-[#00FF41] rounded-xl px-5 py-4 text-base md:text-lg font-mono placeholder-zinc-700 focus:outline-none text-white text-center tracking-wide transition-all focus:shadow-[0_0_15px_rgba(0,255,65,0.15)]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-4 rounded-xl bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-display font-black text-lg uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,65,0.3)] transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                          <span>เริ่มเปิดระบบป้องกันและบล็อกพอร์ต</span>
                          <ArrowRight size={20} />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : gameSession.isFinished ? (
                  
                  // GAME FINISHED SCREEN
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-2xl bg-zinc-900 border-2 border-[#00FF41]/30 text-center flex flex-col items-center gap-6 shadow-[0_0_45px_rgba(0,255,65,0.06)]"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-[#00FF41]/10 border-2 border-[#00FF41] flex items-center justify-center text-[#00FF41] text-3xl font-bold shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                      <Trophy size={40} className="text-[#00FF41] animate-pulse" />
                    </div>

                    <div>
                      <h1 className="text-5xl md:text-6xl font-display font-black italic tracking-tighter uppercase text-white leading-none">
                        MISSION <span className="text-[#00FF41]">ACCOMPLISHED!</span>
                      </h1>
                      <p className="text-xs text-zinc-400 mt-2 font-mono tracking-widest uppercase">
                        INCIDENT RESPONSE PROTOCOL LOGGED SUCCESSFULLY
                      </p>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mt-2">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <span className="text-xs text-zinc-500 font-mono block uppercase tracking-wider mb-1">OPERATOR</span>
                        <span className="text-lg font-black font-mono text-white">{gameSession.playerName}</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <span className="text-xs text-zinc-500 font-mono block uppercase tracking-wider mb-1">FINAL SCORE</span>
                        <span className="text-2xl font-black font-mono text-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.2)]">{gameSession.score} PTS</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 col-span-2 md:col-span-1">
                        <span className="text-xs text-zinc-500 font-mono block uppercase tracking-wider mb-1">ELAPSED TIME</span>
                        <span className="text-2xl font-black font-mono text-orange-500">{gameTimer} SEC</span>
                      </div>
                    </div>

                    {/* Brief feedback based on score */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 w-full text-xs text-zinc-300 max-w-lg leading-relaxed font-mono uppercase tracking-tight">
                      {gameSession.score >= 450 ? (
                        <p className="text-[#00FF41] font-bold">
                          🥇 ยอดเยี่ยมระดับตำนาน! คุณตรวจจับวิกฤตและสแกนมาตรการป้องกันได้สมบูรณ์แบบระดับ SPECIALIST!
                        </p>
                      ) : gameSession.score >= 300 ? (
                        <p className="text-zinc-200 font-bold">
                          🥈 เก่งมาก! คุณตอบโต้วิกฤตได้ทันท่วงที ป้องกันระบบองค์กรจากการล่มสลายได้อย่างดีเยี่ยม
                        </p>
                      ) : (
                        <p className="text-orange-500 font-bold">
                          🥉 ผ่านเกณฑ์ขั้นต้น! ถือเป็นประสบการณ์เรียนรู้ที่ดีในบูธของเรา ลองเพิ่มความเร็วในการยิงและการตัดสินใจอีกนิด!
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 w-full max-w-md mt-2">
                      <button
                        onClick={handleResetGame}
                        className="flex-1 py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-200 font-mono text-xs font-bold transition-all border border-zinc-800 flex items-center justify-center gap-2 uppercase"
                      >
                        <RefreshCw size={14} />
                        <span>เล่นอีกครั้ง (RESTART)</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("leaderboard");
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,65,0.3)] flex items-center justify-center gap-2"
                      >
                        <Trophy size={14} />
                        <span>ดูอันดับบอร์ด</span>
                      </button>
                    </div>

                  </motion.div>
                ) : (
                  
                  // GAME PLAY STAGE
                  <div className="flex flex-col gap-5">
                    
                    {/* Game State Header */}
                    <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-3.5 flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] rounded-lg font-black uppercase tracking-widest text-[10px] sm:text-xs">
                          ROUND {gameSession.currentQuestionIndex + 1} / {currentQuestions.length}
                        </div>
                        <span className="text-zinc-400 hidden sm:inline uppercase text-[10px]">OPERATOR: {gameSession.playerName}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-orange-500 font-bold uppercase text-[11px] sm:text-xs">
                          <Clock size={12} className="shrink-0" />
                          <span>{gameTimer}S</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#00FF41] font-bold uppercase text-[11px] sm:text-xs">
                          <Sparkles size={12} className="shrink-0" />
                          <span>{gameSession.score}</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Threat Incident Screen */}
                    <motion.div
                      key={gameSession.currentQuestionIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-zinc-900 border-2 border-zinc-800 shadow-xl relative overflow-hidden"
                    >
                      {/* Interactive Background Grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

                      <div className="relative z-10 flex flex-col gap-3">
                        
                        {/* Status bar of Incident */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"></span>
                            <span className="text-[9px] text-red-500 font-mono uppercase tracking-widest font-black">
                              ALERT: INTRUSION ACTIVE
                            </span>
                          </div>
                          
                          {/* Threat level Badge */}
                          <div className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black tracking-wider border uppercase ${
                            currentQuestions[gameSession.currentQuestionIndex].threatLevel === "CRITICAL"
                              ? "bg-red-950/40 border-red-500/50 text-red-400"
                              : currentQuestions[gameSession.currentQuestionIndex].threatLevel === "HIGH"
                              ? "bg-amber-950/40 border-amber-500/50 text-amber-400"
                              : "bg-[#00FF41]/10 border-[#00FF41]/40 text-[#00FF41]"
                          }`}>
                            LEVEL: {currentQuestions[gameSession.currentQuestionIndex].threatLevel}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-base sm:text-lg font-display font-black tracking-tight text-white uppercase italic leading-tight">
                            {currentQuestions[gameSession.currentQuestionIndex].title}
                          </h3>
                          <p className="text-zinc-300 mt-2 text-xs font-mono leading-relaxed bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl">
                            {currentQuestions[gameSession.currentQuestionIndex].description}
                          </p>
                        </div>

                        {/* Scan input helper & status */}
                        <div className="border-t border-zinc-850 pt-3 flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
                          <span className="uppercase text-[#00FF41]/80 font-black">
                            🛡️ TARGET ATTACHED PORT:
                          </span>
                          
                          {/* Laser mode / hardware toggle - compact on mobile */}
                          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 shrink-0">
                            <button
                              onClick={() => setIsLaserGunMode(true)}
                              className={`px-1.5 py-0.5 rounded transition-all text-[8px] uppercase font-bold ${
                                isLaserGunMode 
                                  ? "bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30" 
                                  : "text-zinc-600"
                              }`}
                            >
                              TAP/LASER
                            </button>
                            <button
                              onClick={() => setIsLaserGunMode(false)}
                              className={`px-1.5 py-0.5 rounded transition-all text-[8px] uppercase font-bold ${
                                !isLaserGunMode 
                                  ? "bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30" 
                                  : "text-zinc-600"
                              }`}
                            >
                              GUN SCAN
                            </button>
                          </div>
                        </div>

                        {scanFeedbackMsg && (
                          <div className="p-2 rounded bg-zinc-950 border border-[#00FF41]/20 text-[10px] font-mono text-[#00FF41] text-center animate-pulse uppercase">
                            {scanFeedbackMsg}
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* OPTIONS GRID: Optimized 2x2 for mobile fingers */}
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestions[gameSession.currentQuestionIndex].options.map((option, idx) => {
                        const isSelected = lastScannedCode === option.code;
                        const isCorrectPort = option.code === currentQuestions[gameSession.currentQuestionIndex].correctCode;
                        
                        return (
                          <button
                            key={option.code}
                            disabled={showAnswerResult}
                            onClick={() => processScannedCode(option.code)}
                            className={`p-3.5 rounded-xl border-2 transition-all duration-300 relative flex flex-col justify-between items-center text-center gap-3 min-h-[140px] focus:outline-none ${
                              showAnswerResult && isCorrectPort
                                ? "border-[#00FF41] bg-[#00FF41]/5 shadow-[0_0_20px_rgba(0,255,65,0.1)] text-[#00FF41]"
                                : showAnswerResult && isSelected && !isCorrectPort
                                ? "border-red-500 bg-red-950/10 text-red-500"
                                : isSelected
                                ? "border-[#00FF41] bg-[#00FF41]/5 text-[#00FF41]"
                                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-850/40 text-zinc-100 active:scale-[0.98]"
                            }`}
                          >
                            {/* Option Index badge */}
                            <span className="absolute top-2 left-2 w-4.5 h-4.5 rounded bg-zinc-950 text-zinc-400 flex items-center justify-center font-mono text-[9px] font-black shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>

                            {/* Large Port Number */}
                            <div className="mt-2.5 w-full">
                              <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider">PORT</span>
                              <span className="text-2xl font-black font-mono tracking-tight block mt-0.5">
                                {option.code}
                              </span>
                            </div>

                            {/* Neon Barcode Design - Compact & Stylized */}
                            <div className="w-full h-8 opacity-40 hover:opacity-60 transition-opacity bg-zinc-950 border border-zinc-850/60 rounded flex items-center justify-center p-1 relative overflow-hidden">
                              <BarcodeSVG value={option.code} />
                              
                              {/* Laser Gun Aim Effect on hover */}
                              {isLaserGunMode && !showAnswerResult && (
                                <div className="absolute inset-0 bg-red-500/0 hover:bg-red-500/5 cursor-crosshair flex items-center justify-center transition-colors">
                                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-red-500/50 animate-pulse pointer-events-none"></div>
                                </div>
                              )}
                            </div>

                            {/* Interactive Virtual Button Label */}
                            <div className="w-full text-[9px] font-mono font-black uppercase tracking-wider py-1.5 rounded bg-zinc-950 border border-zinc-800/80">
                              {showAnswerResult ? (
                                isCorrectPort ? "✓ BLOCKED" : isSelected ? "✗ EXPLOITED" : "SECURE"
                              ) : (
                                "👆 TAP TO BLOCK"
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* RESULT CARD & NAVIGATION BLOCK */}
                    {showAnswerResult && currentAnswerRecord && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border-2 ${
                          currentAnswerRecord.isCorrect
                            ? "bg-zinc-900 border-[#00FF41]/40 shadow-[0_0_20px_rgba(0,255,65,0.05)]"
                            : "bg-zinc-900 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            currentAnswerRecord.isCorrect 
                              ? "bg-zinc-950 text-[#00FF41] border border-[#00FF41]/30" 
                              : "bg-zinc-950 text-red-500 border border-red-500/30"
                          }`}>
                            {currentAnswerRecord.isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <h4 className={`text-xs sm:text-sm font-black font-mono uppercase tracking-wider ${
                              currentAnswerRecord.isCorrect ? "text-[#00FF41]" : "text-red-500"
                            }`}>
                              {currentAnswerRecord.isCorrect 
                                ? "🛡️ ป้องกันพอร์ตสำเร็จ! (Port Blocked)" 
                                : "🚨 บล็อกพอร์ตผิด! ระบบโดนเจาะทะลวง (Exploited)"}
                            </h4>
                            
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                              {currentQuestions[gameSession.currentQuestionIndex].options.find(
                                (o) => o.code === currentAnswerRecord.selectedCode
                              )?.explanation}
                            </p>

                            <div className="text-[9px] text-zinc-500 font-mono flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800/80 pt-2 mt-1 uppercase tracking-wide">
                              <span>TIME SPENT: {(currentAnswerRecord.timeTakenMs / 1000).toFixed(2)}S</span>
                              {currentAnswerRecord.isCorrect && (
                                <span className="text-[#00FF41] font-bold">
                                  SPEED BONUS: +{Math.max(0, Math.round(100 * (1 - currentAnswerRecord.timeTakenMs / 30000)))} PTS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3.5 flex justify-end">
                          <button
                            onClick={handleNextQuestion}
                            className="w-full sm:w-auto py-3 px-5 rounded-lg bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,255,65,0.2)] flex items-center justify-center gap-1.5"
                          >
                            <span>
                              {gameSession.currentQuestionIndex + 1 < currentQuestions.length
                                ? "สแกนพอร์ตถัดไป (NEXT ROUND)"
                                : "สรุปผลคะแนนและบันทึกบอร์ด"}
                            </span>
                            <ArrowRight size={14} className="shrink-0" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Developer manual testing input box */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                        💡 <strong>สำหรับการสแกนด้วยปืนยิงจริง:</strong> เล็งสแกนเนอร์แล้วยิงเลย! สแกนเนอร์จะป้อนโค้ดอัตโนมัติ (หรือพิมพ์โค้ดคำตอบตรงนี้แล้วกด Enter เพื่อจำลอง: <code>ACTION_ISOLATE</code>)
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="จำลองพิมพ์คำตอบ..."
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              processScannedCode(manualInput.trim());
                              setManualInput("");
                            }
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-[#00FF41] w-36 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_10px_rgba(0,255,65,0.15)]"
                        />
                        <button
                          onClick={() => {
                            processScannedCode(manualInput.trim());
                            setManualInput("");
                          }}
                          className="bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-display font-black text-[10px] px-3.5 py-1 rounded transition-all uppercase tracking-wider"
                        >
                          ยิง
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Right Column: Live Board Sidebar Panel (Col Span 4) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Active Player Stats Summary */}
                <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,255,65,0.02)]">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
                    <Trophy className="text-[#00FF41]" size={16} />
                    <h3 className="font-display font-black text-xs text-white uppercase tracking-wider italic">
                      Top Defenders Today
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-mono border ${
                          index === 0
                            ? "bg-[#00FF41]/10 border-[#00FF41]/30 text-[#00FF41]"
                            : index === 1
                            ? "bg-zinc-950/80 border-zinc-800 text-zinc-300"
                            : "bg-zinc-950 border-zinc-900 text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${
                            index === 0 
                              ? "bg-[#00FF41] text-black" 
                              : "bg-zinc-800 text-zinc-300"
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-black truncate max-w-[120px] text-white uppercase">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-[#00FF41]">{entry.score} PTS</span>
                          <span className="text-zinc-700">|</span>
                          <span>{(entry.timeMs / 1000).toFixed(0)}s</span>
                        </div>
                      </div>
                    ))}

                    {leaderboard.length === 0 && (
                      <p className="text-zinc-500 text-xs font-mono text-center py-4 uppercase">
                        NO PROTOCOLS LOGGED YET
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab("leaderboard")}
                    className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-[#00FF41] hover:text-[#00FF41]/90 font-mono text-xs rounded-lg border border-[#00FF41]/20 transition-all text-center block uppercase tracking-wider font-bold"
                  >
                    ดูอันดับและเวลาทั้งหมด (Full View)
                  </button>
                </div>

                {/* Cyber Security Tip Block */}
                <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,255,65,0.02)]">
                  <div className="flex items-center gap-2 text-[#00FF41] font-display font-black text-xs mb-2 uppercase tracking-wider italic">
                    <Terminal size={14} />
                    <span>CYBER INTELLIGENCE NOTE</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium uppercase">
                    การทำ "Incident Response (IR)" สำคัญอย่างยิ่งที่ต้องคัดกรองภัยคุกคามให้แม่นยำ การเลือกมาตรการผิดพลาด (False Positive / False Action) อาจนำไปสู่สภาวะ "Denial of Service" หรือทำให้ข้อมูลเสียหายเพิ่มมากขึ้น เช่น การสั่งชัตดาวน์ระบบที่มี Ransomware อาจทำให้กู้คืนคีย์เข้ารหัสลับในแรมไม่ได้!
                  </p>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: FULL LEADERBOARD VIEW */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto mt-2"
            >
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,255,65,0.02)] relative overflow-hidden">
                
                {/* Cyber tech layout aesthetics */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#00FF41]/3 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#00FF41]/3 rounded-full blur-3xl pointer-events-none"></div>

                <div className="text-center space-y-2 mb-8 relative z-10">
                  <div className="inline-flex p-3 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded-2xl text-[#00FF41]">
                    <Trophy size={32} />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-display font-black italic tracking-tighter text-white uppercase">
                    DEFENDER <span className="text-[#00FF41]">LEADERBOARD</span>
                  </h1>
                  <p className="text-xs md:text-sm text-zinc-400 font-mono uppercase tracking-widest max-w-md mx-auto font-bold">
                    สรุปรายชื่อทีมความปลอดภัยไซเบอร์ผู้ทำคะแนนสูงสุดประจำบูธนิทรรศการ
                  </p>
                </div>

                <div className="bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden relative z-10 shadow-[0_0_30px_rgba(0,255,65,0.02)]">
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                    <div className="col-span-2 text-center">อันดับ (RANK)</div>
                    <div className="col-span-5">ชื่อผู้ท้าชิง (DEFENDER)</div>
                    <div className="col-span-2 text-right">คะแนน (SCORE)</div>
                    <div className="col-span-3 text-right">เวลาตอบโต้ (TIME)</div>
                  </div>

                  {/* Leaderboard Entries */}
                  <div className="divide-y divide-zinc-900 font-mono">
                    <AnimatePresence>
                      {leaderboard.map((entry, index) => {
                        const isTopThree = index < 3;
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center text-xs transition-colors hover:bg-zinc-900/60 ${
                              index === 0
                                ? "bg-[#00FF41]/5 text-white"
                                : index === 1
                                ? "bg-zinc-950/40 text-zinc-200"
                                : index === 2
                                ? "bg-zinc-950/20 text-zinc-300"
                                : "text-zinc-400"
                            }`}
                          >
                            {/* Rank Column */}
                            <div className="col-span-2 flex justify-center">
                              {index === 0 ? (
                                <span className="flex items-center gap-1 text-yellow-400 font-extrabold text-xs tracking-wider">
                                  🥇 1ST
                                </span>
                              ) : index === 1 ? (
                                <span className="flex items-center gap-1 text-zinc-300 font-extrabold text-xs tracking-wider">
                                  🥈 2ND
                                </span>
                              ) : index === 2 ? (
                                <span className="flex items-center gap-1 text-orange-500 font-extrabold text-xs tracking-wider">
                                  🥉 3RD
                                </span>
                              ) : (
                                <span className="text-zinc-500 text-xs font-bold">{index + 1}</span>
                              )}
                            </div>

                            {/* Name Column */}
                            <div className="col-span-5 font-bold flex items-center gap-2">
                              <span className="truncate max-w-[150px] md:max-w-none text-white uppercase tracking-tight">{entry.name}</span>
                              {isTopThree && (
                                <Flame size={12} className="text-rose-500 animate-pulse shrink-0" />
                              )}
                            </div>

                            {/* Score Column */}
                            <div className="col-span-2 text-right font-black text-[#00FF41]">
                              {entry.score} PTS
                            </div>

                            {/* Time Column */}
                            <div className="col-span-3 text-right text-zinc-400 text-xs">
                              <span className="font-bold text-orange-500">{(entry.timeMs / 1000).toFixed(1)}</span> SEC
                            </div>

                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {leaderboard.length === 0 && (
                      <div className="py-12 text-center text-zinc-500 text-xs uppercase tracking-wider font-bold">
                        {isLoadingLeaderboard ? "กำลังโหลดข้อมูลสด..." : "ยังไม่พบบันทึกแต้มคะแนน กดเริ่มเล่นเกมเป็นคนแรก!"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-zinc-500 bg-zinc-950 p-4 rounded-xl border border-zinc-850 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-[#00FF41]" />
                    <span>หน้านี้ออกแบบมาเพื่อเปิดค้างไว้ที่หน้าจอ TV บูธ ระบบจะดึงคะแนนสดอัตโนมัติ</span>
                  </div>
                  <button
                    onClick={fetchLeaderboard}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold border border-zinc-800 transition-all uppercase text-[9px]"
                  >
                    โหลดซ้ำแบบแมนนวล (Force Reload)
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: PRINTABLE ACTION BARCODES CHEAT SHEET */}
          {activeTab === "print" && (
            <motion.div
              key="print-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto mt-2 space-y-6"
            >
              
              {/* Informational Box */}
              <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed space-y-2 shadow-[0_0_15px_rgba(0,255,65,0.02)]">
                <div className="text-[#00FF41] font-bold text-sm flex items-center gap-2 mb-1 uppercase tracking-wider">
                  <Printer size={16} />
                  <span>ใบรวมการ์ดตอบโต้ภัยคุกคามไซเบอร์ (Printed Barcode Sheets)</span>
                </div>
                <p className="uppercase text-zinc-400">
                  เพื่อให้ประสบการณ์ที่บูธสนุกยิ่งขึ้น ผู้จัดบูธสามารถ<strong>ปริ้นท์กระดาษแผ่นนี้ออกมา</strong> วางไว้หน้าเคาน์เตอร์ เพื่อให้ผู้แข่งขันเล็งปืนสแกนเนอร์สแกนตอบคำถาม 5 ข้อได้อย่างง่ายดาย!
                </p>
                <p className="text-orange-500 font-bold uppercase">
                  * ปืนสแกนเนอร์บาร์โค้ดสากลสามารถยิงแถบบาร์โค้ดสีเขียว/ดำด้านล่างนี้ผ่านจอภาพได้เช่นกัน!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-display font-black text-xs uppercase tracking-wider rounded transition-all"
                  >
                    🖨️ สั่งปริ้นท์หน้านี้ (Print Cheat Sheet)
                  </button>
                </div>
              </div>

              {/* Grid of All Core Action Barcodes */}
              <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200">
                
                {/* Print Title Block */}
                <div className="text-center space-y-1 border-b-2 border-slate-200 pb-4 mb-6">
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    แผ่นบาร์โค้ดบล็อกพอร์ตไฟร์วอลล์ (Firewall Port Blocker Cheat Sheet)
                  </h2>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    FIREWALL PORT BLOCKER &bull; PRINTED PORT LISTS FOR BOOTH BARCODE GUNS
                  </p>
                </div>

                {/* Real-time printable Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  
                  {/* Port 22 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        SSH
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        Secure Shell (Port 22)
                      </h4>
                    </div>
                    <BarcodeSVG value="22" lightMode={true} />
                  </div>

                  {/* Port 80 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        HTTP
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        Web Server (Port 80)
                      </h4>
                    </div>
                    <BarcodeSVG value="80" lightMode={true} />
                  </div>

                  {/* Port 443 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        HTTPS
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        Secure Web (Port 443)
                      </h4>
                    </div>
                    <BarcodeSVG value="443" lightMode={true} />
                  </div>

                  {/* Port 21 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        FTP
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        File Transfer (Port 21)
                      </h4>
                    </div>
                    <BarcodeSVG value="21" lightMode={true} />
                  </div>

                  {/* Port 53 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        DNS
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        Name System (Port 53)
                      </h4>
                    </div>
                    <BarcodeSVG value="53" lightMode={true} />
                  </div>

                  {/* Port 3389 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        RDP
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        Remote Desktop (Port 3389)
                      </h4>
                    </div>
                    <BarcodeSVG value="3389" lightMode={true} />
                  </div>

                  {/* Port 23 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        TELNET
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        Insecure Terminal (Port 23)
                      </h4>
                    </div>
                    <BarcodeSVG value="23" lightMode={true} />
                  </div>

                  {/* Port 1433 */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center bg-slate-50 gap-3 text-center">
                    <div>
                      <span className="text-[9px] bg-pink-100 text-pink-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        MSSQL
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-800">
                        SQL Database (Port 1433)
                      </h4>
                    </div>
                    <BarcodeSVG value="1433" lightMode={true} />
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 4: ADMIN / BOOTH CONFIGURATION */}
          {activeTab === "admin" && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto mt-2"
            >
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 space-y-6 shadow-[0_0_15px_rgba(0,255,65,0.02)]">
                
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                  <Database size={24} className="text-[#00FF41]" />
                  <div>
                    <h2 className="text-lg font-display font-black text-white uppercase tracking-wider italic">
                      BOOTH ADMIN CONTROL PANEL
                    </h2>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
                      แผงควบคุมระบบสำหรับเจ้าหน้าที่ประจำบูธนิทรรศการ
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Stats generation helper */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5 tracking-wider">
                      <Users size={14} className="text-[#00FF41]" />
                      <span>จำลองคะแนนท้าชิง (Populate Mock Scores)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed uppercase">
                      ใช้สำหรับการทดสอบหรือสาธิตการทำงานหน้าบูธ โดยระบบจะแรนด้อมผู้ท้าชิงจำลองจำนวน 5 คนเข้าสู่กระดานลีดเดอร์บอร์ดเรียลไทม์
                    </p>
                    <button
                      onClick={handleAddDemoPlayers}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-[#00FF41] hover:text-[#00FF41]/90 font-mono text-xs rounded border border-zinc-800 font-black tracking-wider uppercase transition-all"
                    >
                      เพิ่มผู้ท้าชิงสุ่ม 5 คน (+5 Mock Defenders)
                    </button>
                  </div>

                  {/* Reset database */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5 tracking-wider">
                      <Trash2 size={14} />
                      <span>รีเซ็ตลีดเดอร์บอร์ดประจำวัน (Daily Reset)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed uppercase">
                      ล้างคะแนนปัจจุบันบนฐานข้อมูลความจำเพื่อเริ่มการแข่งขันเซสชันใหม่ประจำวัน มีเพียงคะแนนตัวแทนผู้จัดบูธเริ่มต้นจะคงเหลือ
                    </p>
                    <button
                      onClick={handleClearLeaderboard}
                      className="w-full py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 font-mono text-xs rounded border border-rose-500/20 font-black tracking-wider uppercase transition-all"
                    >
                      เคลียร์ลีดเดอร์บอร์ดทั้งหมด (Clear Rankings)
                    </button>
                  </div>

                </div>

                <div className="text-[10px] font-mono text-zinc-600 text-center border-t border-zinc-850 pt-4 flex items-center justify-center gap-1 uppercase tracking-wider">
                  <Lock size={12} />
                  <span>PREVIEW ENVIRONMENT PROTECTED / COLD START PERSISTENCE IS SHADOW DATABASE ACTIVE</span>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 px-4 mt-12 font-mono text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span>&copy; 2026 CYBERSECURITY EXHIBITION INTERACTIVE BOOTH GAME &bull; POWERED BY GEMINI AI</span>
          </div>
          <div className="flex gap-4">
            <span>SECURED DEVICE PROTOCOL v2.1</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
