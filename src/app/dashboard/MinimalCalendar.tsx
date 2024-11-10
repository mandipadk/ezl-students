"use client"

import React, { useState } from 'react'
import { addDays, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, startOfWeek, endOfWeek, addWeeks, setHours, setMinutes, isSameWeek, parseISO, isWithinInterval } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@supabase/supabase-js";

type Event = {
  id: string
  title: string
  startDate: Date
  endDate: Date
  description: string
}

type CalendarView = 'month' | 'week' | 'day'

export default function MinimalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({ title: '', startDate: new Date(), endDate: new Date(), description: '' })
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [view, setView] = useState<CalendarView>('month')

  const handlePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(prevDate => addDays(prevDate, -30))
        break
      case 'week':
        setCurrentDate(prevDate => addWeeks(prevDate, -1))
        break
      case 'day':
        setCurrentDate(prevDate => addDays(prevDate, -1))
        break
    }
  }

  const handleNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(prevDate => addDays(prevDate, 30))
        break
      case 'week':
        setCurrentDate(prevDate => addWeeks(prevDate, 1))
        break
      case 'day':
        setCurrentDate(prevDate => addDays(prevDate, 1))
        break
    }
  }

  const handleAddEvent = () => {
    const event: Event = { ...newEvent, id: Date.now().toString() }
    setEvents(prevEvents => [...prevEvents, event])
    setNewEvent({ title: '', startDate: new Date(), endDate: new Date(), description: '' })
  }

  const handleImportEvents = async (file: File) => {
    const text = await file.text()
    const parsedEvents = parseICS(text)
    const newEvents = parsedEvents.map(event => ({
      ...event,
      id: Date.now().toString()
    }))
    setEvents(prevEvents => [...prevEvents, ...newEvents])
    await saveEventsToSupabase(newEvents)
  }

  const saveEventsToSupabase = async (events: Event[]) => {
    const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
    });
    const data = await response.json();
    if (!response.ok) {
        console.error('Error saving events to Supabase:', data.error);
    } else {
        console.log('Events saved to Supabase:', data);
    }
}

  const parseICS = (icsText: string): Omit<Event, 'id'>[] => {
    const events: Omit<Event, 'id'>[] = []
    const lines = icsText.split('\n')
    let currentEvent: Partial<Omit<Event, 'id'>> = {}

    lines.forEach(line => {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {}
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent.title && currentEvent.startDate && currentEvent.endDate) {
          events.push(currentEvent as Omit<Event, 'id'>)
        }
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.replace('SUMMARY:', '').trim()
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.replace('DESCRIPTION:', '').trim()
      } else if (line.startsWith('DTSTART:')) {
        currentEvent.startDate = parseISO(line.replace('DTSTART:', '').trim())
      } else if (line.startsWith('DTEND:')) {
        currentEvent.endDate = parseISO(line.replace('DTEND:', '').trim())
      }
    })

    return events
  }

  const renderMonthView = () => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    })

    const startingDayIndex = startOfMonth(currentDate).getDay()
    const endingDayIndex = endOfMonth(currentDate).getDay()
    const previousMonthDays = Array(startingDayIndex).fill(null).map((_, index) => 
      addDays(startOfMonth(currentDate), -startingDayIndex + index)
    )
    const nextMonthDays = Array(6 - endingDayIndex).fill(null).map((_, index) => 
      addDays(endOfMonth(currentDate), index + 1)
    )

    const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays]

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 h-[750px]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (  
          <div key={day} className="text-xs font-medium text-gray-500 p-2 bg-white">{day}</div>
        ))}
        {allDays.map((day, index) => {
          const dayEvents = events.filter(event => isSameDay(event.startDate, day) || isWithinInterval(day, { start: event.startDate, end: event.endDate }))
          return (
            <div
              key={index}
              className={`bg-white p-1 overflow-hidden ${
                isSameMonth(day, currentDate) ? '' : 'text-gray-400'
              } ${isSameDay(day, new Date()) ? 'font-bold text-orange-500' : ''}`}
            >
              <div className="text-right text-sm">{format(day, 'd')}</div>
              <div className="mt-1">
                {dayEvents.slice(0, 3).map(event => (
                  <EventButton key={event.id} event={event} setSelectedEvent={setSelectedEvent} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 mt-1">{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <ScrollArea className="h-[750px]">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-white"></div>
          {weekDays.map(day => (
            <div key={day.toString()} className="text-xs font-medium text-gray-500 p-2 bg-white">
              {format(day, 'EEE d')}
            </div>
          ))}
          {Array.from({ length: 24 }).map((_, hour) => (
            <React.Fragment key={hour}>
              <div className="text-xs text-gray-500 p-2 bg-white">{format(setHours(new Date(), hour), 'ha')}</div>
              {weekDays.map(day => {
                const cellDate = setHours(day, hour)
                const cellEvents = events.filter(event => 
                  isWithinInterval(cellDate, { start: event.startDate, end: event.endDate })
                )
                return (
                  <div key={cellDate.toString()} className="bg-white p-1 h-12 overflow-hidden border-t border-gray-100">
                    {cellEvents.map(event => (
                      <EventButton key={event.id} event={event} setSelectedEvent={setSelectedEvent} />
                    ))}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    )
  }

  const renderDayView = () => {
    return (
      <ScrollArea className="h-[750px]">
        <div className="grid grid-cols-1 gap-px bg-gray-200">
          {Array.from({ length: 24 }).map((_, hour) => {
            const cellDate = setHours(currentDate, hour)
            const cellEvents = events.filter(event => 
              isWithinInterval(cellDate, { start: event.startDate, end: event.endDate })
            )
            return (
              <div key={hour} className="grid grid-cols-[80px_1fr] bg-white">
                <div className="text-xs text-gray-500 p-2">{format(cellDate, 'ha')}</div>
                <div className="p-1 min-h-[48px] border-t border-gray-100">
                  {cellEvents.map(event => (
                    <EventButton key={event.id} event={event} setSelectedEvent={setSelectedEvent} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
        <CalendarIcon className="h-6 w-6 text-gray-400" />
          <h1 className="text-xl font-semibold text-gray-800">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h1>
          <div className="flex space-x-1">
            <Button onClick={() => setView('month')} variant={view === 'month' ? 'default' : 'ghost'} size="sm">Month</Button>
            <Button onClick={() => setView('week')} variant={view === 'week' ? 'default' : 'ghost'} size="sm">Week</Button>
            <Button onClick={() => setView('day')} variant={view === 'day' ? 'default' : 'ghost'} size="sm">Day</Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevious} variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={handleNext} variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <AddEventDialog newEvent={newEvent} setNewEvent={setNewEvent} handleAddEvent={handleAddEvent} />
          <ImportEventsButton handleImportEvents={handleImportEvents} />
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
      {selectedEvent && (
        <EventDetailsDialog event={selectedEvent} setSelectedEvent={setSelectedEvent} />
      )}
    </div>
  )
}

function EventButton({ event, setSelectedEvent }: { event: Event, setSelectedEvent: (event: Event) => void }) {
  return (
    <Button
      variant="ghost"
      className="w-full text-left text-xs p-1 h-6 truncate bg-blue-100 text-blue-800 hover:bg-blue-200"
      onClick={() => setSelectedEvent(event)}
    >
      {event.title}
    </Button>
  )
}

function AddEventDialog({ newEvent, setNewEvent, handleAddEvent }: {
  newEvent: Omit<Event, 'id'>,
  setNewEvent: React.Dispatch<React.SetStateAction<Omit<Event, 'id'>>>,
  handleAddEvent: () => void
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date and Time</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={format(newEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, startDate: parseISO(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date and Time</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={format(newEvent.endDate, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, endDate: parseISO(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={handleAddEvent}>Add Event</Button>
      </DialogContent>
    </Dialog>
  )
}

function ImportEventsButton({ handleImportEvents }: { handleImportEvents: (file: File) => void }) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImportEvents(e.target.files[0]);
    }
  };

  return (
    <label>
      <Button size="sm" onClick={handleButtonClick}>
        <Upload className="mr-2 h-4 w-4" /> Import
      </Button>
      <input
        type="file"
        accept=".ics"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </label>
  );
}

function EventDetailsDialog({ event, setSelectedEvent }: { event: Event, setSelectedEvent: (event: Event | null) => void }) {
  return (
    <Dialog open={true} onOpenChange={() => setSelectedEvent(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-gray-500"><strong>Start Date:</strong> {format(event.startDate, 'PPP')}</p>
          <p className="text-sm text-gray-500"><strong>Start Time:</strong> {format(event.startDate, 'p')}</p>
          <p className="text-sm text-gray-500"><strong>End Date:</strong> {format(event.endDate, 'PPP')}</p>
          <p className="text-sm text-gray-500"><strong>End Time:</strong> {format(event.endDate, 'p')}</p>
          <p className="text-sm text-gray-500 mt-2"><strong>Description:</strong> {event.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}