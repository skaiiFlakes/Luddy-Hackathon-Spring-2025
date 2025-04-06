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
import { Switch } from "@/components/ui/switch"
import { Upload } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [urlError, setUrlError] = useState<string | null>(null)
  const [interviewer, setInterviewer] = useState("todd")
  const [personality, setPersonality] = useState("friendly") // Default matches initial interviewer (todd)
  const [interviewType, setInterviewType] = useState("behavioral")
  const [useGeneralResume, setUseGeneralResume] = useState(true)
  const [hasGeneralResume, setHasGeneralResume] = useState(false)
  const [specialResume, setSpecialResume] = useState<any>(null)
  const [behavioralFocusAreas, setBehavioralFocusAreas] = useState<string[]>([])
  const [technicalFocusAreas, setTechnicalFocusAreas] = useState<string[]>([])
  const router = useRouter()

  // Check for general resume in localStorage on component mount
  useEffect(() => {
    const generalResume = localStorage.getItem('generalResume')
    if (generalResume) {
      setHasGeneralResume(true)
    } else {
      setUseGeneralResume(false)
      setHasGeneralResume(false)
    }
  }, []);

  // Update personality whenever interviewer changes
  useEffect(() => {
    const defaultPersonality = interviewerPersonalityMap[interviewer] || 'friendly';
    setPersonality(defaultPersonality);
  }, [interviewer]);

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Handle URL change without validation
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobUrl(e.target.value);
  }

  // Validate URL when user unfocuses the input
  const handleUrlBlur = () => {
    if (jobUrl && !isValidUrl(jobUrl)) {
      setUrlError("Please enter a valid URL (e.g., https://example.com/job)");
    } else {
      setUrlError(null);
    }
  }

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          setSpecialResume({
            name: file.name,
            content: event.target.result,
            uploadDate: new Date().toISOString()
          })
          localStorage.setItem('specialResume', JSON.stringify({
            name: file.name,
            content: event.target.result,
            uploadDate: new Date().toISOString()
          }))
        }
      }

      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate URL before submission
    if (!isValidUrl(jobUrl)) {
      setUrlError("Please enter a valid URL (e.g., https://example.com/job)");
      return;
    }

    // Determine which resume to use
    let resumeData = null
    if (useGeneralResume && hasGeneralResume) {
      resumeData = JSON.parse(localStorage.getItem('generalResume') || 'null')
    } else if (specialResume) {
      resumeData = specialResume
    }

    // Include focus areas based on interview type
    let focusAreas: string[] = [];
    if (interviewType === 'behavioral') {
      focusAreas = behavioralFocusAreas;
    } else if (interviewType === 'technical') {
      focusAreas = technicalFocusAreas;
    } else if (interviewType === 'mixed') {
      // For mixed, include both types of focus areas
      focusAreas = [...behavioralFocusAreas, ...technicalFocusAreas];
    }

    // Include all parameters in the query
    const queryParams = new URLSearchParams({
      interviewer,
      jobUrl: encodeURIComponent(jobUrl),
      interviewType,
      hasResume: resumeData ? 'true' : 'false',
      focusAreas: focusAreas.join(',')
    })

    router.push(`/interview/new?${queryParams.toString()}`)
    onClose()
  }

  const handleInterviewerChange = (name: string) => {
    setInterviewer(name);
    // Personality will be updated by the useEffect
  };

  const handleBehavioralFocusChange = (area: string, checked: boolean) => {
    if (checked) {
      setBehavioralFocusAreas(prev => [...prev, area]);
    } else {
      setBehavioralFocusAreas(prev => prev.filter(item => item !== area));
    }
  };

  const handleTechnicalFocusChange = (area: string, checked: boolean) => {
    if (checked) {
      setTechnicalFocusAreas(prev => [...prev, area]);
    } else {
      setTechnicalFocusAreas(prev => prev.filter(item => item !== area));
    }
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
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                required
                className={urlError ? "border-red-500" : ""}
              />
              {urlError && (
                <p className="text-xs text-red-500 mt-1">{urlError}</p>
              )}
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
              <Label>Interview Type</Label>
              <RadioGroup
                value={interviewType}
                onValueChange={setInterviewType}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="behavioral" id="behavioral" />
                  <Label htmlFor="behavioral">Behavioral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="technical" id="technical" />
                  <Label htmlFor="technical">Technical</Label>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">Mixed</Label>
                </div> */}
              </RadioGroup>
            </div>

            {/* Focus Areas Section - conditionally rendered based on interview type */}
            {interviewType === 'behavioral' && (
              <div className="grid gap-3">
                <Label>Behavioral Focus Areas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Leadership', 'Conflict Resolution', 'Time Management', 'Teamwork', 'Problem Solving', 'Adaptability'].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`behavioral-${area}`}
                        checked={behavioralFocusAreas.includes(area)}
                        onCheckedChange={(checked) => handleBehavioralFocusChange(area, checked as boolean)}
                      />
                      <Label htmlFor={`behavioral-${area}`}>{area}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {interviewType === 'technical' && (
              <div className="grid gap-3">
                <Label>Technical Focus Areas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Javascript/Typescript', 'CSS & Styling', 'Testing', 'React/Vue/Angular', 'Performance Optimization', 'Architecture'].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`technical-${area}`}
                        checked={technicalFocusAreas.includes(area)}
                        onCheckedChange={(checked) => handleTechnicalFocusChange(area, checked as boolean)}
                      />
                      <Label htmlFor={`technical-${area}`}>{area}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-general-resume">Use General Resume</Label>
                <Switch
                  id="use-general-resume"
                  checked={useGeneralResume && hasGeneralResume}
                  onCheckedChange={setUseGeneralResume}
                  disabled={!hasGeneralResume}
                />
              </div>

              {!hasGeneralResume && (
                <p className="text-xs text-muted-foreground">
                  No general resume found. Please upload a resume for this interview.
                </p>
              )}

              {(!useGeneralResume || !hasGeneralResume) && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        const input = document.getElementById('special-resume-upload') as HTMLInputElement
                        input.click()
                      }}
                    >
                      <Upload size={16} />
                      {specialResume ? 'Replace Resume' : 'Upload Resume'}
                    </Button>
                    {specialResume && (
                      <span className="text-sm">{specialResume.name}</span>
                    )}
                  </div>
                  <input
                    id="special-resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-center sm:justify-center">
            <Button
              type="submit"
              disabled={
                (!hasGeneralResume && !specialResume && (!useGeneralResume || !hasGeneralResume)) ||
                !!urlError ||
                !jobUrl
              }
            >
              Start Interview
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

