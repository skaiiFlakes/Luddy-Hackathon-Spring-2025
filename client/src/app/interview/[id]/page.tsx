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
  videoBlob?: Blob;
}

interface FeedbackResponse {
  analysis: {
    overall_feedback: string;
    performance_metrics: {
      average_score: number;
      overall_rating: string;
    };
  };
  answers: Array<{
    answer: string;
    evaluation: {
      areas_for_improvement: string[];
      grade: string;
      strengths: string[];
      suggestions: string[];
    };
    question: string;
    question_id: number;
  }>;
  full_transcript: Array<{
    content: string;
    question_id: number;
    role: string;
    timestamp: string;
  }>;
  metadata: {
    end_time: string;
    interview_type: string;
    interviewer: string;
    start_time: string;
    company: string;
    job_url: string;
    job_title: string;
    job_description: string;
  };
  questions: string[];
  sentiment_analysis: {
    dominant_emotion: string;
    emotion_analysis: {
      [key: string]: {
        evidence: string;
        score: number;
      };
    };
    feedback: string;
  };
}

// Fallback data for when API calls fail
const fallbackFeedbackData: FeedbackResponse = {
  analysis: {
    overall_feedback: "Strong interview performance with room for improvement in providing concrete examples.",
    performance_metrics: {
      average_score: 0.85,
      overall_rating: "Good"
    }
  },
  answers: [{
    answer: "Sample answer",
    evaluation: {
      areas_for_improvement: ["More specific examples", "Better time management"],
      grade: "B",
      strengths: ["Clear communication", "Good technical knowledge"],
      suggestions: ["Provide more concrete examples", "Research the company more thoroughly"]
    },
    question: "Sample question",
    question_id: 0
  },{
    answer: "Sample answer",
    evaluation: {
      areas_for_improvement: ["More specific examples", "Better time management"],
      grade: "B",
      strengths: ["Clear communication", "Good technical knowledge"],
      suggestions: ["Provide more concrete examples", "Research the company more thoroughly"]
    },
    question: "Sample question",
    question_id: 0
  }],
  full_transcript: [{
    content: "Sample transcript",
    question_id: 0,
    role: "interviewer",
    timestamp: "20250406_020323"
  }],
  metadata: {
    end_time: "N/A",
    interview_type: "technical",
    interviewer: "todd",
    start_time: "20250406_020249",
    company: "Google",
    job_url: "https://www.google.com/about/careers/applications/jobs/results/134028773082178246-software-engineer-engineering-productivity-silicon",
    job_title: "Software Engineer - Engineering Productivity, Silicon",
    job_description: "Sample job description for Software Engineer position at Google. This role involves working on engineering productivity tools and infrastructure for Silicon development."
  },
  questions: ["Sample question"],
  sentiment_analysis: {
    dominant_emotion: "confidence",
    emotion_analysis: {
      confidence: {
        evidence: "Sample evidence",
        score: 75
      }
    },
    feedback: "Sample feedback"
  }
};

const fallbackCoachData = {
  duration: 1200,
  eye_contact: 85,
  gestures: [
    "Hand movements: 12 times",
    "Head nods: 8 times",
    "Facial expressions: 15 times"
  ],
  posture: 90,
  recommendations: [
    "Try to maintain more consistent eye contact",
    "Use hand gestures more purposefully",
    "Consider sitting slightly more upright"
  ]
};

// Transform feedback API response into dashboard format
const transformFeedbackData = (feedbackData: FeedbackResponse): any => {
  return {
    metadata: {
      company: feedbackData.metadata.company,
      job_title: feedbackData.metadata.job_title,
      job_description: feedbackData.metadata.job_description,
      job_url: feedbackData.metadata.job_url,
    },
    evaluation: {
      overall_score: Math.round(feedbackData.analysis.performance_metrics.average_score * 100),
      strengths: feedbackData.analysis.overall_feedback.match(/\*\*Strengths:\*\*([\s\S]*?)\*\*Areas for Improvement:\*\*/)?.[1]
        ?.split('\n')
        .filter((line: string) => line.trim().startsWith('1.') || line.trim().startsWith('2.'))
        .map((line: string) => line.replace(/^\d+\.\s+\*\*|\*\*$/g, '')) || [],
      areas_for_improvement: feedbackData.analysis.overall_feedback.match(/\*\*Areas for Improvement:\*\*([\s\S]*?)\*\*Patterns Observed:\*\*/)?.[1]
        ?.split('\n')
        .filter((line: string) => line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.'))
        .map((line: string) => line.replace(/^\d+\.\s+\*\*|\*\*$/g, '')) || [],
      summary: feedbackData.analysis.overall_feedback
    },
    qna_feedback: feedbackData.answers.map(answer => ({
      question: answer.question,
      wentWell: answer.evaluation.strengths.join('. '),
      improvements: answer.evaluation.areas_for_improvement.join('. ')
    })),
    tone_voice: Object.entries(feedbackData.sentiment_analysis.emotion_analysis).map(([emotion, data]) => ({
      attribute: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      timestamp: "00:00",
      score: data.score,
      explanation: data.evidence
    }))
  };
};

export default function InterviewPage() {
  const params = useParams()
  const sessionId = params.id as string
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
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

          try {
            // TEMPORARY
            throw new Error("Intentional error for testing");

            const [feedbackResponse, coachResponse] = await Promise.all([
              fetch(`http://localhost:5000/api/interview/${sessionId}/feedback`, {
                method: "GET",
                headers: {
                  'Content-Type': 'application/json',
                }
              }),
              fetch('http://localhost:5000/api/coach', {
                method: 'POST',
                body: (() => {
                  const formData = new FormData();
                  const videoBlob = parsedData.videoBlob;
                  if (videoBlob && typeof videoBlob === 'object' && videoBlob instanceof Blob) {
                    formData.append('file', videoBlob, 'interview.webm');
                  }
                  return formData;
                })()
              })
            ]);

            let feedbackData: FeedbackResponse = fallbackFeedbackData;
            let coachData = fallbackCoachData;

            if (feedbackResponse.ok) {
              feedbackData = await feedbackResponse.json();
            }

            if (coachResponse.ok) {
              coachData = await coachResponse.json();
            }

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
            const fallbackData = {
              ...parsedData,
              analysis: {
                ...transformFeedbackData(fallbackFeedbackData),
                body_language: [{
                  attribute: "Eye Contact",
                  timestamp: "00:00",
                  score: fallbackCoachData.eye_contact,
                  explanation: `Maintained eye contact ${fallbackCoachData.eye_contact}% of the time. ${fallbackCoachData.recommendations[0]}`
                }, {
                  attribute: "Posture",
                  timestamp: "00:00",
                  score: fallbackCoachData.posture,
                  explanation: `Posture score: ${fallbackCoachData.posture}/100. ${fallbackCoachData.recommendations[2]}`
                }, {
                  attribute: "Gestures",
                  timestamp: "00:00",
                  score: Math.min(100, fallbackCoachData.gestures.length * 20),
                  explanation: `Observed gestures: ${fallbackCoachData.gestures.join(", ")}. ${fallbackCoachData.recommendations[1]}`
                }]
              }
            };

            // Save fallback data to master interviews list
            interviews[sessionId] = fallbackData;
            localStorage.setItem('interviews', JSON.stringify(interviews));

            setInterviewData(fallbackData);
          }
        }
      } catch (error) {
        console.error("Error processing interview data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sessionId]);

  console.log("Interview data:", interviewData);

  return interviewData ? (
    <Dashboard
      interviewId={sessionId}
      interviewData={interviewData}
      loading={loading}
    />
  ) : null;
}

