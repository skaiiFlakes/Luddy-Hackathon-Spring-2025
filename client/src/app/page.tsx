"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import NewInterviewModal from "@/components/new-interview-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for the interviews list
const interviews = [
  {
    id: "1",
    jobTitle: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    dateTime: "May 15, 2023 • 2:30 PM",
    score: 82,
  },
  {
    id: "2",
    jobTitle: "Product Manager",
    company: "InnovateSoft",
    dateTime: "May 10, 2023 • 11:00 AM",
    score: 75,
  },
  {
    id: "3",
    jobTitle: "UX Designer",
    company: "DesignHub",
    dateTime: "May 5, 2023 • 1:15 PM",
    score: 90,
  },
  {
    id: "4",
    jobTitle: "Backend Engineer",
    company: "DataSystems",
    dateTime: "April 28, 2023 • 3:45 PM",
    score: 88,
  },
  {
    id: "5",
    jobTitle: "DevOps Specialist",
    company: "CloudNative",
    dateTime: "April 22, 2023 • 10:30 AM",
    score: 79,
  },
  {
    id: "6",
    jobTitle: "Data Scientist",
    company: "AI Innovations",
    dateTime: "April 18, 2023 • 4:00 PM",
    score: 85,
  },
  {
    id: "7",
    jobTitle: "Full Stack Developer",
    company: "WebSolutions",
    dateTime: "April 12, 2023 • 9:00 AM",
    score: 78,
  },
  {
    id: "8",
    jobTitle: "Mobile App Developer",
    company: "Appify",
    dateTime: "April 5, 2023 • 2:00 PM",
    score: 92,
  },
  {
    id: "9",
    jobTitle: "System Analyst",
    company: "TechVision",
    dateTime: "March 30, 2023 • 1:30 PM",
    score: 80,
  },
  {
    id: "10",
    jobTitle: "Cloud Architect",
    company: "SkyNet Solutions",
    dateTime: "March 25, 2023 • 11:45 AM",
    score: 87,
  },
  {
    id: "11",
    jobTitle: "Network Engineer",
    company: "NetWorks",
    dateTime: "March 20, 2023 • 3:15 PM",
    score: 82,
  },
  {
    id: "12",
    jobTitle: "Technical Writer",
    company: "WriteTech",
    dateTime: "March 15, 2023 • 10:00 AM",
    score: 76,
  },
  {
    id: "13",
    jobTitle: "Game Developer",
    company: "PlayTech",
    dateTime: "March 10, 2023 • 2:30 PM",
    score: 91,
  },
  {
    id: "14",
    jobTitle: "Database Administrator",
    company: "DataMasters",
    dateTime: "March 5, 2023 • 1:00 PM",
    score: 84,
  },
  {
    id: "15",
    jobTitle: "Cybersecurity Analyst",
    company: "SecureTech",
    dateTime: "February 28, 2023 • 4:30 PM",
    score: 89,
  },
]

// Function to determine color based on score
const getScoreColor = (score: number) => {
  if (score >= 85) return "text-green-500"
  if (score >= 70) return "text-yellow-500"
  return "text-red-500"
}

export default function InterviewsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const totalPages = Math.ceil(interviews.length / rowsPerPage)
  const router = useRouter()

  const handleRowClick = (id: string) => {
    router.push(`/interview/${id}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const paginatedInterviews = interviews.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onNewInterview={() => setIsModalOpen(true)} />
      <div className="container flex-1 flex items-center justify-center py-6">
        <div className="w-full">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Interviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                Below are your recent interviews. Click on a row to view details.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-4rem)]">

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Job Title</TableHead>
                      <TableHead className="w-[25%]">Date & Time</TableHead>
                      <TableHead className="w-[15%]">Overall Score</TableHead>
                      {/* <TableHead className="w-[20%]">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: Math.max(10, paginatedInterviews.length) }).map((_, index) => {
                      const interview = paginatedInterviews[index]
                      return (
                        <TableRow
                          key={interview?.id || `empty-${currentPage}-${index}`}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{interview?.jobTitle || "-"}</TableCell>
                          <TableCell>{interview?.dateTime || "-"}</TableCell>
                          <TableCell>
                            {interview ? (
                              <span className={`font-medium ${getScoreColor(interview.score)}`}>{interview.score}%</span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          {/* <TableCell>
                            {interview ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRowClick(interview.id)}
                              >
                                Go to Page
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell> */}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      className="mx-1"
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>

          <div className="flex flex-col items-center mt-12">
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Interview
            </Button>
          </div>
        </div>
      </div>

      <NewInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

