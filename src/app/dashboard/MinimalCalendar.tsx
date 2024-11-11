"use client"

import React, { useState, useEffect } from 'react'
import { addDays, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, startOfWeek, endOfWeek, addWeeks, setHours, setMinutes, isSameWeek, parseISO, isWithinInterval } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@supabase/supabase-js";

type EventSource = 'base' | 'free' | 'assignment';

type Event = {
  id: string | number;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  source: EventSource;
  color?: string;
};

const EVENT_COLORS = {
  base: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    hover: "hover:bg-blue-200",
    dot: "bg-blue-500"
  },
  free: {
    bg: "bg-green-100",
    text: "text-green-800",
    hover: "hover:bg-green-200",
    dot: "bg-green-500"
  },
  assignment: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    hover: "hover:bg-purple-200",
    dot: "bg-purple-500"
  }
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

type CalendarView = 'month' | 'week' | 'day';

interface AddEventDialogProps {
    newEvent: Omit<Event, 'id'>;
    setNewEvent: React.Dispatch<React.SetStateAction<Omit<Event, 'id'>>>;
    handleAddEvent: () => void;
}

export default function MinimalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({ title: '', startDate: new Date(), endDate: new Date(), description: '', source: 'base' })
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [view, setView] = useState<CalendarView>('week')
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Check authentication status on mount
  useEffect(() => {
    checkAuthentication();
}, []);

