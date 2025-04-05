import type { Metadata } from 'next'
import './globals.css'
import Navbar from "@/components/navbar"
import { useState } from "react";

export const metadata: Metadata = {
  title: 'InterviewIQ',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <Navbar onOpenModal={() => setIsModalOpen(true)} />
          <main className="bg-gray-100 flex-1">
            {children}
          </main>
        </div>
        <NewInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </body>
    </html>
  );
}
