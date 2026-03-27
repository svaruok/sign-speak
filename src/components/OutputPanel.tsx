import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Volume2, Trash2, Hand, Play, Square } from "lucide-react";

interface PredictionEntry {
  letter: string;
  confidence: number;
  timestamp: number;
}

interface OutputPanelProps {
  currentLetter: string;
  confidence: number;
  accumulatedText: string;
  isDetecting: boolean;
  history: PredictionEntry[];
  onToggleDetection: () => void;
  onClearText: () => void;
  onSpeak: () => void;
  onAddSpace: () => void;
}

const OutputPanel = ({
  currentLetter,
  confidence,
  accumulatedText,
  isDetecting,
  history,
  onToggleDetection,
  onClearText,
  onSpeak,
  onAddSpace,
}: OutputPanelProps) => {
  const confidenceColor =
    confidence >= 0.75
      ? "hsl(var(--success))"
      : confidence >= 0.5
        ? "hsl(var(--warning))"
        : "hsl(var(--danger))";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Detected Letter */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Detected Gesture
          </p>
          <div
            className="text-7xl md:text-8xl font-black tracking-tight transition-all duration-200"
            style={{ color: confidence > 0 ? confidenceColor : "hsl(var(--muted-foreground))" }}
          >
            {currentLetter || "—"}
          </div>
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <span>{Math.round(confidence * 100)}%</span>
            </div>
            <Progress value={confidence * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Accumulated Text */}
      <Card className="border-border bg-card flex-1">
        <CardContent className="p-4 flex flex-col h-full gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Formed Text
          </p>
          <div className="flex-1 min-h-[80px] p-3 rounded-lg bg-secondary text-foreground text-lg font-mono break-all">
            {accumulatedText || (
              <span className="text-muted-foreground italic text-sm">
                Start detecting to form words...
              </span>
            )}
            <span className="animate-pulse text-primary">|</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onToggleDetection}
              variant={isDetecting ? "destructive" : "default"}
              className="gap-2"
            >
              {isDetecting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isDetecting ? "Stop" : "Start"}
            </Button>
            <Button onClick={onAddSpace} variant="outline" className="gap-2">
              <Hand className="w-4 h-4" />
              Space
            </Button>
            <Button onClick={onSpeak} variant="outline" className="gap-2">
              <Volume2 className="w-4 h-4" />
              Speak
            </Button>
            <Button onClick={onClearText} variant="outline" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Recent Predictions
          </p>
          <ScrollArea className="h-24">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No predictions yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {history.map((entry, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono"
                  >
                    <span className="font-bold text-foreground">
                      {entry.letter === "SPACE" ? "␣" : entry.letter}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(entry.confidence * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OutputPanel;
