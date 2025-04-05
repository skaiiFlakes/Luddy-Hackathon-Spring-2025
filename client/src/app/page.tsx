"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import NewInterviewButton from "@/components/new-interview-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [generalResume, setGeneralResume] = useState<string | null>(null)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const totalPages = Math.ceil(interviews.length / rowsPerPage)
  const router = useRouter()

  // Load resume from localStorage on component mount
  useEffect(() => {
    const savedResume = localStorage.getItem('generalResume')
    if (savedResume) {
      setGeneralResume(JSON.parse(savedResume))
    }
  }, [])

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          const resumeData = {
            name: file.name,
            content: event.target.result,
            uploadDate: new Date().toISOString()
          }

          localStorage.setItem('generalResume', JSON.stringify(resumeData))
          setGeneralResume(resumeData)
        }
      }

      reader.readAsDataURL(file)
    }
  }

  const handleRowClick = (id: string) => {
    router.push(`/interview/${id}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value))
    setCurrentPage(1) // Reset to first page when changing rows per page
  }

  const paginatedInterviews = interviews.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onNewInterview={() => setIsModalOpen(true)} />

      <div className="container flex-1 flex flex-col items-center py-6">
      <div className="w-full  mb-6">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8">
              {/* <h3 className="text-lg font-medium mb-2">General Resume</h3> */}
              <p className="text-sm text-muted-foreground text-center mb-4">
                Upload your general resume to use across all interviews
              </p>

              {generalResume ? (
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">
                    {generalResume.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('resume-upload') as HTMLInputElement
                        input.click()
                      }}
                    >
                      Replace
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        localStorage.removeItem('generalResume')
                        setGeneralResume(null)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const input = document.getElementById('resume-upload') as HTMLInputElement
                    input.click()
                  }}
                >
                  <Upload size={16} />
                  Upload Resume
                </Button>
              )}

              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
              />
            </CardContent>
          </Card>
        </div>

        <div className="w-full mb-8">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Interviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                Below are your recent interviews. Click on a row to view details.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-4rem)]">
              <div className="flex justify-end mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={handleRowsPerPageChange}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue placeholder={rowsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Job Title</TableHead>
                      <TableHead className="w-[25%]">Date & Time</TableHead>
                      <TableHead className="w-[15%]">Overall Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: Math.min(rowsPerPage, Math.max(1, paginatedInterviews.length)) }).map((_, index) => {
                      const interview = paginatedInterviews[index]
                      return (
                        <TableRow
                          key={interview?.id || `empty-${currentPage}-${index}`}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => interview && handleRowClick(interview.id)}
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
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, interviews.length)} of {interviews.length} entries
                  </div>
                  <div className="flex">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center mt-4">
          <NewInterviewButton />
        </div>
      </div>
    </div>
  )
}
