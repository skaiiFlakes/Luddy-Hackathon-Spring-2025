"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import NewInterviewModal from "@/components/new-interview-modal"

export default function NewInterviewButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setIsModalOpen(true)}>
        <PlusCircle className="h-4 w-4" />
        New Interview
      </Button>
      <NewInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
