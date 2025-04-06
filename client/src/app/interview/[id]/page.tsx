"use client"
import { useParams } from "next/navigation"
import Dashboard from "@/components/dashboard"
import { useEffect, useState, useRef } from "react"
import { InterviewData } from "@/types/interview"
import { FALLBACK_FEEDBACK_DATA, FALLBACK_COACH_DATA } from "@/constants/feedback"
import { transformFeedbackData } from "@/utils/transformFeedback"
import axios from "axios"
import { saveAs } from "file-saver"

export default function InterviewPage() {
  const params = useParams()
  const sessionId = params.id as string
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      // Only proceed if not already initialized
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        // Get the master interviews list
        const interviewsJson = localStorage.getItem('interviews');
        const interviews = interviewsJson ? JSON.parse(interviewsJson) : {};

        if (interviews[sessionId]) {
          // Use existing interview data
          setInterviewData(interviews[sessionId]);
          setLoading(false);
          return;
        }

        // If no data found, use fallback data
        const transformedFeedbackData = transformFeedbackData(FALLBACK_FEEDBACK_DATA);
        const fallbackData: InterviewData = {
          interviewer: FALLBACK_FEEDBACK_DATA.metadata.interviewer,
          personality: "professional",
          responses: FALLBACK_FEEDBACK_DATA.full_transcript.map(entry => ({
            type: entry.role === 'interviewer' ? 'ai' : 'user',
            text: entry.content,
            timestamp: new Date(entry.timestamp).getTime()
          })),
          jobUrl: FALLBACK_FEEDBACK_DATA.metadata.job_url,
          duration: FALLBACK_COACH_DATA.duration,
          timestamp: FALLBACK_FEEDBACK_DATA.metadata.start_time,
          analysis: {
            ...transformedFeedbackData,
            body_language: [
              {
                attribute: "Eye Contact",
                timestamp: "00:00",
                score: FALLBACK_COACH_DATA.eye_contact,
                explanation: FALLBACK_COACH_DATA.recommendations[0]
              },
              {
                attribute: "Posture",
                timestamp: "00:00",
                score: FALLBACK_COACH_DATA.posture,
                explanation: FALLBACK_COACH_DATA.recommendations[2]
              }
            ]
          }
        };

        // Save fallback data to master interviews list
        interviews[sessionId] = fallbackData;
        localStorage.setItem('interviews', JSON.stringify(interviews));

        setInterviewData(fallbackData);
      } catch (error) {
        console.error('Error fetching interview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  return <Dashboard interviewId={sessionId} interviewData={interviewData} loading={loading} />;
}

