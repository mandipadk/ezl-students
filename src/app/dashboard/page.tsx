"use client"

import CalendarCard from "@/app/dashboard/CalendarCard";
import AssignmentCard from "@/app/dashboard/AssignmentCard"
import EmailCard from "@/app/dashboard/EmailCard"
import MinimalCalendar from "@/app/dashboard/MinimalCalendar";


export default function Dashboard() {
  return (
    <div className="mx-auto max-w-8xl max-h-screen flex flex-col md:flex-row">
      {/* Left Section */}
      <div className="w-full md:w-1/3 p-4 space-y-4 overflow-auto">
        {/* Emails Card */}
        <EmailCard></EmailCard>
        {/* Assignments Card (unchanged) */}
        <AssignmentCard></AssignmentCard>
      </div>

      {/* Right Section (Calendar Placeholder) */}
      <div className="w-full max-h-screen md:w-2/3 p-4 pl-0">
        {/* <CalendarCard></CalendarCard> */}
        <MinimalCalendar></MinimalCalendar>
      </div>
    </div>
  )
}