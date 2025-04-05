"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, Loader } from "lucide-react"
import { saveAs } from "file-saver"
import Image from "next/image"
import aiInterviewService, { InterviewResponse } from "@/services/ai-interview-service"

// Map interviewer names to their default personalities
const interviewerPersonalityMap: Record<string, string> = {
  'todd': 'friendly',
  'jeff': 'professional',
  'karen': 'challenging',
  'creep': 'creepy',
};

export default function ConductInterviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [interviewer, setInterviewer] = useState("todd")
  const [personality, setPersonality] = useState("friendly")
  const [isUserTurn, setIsUserTurn] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [interviewResponses, setInterviewResponses] = useState<InterviewResponse[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  const router = useRouter()
  const [fadeIn, setFadeIn] = useState(false)

  // Video functionality
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const recordedSessions = useRef<{video: Blob, transcript: string}[]>([])

  // Speech recognition
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize the Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setCurrentTranscript(finalTranscript || interimTranscript);
      };
    } else {
      console.error("Speech recognition not supported");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Listen for interviewer selection from query params
    const queryParams = new URLSearchParams(window.location.search)
    const selectedInterviewer = queryParams.get("interviewer")

    if (selectedInterviewer) {
      setInterviewer(selectedInterviewer)
      // Set personality based on interviewer
      const defaultPersonality = interviewerPersonalityMap[selectedInterviewer] || 'friendly';
      setPersonality(defaultPersonality);

      // Initialize the AI interview with default questions
      initializeInterview(selectedInterviewer);
    }

    const timer = setTimeout(() => setFadeIn(true), 0);
    return () => clearTimeout(timer);
  }, [router]);

  const initializeInterview = async (selectedInterviewer) => {
    // Ensure personality is correctly set based on interviewer
    const interviewerPersonality = interviewerPersonalityMap[selectedInterviewer] || 'friendly';

    // Get custom questions from backend or use defaults
    try {
      console.log('Fetching questions from backend...');
      console.log(selectedInterviewer, interviewerPersonality);
      const response = await fetch("http://localhost:5000/api/get-interview-questions");
      const data = await response.json();
      aiInterviewService.initializeInterview(
        selectedInterviewer,
        interviewerPersonality as any,
        data.questions || []
      );
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Initialize with empty questions (will use defaults)
      aiInterviewService.initializeInterview(
        selectedInterviewer,
        interviewerPersonality as any,
        []
      );
    }

    // Start the interview with AI speaking first - this will get the greeting
    startAITurn();
  }

  // Start AI's turn
  const startAITurn = async () => {
    setIsUserTurn(false);
    setIsProcessing(true);

    try {
      // Get next statement from AI
      const statement = await aiInterviewService.getNextInterviewerStatement();
      setCurrentTranscript(statement);

      // Update interview responses
      setInterviewResponses(aiInterviewService.getResponses());

      // Speak the text
      setIsSpeaking(true);
      await aiInterviewService.speakText(statement);
      setIsSpeaking(false);

      // Check if interview is complete
      if (aiInterviewService.isInterviewComplete()) {
        setInterviewComplete(true);
      } else {
        // Switch to user's turn
        setIsUserTurn(true);
      }
    } catch (error) {
      console.error("Error in AI turn:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Video stream setup
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
        })
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

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

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    }
  };

  // End user's turn
  const endUserTurn = async () => {
    if (!isRecording) return;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsRecording(false);
    setIsProcessing(true);

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

          // Process the user's response
          aiInterviewService.processUserResponse(videoBlob, userTranscript);

          resolve();
        };
      } else {
        resolve();
      }
    });

    // Clear transcript for AI's next response
    setCurrentTranscript("");

    // Start AI's turn
    startAITurn();
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

  const handleAnalyzeInterview = async () => {
    try {
      // Prepare all recordings as an array
      const formData = new FormData();

      recordedSessions.current.forEach((session, index) => {
        formData.append(`video_${index}`, session.video);
        formData.append(`transcript_${index}`, session.transcript);
      });

      formData.append('interviewer', interviewer);
      formData.append('personality', personality);

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

          {/* Transcript and Controls */}
          <div className="w-full max-w-md">
            <Card className="p-6">
              <div className="min-h-[120px] mb-4">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  <p className="text-lg">{currentTranscript}</p>
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
