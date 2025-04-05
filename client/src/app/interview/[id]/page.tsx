"use client"

import { useParams } from "next/navigation"
import Dashboard from "@/components/dashboard"
import { useFadeIn } from "@/utils/useFadeIn" // Import the custom hook

export default function InterviewPage() {
  const params = useParams()
  const id = params.id
  const fadeIn = useFadeIn(0) // Use the fade-in hook with a 1-second delay

  return (
    <div className={`transition-opacity duration-1000 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
      <Dashboard interviewId={id as string} />
    </div>
  )
}

