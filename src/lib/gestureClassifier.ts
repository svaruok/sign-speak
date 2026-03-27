// ISL (Indian Sign Language) A-Z Gesture Classifier
// Uses MediaPipe hand landmarks (21 points) to classify gestures

import type { NormalizedLandmarkList } from "@mediapipe/hands";

interface GestureResult {
  letter: string;
  confidence: number;
}

// Landmark indices
const WRIST = 0;
const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

function dist(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function isFingerExtended(landmarks: NormalizedLandmarkList, tip: number, pip: number, mcp: number): boolean {
  const tipToWrist = dist(landmarks[tip], landmarks[WRIST]);
  const pipToWrist = dist(landmarks[pip], landmarks[WRIST]);
  return tipToWrist > pipToWrist * 1.05;
}

function isThumbExtended(landmarks: NormalizedLandmarkList): boolean {
  const tipToWrist = dist(landmarks[THUMB_TIP], landmarks[WRIST]);
  const mcpToWrist = dist(landmarks[THUMB_MCP], landmarks[WRIST]);
  return tipToWrist > mcpToWrist * 1.1;
}

function getFingerStates(landmarks: NormalizedLandmarkList) {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP, INDEX_MCP),
    middle: isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP),
    ring: isFingerExtended(landmarks, RING_TIP, RING_PIP, RING_MCP),
    pinky: isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP, PINKY_MCP),
  };
}

function countExtended(fingers: ReturnType<typeof getFingerStates>): number {
  return [fingers.thumb, fingers.index, fingers.middle, fingers.ring, fingers.pinky].filter(Boolean).length;
}

function fingersTouching(landmarks: NormalizedLandmarkList, tip1: number, tip2: number, threshold = 0.06): boolean {
  return dist(landmarks[tip1], landmarks[tip2]) < threshold;
}

