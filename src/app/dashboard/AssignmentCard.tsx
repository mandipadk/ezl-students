import { useState } from "react"
import { AlertCircle, Calendar, CheckCircle2, Circle, Clock, FileText, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

type Assignment = {
    id: number
    title: string
    course: string
    dueDate: string
    gradePoints: number
    estimatedTime: string
    priority: "High" | "Medium" | "Low"
    completed: boolean
}
  // Updated sample assignment data
const assignments: Assignment[] = [
    { id: 1, title: "Math Assignment 3", course: "Advanced Calculus", dueDate: "Tomorrow", gradePoints: 100, estimatedTime: "2 hours", priority: "High", completed: false },
    { id: 2, title: "English Essay", course: "Contemporary Literature", dueDate: "Next Week", gradePoints: 150, estimatedTime: "4 hours", priority: "Medium", completed: true },
    { id: 3, title: "Physics Lab Report", course: "Quantum Mechanics", dueDate: "Friday", gradePoints: 75, estimatedTime: "3 hours", priority: "High", completed: false },
  ]

export default function AssignmentCard(){
    const [openAssignmentId, setOpenAssignmentId] = useState<number | null>(null)

    return(
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Assignments</CardTitle>
            <CardDescription>Your upcoming tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] max-h-full">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center space-x-4 mb-4">
                  {assignment.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-yellow-500" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                  </div>
                  <Dialog open={openAssignmentId === assignment.id} onOpenChange={(open) => setOpenAssignmentId(open ? assignment.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Assignment Details</DialogTitle>
                        <DialogDescription>Detailed information about your assignment</DialogDescription>
                      </DialogHeader>
                      <Carousel className="w-full max-w-xs">
                        <CarouselContent>
                          <CarouselItem>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
                              <div className="space-y-2">
                                <p className="text-sm"><GraduationCap className="inline mr-2" />{assignment.course}</p>
                                <p className="text-sm"><Calendar className="inline mr-2" />Due: {assignment.dueDate}</p>
                                <p className="text-sm"><FileText className="inline mr-2" />Grade: {assignment.gradePoints} points</p>
                                <p className="text-sm"><Clock className="inline mr-2" />Est. Time: {assignment.estimatedTime}</p>
                                <p className="text-sm"><AlertCircle className="inline mr-2" />Priority: {assignment.priority}</p>
                              </div>
                            </div>
                          </CarouselItem>
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    </DialogContent>
                  </Dialog>
                  <Button variant="secondary" size="sm">
                    Ask for Extension
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
    );
}