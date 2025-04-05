"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import aiInterviewService from "@/services/ai-interview-service"

export function VoiceSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [useElevenlabs, setUseElevenlabs] = useState(false)

  // Load saved API key from localStorage if available
  useEffect(() => {
    const savedApiKey = localStorage.getItem("elevenlabs-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setUseElevenlabs(true)
      aiInterviewService.setElevenlabsApiKey(savedApiKey)
    }
  }, [])

  const handleSave = () => {
    if (useElevenlabs && apiKey) {
      localStorage.setItem("elevenlabs-api-key", apiKey)
      aiInterviewService.setElevenlabsApiKey(apiKey)
    } else {
      localStorage.removeItem("elevenlabs-api-key")
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Voice Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Voice Settings</DialogTitle>
          <DialogDescription>
            Configure the text-to-speech settings for more realistic voices.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="use-elevenlabs" className="text-sm font-medium">
              Use ElevenLabs AI Voices
            </Label>
            <Switch
              id="use-elevenlabs"
              checked={useElevenlabs}
              onCheckedChange={setUseElevenlabs}
            />
          </div>
          {useElevenlabs && (
            <div className="grid gap-2">
              <Label htmlFor="elevenlabs-api-key">ElevenLabs API Key</Label>
              <Input
                id="elevenlabs-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
              />
              <p className="text-xs text-muted-foreground">
                You can get an API key from{" "}
                <a
                  href="https://elevenlabs.io/app/account"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  elevenlabs.io
                </a>
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
