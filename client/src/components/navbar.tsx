"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface NavbarProps {
  onOpenModal: () => void;
}

export default function Navbar({ onOpenModal }: NavbarProps) {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-1">
              <svg
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                viewBox={`0 0 612 792`}
                className="h-11 w-11"
              >
                <path
                  d="M465.67,165.8c8.46,9.45,16.3,24.5,23.01,35.68,30.58,50.93,59.62,103.04,89.05,154.66,4.71,8.26,10.46,15.9,14.08,24.79,14.63,35.95-.15,56.62-17.09,86.82-19.04,33.93-40.66,66.48-57.8,101.49-.18,1.2.11,2.21.48,3.33,2.05,6.09,12.32,19.83,16.17,26.44,14.15,24.27,27.51,49.01,42.15,72.99l-.86,1.38c-16.44.27-32.91-.42-49.25,1.63-37.91,1.18-65-2.01-87.5-34.47-20.99-30.28-34.4-65.64-56.69-95.07-41.87-55.29-110.04-1.7-153.26-50.18-14.07-15.78-39.81-60.76-41.12-81.47-1.62-25.53,15.79-54.81,29.61-75.77,21.9-33.2,38.78-37.7,77.72-38.95,45.44-1.46,68.74,2.13,92.7,41.98,23.74,39.47,41.7,82.94,68.17,120.95l3.29.64c6.04-11.65,13.4-22.85,17.09-35.6,10.61-36.72-16.31-68.31-33.58-98.29-14.76-25.62-30.71-64.59-59.53-76.54-11.03-4.58-25.96-5.03-37.95-5.44-24.4-.82-48.95.67-73.36.03l-1.12-1.13c22.1-31.13,33.98-80.03,71.86-96.35,11.73-5.06,20.32-4.06,32.51-4.89,31.71-2.17,68.01-4.57,91.22,21.36Z"
                  fill="currentColor"
                />
                <path
                  d="M175.07,299.86c1.26,1.29-4.09,11.14-5.13,13.19-12.84,25.17-45.07,67.51-45.06,94.79s28.48,67.6,42.7,91.91c13.94,23.83,26.17,54.92,53.89,65.73,40.31,15.72,91.88-11.16,124.92,27.14,20.07,23.27,31.65,53.73,48.35,79.31l-1.22,1.93c-18.29-.54-36.69-.62-55.01-.43-42.25.43-84.85,1.61-127.19.82-29.83-.56-53.22.88-74.66-23.29-32.84-52.66-64.16-106.76-94.89-160.8-10.04-17.66-32.09-51.2-34.93-69.73-3.25-21.21,5.34-41.68,15.48-59.8,7.8-13.95,22.92-39.18,35.81-47.92,33.84-22.93,78.91-9.53,116.94-12.85Z"
                  fill="currentColor"
                />
                <path
                  d="M215.81,226.96c-32.52,31.45-81.65,17.18-122.7,19.88l-2.58-1.18,36.18-64.71c30.16-43.96,61.04-37.49,109.3-36.48,8.9.19,20-1,28.5-.07,1.13.12,1.86.07,2.57,1.16-19.23,25.74-27.82,58.73-51.27,81.4Z"
                  fill="currentColor"
                />
              </svg>
            <span className="inline-block font-bold text-xl">InterviewIQ</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary mr-8">
              Interviews
            </Link>
          </nav>
          <Button size="sm" onClick={onOpenModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>
      </div>
    </header>
  )
}

