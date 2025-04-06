export interface FeedbackResponse {
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

export interface CoachData {
  duration: number;
  eye_contact: number;
  gestures: string[];
  posture: number;
  recommendations: string[];
}
