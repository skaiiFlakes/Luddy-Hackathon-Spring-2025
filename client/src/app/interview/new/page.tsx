"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic } from "lucide-react"
import NewInterviewModal from "@/components/new-interview-modal"
import { saveAs } from "file-saver" // Add this import for saving files locally
import Image from "next/image"

export default function ConductInterviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState(
    "Hello! I'm Todd, your interviewer today. I'll be asking you some questions about your experience and skills for the Senior Frontend Developer position at TechCorp Inc. Let's start with you telling me a bit about yourself and your background in frontend development.",
  )
  const [interviewer, setInterviewer] = useState("todd") // Track selected interviewer
  const router = useRouter()
  const [fadeIn, setFadeIn] = useState(false); // Track fade-in state

  useEffect(() => {
    // Listen for interviewer selection from query params
    const queryParams = new URLSearchParams(window.location.search)
    const selectedInterviewer = queryParams.get("interviewer")
    if (selectedInterviewer) {
      setInterviewer(selectedInterviewer)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 0); // Trigger fade-in after 1 second
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  // Video functionality
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])

  useEffect(() => {
    // Start video stream when component mounts
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true }) // Include audio for recording
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
        })
    }

    // Cleanup function to stop video stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Simulate interview progression
  const simulateInterviewProgress = () => {
    if (isRecording) {
      // Simulate interview completion after 5 seconds
      setTimeout(() => {
        setIsRecording(false)
        setInterviewComplete(true)
        setCurrentTranscript(
          (prev) =>
            prev +
            "\n\nThank you for sharing your experience. That's all the questions I have for today. You can now analyze your interview performance.",
        )
      }, 5000)
    }
  }

  useEffect(() => {
    simulateInterviewProgress()
  }, [isRecording])

  const handleStartRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    }
  }

  const handleAnalyzeInterview = async () => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.onstop = async () => {
          const videoBlob = new Blob(recordedChunks.current, { type: "video/webm" })
          const audioBlob = new Blob(recordedChunks.current, { type: "audio/webm" })

          // Save files locally
          saveAs(videoBlob, "interview-video.webm")

          // Prepare form data for API
          const formData = new FormData()
          formData.append("video", videoBlob)
          formData.append("audio", audioBlob)

          // const response = await fetch("http://localhost:5000/api/analyze-interview", {
          //   method: "POST",
          //   body: formData,
          // })
          // if (!response.ok) {
          //   throw new Error("Failed to analyze interview")
          // }
          // const data = await response.json()
          // console.log("Analysis result:", data)
          // router.push(`/interview/${data.interviewId}`)

          router.push(`/interview/1`)
        }
      }
    } catch (error) {
      console.error("Error analyzing interview:", error)
    }
  }

  // Audio wave animation
  const [waveAmplitude, setWaveAmplitude] = useState(5)

  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setWaveAmplitude(Math.floor(Math.random() * 15) + 5)
    }, 200)

    return () => clearInterval(interval)
  }, [isRecording])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onNewInterview={() => setIsModalOpen(true)} />
      <div className={`container flex flex-1 items-center justify-center py-8 relative w-100vw ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`} >
        {/* Stack AI Interviewer and Transcript & Controls */}
        <div className="flex flex-col items-center justify-center w-full lg:flex-row lg:w-100 lg:items-center">
          {/* AI Interviewer with Audio Waves */}
          <div
            className={`relative mb-14 lg:mb-0 lg:mr-20 lg:flex-shrink-0 transition-opacity duration-1000`}
          >
            <div className="h-128 w-128 rounded-full overflow-hidden relative z-10">
              <Image
                src={`/${interviewer}.jpg`}
                alt={`${interviewer}'s profile picture`}
                width={256}
                height={256}
                style={
                  {
                    scale: 1.1,
                    transform: "translateY(10px)",
                  }
                }
                className="object-cover"
              />
            </div>

            {/* Audio Waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute h-${isRecording ? waveAmplitude : 5} w-1 bg-gray-200 rounded-full opacity-${isRecording ? "140" : "40"}`}
                  style={{
                    transform: `rotate(${i * 45}deg) translateX(${isRecording ? 140 + (Math.random() * 10) : 140}px)`,
                    height: isRecording ? `${waveAmplitude + (i % 3) * 5}px` : "30px",
                    transition: "height 0.2s ease-in-out",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Transcript and Controls */}
          <div className="w-full max-w-md">
            <Card className="p-6">
              <p className="text-lg mb-4">{currentTranscript}</p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleStartRecording} disabled={isRecording || interviewComplete} className="w-full">
                  {isRecording ? (
                    <>
                      <Mic className="mr-2 h-4 w-4 animate-pulse" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </>
                  )}
                </Button>
                <Button onClick={handleAnalyzeInterview} disabled={!interviewComplete} className="w-full">
                  Analyze Interview
                </Button>
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

      <NewInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