useEffect(() => {
    if (isAuthenticated && userId) {
      console.log("It should be fetching now....");
      fetchCalenderEvents(userId);
      const interval = setInterval(() => fetchCalenderEvents(userId), 20000); // Fetch assignments once a day
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userId]);

const checkAuthentication = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error checking authentication:", error);
    } else {
        console.log("True from checkAuthentication");
        setIsAuthenticated(!!data.session);
        if (data.session?.user?.id) {
            setUserId(data.session.user.id);
            console.log("User ID from AssignmentCard:", data.session.user.id);
        }
    }
};

    const fetchCalenderEvents = async (userId: string) => {
        try {
            console.log("Fetching calendar events for user:", userId);
            // Fetch from all three tables in parallel
            const { data, error } = await supabase
                .from('BaseCalendarEvents')
                .select('json_response')
                .eq('user_id', userId);
            if (data) {
                console.log("Base events:", data);
            } else {
                console.log("No base events found");
            }

            const [baseEvents, freeTimeEvents, assignmentEvents] = await Promise.all([
                // Base calendar events
                supabase
                    .from('BaseCalendarEvents')
                    .select('json_response')
                    .eq('user_id', userId),

                // Free time events
                supabase
                    .from('FreeTimeCal')
                    .select('json_response')
                    .eq('user_id', userId),

                // Assignment events
                supabase
                    .from('AssignmentCal')
                    .select('json_response')
                    .eq('user_id', userId)
            ]);

            let allEvents: Event[] = [];

            

            // Process base events if they exist
            if (baseEvents.data && baseEvents.data.length > 0 && baseEvents.data[0].json_response?.events) {
                const events = baseEvents.data[0].json_response.events.map((event: any) => ({
                    ...event,
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    source: 'base' as EventSource
                }));
                allEvents = [...allEvents, ...events];
                console.log("Base events fetched:", events);
            } else {
                console.log("No base events found", baseEvents.data);
            }

            // Process free time events if they exist
            if (freeTimeEvents.data && freeTimeEvents.data.length > 0 && freeTimeEvents.data[0].json_response?.events) {
                const events = freeTimeEvents.data[0].json_response.events.map((event: any) => ({
                    ...event,
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    source: 'free' as EventSource
                }));
                allEvents = [...allEvents, ...events];
                console.log("Free time events fetched:", events);
            } else {
                console.log("No free time events found");
            }

            // Process assignment events if they exist
            if (assignmentEvents.data && assignmentEvents.data.length > 0 && assignmentEvents.data[0].json_response?.events) {
                const events = assignmentEvents.data[0].json_response.events.map((event: any) => ({
                    ...event,
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    source: 'assignment' as EventSource
                }));
                allEvents = [...allEvents, ...events];
                console.log("Assignment events fetched:", events);
            } else {
                console.log("No assignment events found");
            }

            // Log any errors but don't fail
            if (baseEvents.error) console.log("Base events error:", baseEvents.error);
            if (freeTimeEvents.error) console.log("Free time events error:", freeTimeEvents.error);
            if (assignmentEvents.error) console.log("Assignment events error:", assignmentEvents.error);

            // Set events even if some tables were empty
            setEvents(allEvents);
            console.log("All events set:", allEvents);

        } catch (error) {
            console.error("Error in fetchCalenderEvents:", error);
        }
    };

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

  const handleAddEvent = async () => {
    const event: Event = { 
        ...newEvent, 
        id: Date.now().toString()
    };
    
    try {
        if (userId) {
            // First, check if this new event overlaps with any base events
            if (event.source === 'free') {
                const { data: baseEventsData } = await supabase
                    .from('BaseCalendarEvents')
                    .select('json_response')
                    .eq('user_id', userId)
                    .single();

                if (baseEventsData?.json_response?.events) {
                    const hasOverlap = baseEventsData.json_response.events.some((baseEvent: Event) => {
                        return isOverlapping(
                            new Date(event.startDate),
                            new Date(event.endDate),
                            new Date(baseEvent.startDate),
                            new Date(baseEvent.endDate)
                        );
                    });

                    if (hasOverlap) {
                        alert("Cannot create free time event that overlaps with base events!");
                        return;
                    }
                }
            }

            // Get existing events
            const { data: existingData } = await supabase
                .from(event.source === 'base' ? 'BaseCalendarEvents' : 'FreeTimeCal')
                .select('json_response')
                .eq('user_id', userId)
                .single();

            let allEvents: Event[] = [];
            if (existingData?.json_response?.events) {
                allEvents = [...existingData.json_response.events] as Event[];
            }

            // Add the new event
            allEvents.push(event);

            // Update the database
            const { error: insertError } = await supabase
                .from(event.source === 'base' ? 'BaseCalendarEvents' : 'FreeTimeCal')
                .upsert({
                    user_id: userId,
                    json_response: {
                        events: allEvents
                    }
                }, {
                    onConflict: 'user_id'
                });

            if (insertError) {
                console.error("Error saving event:", insertError.message);
            } else {
                setEvents(prevEvents => [...prevEvents, event]);
                setNewEvent({
                    title: '',
                    startDate: new Date(),
                    endDate: new Date(),
                    description: '',
                    source: 'base'
                });
            }
        }
    } catch (error) {
        console.error("Error saving event:", error);
    }
};

  const handleImportEvents = async (file: File) => {
    const text = await file.text()
    const parsedEvents = parseICS(text)
    const newEvents = parsedEvents.map(event => ({
      ...event,
      id: Date.now().toString()
    }))
    setEvents(prevEvents => [...prevEvents, ...newEvents])
    await saveBaseEventsToSupabase(newEvents)
  }

  const saveBaseEventsToSupabase = async (newEvents: Event[]) => {
    try {
        // First, get existing base events
        const { data: existingBaseData } = await supabase
            .from('BaseCalendarEvents')
            .select('json_response')
            .eq('user_id', userId)
            .single();

        // Get existing free time events
        const { data: existingFreeData } = await supabase
            .from('FreeTimeCal')
            .select('json_response')
            .eq('user_id', userId)
            .single();

        let allBaseEvents: Event[] = [];
        let allFreeEvents: Event[] = [];
        
        // Combine existing and new base events
        if (existingBaseData?.json_response?.events) {
            allBaseEvents = [...existingBaseData.json_response.events];
        }
        allBaseEvents = [...allBaseEvents, ...newEvents];

        // Filter free time events to remove any that overlap with base events
        if (existingFreeData?.json_response?.events) {
            allFreeEvents = existingFreeData.json_response.events.filter((freeEvent: Event) => {
                return !allBaseEvents.some(baseEvent => 
                    isOverlapping(
                        new Date(freeEvent.startDate),
                        new Date(freeEvent.endDate),
                        new Date(baseEvent.startDate),
                        new Date(baseEvent.endDate)
                    )
                );
            });
        }

        // Update both tables
        await Promise.all([
            // Update base events
            supabase
                .from('BaseCalendarEvents')
                .upsert({
                    user_id: userId,
                    json_response: {
                        events: allBaseEvents
                    }
                }, {
                    onConflict: 'user_id'
                }),

            // Update free time events (with overlapping ones removed)
            supabase
                .from('FreeTimeCal')
                .upsert({
                    user_id: userId,
                    json_response: {
                        events: allFreeEvents
                    }
                }, {
                    onConflict: 'user_id'
                })
        ]);

        // Update local state
        setEvents([...allBaseEvents, ...allFreeEvents]);

    } catch (error) {
        console.error("Unexpected error saving events to Supabase:", error);
    }
};

  const parseICS = (icsText: string): Omit<Event, 'id'>[] => {
    const events: Omit<Event, 'id'>[] = [];
    const lines = icsText.split('\n');
    let currentEvent: Partial<Omit<Event, 'id'>> = {
        source: 'base' // Set default source for imported events
    };

    lines.forEach(line => {
        const cleanLine = line.trim();
        
        if (cleanLine.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (cleanLine.startsWith('END:VEVENT')) {
            if (currentEvent.title && currentEvent.startDate && currentEvent.endDate) {
                events.push({
                    ...currentEvent,
                    source: 'base',
                    description: currentEvent.description || ''
                } as Omit<Event, 'id'>);
            }
            currentEvent = { source: 'base' }; // Reset with default source
        } else if (cleanLine.startsWith('SUMMARY:')) {
            currentEvent.title = cleanLine.replace('SUMMARY:', '').trim();
        } else if (cleanLine.startsWith('DESCRIPTION:')) {
            currentEvent.description = cleanLine.replace('DESCRIPTION:', '').trim();
        } else if (cleanLine.startsWith('DTSTART')) {
            // Handle different date formats
            const dateStr = cleanLine.includes('TZID=') 
                ? cleanLine.split(':')[1].trim()  // For dates with timezone
                : cleanLine.replace('DTSTART:', '').trim();  // For UTC dates
            
            try {
                // Parse the date considering timezone if present
                if (cleanLine.includes('TZID=')) {
                    const tzid = cleanLine.match(/TZID=([^:]+):/)?.[1];
                    const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
                    currentEvent.startDate = date;
                } else {
                    const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
                    currentEvent.startDate = date;
                }
            } catch (error) {
                console.error('Error parsing start date:', error);
            }
        } else if (cleanLine.startsWith('DTEND')) {
            // Handle different date formats
            const dateStr = cleanLine.includes('TZID=')
                ? cleanLine.split(':')[1].trim()  // For dates with timezone
                : cleanLine.replace('DTEND:', '').trim();  // For UTC dates
            
            try {
                // Parse the date considering timezone if present
                if (cleanLine.includes('TZID=')) {
                    const tzid = cleanLine.match(/TZID=([^:]+):/)?.[1];
                    const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
                    currentEvent.endDate = date;
                } else {
                    const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
                    currentEvent.endDate = date;
                }
            } catch (error) {
                console.error('Error parsing end date:', error);
            }
        } else if (cleanLine.startsWith('LOCATION:')) {
            // Add location to description if present
            const location = cleanLine.replace('LOCATION:', '').trim();
            if (location) {
                currentEvent.description = currentEvent.description 
                    ? `${currentEvent.description}\nLocation: ${location}`
                    : `Location: ${location}`;
            }
        } else if (cleanLine.startsWith('RRULE:')) {
            // Add recurrence info to description
            const rrule = cleanLine.replace('RRULE:', '').trim();
            if (rrule) {
                currentEvent.description = currentEvent.description 
                    ? `${currentEvent.description}\nRecurs: ${rrule}`
                    : `Recurs: ${rrule}`;
            }
        }
    });

    return events;
};

  const renderMonthView = () => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });

    const startingDayIndex = startOfMonth(currentDate).getDay();
    const endingDayIndex = endOfMonth(currentDate).getDay();
    const previousMonthDays = Array(startingDayIndex).fill(null).map((_, index) => 
      addDays(startOfMonth(currentDate), -startingDayIndex + index)
    );
    const nextMonthDays = Array(6 - endingDayIndex).fill(null).map((_, index) => 
      addDays(endOfMonth(currentDate), index + 1)
    );

    const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (  
          <div key={day} className="bg-white p-3 text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
        {allDays.map((day, index) => {
          const dayEvents = events.filter(event => 
            isSameDay(event.startDate, day) || 
            isWithinInterval(day, { start: event.startDate, end: event.endDate })
          );
          
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={index}
              className={`bg-white min-h-[120px] p-2 relative ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
            >
              <div className={`flex justify-between items-center mb-2 ${
                !isCurrentMonth ? 'text-gray-400' : ''
              }`}>
                <span className={`text-sm font-medium ${
                  isToday 
                    ? 'bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                    : ''
                }`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 3 && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map(event => renderEventInCell(event))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Add a helper function to calculate event height and position
  const calculateEventStyles = (event: Event, hour: number) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
    const endHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
    
    // Only render if this is the starting hour of the event
    if (hour !== Math.floor(startHour)) return null;
    
    const duration = endHour - startHour;
    const topOffset = (startHour - Math.floor(startHour)) * 100; // % from top of hour
    const height = duration * 100; // height in pixels (1 hour = 100px)
    
    return {
      top: `${topOffset}%`,
      height: `${height}%`,
      position: 'absolute' as const,
      left: '4px',
      right: '4px',
      zIndex: 10,
    };
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const today = new Date();

    return (
      <ScrollArea className="w-full">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-white"></div>
          {weekDays.map(day => {
            const isToday = isSameDay(day, today);
            return (
              <div 
                key={day.toString()} 
                className={`
                  text-sm font-medium p-2
                  ${isToday ? 'bg-blue-50' : 'bg-white'}
                  ${isToday ? 'text-blue-700 font-bold' : 'text-gray-500'}
                `}
              >
                <div className={`
                  flex flex-col items-center
                  ${isToday ? 'bg-blue-500 text-white rounded-full p-1' : ''}
                `}>
                  <span>{format(day, 'EEE')}</span>
                  <span>{format(day, 'd')}</span>
                </div>
              </div>
            );
          })}
          {Array.from({ length: 24 }).map((_, hour) => (
            <React.Fragment key={hour}>
              <div className="text-sm text-gray-500 p-2 bg-white">
                {format(setHours(new Date(), hour), 'ha')}
              </div>
              {weekDays.map(day => {
                const isToday = isSameDay(day, today);
                const cellDate = setHours(day, hour);
                const cellEvents = events.filter(event => {
                  const eventStart = new Date(event.startDate);
                  const eventEnd = new Date(event.endDate);
                  return isWithinInterval(cellDate, { 
                    start: setMinutes(eventStart, 0), 
                    end: setMinutes(eventEnd, 59) 
                  });
                });

                return (
                  <div 
                    key={cellDate.toString()} 
                    className={`
                      relative h-[100px] border-t border-gray-100
                      ${isToday ? 'bg-blue-50' : 'bg-white'}
                    `}
                  >
                    {cellEvents.map(event => {
                      const styles = calculateEventStyles(event, hour);
                      if (!styles) return null;
                      
                      const colors = EVENT_COLORS[event.source];
                      return (
                        <div
                          key={event.id}
                          style={styles}
                          className={`rounded-md p-2 cursor-pointer ${colors.bg} ${colors.text} hover:opacity-90 transition-opacity`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <p className="text-sm font-semibold truncate">{event.title}</p>
                          <p className="text-xs truncate">
                            {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderDayView = () => {
    return (
      <ScrollArea className="h-[750px]">
        <div className="grid grid-cols-[100px_1fr] gap-px bg-gray-200">
          {Array.from({ length: 24 }).map((_, hour) => {
            const cellDate = setHours(currentDate, hour);
            const cellEvents = events.filter(event => {
              const eventStart = new Date(event.startDate);
              const eventEnd = new Date(event.endDate);
              return isWithinInterval(cellDate, { 
                start: setMinutes(eventStart, 0), 
                end: setMinutes(eventEnd, 59) 
              });
            });

            return (
              <React.Fragment key={hour}>
                <div className="text-sm text-gray-500 p-2 bg-white">
                  {format(cellDate, 'ha')}
                </div>
                <div className="relative bg-white border-t border-gray-100 h-[100px]">
                  {cellEvents.map(event => {
                    const styles = calculateEventStyles(event, hour);
                    if (!styles) return null;
                    
                    const colors = EVENT_COLORS[event.source];
                    return (
                      <div
                        key={event.id}
                        style={styles}
                        className={`rounded-md p-2 cursor-pointer ${colors.bg} ${colors.text} hover:opacity-90 transition-opacity`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="text-xs">
                          {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const renderEventInCell = (event: Event) => {
    const colors = EVENT_COLORS[event.source];
    return (
      <div 
        key={event.id} 
        className={`flex items-center gap-1 px-2 py-1 rounded-md mb-1 ${colors.bg} ${colors.text} hover:opacity-90 cursor-pointer transition-opacity`}
        onClick={() => setSelectedEvent(event)}
      >
        <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`}></span>
        <span className="truncate text-sm font-medium">
          {format(new Date(event.startDate), 'HH:mm')} {event.title}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
                <h1 className="text-xl font-semibold text-gray-800">
                    {view === 'month' && format(currentDate, 'MMMM yyyy')}
                    {view === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
                    {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
                </h1>
            </div>
            <div className="flex items-center space-x-2">
                <div className="flex space-x-1 mr-4">
                    <Button onClick={() => setView('month')} variant={view === 'month' ? 'default' : 'ghost'} size="sm">Month</Button>
                    <Button onClick={() => setView('week')} variant={view === 'week' ? 'default' : 'ghost'} size="sm">Week</Button>
                    <Button onClick={() => setView('day')} variant={view === 'day' ? 'default' : 'ghost'} size="sm">Day</Button>
                </div>
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
        <CalendarLegend />
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {view === 'month' && (
                <div className="h-full">
                    {renderMonthView()}
                </div>
            )}
            {view === 'week' && (
                <div className="h-full">
                    <ScrollArea className="h-full">
                        {renderWeekView()}
                    </ScrollArea>
                </div>
            )}
            {view === 'day' && (
                <div className="h-full">
                    <ScrollArea className="h-full">
                        {renderDayView()}
                    </ScrollArea>
                </div>
            )}
        </div>
        {selectedEvent && (
            <EventDetailsDialog event={selectedEvent} setSelectedEvent={setSelectedEvent} />
        )}
    </div>
  )
}

function EventButton({ event, setSelectedEvent }: { 
  event: Event, 
  setSelectedEvent: (event: Event) => void 
}) {
  const colors = EVENT_COLORS[event.source];
  
  return (
    <Button
      variant="ghost"
      className={`w-full text-left text-xs p-1 h-6 truncate ${colors.bg} ${colors.text} ${colors.hover}`}
      onClick={() => setSelectedEvent(event)}
    >
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
        <span className="truncate">
          {format(new Date(event.startDate), 'HH:mm')} {event.title}
        </span>
      </div>
    </Button>
  );
}

function AddEventDialog({ newEvent, setNewEvent, handleAddEvent }: AddEventDialogProps) {
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
                        <Label htmlFor="eventType">Event Type</Label>
                        <select
                            id="eventType"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={newEvent.source}
                            onChange={(e) => setNewEvent({ 
                                ...newEvent, 
                                source: e.target.value as 'base' | 'free'
                            })}
                        >
                            <option value="base">Base Time</option>
                            <option value="free">Free Time</option>
                        </select>
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
    );
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
  const colors = EVENT_COLORS[event.source];
  
  return (
    <Dialog open={true} onOpenChange={() => setSelectedEvent(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start</p>
                  <p className="text-base font-semibold">{format(event.startDate, 'PPP')}</p>
                  <p className="text-sm font-medium">{format(event.startDate, 'p')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End</p>
                  <p className="text-base font-semibold">{format(event.endDate, 'PPP')}</p>
                  <p className="text-sm font-medium">{format(event.endDate, 'p')}</p>
                </div>
              </div>
              {event.description && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

const CalendarLegend = () => (
  <div className="flex items-center gap-6 text-sm mb-4 bg-white p-3 rounded-lg shadow-sm">
    {Object.entries(EVENT_COLORS).map(([source, colors]) => (
      <div key={source} className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
        <span className="font-medium capitalize">{source} Events</span>
      </div>
    ))}
  </div>
);

// Helper function to check if two time periods overlap
const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return start1 < end2 && end1 > start2;
};