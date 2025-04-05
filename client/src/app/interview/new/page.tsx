"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, Loader, Clock } from "lucide-react"
import { saveAs } from "file-saver"
import Image from "next/image"
import aiInterviewService, { InterviewResponse } from "@/services/ai-interview-service"


export default function ConductInterviewPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [interviewer, setInterviewer] = useState("todd")
  const [isUserTurn, setIsUserTurn] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const router = useRouter()
  const [fadeIn, setFadeIn] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Video functionality
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const recordedSessions = useRef<{video: Blob, transcript: string}[]>([])

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start timer
  const startTimer = () => {
    if (isTimerRunning) return

    setIsTimerRunning(true)
    timerIntervalRef.current = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1)
    }, 1000)
  }

  // Stop timer
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setIsTimerRunning(false)
  }

  useEffect(() => {
    // Cleanup timer on component unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    console.log("ConductInterviewPage mounted")
    const queryParams = new URLSearchParams(window.location.search)
    const selectedInterviewer = queryParams.get("interviewer") || "jeff"
    const urlJobUrl = queryParams.get("jobUrl") || "https://www.google.com/about/careers/applications/jobs/results/134028773082178246-software-engineer-engineering-productivity-silicon"
    const interviewType = queryParams.get("interviewType") || "mixed"
    const focusAreas = queryParams.get("focusAreas") || ""


    if (queryParams.has("interviewer") || queryParams.has("jobUrl") || queryParams.has("interviewType") || queryParams.has("focusAreas")) {
      setInterviewer(selectedInterviewer);
      console.log(selectedInterviewer, interviewType, urlJobUrl, focusAreas);
      initializeInterview(selectedInterviewer, interviewType, urlJobUrl, focusAreas);
    }

    const timer = setTimeout(() => setFadeIn(true), 0);
    return () => clearTimeout(timer);
  }, [router]);

  const initializeInterview = async (selectedInterviewer: string, selectedType: string, jobLink: string, selectedFocusAreas) => {
    setIsProcessing(true);

    try {
      // Start the interview with the AI service
      const introduction = await aiInterviewService.startInterview(
        selectedInterviewer,
        selectedType,
        selectedFocusAreas,
        jobLink
      );

      setCurrentTranscript(introduction);

      // Start the timer
      startTimer();

      // Begin AI speaking
      setIsSpeaking(true);
      await aiInterviewService.speakText(introduction);
      setIsSpeaking(false);

      // Switch to user's turn
      setIsUserTurn(true);
      setIsProcessing(false);

    } catch (error) {
      console.error("Error initializing interview:", error);
      setIsProcessing(false);
    }
  };


  // Start user's turn (recording)
  const startUserTurn = () => {
    if (!isUserTurn || isRecording) return;

    setIsRecording(true);
    recordedChunks.current = [];

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.start();
    }
  };

  // End user's turn
  const endUserTurn = async () => {
    if (!isRecording) return;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsProcessing(true);
    setShowTranscript(false);

    // Capture the current transcript before clearing
    const userTranscript = currentTranscript;

    // Create video blob from recorded chunks
    await new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          const videoBlob = new Blob(recordedChunks.current, { type: "video/webm" });

          // Store the recording
          recordedSessions.current.push({
            video: videoBlob,
            transcript: userTranscript
          });

          resolve();
        };
      } else {
        resolve();
      }
    });

    try {
      // Process the user's response through the API
      const { text, isFinished } = await aiInterviewService.processUserResponse(
        new Blob(recordedChunks.current, { type: "video/webm" }),
        userTranscript
      );

      // Update the transcript with AI's response
      setCurrentTranscript(text);

      // Check if interview is complete
      if (isFinished) {
        setInterviewComplete(true);
        stopTimer();
      }

      // Begin AI speaking
      setIsSpeaking(true);
      await aiInterviewService.speakText(text);
      setIsSpeaking(false);

      // If interview is not complete, switch back to user's turn
      if (!isFinished) {
        setIsUserTurn(true);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing user response:", error);
      setIsProcessing(false);
    }
  };

  // Audio wave animation
  const [waveAmplitude, setWaveAmplitude] = useState(5)

  useEffect(() => {
    if (!isSpeaking) return

    const interval = setInterval(() => {
      setWaveAmplitude(Math.floor(Math.random() * 15) + 5)
    }, 200)

    return () => clearInterval(interval)
  }, [isSpeaking])

  // Handle transcript fade-in effect
  useEffect(() => {
    if (!isProcessing && currentTranscript) {
      // Slight delay before starting the fade animation
      const timer = setTimeout(() => {
        setShowTranscript(true);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setShowTranscript(false);
    }
  }, [isProcessing, currentTranscript]);

  const handleAnalyzeInterview = async () => {
    try {
      // Prepare all recordings as an array
      const formData = new FormData();

      // Add session ID to the form data
      const sessionId = aiInterviewService.getSessionId();
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      recordedSessions.current.forEach((session, index) => {
        formData.append(`video_${index}`, session.video);
        formData.append(`transcript_${index}`, session.transcript);
      });

      formData.append('interviewer', interviewer);
      formData.append('interview_type', interviewType);

      // Save interview data to localStorage to pass to the interview/[id] page
      const interviewData = {
        interviewer: interviewer,
        interviewType: interviewType,
        responses: aiInterviewService.getResponses(),
        jobUrl: jobUrl,
        duration: timer,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
      };

      localStorage.setItem('interviewData', JSON.stringify(interviewData));

      // Save last video locally for demo purposes
      if (recordedSessions.current.length > 0) {
        const lastSession = recordedSessions.current[recordedSessions.current.length - 1];
        saveAs(lastSession.video, "interview-video.webm");
      }

      // Navigate to results page
      router.push(`/interview/1`);

      // Uncomment to send to backend
      /*
      const response = await fetch("http://localhost:5000/api/analyze-interview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze interview");
      }

      const data = await response.json();
      router.push(`/interview/${data.interviewId}`);
      */
    } catch (error) {
      console.error("Error analyzing interview:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onNewInterview={() => setIsModalOpen(true)} />
      <div className={`container flex flex-1 items-center justify-center py-8 relative w-100vw ${
              fadeIn ? "opacity-100" : "opacity-0"
            } transition-opacity duration-1000`} >
        {/* Stack AI Interviewer and Transcript & Controls */}
        <div className="flex flex-col items-center justify-center w-full lg:flex-row lg:w-100 lg:items-center">
          {/* AI Interviewer with Audio Waves */}
          <div className="relative mb-14 lg:mb-0 lg:mr-20 lg:flex-shrink-0">
            <div className="h-128 w-128 rounded-full overflow-hidden relative z-10">
              <Image
              src={`/${interviewer}.jpg`}
              alt={`${interviewer}'s profile picture`}
              width={256}
              height={256}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/todd.jpg"; // Fallback image
              }}
              style={{
                scale: 1.1,
                transform: "translateY(10px)",
              }}
              className="object-cover"
              />
            </div>

            {/* Audio Waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute h-${isSpeaking ? waveAmplitude : 5} w-1 bg-gray-200 rounded-full opacity-${isSpeaking ? "140" : "40"}`}
                  style={{
                    transform: `rotate(${i * 45}deg) translateX(${isSpeaking ? 140 + (Math.random() * 10) : 140}px)`,
                    height: isSpeaking ? `${waveAmplitude + (i % 3) * 5}px` : "30px",
                    transition: "height 0.2s ease-in-out",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Transcript and Controls with Timer */}
          <div className="w-full max-w-md">
            {/* Timer Card */}
            <Card className="p-4 mb-4 flex items-center justify-center">
              <Clock className="mr-2 h-5 w-5" />
              <span className="text-lg font-mono">{formatTime(timer)}</span>
            </Card>

            {/* Transcript Card */}
            <Card className="p-6">
              <div className="min-h-[120px] mb-4">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  <div className="relative overflow-hidden">
                    <div className={`text-md ${showTranscript ? 'animate-curtain-drop' : 'opacity-0'}`}>
                      {currentTranscript}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {isUserTurn && !interviewComplete ? (
                  isRecording ? (
                    <Button onClick={endUserTurn} variant="destructive" className="w-full">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  ) : (
                    <Button onClick={startUserTurn} className="w-full">
                      <Mic className="mr-2 h-4 w-4" />
                      Start Speaking
                    </Button>
                  )
                ) : (
                  <Button onClick={handleAnalyzeInterview} disabled={!interviewComplete} className="w-full">
                    Analyze Interview
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Live Video Feed */}
        <div className="absolute bottom-8 left-8">
          <Card className="overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-64 h-48 bg-muted"
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
