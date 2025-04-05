"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Mic, Video } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import NewInterviewModal from "@/components/new-interview-modal"
import { useEffect } from "react"

interface DashboardProps {
  interviewId?: string
}

export default function Dashboard({ interviewId }: DashboardProps) {

  // This would be used to fetch the specific interview data in a real app
  console.log(`Displaying interview with ID: ${interviewId || "default"}`)

  // Disable scrolling on the page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("qna")

  // Sample data for demonstration
  const interviewData = {
    company: "TechCorp Inc.",
    jobTitle: "Senior Frontend Developer",
    dateTime: "May 15, 2023 • 2:30 PM",
    jobDescription: `We are looking for an Interaction Designer to join our team. The ideal candidate will have a Bachelor's degree or equivalent practical experience, with at least 4 years of experience in product design or User Experience (UX). You should have experience designing across multiple platforms and collaborating with technical/design teams to create user flows, wireframes, and user interface mockups and prototypes. A portfolio or any related link to your work should be included in your resume.

Preferred qualifications:

- Master's degree in Design, Human-Computer Interaction, Computer Science, or a related field, or equivalent practical experience.
- 2 years of experience working in a cross-functional organization.
- 1 year of experience in leading design projects.
- Experience with technical constraints and limitations, with excellent problem-solving skills.
- Ability to guide and ideate products from scratch and improve features.
- Excellent communication and collaboration skills for product design strategy.

About the job

At Google, we follow a simple but vital premise: 'Focus on the user and all else will follow.' Google’s Interaction Designers take complex tasks and make them intuitive and easy-to-use for billions of people around the globe. Throughout the design process—from creating user flows and wireframes to building user interface mockups and prototypes—you’ll envision how
`,
    resources: [
      { title: "Company Website", url: "https://interviewiq.com" },
      { title: "Job Description", url: "https://interviewiq.com/jobs/senior-frontend-developer" },
      { title: "Company Culture", url: "https://interviewiq.com/about/culture" },
      { title: "Tech Stack Overview", url: "https://interviewiq.com/tech" },
      { title: "Interview Preparation Guide", url: "https://interviewiq.com/guides/interview-prep" },
      { title: "Company Website", url: "https://interviewiq.com" },
      { title: "Job Description", url: "https://interviewiq.com/jobs/senior-frontend-developer" },
      { title: "Company Culture", url: "https://interviewiq.com/about/culture" },
      { title: "Tech Stack Overview", url: "https://interviewiq.com/tech" },
      { title: "Interview Preparation Guide", url: "https://interviewiq.com/guides/interview-prep" },
      { title: "Company Website", url: "https://interviewiq.com" },
      { title: "Job Description", url: "https://interviewiq.com/jobs/senior-frontend-developer" },
      { title: "Company Culture", url: "https://interviewiq.com/about/culture" },
      { title: "Tech Stack Overview", url: "https://interviewiq.com/tech" },
      { title: "Interview Preparation Guide", url: "https://interviewiq.com/guides/interview-prep" },
    ],
    summary:
      "The candidate demonstrated strong technical knowledge in frontend development, particularly in React and state management. They articulated their experience well and provided concrete examples of past projects. Communication skills were excellent, with clear and concise responses. Areas for improvement include more detailed explanations of architectural decisions and stronger examples of team leadership. Overall, a strong candidate who would be a good fit for the Senior Frontend Developer role.",
    transcript: [
      {
        "timestamp": "00:00",
        "text": "Interviewer: Hello and welcome to the interview. Could you start by introducing yourself and telling us about your background?"
      },
      {
        "timestamp": "00:15",
        "text": "Candidate: Hi, thank you for having me. I'm Alex, a frontend developer with 6 years of experience in the field. Over the years, I've worked with a range of technologies, but for the last 4 years, I've focused primarily on React. I began my career working with Angular, which helped me develop a solid understanding of single-page applications and component-based architecture. I’m currently working at TechCorp, where I lead the frontend team for our customer-facing dashboard product. We’ve been focusing a lot on scalability and performance improvements as our user base continues to grow. We recently started introducing some advanced features, like real-time data updates and custom reporting, which has been a really exciting challenge."
      },
      {
        "timestamp": "01:30",
        "text": "Interviewer: That’s great. It sounds like you’ve been involved in some impactful work. Can you tell us about a particularly challenging project you worked on recently?"
      },
      {
        "timestamp": "01:45",
        "text": "Candidate: Absolutely. One of the most challenging projects I worked on recently was a complete overhaul of our analytics dashboard. We needed to make it capable of handling a 10x increase in data points without sacrificing performance. It was a pretty complex challenge because the existing architecture wasn’t designed to scale like that. My team and I decided to implement virtualized rendering for the data tables, which allowed us to only render the rows currently in view, drastically improving performance. Additionally, I led the effort to optimize our Redux store structure, reducing unnecessary re-renders. We also introduced a worker thread for processing data in the background, so the main UI thread stayed responsive even with heavy data processing. The project was a success — we were able to cut down the rendering time by about 70%, and user feedback has been overwhelmingly positive."
      },
      {
        "timestamp": "03:20",
        "text": "Interviewer: That’s impressive! It sounds like you have a solid understanding of performance optimization. How do you approach state management in large applications?"
      },
      {
        "timestamp": "03:35",
        "text": "Candidate: I believe that the key to good state management is using the right tool for the job. In larger applications, where you have multiple layers of components, I typically rely on Redux for global state that needs to be accessed across many different parts of the app. However, I try to keep state as local as possible by utilizing React's built-in useState and useReducer hooks for components that only need to manage their own state. For more specific feature-related state, I often use context to provide a way to share state across components without overloading the global store. This layered approach not only helps with performance but also keeps the codebase cleaner and more maintainable over time."
      },
      {
        "timestamp": "05:00",
        "text": "Interviewer: That sounds like a well-thought-out approach. Can you give us a concrete example of how you’ve implemented this in a project?"
      },
      {
        "timestamp": "05:15",
        "text": "Candidate: Sure, I’d love to. In one of our recent projects, we had a multi-step form that was quite complex. The form had conditional steps based on user inputs, and it needed to handle form validation, error messages, and progress tracking. Instead of using global state for everything, I kept the form fields themselves in local state within each step using useState, and I used context to manage things like the current step and overall validation state. This way, each individual form component could remain independent, and we avoided unnecessary re-renders. Only the components that were affected by user interaction would re-render. This allowed the form to stay responsive, even with a complex structure. Additionally, it made it easier to maintain and update in the future, as the logic for each step was kept isolated from the others."
      },
      {
        "timestamp": "06:00",
        "text": "Interviewer: That’s a really smart way to manage complexity and ensure performance stays optimal. You’ve obviously got a strong grasp of React. How do you stay current with new trends and best practices in the ever-evolving frontend ecosystem?"
      },
      {
        "timestamp": "06:15",
        "text": "Candidate: I try to stay as up-to-date as possible by regularly reading blogs, attending webinars, and engaging with the community on GitHub and Stack Overflow. I also try to experiment with new features as they’re released. For example, I’ve recently started exploring React Server Components and how they might help with improving performance in certain use cases. In addition to that, I love attending conferences and meetups where I can learn from other developers. It’s important to me to keep learning, not only to stay current but to ensure that the solutions I’m providing are as modern and efficient as possible."
      },
      {
        "timestamp": "06:45",
        "text": "Interviewer: That’s fantastic! It’s great to see that you’re proactive about continuing your education. Now, let’s talk about your experience with teams. How do you approach collaboration and code reviews in your current role?"
      },
      {
        "timestamp": "07:00",
        "text": "Candidate: Collaboration is one of the aspects I really enjoy about working in a team. I believe that the best results come from open communication and shared problem-solving. In my current role, I work closely with both designers and backend engineers to ensure the frontend integrates smoothly with the rest of the system. When it comes to code reviews, I think they’re an essential part of our development process. I always try to give constructive feedback, focusing not only on the code itself but also on the overall design and maintainability. I also appreciate when others provide feedback on my code, as it helps me see different perspectives and improve my work. I try to foster a collaborative atmosphere where everyone feels comfortable sharing their thoughts and suggestions."
      },
      {
        "timestamp": "07:30",
        "text": "Interviewer: That’s great to hear. We definitely value collaboration and feedback here. So, if you were to join our team, how would you contribute to building a positive, collaborative culture?"
      },
      {
        "timestamp": "07:45",
        "text": "Candidate: I would start by getting to know my teammates and understanding their strengths and areas they’d like to improve in. I think it’s important to recognize that everyone has unique skills and approaches, and it’s important to respect and learn from each other. I would also encourage transparency and open communication — sharing both successes and challenges is essential in fostering a strong team dynamic. I’m a big believer in pairing programming and regular check-ins to keep the team aligned and provide support when needed. At the same time, I would try to inject a sense of fun into the team culture. Building relationships outside of work tasks is key to creating a friendly and productive environment."
      },
      {
        "timestamp": "08:00",
        "text": "Interviewer: Those are fantastic qualities to bring to a team. Thank you for your thoughtful answers today. We really appreciate your time. Do you have any final questions for us?"
      },
      {
        "timestamp": "08:15",
        "text": "Candidate: Yes, I’d love to know more about the team’s current projects and how you approach onboarding new team members. I’m always curious about the way teams integrate new hires into their processes and workflows."
      },
      {
        "timestamp": "08:30",
        "text": "Interviewer: We have a few exciting projects in the pipeline, including a complete revamp of our mobile app and some new features for our flagship product. When it comes to onboarding, we make sure that new team members are paired with mentors who can guide them through the first few weeks. We also have a series of onboarding documents and training sessions to help everyone get up to speed with our processes and tools. The goal is to make sure that new hires feel supported and integrated as quickly as possible."
      },
      {
        "timestamp": "08:45",
        "text": "Candidate: That sounds like an excellent approach. I really value a structured yet welcoming onboarding process. It would be exciting to contribute to these projects."
      },
      {
        "timestamp": "09:00",
        "text": "Interviewer: We definitely strive to create a positive and supportive environment. Thank you again for your time today. We’ll be in touch soon."
      },
      {
        "timestamp": "09:15",
        "text": "Candidate: Thank you! I really appreciate the opportunity to speak with you today, and I look forward to hearing from you soon."
      },
      {
        "timestamp": "09:30",
        "text": "Interviewer: Goodbye."
      },
      {
        "timestamp": "09:45",
        "text": "Candidate: Goodbye."
      }
    ],
    qnaFeedback: [
      {
        question: "Tell us about your background",
        wentWell:
          "The candidate provided a clear and concise overview of their experience, highlighting relevant technologies and their current role. The response was well-structured and easy to follow.",
        improvements:
          "Could have included more specific achievements or metrics to demonstrate impact in previous roles. Adding a brief mention of educational background would have provided a more complete picture.",
      },
      {
        question: "Describe a challenging project",
        wentWell:
          "Excellent response with specific details about the technical challenge, the approach taken, and quantifiable results. The candidate demonstrated technical expertise and problem-solving skills.",
        improvements:
          "Could have elaborated more on the team dynamics and their specific leadership role in coordinating the effort. A brief mention of any setbacks and how they were overcome would have added depth.",
      },
      {
        question: "How do you approach state management?",
        wentWell:
          "The candidate showed a nuanced understanding of state management approaches, demonstrating both technical knowledge and practical experience. The response indicated thoughtful consideration of architecture and maintainability.",
        improvements:
          "The answer could have included a brief example of how they've implemented this approach in a specific project, or mentioned any tools or patterns they use to enforce these principles.",
      },
      {
        question: "Tell us about your background",
        wentWell:
          "The candidate provided a clear and concise overview of their experience, highlighting relevant technologies and their current role. The response was well-structured and easy to follow.",
        improvements:
          "Could have included more specific achievements or metrics to demonstrate impact in previous roles. Adding a brief mention of educational background would have provided a more complete picture.",
      },
      {
        question: "Describe a challenging project",
        wentWell:
          "Excellent response with specific details about the technical challenge, the approach taken, and quantifiable results. The candidate demonstrated technical expertise and problem-solving skills.",
        improvements:
          "Could have elaborated more on the team dynamics and their specific leadership role in coordinating the effort. A brief mention of any setbacks and how they were overcome would have added depth.",
      },
      {
        question: "How do you approach state management?",
        wentWell:
          "The candidate showed a nuanced understanding of state management approaches, demonstrating both technical knowledge and practical experience. The response indicated thoughtful consideration of architecture and maintainability.",
        improvements:
          "The answer could have included a brief example of how they've implemented this approach in a specific project, or mentioned any tools or patterns they use to enforce these principles.",
      },
    ],
    toneVoice: [
      {
        attribute: "Clarity",
        timestamp: "00:15",
        score: 85,
        explanation:
          "The candidate spoke clearly and articulated thoughts well. Technical concepts were explained in an accessible way without oversimplifying. Occasional use of industry jargon was appropriate for the context.",
      },
      {
        attribute: "Confidence",
        timestamp: "01:45",
        score: 90,
        explanation:
          "Demonstrated strong confidence when discussing technical expertise and project experiences. Voice was steady and authoritative without being arrogant. Maintained good eye contact throughout.",
      },
      {
        attribute: "Enthusiasm",
        timestamp: "03:35",
        score: 75,
        explanation:
          "Showed genuine interest in the topics discussed, particularly when describing technical solutions. Could have conveyed more passion when discussing the company and role. Energy level was consistent but could be more dynamic.",
      },
      {
        attribute: "Conciseness",
        timestamp: "05:20",
        score: 80,
        explanation:
          "Responses were generally well-structured and to the point. Provided sufficient detail without rambling. Some answers could have been more concise while maintaining the key information.",
      },
    ],
    bodyLanguage: [
      {
        attribute: "Posture",
        timestamp: "00:15",
        score: 85,
        explanation:
          "Maintained good upright posture throughout most of the interview, conveying attentiveness and professionalism. Occasionally leaned forward when discussing topics of interest, which showed engagement.",
      },
      {
        attribute: "Hand Gestures",
        timestamp: "01:45",
        score: 70,
        explanation:
          "Used natural hand gestures to emphasize points, which enhanced communication. Some gestures were slightly repetitive. Could use more varied gestures to highlight different types of information.",
      },
      {
        attribute: "Eye Contact",
        timestamp: "03:35",
        score: 90,
        explanation:
          "Excellent eye contact throughout the interview. Maintained appropriate gaze with all interviewers, showing confidence and honesty. Briefly looked away when thinking deeply, which is natural.",
      },
      {
        attribute: "Facial Expressions",
        timestamp: "05:20",
        score: 80,
        explanation:
          "Displayed appropriate facial expressions that matched the content of responses. Smiled naturally at appropriate moments. Could show more variation in expressions to convey enthusiasm for certain topics.",
      },
    ],
  }

  // Function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500"
    if (score >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  const calculateOverallScore = () => {
    // Combine all scores from tone/voice and body language
    const allScores = [
      ...interviewData.toneVoice.map((item) => item.score),
      ...interviewData.bodyLanguage.map((item) => item.score),
    ]

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

  return (
    <>
      {/* MAIN CONTENT */}
      <div className="container flex flex-1 flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-1/4 p-4 lg:pr-2 pl-0 px-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100vh-9.5rem)]">
              <ScrollArea className="flex-grow">
                {interviewData.jobDescription.split("\n").map((line, index) => (
                  <p key={index} className="mb-2 text-sm text-muted-foreground">
                    {line}
                  </p>
                ))}
              </ScrollArea>

              <Separator className="my-4" />

              <div>
                <h3 className="text-lg font-semibold mb-2">Resources</h3>
                <ScrollArea className="h-40">
                  <ul className="space-y-1.5">
                    {interviewData.resources.map((resource, index) => (
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
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Removed left and right padding */}
        <div className="w-full lg:w-2/4 p-4 lg:px-2 px-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardDescription className="text-sm">{interviewData.company}</CardDescription>
                  <CardTitle className="text-lg">{interviewData.jobTitle}</CardTitle>
                  <CardDescription>{interviewData.dateTime}</CardDescription>
                </div>

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

              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)]">
              <p className="text-sm text-muted-foreground mb-4">{interviewData.summary}</p>
              <Separator className="my-4 w-full" />
              <div className="flex-grow overflow-auto">
                <ScrollArea className="h-[calc(100vh-26.5rem)]">
                  <div className="space-y-4">
                    {interviewData.transcript.map((entry, index) => (
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
                      {interviewData.qnaFeedback.map((feedback, index) => (
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
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* RIGHT COL — TONE */}
                <TabsContent value="tone" className="flex-grow overflow-auto p-4">
                  <ScrollArea className="h-[calc(100vh-11rem)]">
                    <div className="space-y-4">
                      {interviewData.toneVoice.map((item, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{item.attribute}</CardTitle>
                              <span className="text-xs text-muted-foreground">{item.timestamp}</span>
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
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* RIGHT COL — BODY */}
                <TabsContent value="body" className="flex-grow overflow-auto p-4">
                  <ScrollArea className="h-[calc(100vh-11rem)]">
                    <div className="space-y-4">
                      {interviewData.bodyLanguage.map((item, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{item.attribute}</CardTitle>
                              <span className="text-xs text-muted-foreground">{item.timestamp}</span>
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
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

