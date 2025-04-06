"use client"
import Navbar from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Mic, Video, Loader } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { InterviewResponse } from "@/services/ai-interview-service"

interface InterviewData {
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

interface Resource {
  title: string;
  url: string;
}

interface FeedbackItem {
  question: string;
  wentWell: string;
  improvements: string;
}

interface AnalysisItem {
  attribute: string;
  timestamp: string;
  score: number;
  explanation: string;
}

interface DashboardProps {
  interviewId?: string;
  interviewData?: InterviewData | null;
  loading?: boolean;
}

export default function Dashboard({ interviewId, interviewData, loading = false }: DashboardProps) {
  // Disable scrolling on the page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("qna")

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format date and time
  const formatDateTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Prepare the actual data to display
  const displayData = {
    company: interviewData?.analysis?.metadata?.company || "Unknown Company",
    jobTitle: interviewData?.analysis?.metadata?.job_title || "Unknown Job Title",
    jobUrl: interviewData?.analysis?.metadata?.job_url || "No job URL available.",
    jobDescription: interviewData?.analysis?.metadata?.job_description || "No job description available.",
    dateTime: interviewData?.timestamp ? formatDateTime(interviewData.timestamp) : "Recent Interview",
    resources: interviewData?.analysis?.resources || [],
    summary: interviewData?.analysis?.evaluation.summary || "Analysis not available. This interview has been recorded and will be analyzed soon.",
    transcript: interviewData?.responses.map((response, index) => ({
      timestamp: formatTime(Math.floor((response.timestamp - interviewData?.responses[0]?.timestamp) / 1000)),
      text: `${response.type === 'ai' ? 'Interviewer' : 'You'}: ${response.text}`
    })),
    qnaFeedback: interviewData?.analysis?.qna_feedback || [],
    toneVoice: interviewData?.analysis?.tone_voice || [],
    bodyLanguage: interviewData?.analysis?.body_language || []
  };

  // Function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500"
    if (score >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  const calculateOverallScore = () => {
    // Combine all scores from tone/voice and body language
    const allScores = [
      ...displayData.toneVoice.map((item: AnalysisItem) => item.score),
      ...displayData.bodyLanguage.map((item: AnalysisItem) => item.score),
    ]

    // If no scores are available, return a default score
    if (allScores.length === 0) {
      return 0;
    }

    // Calculate average
    const average = allScores.reduce((sum, score) => sum + score, 0) / allScores.length
    return Math.round(average)
  }

  const getScoreDescription = (score: number) => {
    if (score >= 90) return { text: "Excellent", color: "bg-green-500" }
    if (score >= 80) return { text: "Very Good", color: "bg-green-500" }
    if (score >= 70) return { text: "Good", color: "bg-yellow-500" }
    if (score >= 60) return { text: "Satisfactory", color: "bg-yellow-500" }
    return { text: "Needs Improvement", color: "bg-red-500" }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar onNewInterview={() => setIsModalOpen(true)} />
        <div className="container flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader className="h-8 w-8 animate-spin mb-4" />
            <p>Loading interview analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onNewInterview={() => setIsModalOpen(true)} />
      {/* MAIN CONTENT */}
      <div className="container flex flex-1 flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-1/4 p-4 lg:pr-2 pl-0 px-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Job Description</CardTitle>
              {interviewData && interviewData.jobUrl && (
                <CardDescription>
                  <a href={interviewData.jobUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View Original Job Posting
                  </a>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100vh-9.5rem)]">
              <ScrollArea className="flex-grow">
                {displayData.jobDescription.split("\n").map((line: string, index: number) => (
                  <p key={index} className="mb-2 text-sm text-muted-foreground">
                    {line}
                  </p>
                ))}
              </ScrollArea>
              {displayData.resources.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Resources</h3>
                    <ScrollArea className="h-40">
                      <ul className="space-y-1.5">
                        {displayData.resources.map((resource: Resource, index: number) => (
                          <li key={index}>
                            <a
                              href={resource.url}
                              className="text-sm text-primary hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {resource.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Middle Column - Removed left and right padding */}
        <div className="w-full lg:w-2/4 p-4 lg:px-2 px-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardDescription className="text-sm">{displayData.company}</CardDescription>
                  <CardTitle className="text-lg">{displayData.jobTitle}</CardTitle>
                  <CardDescription>{displayData.dateTime}</CardDescription>
                </div>
                {calculateOverallScore() > 0 && (
                  <div className="flex items-center gap-2 bg-muted/60 border px-4 py-2 rounded-md ">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold">{calculateOverallScore()}%</div>
                      <div className="flex items-center gap-2 text-xs ">
                        <span
                          className={`h-2 w-2 rounded-full ${getScoreDescription(calculateOverallScore()).color}`}
                        ></span>
                        {getScoreDescription(calculateOverallScore()).text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)]">
              <p className="text-sm text-muted-foreground mb-4">{displayData.summary}</p>
              <Separator className="my-4 w-full" />
              <div className="flex-grow overflow-auto">
                <ScrollArea className="h-[calc(100vh-26.5rem)]">
                  <div className="space-y-4">
                    {displayData.transcript.map((entry, index) => (
                      <div key={index} className="flex">
                        <span className="text-xs font-medium text-muted-foreground w-12 flex-shrink-0">
                          {entry.timestamp}
                        </span>
                        <p className="text-sm">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Right Column */}
        <div className="w-full lg:w-1/4 p-4 lg:pl-2 px-0">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <Tabs defaultValue="qna" className="h-full flex flex-col">
                <TooltipProvider>
                  <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/60 border-b h-11">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="qna"
                          onClick={() => setActiveTab("qna")}
                          className={`${
                            activeTab === "qna"
                              ? "bg-white text-black border border-gray-200"
                              : ""
                          }`}
                        >
                          <MessageSquare className="h-5 w-5" />
                          <span className="sr-only">QnA Feedback</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>QnA Feedback</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="tone"
                          onClick={() => setActiveTab("tone")}
                          className={`${
                            activeTab === "tone"
                              ? "bg-white text-black border border-gray-200"
                              : ""
                          }`}
                        >
                          <Mic className="h-5 w-5" />
                          <span className="sr-only">Tone & Voice</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tone & Voice</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger
                            value="body"
                            onClick={() => setActiveTab("body")}
                            className={`${
                              activeTab === "body"
                                ? "bg-white text-black border border-gray-200"
                                : ""
                            }`}
                          >
                            <Video className="h-5 w-5" />
                            <span className="sr-only">Body Language</span>
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Body Language</p>
                        </TooltipContent>
                      </Tooltip>
                  </TabsList>
                </TooltipProvider>
                {/* RIGHT COL — QNA */}
                <TabsContent value="qna" className="flex-grow overflow-auto p-4">
                  <ScrollArea className="h-[calc(100vh-11rem)]">
                    <div className="space-y-4">
                      {displayData.qnaFeedback.length > 0 ? (
                        displayData.qnaFeedback.map((feedback: FeedbackItem, index: number) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{feedback.question}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-medium text-sm flex items-center gap-2"><span className={`h-2 w-2 rounded-full bg-green-500`}></span>Successes</h4>
                                  <p className="text-sm text-muted-foreground">{feedback.wentWell}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm flex items-center gap-2"><span className={`h-2 w-2 rounded-full bg-red-500`}></span>Improvements</h4>
                                  <p className="text-sm text-muted-foreground">{feedback.improvements}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-32 text-center">
                          <p className="text-muted-foreground">
                            Analysis of your Q&A responses will appear here once processed.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                {/* RIGHT COL — TONE */}
                <TabsContent value="tone" className="flex-grow overflow-auto p-4">
                  <ScrollArea className="h-[calc(100vh-11rem)]">
                    <div className="space-y-4">
                      {displayData.toneVoice.length > 0 ? (
                        displayData.toneVoice.map((item: AnalysisItem, index: number) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">{item.attribute}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={item.score}
                                    className="h-2"
                                    indicatorClassName={getScoreColor(item.score)}
                                  />
                                  <span className="text-sm font-medium">{item.score}%</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.explanation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-32 text-center">
                          <p className="text-muted-foreground">
                            Analysis of your tone and voice will appear here once processed.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                {/* RIGHT COL — BODY */}
                <TabsContent value="body" className="flex-grow overflow-auto p-4">
                  <ScrollArea className="h-[calc(100vh-11rem)]">
                    <div className="space-y-4">
                      {displayData.bodyLanguage.length > 0 ? (
                        displayData.bodyLanguage.map((item: AnalysisItem, index: number) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">{item.attribute}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={item.score}
                                    className="h-2"
                                    indicatorClassName={getScoreColor(item.score)}
                                  />
                                  <span className="text-sm font-medium">{item.score}%</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.explanation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-32 text-center">
                          <p className="text-muted-foreground">
                            Analysis of your body language will appear here once processed.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
