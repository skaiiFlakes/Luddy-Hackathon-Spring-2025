import { FeedbackResponse } from "@/types/feedback"

export const transformFeedbackData = (feedbackData: FeedbackResponse) => {
  return {
    metadata: {
      company: feedbackData.metadata.company,
      job_title: feedbackData.metadata.job_title,
      job_description: feedbackData.metadata.job_description,
      job_url: feedbackData.metadata.job_url,
    },
    evaluation: {
      overall_score: Math.round(feedbackData.analysis.performance_metrics.average_score * 100),
      overall_rating: feedbackData.analysis.performance_metrics.overall_rating,
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
      wentWell: answer.evaluation.strengths,
      improvements: answer.evaluation.areas_for_improvement
    })),
    tone_voice: Object.entries(feedbackData.sentiment_analysis.emotion_analysis).map(([emotion, data]) => ({
      attribute: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      timestamp: "00:00",
      score: data.score,
      explanation: data.evidence
    }))
  }
}
