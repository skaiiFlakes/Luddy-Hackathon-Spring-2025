"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"

interface InterviewData {
  interviewer: string;
  personality: string;
  responses: any[];
  jobUrl: string;
  duration: number;
  timestamp: string;
  analysis?: {
    metadata?: {
      company: string;
      job_title: string;
      job_url: string;
    };
    evaluation?: {
      overall_score: number;
    };
  };
}

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState<Record<string, InterviewData>>({});
  const router = useRouter();

  useEffect(() => {
    const interviewsJson = localStorage.getItem('interviews');
    if (interviewsJson) {
      setInterviews(JSON.parse(interviewsJson));
    }
  }, []);

  const formatDateTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const calculateOverallScore = (interview: InterviewData): number => {
    if (!interview.analysis?.evaluation?.overall_score) return 0;
    return interview.analysis.evaluation.overall_score;
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Interview ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(interviews).map(([id, interview]) => (
                <TableRow
                  key={id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/interview/${id}`)}
                >
                  <TableCell>{interview.analysis?.metadata?.company || "Unknown Company"}</TableCell>
                  <TableCell>{interview.analysis?.metadata?.job_title || "Unknown Job Title"}</TableCell>
                  <TableCell>{formatDateTime(interview.timestamp)}</TableCell>
                  <TableCell>{calculateOverallScore(interview)}%</TableCell>
                  <TableCell className="font-mono text-sm">{id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
