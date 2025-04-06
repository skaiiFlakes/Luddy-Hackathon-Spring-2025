import { FeedbackResponse, CoachData } from "@/types/feedback"

export const FALLBACK_FEEDBACK_DATA: FeedbackResponse = {
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
    job_description: `
Minimum qualifications:

- Bachelor's degree or equivalent practical experience.
- 2 years of experience with data structures or algorithms in either an academic or industry setting.
- Experience with software development in Typescript and Python.
- Experience working with a cloud platform.

Preferred qualifications:

- Master's degree or PhD in Computer Science or related technical fields.
- 2 years of experience with performance, large scale systems data analysis, visualization tools, or debugging.
- Experience in Angular, Terraform, Puppet.
- Experience with high performance computing tools and infrastructure.
- Interest in learning customer workflows, identifying pain points, and designing/implementing creative solutions to them.
- Excellent system design skills.

About the job

Google's software engineers develop the next-generation technologies that change how billions of users connect, explore, and interact with information and one another. Our products need to handle information at massive scale, and extend well beyond web search.

We're looking for engineers who bring fresh ideas from all areas, including:
- information retrieval
- distributed computing
- large-scale system design
- networking and data storage
- security
- artificial intelligence
- natural language processing
- UI design and mobile

...and more. As a software engineer, you will work on a specific project critical to Google's needs with opportunities to switch teams and projects as you and our fast-paced business grow and evolve. We need our engineers to be versatile, display leadership qualities, and be enthusiastic to take on new problems across the full stack as we continue to push technology forward.

The Silicon Infrastructure team is responsible for building and operating foundational tooling and infrastructure used to develop custom silicon. You will closely work with partner and Client teams to eliminate pain points, improve quality and development velocity. You will plan solutions with Client teams and senior staff.

Google's mission is to organize the world's information and make it universally accessible and useful. Our team combines the best of Google AI, Software, and Hardware to create radically helpful experiences. We research, design, and develop new technologies and hardware to make computing faster, seamless, and more powerful. We aim to make people's lives better through technology.

Compensation:
The US base salary range for this full-time position is $141,000–$202,000 + bonus + equity + benefits.
Salary ranges are determined by role, level, and location. Individual pay is based on work location and other factors, including job-related skills, experience, and relevant education or training.
Your recruiter can share more about the specific salary range for your preferred location during the hiring process.

Please note: compensation details listed reflect base salary only and do not include bonus, equity, or benefits.
Learn more about benefits at Google.

Responsibilities

- Design creative solutions to complex problems, leveraging Engineering Productivity domain knowledge.
- Create web applications with Typescript and Python to automate processes.
- Design systems to improve efficiency of globally distributed high performance computing infrastructure.
- Improve development efficiency across the silicon organization and possibly Google-wide through tooling improvements.
`
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
}

export const FALLBACK_COACH_DATA: CoachData = {
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
}
