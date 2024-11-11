"use client"

import React, { useState, useEffect } from 'react'
import { addDays, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, startOfWeek, endOfWeek, addWeeks, setHours, setMinutes, isSameWeek, parseISO, isWithinInterval } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Upload, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

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

// Add these helper functions at the top level
const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return start1 < end2 && end1 > start2;
};

const checkEventConflicts = (newEvent: Event, existingEvents: Event[]) => {
    return existingEvents.some(existingEvent => 
        isOverlapping(
            new Date(newEvent.startDate),
            new Date(newEvent.endDate),
            new Date(existingEvent.startDate),
            new Date(existingEvent.endDate)
        )
    );
};

// Function to validate event placement
const validateEventPlacement = async (userId: string, newEvent: Event) => {
    // Get all base events
    const { data: baseEventsData } = await supabase
        .from('BaseCalendarEvents')
        .select('json_response')
        .eq('user_id', userId)
        .single();

    const baseEvents = baseEventsData?.json_response?.events || [];

    // Check if the new event conflicts with any base events
    const hasBaseConflict = checkEventConflicts(newEvent, baseEvents);

    if (hasBaseConflict) {
        return {
            valid: false,
            message: "This time slot conflicts with a base event"
        };
    }

    // If it's an assignment event, check if it overlaps with any free time
    if (newEvent.source === 'assignment') {
        const { data: freeTimeData } = await supabase
            .from('FreeTimeCal')
            .select('json_response')
            .eq('user_id', userId)
            .single();

        const freeTimeEvents = freeTimeData?.json_response?.events || [];
        const hasFreetimeOverlap = checkEventConflicts(newEvent, freeTimeEvents);

        if (!hasFreetimeOverlap) {
            return {
                valid: false,
                message: "Assignment must be scheduled during free time"
            };
        }
    }

    return { valid: true };
};

