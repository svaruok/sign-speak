import { useState, useCallback, useRef } from "react";
import WebcamTracker from "@/components/WebcamTracker";
import OutputPanel from "@/components/OutputPanel";

interface PredictionEntry {
  letter: string;
  confidence: number;
  timestamp: number;
}

const STABILIZATION_MS = 900;
const MAX_HISTORY = 20;

const Index = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentLetter, setCurrentLetter] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [accumulatedText, setAccumulatedText] = useState("");
  const [history, setHistory] = useState<PredictionEntry[]>([]);

  const lastLetterRef = useRef("");
  const lastLetterTimeRef = useRef(0);
  const letterRegisteredRef = useRef(false);

  const handleGestureDetected = useCallback((letter: string, conf: number) => {
    setCurrentLetter(letter);
    setConfidence(conf);

    const now = Date.now();

    if (letter !== lastLetterRef.current) {
      lastLetterRef.current = letter;
      lastLetterTimeRef.current = now;
      letterRegisteredRef.current = false;
      return;
    }

    if (!letterRegisteredRef.current && now - lastLetterTimeRef.current > STABILIZATION_MS) {
      letterRegisteredRef.current = true;

      if (letter === "SPACE") {
        setAccumulatedText((prev) => prev + " ");
      } else if (letter !== "?") {
        setAccumulatedText((prev) => prev + letter);
      }

      setHistory((prev) => [{ letter, confidence: conf, timestamp: now }, ...prev].slice(0, MAX_HISTORY));
    }
  }, []);

  const handleSpeak = () => {
    if (!accumulatedText.trim()) return;
    const utterance = new SpeechSynthesisUtterance(accumulatedText);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handleClear = () => {
    setAccumulatedText("");
    setCurrentLetter("");
    setConfidence(0);
    setHistory([]);
    lastLetterRef.current = "";
    letterRegisteredRef.current = false;
  };

  const handleAddSpace = () => {
    setAccumulatedText((prev) => prev + " ");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤟</span>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                GestureSense
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-Powered Indian Sign Language Recognition
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            Browser AI • No Server
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left: Webcam */}
          <div className="flex flex-col gap-3">
            <WebcamTracker
              isDetecting={isDetecting}
              onGestureDetected={handleGestureDetected}
            />
            <p className="text-xs text-center text-muted-foreground">
              Show ISL hand gestures to the camera • Hold steady for ~1 second to register
            </p>
          </div>

          {/* Right: Output */}
          <OutputPanel
            currentLetter={currentLetter}
            confidence={confidence}
            accumulatedText={accumulatedText}
            isDetecting={isDetecting}
            history={history}
            onToggleDetection={() => setIsDetecting((d) => !d)}
            onClearText={handleClear}
            onSpeak={handleSpeak}
            onAddSpace={handleAddSpace}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
