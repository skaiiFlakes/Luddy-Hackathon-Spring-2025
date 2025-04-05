"use client"

import type React from "react"

import { useState } from "react"
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

interface NewInterviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewInterviewModal({ isOpen, onClose }: NewInterviewModalProps) {
  const [jobUrl, setJobUrl] = useState("")
  const [interviewer, setInterviewer] = useState("todd")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/interview/new?interviewer=${interviewer}`) // Redirect first
    onClose()

    try {
      await fetch("http://localhost:5000/api/start-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobUrl, interviewer }),
      })
      // if (!response.ok) {
      //   throw new Error("Failed to start interview")
      // }
      // const data = await response.json()
      // console.log("Interview started:", data)
    } catch (error) {
      console.error("Error starting interview:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Interview</DialogTitle>
          <DialogDescription>
            Set up your mock interview by providing a job description and selecting an interviewer.
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
                    className={`flex flex-col items-center gap-2 cursor-pointer`}
                    onClick={() => setInterviewer(name)}
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
                  </div>
                ))}
              </div>
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