export default function MinimalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({ title: '', startDate: new Date(), endDate: new Date(), description: '', source: 'base' })
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [view, setView] = useState<CalendarView>('week')
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

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
            const [baseEvents, freeTimeEvents, assignmentEvents] = await Promise.all([
                supabase
                    .from('BaseCalendarEvents')
                    .select('json_response')
                    .eq('user_id', userId),

                supabase
                    .from('FreeTimeCal')
                    .select('json_response')
                    .eq('user_id', userId),

                supabase
                    .from('AssignmentCal')
                    .select('json_response')
                    .eq('user_id', userId)
            ]);

            let allEvents: Event[] = [];

            // Process base events first (they take precedence)
            if (baseEvents.data && baseEvents.data.length > 0 && baseEvents.data[0].json_response?.events) {
                const events = baseEvents.data[0].json_response.events.map((event: any) => ({
                    ...event,
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    source: 'base' as EventSource
                }));
                allEvents = [...allEvents, ...events];
                console.log("Base events fetched:", events);
            }

            // Process free time events that don't conflict with base events
            if (freeTimeEvents.data && freeTimeEvents.data.length > 0 && freeTimeEvents.data[0].json_response?.events) {
                const freeEvents = freeTimeEvents.data[0].json_response.events
                    .filter((freeEvent: Event) => !checkEventConflicts(freeEvent, allEvents))
                    .map((event: any) => ({
                        ...event,
                        startDate: new Date(event.startDate),
                        endDate: new Date(event.endDate),
                        source: 'free' as EventSource
                    }));
                allEvents = [...allEvents, ...freeEvents];
                console.log("Free time events fetched:", freeEvents);
            }

            // Process assignment events that overlap with free time and don't conflict with base events
            if (assignmentEvents.data && assignmentEvents.data.length > 0 && assignmentEvents.data[0].json_response?.events) {
                const assignmentEvts = assignmentEvents.data[0].json_response.events
                    .filter((assignmentEvent: Event) => {
                        const baseEventsArray = baseEvents.data?.[0]?.json_response?.events || [];
                        const freeTimeEventsArray = freeTimeEvents.data?.[0]?.json_response?.events || [];
                        
                        const hasBaseConflict = checkEventConflicts(assignmentEvent, baseEventsArray);
                        const hasFreeTimeOverlap = checkEventConflicts(assignmentEvent, freeTimeEventsArray);
                        
                        return !hasBaseConflict && hasFreeTimeOverlap;
                    })
                    .map((event: any) => ({
                        ...event,
                        startDate: new Date(event.startDate),
                        endDate: new Date(event.endDate),
                        source: 'assignment' as EventSource
                    }));
                allEvents = [...allEvents, ...assignmentEvts];
                console.log("Assignment events fetched:", assignmentEvts);
            }

            // Log any errors but don't fail
            if (baseEvents.error) console.log("Base events error:", baseEvents.error);
            if (freeTimeEvents.error) console.log("Free time events error:", freeTimeEvents.error);
            if (assignmentEvents.error) console.log("Assignment events error:", assignmentEvents.error);

            // Set all events
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

  // Update handleAddEvent to use fetchCalenderEvents instead of fetchAllEvents
  const handleAddEvent = async () => {
    const event: Event = { 
        ...newEvent, 
        id: Date.now().toString()
    };
    
    try {
        if (userId) {
            // Validate event placement
            const validation = await validateEventPlacement(userId, event);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }

            // Get existing events of the same type
            const { data: existingData } = await supabase
                .from(event.source === 'base' ? 'BaseCalendarEvents' : 
                      event.source === 'free' ? 'FreeTimeCal' : 'AssignmentCal')
                .select('json_response')
                .eq('user_id', userId)
                .single();

            let allEvents: Event[] = [];
            if (existingData?.json_response?.events) {
                allEvents = [...existingData.json_response.events] as Event[];
            }

            // Add the new event
            allEvents.push(event);

            // If it's a base event, remove any conflicting free time or assignment events
            if (event.source === 'base') {
                await removeConflictingEvents(userId, event);
            }

            // Update the database
            const { error: insertError } = await supabase
                .from(event.source === 'base' ? 'BaseCalendarEvents' : 
                      event.source === 'free' ? 'FreeTimeCal' : 'AssignmentCal')
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
                // Refresh all events using the existing function
                await fetchCalenderEvents(userId);
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
    try {
        console.log("Starting file import process...");
        
        // 1. Read the file
        const text = await file.text();
        console.log("File read successfully");

        // 2. Parse the ICS file
        const parsedEvents = parseICS(text);
        console.log("Parsed events:", parsedEvents);

        if (!parsedEvents.length) {
            console.error("No events were parsed from the file");
            return;
        }

        // 3. Add IDs and prepare events for saving
        const newEvents = parsedEvents.map(event => ({
            ...event,
            id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        console.log("Prepared events for saving:", newEvents);

        // 4. Save to Supabase
        await saveBaseEventsToSupabase(newEvents);

        // 5. Update local state only after successful save
        setEvents(prevEvents => {
            const updatedEvents = [...prevEvents, ...newEvents];
            console.log("Updated local state with new events:", updatedEvents);
            return updatedEvents;
        });

    } catch (error) {
        console.error("Error in handleImportEvents:", error);
        alert("Failed to import events. Please try again.");
    }
};

  const saveBaseEventsToSupabase = async (newEvents: Event[]) => {
    if (!userId) {
        console.error("No user ID available");
        return;
    }

    try {
        console.log("Starting saveBaseEventsToSupabase...");
        
        // 1. Fetch existing base events
        const { data: existingBaseData, error: baseError } = await supabase
            .from('BaseCalendarEvents')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (baseError && baseError.code !== 'PGRST116') {
            console.error("Error fetching base events:", baseError);
            throw new Error(`Failed to fetch base events: ${baseError.message}`);
        }

        // 2. Combine existing and new events
        let allBaseEvents: Event[] = [];
        if (existingBaseData?.json_response?.events) {
            allBaseEvents = [...existingBaseData.json_response.events];
            console.log("Existing base events:", allBaseEvents);
        }
        
        allBaseEvents = [...allBaseEvents, ...newEvents];
        console.log("Combined events:", allBaseEvents);

        // 3. Delete existing record if it exists
        if (existingBaseData) {
            const { error: deleteError } = await supabase
                .from('BaseCalendarEvents')
                .delete()
                .eq('user_id', userId);

            if (deleteError) {
                console.error("Error deleting existing events:", deleteError);
                throw new Error(`Failed to delete existing events: ${deleteError.message}`);
            }
        }

        // 4. Insert new record
        const { error: insertError } = await supabase
            .from('BaseCalendarEvents')
            .insert({
                user_id: userId,
                json_response: {
                    events: allBaseEvents
                }
            });

        if (insertError) {
            console.error("Error inserting base events:", insertError);
            throw new Error(`Failed to insert base events: ${insertError.message}`);
        }

        console.log("Successfully saved all events to Supabase");
        return { allBaseEvents };

    } catch (error) {
        console.error("Error in saveBaseEventsToSupabase:", error);
        throw error;
    }
};

  const parseICS = (icsText: string): Omit<Event, 'id'>[] => {
    const events: Omit<Event, 'id'>[] = [];
    const lines = icsText.split('\n');
    let currentEvent: Partial<Omit<Event, 'id'>> = {};

    const parseDateTime = (dateTimeStr: string): Date => {
        // Remove any TZID if present
        const cleanStr = dateTimeStr.includes(':') ? dateTimeStr.split(':').pop()! : dateTimeStr;
        
        // Parse the date string
        const year = parseInt(cleanStr.substr(0, 4));
        const month = parseInt(cleanStr.substr(4, 2)) - 1; // months are 0-based
        const day = parseInt(cleanStr.substr(6, 2));
        const hour = parseInt(cleanStr.substr(9, 2));
        const minute = parseInt(cleanStr.substr(11, 2));
        const second = parseInt(cleanStr.substr(13, 2));

        return new Date(year, month, day, hour, minute, second);
    };

    lines.forEach(line => {
        const cleanLine = line.trim();
        
        if (cleanLine.startsWith('BEGIN:VEVENT')) {
            currentEvent = { source: 'base' as EventSource };
        } else if (cleanLine.startsWith('END:VEVENT')) {
            if (currentEvent.title && currentEvent.startDate && currentEvent.endDate) {
                events.push({
                    ...currentEvent,
                    source: 'base' as EventSource,
                    description: currentEvent.description || '',
                    title: currentEvent.title,
                    startDate: currentEvent.startDate,
                    endDate: currentEvent.endDate
                } as Omit<Event, 'id'>);
            }
            currentEvent = { source: 'base' as EventSource };
        } else if (cleanLine.startsWith('SUMMARY:')) {
            currentEvent.title = cleanLine.replace('SUMMARY:', '').trim();
        } else if (cleanLine.startsWith('DESCRIPTION:')) {
            currentEvent.description = cleanLine.replace('DESCRIPTION:', '').trim();
        } else if (cleanLine.startsWith('DTSTART')) {
            try {
                currentEvent.startDate = parseDateTime(cleanLine.split(':').pop()!);
            } catch (error) {
                console.error('Error parsing start date:', error, cleanLine);
            }
        } else if (cleanLine.startsWith('DTEND')) {
            try {
                currentEvent.endDate = parseDateTime(cleanLine.split(':').pop()!);
            } catch (error) {
                console.error('Error parsing end date:', error, cleanLine);
            }
        }
    });

    console.log("Parsed events:", events);
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
          <div key={`header-${day}`} className="bg-white p-3 text-sm font-semibold text-gray-600">
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
              key={`day-${day.toISOString()}`}
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
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div key={`${event.id}-${eventIndex}-${day.toISOString()}`}>
                    {renderEventInCell(event, day.toISOString())}
                  </div>
                ))}
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
                            key={`header-${day.toISOString()}`}
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
                    <React.Fragment key={`hour-${hour}`}>
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
                                    key={`cell-${day.toISOString()}-${hour}`}
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
                                                key={`event-${event.id}-${hour}`}
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

  const renderEventInCell = (event: Event, dayString: string) => {
    const source = event.source && EVENT_COLORS.hasOwnProperty(event.source) 
        ? event.source 
        : 'base';
    
    const colors = EVENT_COLORS[source];
    const eventId = typeof event.id === 'number' ? `event-${event.id}` : event.id;
    const startDate = new Date(event.startDate);
    
    return (
        <div 
            key={`${eventId}-${dayString}-${startDate.toISOString()}`}
            className={`flex items-center gap-1 px-2 py-1 rounded-md mb-1 ${colors.bg} ${colors.text} hover:opacity-90 cursor-pointer transition-opacity`}
            onClick={() => setSelectedEvent(event)}
        >
            <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`}></span>
            <span className="truncate text-sm font-medium">
                {format(startDate, 'HH:mm')} {event.title}
            </span>
        </div>
    );
};

  const handleAIPrioritization = async () => {
    if (!userId) {
        toast.error("Please log in to use AI prioritization");
        return;
    }

    try {
        setIsAIProcessing(true);
        toast.info("AI is analyzing your schedule. This may take up to 5 minutes.", {
            duration: 10000,
        });

        const response = await fetch('http://localhost:7777/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
            }),
        });

        if (response.ok) {
            // Start polling for completion
            const pollInterval = setInterval(async () => {
                const pollResponse = await fetch(`http://localhost:7777/schedule/status?user_id=${userId}`);
                const status = await pollResponse.json();
                
                if (status.completed) {
                    clearInterval(pollInterval);
                    setIsAIProcessing(false);
                    await fetchCalenderEvents(userId);
                    toast.success("Schedule has been optimized by AI!", {
                        description: "Your calendar has been updated with the new prioritized schedule."
                    });
                }
            }, 30000); // Poll every 30 seconds

            // Clear interval after 6 minutes (timeout)
            setTimeout(() => {
                clearInterval(pollInterval);
                if (isAIProcessing) {
                    setIsAIProcessing(false);
                    toast.error("AI prioritization is taking longer than expected. Please try again.");
                }
            }, 360000);

        } else {
            throw new Error("Failed to start AI prioritization");
        }
    } catch (error) {
        console.error("Error in AI prioritization:", error);
        setIsAIProcessing(false);
        toast.error("Failed to prioritize schedule. Please try again.");
    }
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
                <Button
                    onClick={handleAIPrioritization}
                    disabled={isAIProcessing}
                    className={`
                        relative overflow-hidden
                        ${isAIProcessing ? 'animate-pulse' : 'animate-shimmer'}
                        bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                        text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600
                    `}
                    size="sm"
                >
                    {isAIProcessing ? (
                        <>
                            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                            AI Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4 animate-bounce" />
                            Prioritize with AI
                        </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
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
  const source = event.source && EVENT_COLORS.hasOwnProperty(event.source) 
      ? event.source 
      : 'base';
  const colors = EVENT_COLORS[source];
  const startDate = new Date(event.startDate); // Convert string to Date object
  
  return (
    <Button
      variant="ghost"
      className={`w-full text-left text-xs p-1 h-6 truncate ${colors.bg} ${colors.text} ${colors.hover}`}
      onClick={() => setSelectedEvent(event)}
    >
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
        <span className="truncate">
          {format(startDate, 'HH:mm')} {event.title}
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

function EventDetailsDialog({ event, setSelectedEvent }: { 
    event: Event, 
    setSelectedEvent: (event: Event | null) => void 
}) {
    const source = event.source && EVENT_COLORS.hasOwnProperty(event.source) 
        ? event.source 
        : 'base';
    const colors = EVENT_COLORS[source];
    
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

// Function to remove conflicting events
const removeConflictingEvents = async (userId: string, baseEvent: Event) => {
    try {
        // Get free time events
        const { data: freeTimeData } = await supabase
            .from('FreeTimeCal')
            .select('json_response')
            .eq('user_id', userId)
            .single();

        // Get assignment events
        const { data: assignmentData } = await supabase
            .from('AssignmentCal')
            .select('json_response')
            .eq('user_id', userId)
            .single();

        // Filter out conflicting events
        if (freeTimeData?.json_response?.events) {
            const filteredFreeTime = freeTimeData.json_response.events.filter((event: Event) => 
                !checkEventConflicts(baseEvent, [event])
            );

            await supabase
                .from('FreeTimeCal')
                .upsert({
                    user_id: userId,
                    json_response: { events: filteredFreeTime }
                }, {
                    onConflict: 'user_id'
                });
        }

        if (assignmentData?.json_response?.events) {
            const filteredAssignments = assignmentData.json_response.events.filter((event: Event) => 
                !checkEventConflicts(baseEvent, [event])
            );

            await supabase
                .from('AssignmentCal')
                .upsert({
                    user_id: userId,
                    json_response: { events: filteredAssignments }
                }, {
                    onConflict: 'user_id'
                });
        }
    } catch (error) {
        console.error("Error removing conflicting events:", error);
    }
};