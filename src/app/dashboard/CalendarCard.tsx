import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

type Event = {
  id: number
  title: string
  date: string
  time: string
  description: string
}

const fetchEvents = async (): Promise<Event[]> => {
  // Simulate fetching events from backend
  return [
    { id: 1, title: "Math Class", date: "2023-09-01", time: "10:00 AM", description: "Advanced Calculus" },
    { id: 2, title: "Physics Lab", date: "2023-09-01", time: "2:00 PM", description: "Quantum Mechanics" },
    { id: 3, title: "English Essay Due", date: "2023-09-02", time: "11:59 PM", description: "Submit via portal" },
  ]
}

export default function CalendarCard() {
  const [view, setView] = useState<"daily" | "weekly">("weekly")
  const [events, setEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const loadEvents = async () => {
      const events = await fetchEvents()
      setEvents(events)
    }
    loadEvents()
  }, [])

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + days)
    setCurrentDate(newDate)
  }

  const renderEvents = () => {
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date)
      return view === "daily"
        ? eventDate.toDateString() === currentDate.toDateString()
        : eventDate >= currentDate && eventDate < new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    })

    return (
      <ScrollArea className="h-[250px]">
        {filteredEvents.map(event => (
          <div key={event.id} className="mb-4">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
            <p className="text-sm">{event.description}</p>
          </div>
        ))}
      </ScrollArea>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Calendar</CardTitle>
        <CardDescription>Your schedule at a glance</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-88px)]">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => changeDate(view === "daily" ? -1 : -7)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-6 w-6 text-orange-400" />
            <p className="text-muted-foreground">{currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => changeDate(view === "daily" ? 1 : 7)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Tabs defaultValue="weekly" className="w-full mb-4" onValueChange={(value) => setView(value as "daily" | "weekly")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center justify-center">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center justify-center">
              Weekly
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            {renderEvents()}
          </TabsContent>
          <TabsContent value="weekly">
            {renderEvents()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
