
# GestureSense: AI-Powered Indian Sign Language Recognition

## Overview
A real-time browser-based app that uses the webcam + MediaPipe Hands (JavaScript SDK) to detect hand gestures and classify them into A–Z ISL alphabets, all running client-side.

## Pages & Layout

### Main Page — Split Screen Layout
- **Left panel**: Live webcam feed with hand landmark overlay drawn on a canvas
- **Right panel**: Output area showing detected letter, confidence score, accumulated text, and controls
- **Header**: App title + brief description

## Core Features

### 1. Webcam Integration
- Start/Stop camera button
- Live video feed with MediaPipe hand landmark overlay (21 hand keypoints)
- Canvas overlay drawing detected landmarks and connections

### 2. Hand Gesture Recognition (A–Z)
- MediaPipe Hands JS SDK for real-time hand landmark detection
- Rule-based classification using finger positions, angles, and distances between landmarks
- All 26 ISL alphabet gestures mapped using landmark geometry
- Confidence score calculated from landmark detection quality

### 3. Text Output Area
- Large display of currently detected letter
- Confidence percentage bar
- Accumulated text string building up as letters are detected
- Stabilization logic: only register a letter after consistent detection for ~1 second to avoid jitter

### 4. Controls
- **Start/Stop Detection** button
- **Clear Text** button to reset accumulated text
- **Speak** button — uses browser's Web Speech API (SpeechSynthesis) for text-to-speech
- **Space** — detected via a specific "open palm" gesture or a manual button

### 5. Extra Features
- Word formation from accumulated letters
- Space gesture detection (open palm held flat)
- Prediction history log (last 20 predictions shown below)
- Real-time accuracy/confidence display per detection

## Technical Approach
- **MediaPipe Hands** via `@mediapipe/hands` JS package for 21-landmark hand tracking
- **Rule-based classifier**: Analyze finger extension states (curled vs extended), thumb position, and inter-finger angles to map to ISL alphabet signs
- **Canvas API** for drawing landmarks on top of video feed
- **Web Speech API** for text-to-speech
- All processing happens in-browser — no backend needed

## UI Design
- Clean, modern dark/light theme
- Responsive split-screen layout
- Large detected letter display with animation
- Color-coded confidence indicator (green = high, yellow = medium, red = low)
