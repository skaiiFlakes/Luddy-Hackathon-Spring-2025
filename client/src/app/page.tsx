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
import { InterviewData } from "@/types/interview"
import { transformInterviewList, InterviewListItem } from "@/utils/interview"
import { getScoreColor } from "@/utils/score"

interface ResumeData {
  name: string;
  content: string;
  uploadDate: string;
}

export default function InterviewsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [generalResume, setGeneralResume] = useState<ResumeData | null>(null)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [interviews, setInterviews] = useState<Record<string, InterviewData>>({})
  const router = useRouter()

  // Load interviews and resume from localStorage on component mount
  useEffect(() => {
    const savedResume = localStorage.getItem('generalResume')
    if (savedResume) {
      setGeneralResume(JSON.parse(savedResume))
    }

    const interviewsJson = localStorage.getItem('interviews')
    if (interviewsJson) {
      setInterviews(JSON.parse(interviewsJson))
    }
  }, [])

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          const resumeData: ResumeData = {
            name: file.name,
            content: event.target.result as string,
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

  const interviewList = transformInterviewList(interviews)
  const totalPages = Math.ceil(interviewList.length / rowsPerPage)
  const paginatedInterviews = interviewList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="container flex-1 flex flex-col items-center py-6">
        <div className="w-full mb-6">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8">
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
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Interview History</CardTitle>
                <div className="flex justify-end mb-4 gap-4">
                  <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Rows per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 rows</SelectItem>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="15">15 rows</SelectItem>
                    </SelectContent>
                  </Select>
                  <NewInterviewButton />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInterviews.map((interview) => (
                    <TableRow
                      key={interview.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(interview.id)}
                    >
                      <TableCell>{interview.company}</TableCell>
                      <TableCell>{interview.jobTitle}</TableCell>
                      <TableCell>{interview.dateTime}</TableCell>
                      <TableCell className={`text-right font-medium`}>
                        <div className="flex items-center gap-2 justify-end">
                          <span className={`${getScoreColor(interview.score)} h-2 w-2 rounded-full`}></span>
                          {interview.score}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {Array.from({ length: Math.max(0, rowsPerPage - paginatedInterviews.length) }).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="opacity-50">
                      <TableCell>·</TableCell>
                      <TableCell>·</TableCell>
                      <TableCell>·</TableCell>
                      <TableCell className="text-right">·</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
