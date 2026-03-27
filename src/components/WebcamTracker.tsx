import { useEffect, useRef, useState, useCallback } from "react";
import { Hands, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { classifyGesture } from "@/lib/gestureClassifier";

interface WebcamTrackerProps {
  isDetecting: boolean;
  onGestureDetected: (letter: string, confidence: number) => void;
}

const WebcamTracker = ({ isDetecting, onGestureDetected }: WebcamTrackerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onResults = useCallback(
    (results: Results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: "hsl(250, 80%, 65%)",
            lineWidth: 3,
          });
          drawLandmarks(ctx, landmarks, {
            color: "hsl(170, 70%, 50%)",
            lineWidth: 1,
            radius: 4,
          });

          if (isDetecting) {
            const result = classifyGesture(landmarks);
            if (result.confidence > 0.3) {
              onGestureDetected(result.letter, result.confidence);
            }
          }
        }
      }
      ctx.restore();
    },
    [isDetecting, onGestureDetected]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera
      .start()
      .then(() => setCameraReady(true))
      .catch((err) => {
        console.error("Camera error:", err);
        setError("Could not access camera. Please allow camera permissions.");
      });

    cameraRef.current = camera;

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onResults]);

  return (
    <div className="relative w-full aspect-[4/3] bg-card rounded-xl overflow-hidden border border-border shadow-lg">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-0"
        playsInline
        autoPlay
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        width={640}
        height={480}
        style={{ transform: "scaleX(-1)" }}
      />
      {!cameraReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-sm">Loading camera & AI model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-card p-6">
          <p className="text-destructive text-sm text-center">{error}</p>
        </div>
      )}
      {isDetecting && cameraReady && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1.5 rounded-full border border-border">
          <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          <span className="text-xs font-medium text-foreground">Detecting</span>
        </div>
      )}
    </div>
  );
};

export default WebcamTracker;
