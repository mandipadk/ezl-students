import { TriangleAlert, AlertCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Email type definition
type Email = {
  id: number
  subject: string
  sender: string
  time: string
  urgency: "urgent" | "important" | "normal"
}

// Sample email data for now
const emails: Email[] = [
  { id: 1, subject: "Exam Schedule Change", sender: "Academic Office", time: "10:30 AM", urgency: "urgent" },
  { id: 2, subject: "Project Deadline Extension", sender: "Prof. Johnson", time: "Yesterday", urgency: "important" },
  { id: 3, subject: "Campus Event Invitation", sender: "Student Council", time: "2 days ago", urgency: "normal" },
  { id: 4, subject: "Scholarship Opportunity", sender: "Financial Aid Office", time: "1 hour ago", urgency: "urgent" },
  { id: 5, subject: "Study Group Meeting", sender: "Sarah Smith", time: "3 hours ago", urgency: "important" },
  { id: 6, subject: "Library Book Due Reminder", sender: "University Library", time: "Yesterday", urgency: "normal" },
]

export default function EmailCard() {
    // Helper function to filter emails by urgency
    const filterEmailsByUrgency = (urgency: Email["urgency"]) => 
      emails.filter(email => email.urgency === urgency)
  
    // Helper function to render email list
    const renderEmailList = (emailList: Email[]) => (
      <ScrollArea className="h-[250px]">
        {emailList.map((email) => (
          <div key={email.id} className="flex items-center space-x-4 mt-4 mb-4">
            <Mail className="h-6 w-6 text-blue-500" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{email.subject}</p>
              <p className="text-sm text-muted-foreground">{email.sender}</p>
            </div>
            <span className="text-xs text-muted-foreground">{email.time}</span>
          </div>
        ))}
      </ScrollArea>
    )
  
    return (
        <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Emails</CardTitle>
              <CardDescription>Your latest incoming messages</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="urgent" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="urgent" className="flex items-center justify-center">
                    <TriangleAlert className="h-4 w-4 text-red-500 mr-2" />
                    Urgent
                  </TabsTrigger>
                  <TabsTrigger value="important" className="flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    Important
                  </TabsTrigger>
                  <TabsTrigger value="normal" className="flex items-center justify-center">
                    <Mail className="h-4 w-4 text-green-500 mr-2" />
                    Normal
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="urgent">
                  {renderEmailList(filterEmailsByUrgency("urgent"))}
                </TabsContent>
                <TabsContent value="important">
                  {renderEmailList(filterEmailsByUrgency("important"))}
                </TabsContent>
                <TabsContent value="normal">
                  {renderEmailList(filterEmailsByUrgency("normal"))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
    )
  }