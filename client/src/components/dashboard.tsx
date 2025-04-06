"use client"
import Navbar from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Mic, Video, Loader } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { DashboardProps, Resource, FeedbackItem, AnalysisItem } from "@/types/interview"
import { formatTime, formatDateTime } from "@/utils/formatting"
import { FALLBACK_DATA } from "@/constants/interview"
import { getScoreColor } from "@/utils/score"
import ReactMarkdown from "react-markdown"

export default function Dashboard({ interviewId, interviewData, loading = false }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("qna")

  // Prepare the actual data to display
  const displayData = {
    company: interviewData?.analysis?.metadata?.company || FALLBACK_DATA.company,
    jobTitle: interviewData?.analysis?.metadata?.job_title || FALLBACK_DATA.jobTitle,
    jobUrl: interviewData?.analysis?.metadata?.job_url || FALLBACK_DATA.jobUrl,
    jobDescription: interviewData?.analysis?.metadata?.job_description || FALLBACK_DATA.jobDescription,
    dateTime: interviewData?.timestamp ? formatDateTime(interviewData.timestamp) : "Recent Interview",
    resources: interviewData?.analysis?.resources || [],
    summary: interviewData?.analysis?.evaluation.summary || FALLBACK_DATA.summary,
    overallScore: interviewData?.analysis?.evaluation.overall_score || FALLBACK_DATA.overallScore,
    overallRating: interviewData?.analysis?.evaluation.overall_rating || FALLBACK_DATA.overallRating,
    transcript: interviewData?.responses.map((response, index) => ({
      timestamp: formatTime(Math.floor((response.timestamp - interviewData?.responses[0]?.timestamp) / 1000)),
      text: `${response.type === 'ai' ? 'Interviewer' : 'You'}: ${response.text}`
    })) || FALLBACK_DATA.transcript,
    qnaFeedback: interviewData?.analysis?.qna_feedback || FALLBACK_DATA.qnaFeedback,
    toneVoice: interviewData?.analysis?.tone_voice || FALLBACK_DATA.toneVoice,
    bodyLanguage: interviewData?.analysis?.body_language || FALLBACK_DATA.bodyLanguage
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
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
      <Navbar />
      {/* MAIN CONTENT */}
      <div className="container flex flex-1 flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-1/4 p-4 lg:pr-2 pl-0 px-0">
          <Card className="h-[calc(100vh-5.6rem)]">
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
              <Separator className="my-4" />
              <div className="flex-none">
                <h3 className="text-lg font-semibold mb-2">Recommended Resources</h3>
                <ScrollArea className="h-[calc(100vh-46.5rem)]">

                  <div className="space-y-4">
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                      <iframe
                        src="https://www.youtube.com/embed/wCU9X8QK-rg"
                        title="Interview Tips Video Guide"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <ul className="space-y-2">
                      <li>
                        <a
                          href="https://www.betterup.com/blog/star-interview-method"
                          className="text-sm text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          STAR Interview Method Guide
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.w3schools.com/python/python_interview_questions.asp"
                          className="text-sm text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Python Interview Questions
                        </a>
                      </li>
                    </ul>
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="w-full lg:w-2/4 p-4 lg:px-2 px-0">
          <Card className="h-[calc(100vh-5.6rem)]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardDescription className="text-sm">{displayData.company}</CardDescription>
                  <CardTitle className="text-lg">{displayData.jobTitle}</CardTitle>
                  <CardDescription>{displayData.dateTime}</CardDescription>
                </div>
                {displayData.overallScore > 0 && (
                  <div className="flex items-center gap-2 bg-muted/60 border px-4 py-2 rounded-md ">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold">{displayData.overallScore}%</div>
                      <div className="flex items-center gap-2 text-xs ">
                        <span
                          className={`h-2 w-2 rounded-full ${getScoreColor(displayData.overallScore)}`}
                        ></span>
                        {displayData.overallRating}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)]">
              <div className="flex-none">
                <div className="prose prose-sm">
                  <ReactMarkdown>{displayData.summary}</ReactMarkdown>
                </div>
                <Separator className="my-4 w-full" />
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {displayData.transcript.map((entry, index) => (
                    <div key={index} className="flex">
                      <span className="text-xs font-medium text-muted-foreground w-12 flex-shrink-0">
                        {entry.timestamp}
                      </span>
                      <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/4 p-4 lg:pl-2 px-0">
          <Card className="h-[calc(100vh-5.6rem)]">
            <CardContent className="p-0 h-full">
              <Tabs defaultValue="qna" className="h-full flex flex-col">
                <TooltipProvider>
                  <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/60 border-b h-11">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="qna"
                          onClick={() => setActiveTab("qna")}
                          className={`${activeTab === "qna"
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
                          className={`${activeTab === "tone"
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
                          className={`${activeTab === "body"
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

                {/* QnA Tab */}
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
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.wentWell}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm flex items-center gap-2"><span className={`h-2 w-2 rounded-full bg-red-500`}></span>Improvements</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.improvements}</p>
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

                {/* Tone Tab */}
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
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.explanation}</p>
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

                {/* Body Language Tab */}
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
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.explanation}</p>
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