function thumbToIndexDist(landmarks: NormalizedLandmarkList): number {
  return dist(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
}

export function classifyGesture(landmarks: NormalizedLandmarkList): GestureResult {
  const f = getFingerStates(landmarks);
  const extended = countExtended(f);
  const thumbIndexDist = thumbToIndexDist(landmarks);
  const thumbMiddleDist = dist(landmarks[THUMB_TIP], landmarks[MIDDLE_TIP]);

  // Distances for more nuanced detection
  const indexMiddleDist = dist(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
  const middleRingDist = dist(landmarks[MIDDLE_TIP], landmarks[RING_TIP]);
  const ringPinkyDist = dist(landmarks[RING_TIP], landmarks[PINKY_TIP]);

  // Thumb position relative to palm
  const thumbCrossed = landmarks[THUMB_TIP].x > landmarks[INDEX_MCP].x; // for right hand

  // Y positions (lower y = higher on screen)
  const indexPointingUp = landmarks[INDEX_TIP].y < landmarks[INDEX_MCP].y;
  const indexPointingDown = landmarks[INDEX_TIP].y > landmarks[WRIST].y;

  // Rule-based classification for ISL alphabets
  // Each rule tries to match a specific hand shape

  // A - Fist with thumb to the side
  if (!f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    return { letter: "A", confidence: 0.85 };
  }

  // B - All fingers extended, thumb across palm
  if (f.index && f.middle && f.ring && f.pinky && !f.thumb && indexMiddleDist < 0.05) {
    return { letter: "B", confidence: 0.82 };
  }

  // C - Curved hand (all fingers partially extended in a C shape)
  if (extended >= 3 && thumbIndexDist > 0.08 && thumbIndexDist < 0.18 && !f.pinky) {
    return { letter: "C", confidence: 0.72 };
  }

  // D - Index pointing up, others closed, thumb touches middle
  if (f.index && !f.middle && !f.ring && !f.pinky && indexPointingUp && fingersTouching(landmarks, THUMB_TIP, MIDDLE_TIP, 0.08)) {
    return { letter: "D", confidence: 0.80 };
  }

  // E - All fingers curled, thumb across
  if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    return { letter: "E", confidence: 0.78 };
  }

  // F - Thumb and index touching, other three extended
  if (fingersTouching(landmarks, THUMB_TIP, INDEX_TIP, 0.05) && f.middle && f.ring && f.pinky) {
    return { letter: "F", confidence: 0.83 };
  }

  // G - Index pointing sideways, thumb extended
  if (f.index && f.thumb && !f.middle && !f.ring && !f.pinky &&
      Math.abs(landmarks[INDEX_TIP].y - landmarks[INDEX_MCP].y) < 0.08) {
    return { letter: "G", confidence: 0.75 };
  }

  // H - Index and middle pointing sideways
  if (f.index && f.middle && !f.ring && !f.pinky &&
      Math.abs(landmarks[INDEX_TIP].y - landmarks[INDEX_MCP].y) < 0.08) {
    return { letter: "H", confidence: 0.74 };
  }

  // I - Only pinky extended
  if (!f.index && !f.middle && !f.ring && f.pinky && !f.thumb) {
    return { letter: "I", confidence: 0.88 };
  }

  // J - Pinky extended with movement (simplified: pinky up, hand tilted)
  if (!f.index && !f.middle && !f.ring && f.pinky && f.thumb) {
    return { letter: "J", confidence: 0.65 };
  }

  // K - Index and middle up spread, thumb between
  if (f.index && f.middle && !f.ring && !f.pinky && indexMiddleDist > 0.06 &&
      fingersTouching(landmarks, THUMB_TIP, MIDDLE_PIP, 0.08)) {
    return { letter: "K", confidence: 0.72 };
  }

  // L - Index up, thumb out (L shape)
  if (f.index && f.thumb && !f.middle && !f.ring && !f.pinky && indexPointingUp) {
    return { letter: "L", confidence: 0.87 };
  }

  // M - Three fingers (index, middle, ring) over thumb
  if (!f.index && !f.middle && !f.ring && !f.pinky &&
      landmarks[THUMB_TIP].y > landmarks[INDEX_PIP].y) {
    return { letter: "M", confidence: 0.60 };
  }

  // N - Two fingers (index, middle) over thumb  
  if (!f.index && !f.middle && !f.ring && !f.pinky &&
      landmarks[THUMB_TIP].y > landmarks[MIDDLE_PIP].y &&
      landmarks[THUMB_TIP].y < landmarks[INDEX_PIP].y) {
    return { letter: "N", confidence: 0.58 };
  }

  // O - Thumb and index form a circle
  if (fingersTouching(landmarks, THUMB_TIP, INDEX_TIP, 0.04) && !f.middle && !f.ring && !f.pinky) {
    return { letter: "O", confidence: 0.82 };
  }

  // P - Index pointing down, middle extended
  if (f.index && f.middle && !f.ring && !f.pinky && indexPointingDown) {
    return { letter: "P", confidence: 0.68 };
  }

  // Q - Thumb and index pointing down
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky && indexPointingDown) {
    return { letter: "Q", confidence: 0.65 };
  }

  // R - Index and middle crossed
  if (f.index && f.middle && !f.ring && !f.pinky && indexMiddleDist < 0.03) {
    return { letter: "R", confidence: 0.70 };
  }

  // S - Fist with thumb over fingers
  if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb &&
      landmarks[THUMB_TIP].y < landmarks[INDEX_MCP].y) {
    return { letter: "S", confidence: 0.65 };
  }

  // T - Thumb between index and middle (fist)
  if (!f.index && !f.middle && !f.ring && !f.pinky &&
      landmarks[THUMB_TIP].x > landmarks[INDEX_MCP].x &&
      landmarks[THUMB_TIP].x < landmarks[MIDDLE_MCP].x) {
    return { letter: "T", confidence: 0.60 };
  }

  // U - Index and middle up together
  if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb && indexMiddleDist < 0.04) {
    return { letter: "U", confidence: 0.80 };
  }

  // V - Index and middle up spread (peace sign)
  if (f.index && f.middle && !f.ring && !f.pinky && indexMiddleDist > 0.05) {
    return { letter: "V", confidence: 0.88 };
  }

  // W - Index, middle, ring extended and spread
  if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) {
    return { letter: "W", confidence: 0.85 };
  }

  // X - Index finger hooked/bent
  if (!f.middle && !f.ring && !f.pinky &&
      landmarks[INDEX_TIP].y > landmarks[INDEX_DIP].y &&
      landmarks[INDEX_DIP].y < landmarks[INDEX_PIP].y) {
    return { letter: "X", confidence: 0.65 };
  }

  // Y - Thumb and pinky extended
  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
    return { letter: "Y", confidence: 0.90 };
  }

  // Z - Index draws Z (simplified: index pointing with movement)
  if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb &&
      Math.abs(landmarks[INDEX_TIP].x - landmarks[WRIST].x) > 0.15) {
    return { letter: "Z", confidence: 0.55 };
  }

  // SPACE - Open palm (all fingers extended and spread)
  if (extended === 5 && indexMiddleDist > 0.04 && middleRingDist > 0.03) {
    return { letter: "SPACE", confidence: 0.80 };
  }

  // Fallback - all fingers extended together
  if (extended >= 4) {
    return { letter: "B", confidence: 0.50 };
  }

  return { letter: "?", confidence: 0.0 };
}
