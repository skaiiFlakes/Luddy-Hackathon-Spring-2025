"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface NewInterviewModalProps {
  isOpen: boolean
  onClose: () => void
}

// Map interviewer names to their default personalities
const interviewerPersonalityMap: Record<string, string> = {
  'todd': 'friendly',
  'jeff': 'professional',
  'karen': 'challenging'
};

export default function NewInterviewModal({ isOpen, onClose }: NewInterviewModalProps) {
  const [jobUrl, setJobUrl] = useState("")
  const [interviewer, setInterviewer] = useState("todd")
  const [personality, setPersonality] = useState("friendly") // Default matches initial interviewer (todd)
  const [customQuestions, setCustomQuestions] = useState("")
  const router = useRouter()

  // Update personality whenever interviewer changes
  useEffect(() => {
    const defaultPersonality = interviewerPersonalityMap[interviewer] || 'friendly';
    setPersonality(defaultPersonality);
  }, [interviewer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/interview/new?interviewer=${interviewer}&personality=${personality}`) // Redirect first
    onClose()

    // try {
    //   await fetch("http://localhost:5000/api/start-interview", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       jobUrl,
    //       interviewer,
    //       personality,
    //       customQuestions: customQuestions.split('\n').filter(q => q.trim() !== '')
    //     }),
    //   })
    // } catch (error) {
    //   console.error("Error starting interview:", error)
    // }
  }

  const handleInterviewerChange = (name: string) => {
    setInterviewer(name);
    // Personality will be updated by the useEffect
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Interview</DialogTitle>
          <DialogDescription>
            Set up your mock interview by providing a job description and customizing your interviewer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="job-url">Job Description URL</Label>
              <Input
                id="job-url"
                placeholder="https://example.com/job-posting"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Select Interviewer</Label>
              <div className="grid grid-cols-3 gap-4">
                {["todd", "jeff", "karen"].map((name) => (
                  <div
                    key={name}
                    className={`flex flex-col items-center gap-1 cursor-pointer`}
                    onClick={() => handleInterviewerChange(name)}
                  >
                    <div
                      className={`p-1 rounded-full border-2 ${
                        interviewer === name ? "border-primary" : "border-muted"
                      }`}
                    >
                      <div className="h-16 w-16 rounded-full overflow-hidden">
                        <Image
                          src={`/${name}.jpg`}
                          alt={`${name}'s profile picture`}
                          width={64}
                          height={64}
                          style={{
                            transform: "scale(1.2)",
                            objectPosition: "50% 5px",
                          }}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium capitalize">{name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {interviewerPersonalityMap[name]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-questions">Custom Questions</Label>
              <Textarea
                id="custom-questions"
                placeholder="How do you handle difficult team dynamics? (one question per line)"
                value={customQuestions}
                onChange={(e) => setCustomQuestions(e.target.value)}
                className="min-h-[50px]"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-center sm:justify-center">
            <Button type="submit">Start Interview</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

