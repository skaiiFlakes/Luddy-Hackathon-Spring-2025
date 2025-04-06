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
        // Check if interview exists in master interviews list
        const interviewsJson = localStorage.getItem('interviews');
        const interviews = interviewsJson ? JSON.parse(interviewsJson) : {};

        if (interviews[sessionId]) {
          // Use existing interview data
          setInterviewData(interviews[sessionId]);
          setLoading(false);
          return;
        }

        // If not found, proceed with API calls
        const storedData = localStorage.getItem('interviewData');
        if (storedData) {
          const parsedData: InterviewData = JSON.parse(storedData);

          // Reconstruct the video blob from base64 data
          let videoBlob: Blob | null = null;
          if ((parsedData as any).videoBlob) {
            try {
              // If it's already a Blob, use it directly
              if ((parsedData as any).videoBlob instanceof Blob) {
                videoBlob = (parsedData as any).videoBlob;
              } else {
                // If it's base64 data, convert it to a Blob
                const base64Data = (parsedData as any).videoBlob;
                const byteCharacters = atob(base64Data);
                const byteArrays = [];

                for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
                  const slice = byteCharacters.slice(offset, offset + 1024);
                  const byteNumbers = new Array(slice.length);

                  for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                  }

                  const byteArray = new Uint8Array(byteNumbers);
                  byteArrays.push(byteArray);
                }

                videoBlob = new Blob(byteArrays, { type: 'video/webm' });
              }
            } catch (error) {
              console.error('Error reconstructing video blob:', error);
            }
          }

          if (videoBlob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            saveAs(videoBlob, `interview-${timestamp}.webm`);
          }

          try {
            // Call both APIs in parallel using axios
            const [feedbackResponse, coachResponse] = await Promise.all([
              axios.get(`http://localhost:5000/api/interview/${sessionId}/feedback`),
              (async () => {
                if (videoBlob) {
                  const formData = new FormData();
                  formData.append('file', videoBlob, 'interview.webm');
                  return axios.post('http://localhost:5000/api/coach', formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });
                }
                return { data: FALLBACK_COACH_DATA, status: 200 };
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
              ...parsedData,
              analysis: {
                ...transformFeedbackData(feedbackData),
                body_language: [{
                  attribute: "Eye Contact",
                  timestamp: "00:00",
                  score: coachData.eye_contact,
                  explanation: `Maintained eye contact ${coachData.eye_contact}% of the time. ${coachData.recommendations[0]}`
                }, {
                  attribute: "Posture",
                  timestamp: "00:00",
                  score: coachData.posture,
                  explanation: `Posture score: ${coachData.posture}/100. ${coachData.recommendations[2]}`
                }, {
                  attribute: "Gestures",
                  timestamp: "00:00",
                  score: Math.min(100, coachData.gestures.length * 20),
                  explanation: `Observed gestures: ${coachData.gestures.join(", ")}. ${coachData.recommendations[1]}`
                }]
              }
            };

            // Save to master interviews list
            interviews[sessionId] = finalInterviewData;
            localStorage.setItem('interviews', JSON.stringify(interviews));

            setInterviewData(finalInterviewData);
          } catch (error) {
            console.error("Error fetching analysis:", error);
            // Use fallback data
            const transformedFeedbackData = transformFeedbackData(FALLBACK_FEEDBACK_DATA);
            const fallbackData: InterviewData = {
              ...parsedData,
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
            interviews[sessionId] = fallbackData;
            localStorage.setItem('interviews', JSON.stringify(interviews));

            setInterviewData(fallbackData);
          }
        } else {
          // If no stored data, use fallback data
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
          setInterviewData(fallbackData);
        }
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

