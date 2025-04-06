import { InterviewResponse } from "@/services/ai-interview-service"

export interface InterviewData {
  interviewer: string;
  personality: string;
  responses: InterviewResponse[];
  jobUrl: string;
  duration: number;
  timestamp: string;
  analysis?: any;
  metadata?: {
    company: string;
    job_title: string;
    job_description: string;
    job_url: string;
  };
}

export interface Resource {
  title: string;
  url: string;
}

export interface FeedbackItem {
  question: string;
  wentWell: string;
  improvements: string;
}

export interface AnalysisItem {
  attribute: string;
  timestamp: string;
  score: number;
  explanation: string;
}

export interface DashboardProps {
  interviewId?: string;
  interviewData?: InterviewData | null;
  loading?: boolean;
}
