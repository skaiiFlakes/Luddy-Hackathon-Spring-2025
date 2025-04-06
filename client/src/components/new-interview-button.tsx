"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import NewInterviewModal from "@/components/new-interview-modal"

export default function NewInterviewButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasGeneralResume, setHasGeneralResume] = useState(false)

  const handleClick = () => {
    // Check for general resume when button is clicked
    const generalResume = localStorage.getItem('generalResume')
    setHasGeneralResume(!!generalResume)
    setIsModalOpen(true)
  }

  return (
    <>
      <Button size="sm" onClick={handleClick}>
        <PlusCircle className="h-4 w-4" />
        New Interview
      </Button>
      <NewInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hasGeneralResume={hasGeneralResume}
      />
    </>
  )
}
