"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Square, Loader, Clock, Loader2 } from "lucide-react"
import { saveAs } from "file-saver"
import Image from "next/image"
import aiInterviewService, { InterviewResponse } from "@/services/ai-interview-service"
import axios from "axios"
import { FALLBACK_FEEDBACK_DATA, FALLBACK_COACH_DATA } from "@/constants/feedback"
import { transformFeedbackData } from "@/utils/transformFeedback"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"


export default function ConductInterviewPage() {
  const IS_TEST = true
  const isInitializedRef = useRef(false)

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
  const [interviewType, setInterviewType] = useState("mixed")
  const [jobUrl, setJobUrl] = useState("")

  const router = useRouter()
  const [fadeIn, setFadeIn] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Video functionality
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const recordedVideoChunks = useRef<Blob[]>([])
  const recordedSessions = useRef<{ video: Blob, audio: Blob }[]>([])
  const isSessionRecordingRef = useRef(false)

  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Initialize video stream and start recording
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        // Get a single stream for both display and recording
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });

        // Set up video display
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start recording with optimized settings
        const videoRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 1500000 // 1.5 Mbps for better performance
        });
        videoRecorderRef.current = videoRecorder;

        videoRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedVideoChunks.current.push(event.data);
          }
        };

        // Collect chunks every 10 seconds to reduce overhead
        videoRecorder.start(10000);
        isSessionRecordingRef.current = true;
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    // Only initialize video if we have a session ID
    if (aiInterviewService.getSessionId()) {
      initializeVideo();
    }

    // Cleanup function to stop all tracks and recording when component unmounts
    return () => {
      if (videoRecorderRef.current && isSessionRecordingRef.current) {
        videoRecorderRef.current.stop();
        isSessionRecordingRef.current = false;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  // Initialize interview and handle fade-in
  useEffect(() => {
    console.log("ConductInterviewPage mounted")

    // Set fade-in immediately
    setFadeIn(true);

    // Only initialize if not already initialized
    if (!isInitializedRef.current) {
      const queryParams = new URLSearchParams(window.location.search)
      const selectedInterviewer = queryParams.get("interviewer") || "jeff"
      const urlJobUrl = queryParams.get("jobUrl") || "https://www.google.com/about/careers/applications/jobs/results/134028773082178246-software-engineer-engineering-productivity-silicon"
      const interviewType = queryParams.get("interviewType") || "mixed"
      const focusAreas = queryParams.get("focusAreas") || ""

      if (queryParams.has("interviewer") || queryParams.has("jobUrl") || queryParams.has("interviewType") || queryParams.has("focusAreas")) {
        setInterviewer(selectedInterviewer);
        setJobUrl(urlJobUrl);
        setInterviewType(interviewType);
        console.log(selectedInterviewer, interviewType, urlJobUrl, focusAreas);
        initializeInterview(selectedInterviewer, interviewType, urlJobUrl, focusAreas.split(','));
        isInitializedRef.current = true;
      }

      return () => {
        stopTimer(); // Clean up timer on unmount
      };
    }
  }, []); // Empty dependency array to run only once on mount

  const initializeInterview = async (selectedInterviewer: string, selectedType: string, jobLink: string, selectedFocusAreas: string[]) => {
    setIsProcessing(true);

    try {
      // Start the interview with the AI service
      const introduction = await aiInterviewService.startInterview(
        selectedInterviewer,
        selectedType,
        selectedFocusAreas,
        jobLink,
        IS_TEST
      );

      // Initialize video after successful API response
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      // Set up video display
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start recording with optimized settings
      const videoRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 1500000
      });
      videoRecorderRef.current = videoRecorder;

      videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedVideoChunks.current.push(event.data);
        }
      };

      videoRecorder.start(10000);
      isSessionRecordingRef.current = true;

      setCurrentTranscript(introduction);

      // Start the timer only if it's not already running
      if (!isTimerRunning) {
        startTimer();
      }

      // Begin AI speaking
      setIsProcessing(false);
      setIsSpeaking(true);
      if (!IS_TEST) {
        await aiInterviewService.speakText(introduction);
      }
      setIsSpeaking(false);

      // Switch to user's turn
      setIsUserTurn(true);

    } catch (error) {
      console.error("Error initializing interview:", error);
      alert("Please allow camera and microphone access to start the interview.");
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
      const audioTrack = stream.getAudioTracks()[0];
      const audioStream = new MediaStream([audioTrack]);
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect chunks every second for better transcription
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

    try {
      // Convert the audio blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          resolve(base64Content);
        };
      });
      reader.readAsDataURL(new Blob(recordedChunks.current, { type: "audio/webm" }));
      const base64data = await base64Promise;

      // Process the user's response through the API
      const { text, isFinished } = await aiInterviewService.processUserResponse(
        base64data
      );

      // Update the transcript with AI's response
      setCurrentTranscript(text);

      // Check if interview is complete
      if (isFinished) {
        setInterviewComplete(true);
        stopTimer();
      }

      // Begin AI speaking
      setIsProcessing(false);
      setIsSpeaking(true);
      if (!IS_TEST) {
        await aiInterviewService.speakText(text);
      }
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
    setIsAnalyzing(true);
    try {
      const sessionId = aiInterviewService.getSessionId();
      if (!sessionId) {
        throw new Error("No active interview session");
      }

      // Stop recording if still running
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Create final video blob from recorded chunks
      const videoBlob = new Blob(recordedVideoChunks.current, { type: 'video/webm' });
      console.log('Final video blob:', videoBlob);

      // Get the master interviews list
      const interviewsJson = localStorage.getItem('interviews');
      const interviews = interviewsJson ? JSON.parse(interviewsJson) : {};

      // Prepare interview data
      const interviewData = {
        interviewer: interviewer,
        interviewType: interviewType,
        responses: aiInterviewService.getResponses(),
        jobUrl: jobUrl,
        duration: timer,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      };

      // Call both APIs in parallel
      const [feedbackResponse, coachResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/interview/${sessionId}/feedback`),
        (async () => {
          const formData = new FormData();
          formData.append('file', videoBlob, 'interview.webm');
          return axios.post('http://localhost:5000/api/coach', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        })()
      ]);

      // Use API responses if successful, otherwise use fallback data
      const feedbackData = feedbackResponse.status === 200
        ? feedbackResponse.data
        : FALLBACK_FEEDBACK_DATA;

      const coachData = coachResponse.status === 200
        ? coachResponse.data
        : FALLBACK_COACH_DATA;

      // Create final interview data
      const finalInterviewData = {
        ...interviewData,
        analysis: {
          ...transformFeedbackData(feedbackData),
          body_language: [{
            attribute: "Eye Contact",
            timestamp: "00:00",
            score: coachData.eye_contact,
            explanation: `Maintained eye contact ${coachData.eye_contact}% of the time.`
          }, {
            attribute: "Posture",
            timestamp: "00:00",
            score: coachData.posture,
            explanation: `Posture score: ${coachData.posture}/100.`
          }, {
            attribute: "Gestures",
            timestamp: "00:00",
            score: Math.min(100, coachData.gestures.length * 20),
            explanation: `Observed gestures: ${coachData.gestures.join(", ")}`
          }]
        }
      };

      // Save to master interviews list
      interviews[sessionId] = finalInterviewData;
      localStorage.setItem('interviews', JSON.stringify(interviews));

      // Navigate to results page
      router.push(`/interview/${sessionId}`);
    } catch (error) {
      console.error("Error analyzing interview:", error);
      // Use fallback data if API calls fail
      const transformedFeedbackData = transformFeedbackData(FALLBACK_FEEDBACK_DATA);
      const fallbackData = {
        ...interviewData,
        analysis: {
          ...transformedFeedbackData,
          body_language: [{
            attribute: "Eye Contact",
            timestamp: "00:00",
            score: FALLBACK_COACH_DATA.eye_contact,
            explanation: FALLBACK_COACH_DATA.recommendations[0]
          }, {
            attribute: "Posture",
            timestamp: "00:00",
            score: FALLBACK_COACH_DATA.posture,
            explanation: FALLBACK_COACH_DATA.recommendations[2]
          }]
        }
      };

      // Save fallback data to master interviews list
      const interviewsJson = localStorage.getItem('interviews');
      const interviews = interviewsJson ? JSON.parse(interviewsJson) : {};
      interviews[sessionId] = fallbackData;
      localStorage.setItem('interviews', JSON.stringify(interviews));

      // Navigate to results page
      router.push(`/interview/${sessionId}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className={`container flex flex-1 items-center justify-center py-8 relative w-100vw ${fadeIn ? "opacity-100" : "opacity-0"
        } transition-opacity duration-1000`} >
        {isAnalyzing ? (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader className="h-8 w-8 animate-spin" />
              <p className="text-lg font-medium">Analyzing interview...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </div>
        ) : (
          <>
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
                  <div>
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
                  {!(isProcessing || isSpeaking) ? (

                    <div className="flex flex-col gap-3 mt-4">
                      {isUserTurn && !interviewComplete ? (
                        isRecording ? (
                          <Button onClick={endUserTurn} variant="destructive" className="w-full">
                            <Square className="mr-2 h-4 w-4" />
                            Stop Recording
                          </Button>
                        ) : (
                          <Button
                            onClick={startUserTurn}
                            className="w-full"
                            disabled={isProcessing || isSpeaking}
                          >
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
                  ) : <></>}
                </Card>

                {(IS_TEST) ? (
                  <Button onClick={handleAnalyzeInterview} className="w-full">
                    Analyze Interview
                  </Button>
                ) : <></>}
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
          </>
        )}
      </div>
    </div>
  )
}
