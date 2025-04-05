"use client"
import { useParams } from "next/navigation"
import Dashboard from "@/components/dashboard"
import { useEffect, useState } from "react"
import { InterviewResponse } from "@/services/ai-interview-service"

interface InterviewData {
  interviewer: string;
  personality: string;
  responses: InterviewResponse[];
  jobUrl: string;
  duration: number;
  timestamp: string;
  analysis?: any;
}

export default function InterviewPage() {
  const params = useParams()
  const id = params.id // Use the fade-in hook with a 1-second delay
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Retrieve the interview data from localStorage
        const storedData = localStorage.getItem('interviewData')

        if (storedData) {
          const parsedData: InterviewData = JSON.parse(storedData)

          // Send the data to the backend for analysis
          try {
            const response = await fetch("http://localhost:5000/api/analyze-interview-results", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
                'X-Interviewer': parsedData.interviewer,
                'X-Personality': parsedData.personality,
                'X-Job-URL': parsedData.jobUrl || '',
                'X-Interview-Duration': parsedData.duration.toString(),
                'X-Interview-Timestamp': parsedData.timestamp
              },
              body: JSON.stringify({
                responses: parsedData.responses
              }),
            })

            if (response.ok) {
              const analysisData = await response.json()
              // Merge the analysis data with the interview data
              setInterviewData({
                ...parsedData,
                analysis: analysisData
              })
            } else {
              // If the API call fails, still show the interview data without analysis
              setInterviewData(parsedData)
              console.error("Failed to fetch analysis from server")
            }
          } catch (error) {
            console.error("Error fetching analysis:", error)
            setInterviewData(parsedData)
          }
        }
      } catch (error) {
        console.error("Error processing interview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  return (
    <Dashboard
        interviewId={id as string}
        interviewData={interviewData}
        loading={loading}
      />
  )
}

