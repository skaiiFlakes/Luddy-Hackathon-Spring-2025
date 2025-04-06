import { InterviewData } from "@/types/interview"
import { formatDateTime } from "@/utils/formatting"

export interface InterviewListItem {
  id: string;
  jobTitle: string;
  company: string;
  dateTime: string;
  score: number;
}

export const transformInterviewList = (interviews: Record<string, InterviewData>): InterviewListItem[] => {
  return Object.entries(interviews).map(([id, interview]) => ({
    id,
    jobTitle: interview.analysis?.metadata?.job_title || "Unknown Job Title",
    company: interview.analysis?.metadata?.company || "Unknown Company",
    dateTime: formatDateTime(interview.timestamp),
    score: interview.analysis?.evaluation?.overall_score || 0
  }));
};
