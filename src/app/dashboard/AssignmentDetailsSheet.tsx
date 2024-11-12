import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
    Clock, 
    GraduationCap, 
    Calendar, 
    FileText, 
    AlertCircle,
    Brain,
    ListChecks,
    BookOpen,
    Target,
    Workflow,
    Link2,
    Calendar as CalendarIcon
} from "lucide-react";
import { Assignment } from "./AssignmentCard";

interface AssignmentDetailsSheetProps {
    assignment: Assignment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatTimeRemaining = (timeStr: string) => {
    if (!timeStr) return "No due date";

    // Check if it's overdue (starts with negative)
    const isOverdue = timeStr.startsWith('-');
    
    // Remove the negative sign if present
    const cleanTimeStr = timeStr.replace('-', '');
    
    // Split into days and time
    const [days, time] = cleanTimeStr.split(', ');
    const daysNum = parseInt(days);
    
    if (time) {
        // Split time into hours, minutes
        const [hours] = time.split(':');
        const hoursNum = parseInt(hours);

        if (isOverdue) {
            return (
                <span className="text-red-500 font-medium">
                    Overdue by {daysNum} {daysNum === 1 ? 'day' : 'days'}
                    {hoursNum > 0 ? ` and ${hoursNum} ${hoursNum === 1 ? 'hour' : 'hours'}` : ''}
                </span>
            );
        }

        return (
            <span>
                {daysNum} {daysNum === 1 ? 'day' : 'days'}
                {hoursNum > 0 ? ` and ${hoursNum} ${hoursNum === 1 ? 'hour' : 'hours'}` : ''}
            </span>
        );
    }

    return isOverdue ? 
        <span className="text-red-500 font-medium">Overdue by {daysNum} {daysNum === 1 ? 'day' : 'days'}</span> :
        `${daysNum} ${daysNum === 1 ? 'day' : 'days'}`;
};

export function AssignmentDetailsSheet({ assignment, open, onOpenChange }: AssignmentDetailsSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90vw] sm:w-[600px] md:w-[800px]">
                <SheetHeader>
                    <SheetTitle className="text-xl">{assignment.basic_info.title}</SheetTitle>
                    <SheetDescription>
                        <div className="flex flex-col gap-2">
                            <p className="text-lg text-bold">
                                Course: <span className="font-semibold text-gray-900">{assignment.basic_info.course_name}</span>
                            </p>
                            <p className="text-base">
                                Points: {assignment.basic_info.points} • Due: {new Date(assignment.basic_info.due_date).toLocaleDateString()}
                            </p>
                            <a href={assignment.basic_info.url} target="_blank" rel="noopener noreferrer" 
                               className="text-base text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                <Link2 className="h-4 w-4" /> View in Canvas
                            </a>
                        </div>
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-200px)] mt-6">
                    <div className="space-y-8">
                        {/* Priority Ratings Section */}
                        {assignment.analysis && (
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-100">
                                    <p className="text-lg font-medium text-orange-700 mb-2">Urgency Rating</p>
                                    <p className="text-4xl font-bold text-orange-500">
                                        {assignment.analysis.urgency_rating}
                                        <span className="text-xl text-orange-400">/10</span>
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
                                    <p className="text-lg font-medium text-blue-700 mb-2">Importance Rating</p>
                                    <p className="text-4xl font-bold text-blue-500">
                                        {assignment.analysis.importance_rating}
                                        <span className="text-xl text-blue-400">/10</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Time Management Section */}
                        <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="h-6 w-6 text-blue-500" />
                                <h3 className="text-xl font-bold">Time Management</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Time Remaining:</span> 
                                    {formatTimeRemaining(assignment.time_management.time_remaining)}
                                </div>
                                <p className="text-base">
                                    <span className="font-medium">Planned Time:</span> {assignment.time_management.planned_time} hours
                                </p>
                                <p className="text-base">
                                    <span className="font-medium">Buffer Time:</span> {assignment.time_management.buffer_time}
                                </p>
                                
                                {/* Task Breakdown */}
                                <div className="mt-6">
                                    <p className="text-lg font-medium mb-3">Task Breakdown:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(assignment.time_management.task_breakdown || {}).map(([task, hours], index) => (
                                            <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                                <p className="text-base">{task}: <span className="font-semibold">{hours} hours</span></p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommended Schedule */}
                                <div className="mt-6">
                                    <p className="text-lg font-medium mb-3">Recommended Schedule:</p>
                                    <div className="space-y-3">
                                        {Object.entries(assignment.time_management.recommended_schedule || {}).map(([day, tasks], index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                <p className="text-base font-medium mb-2">{day}:</p>
                                                {typeof tasks === 'string' ? (
                                                    <p className="text-base ml-2">{tasks}</p>
                                                ) : (
                                                    <div className="ml-2 space-y-1">
                                                        {Object.entries(tasks).map(([task, time], i) => (
                                                            <p key={i} className="text-base">• {task}: {time}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Workflow Section */}
                        {assignment.workflow && (
                            <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <Workflow className="h-6 w-6 text-gray-700" />
                                    <h3 className="text-xl font-bold">Workflow</h3>
                                </div>

                                {/* Complexity Level */}
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                                    <p className="text-lg font-medium text-gray-700 mb-2">Complexity Level</p>
                                    <p className="text-4xl font-bold text-gray-700">
                                        {assignment.workflow.complexity_level}
                                        <span className="text-xl text-gray-500">/10</span>
                                    </p>
                                </div>

                                {/* Steps */}
                                <div className="space-y-4 mb-6">
                                    <p className="text-lg font-medium">Steps:</p>
                                    <div className="grid gap-3">
                                        {assignment.workflow.steps.map((step, index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-3">
                                                <span className="text-gray-700 font-semibold min-w-[24px]">{index + 1}.</span>
                                                <p className="text-base break-words">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Prerequisites */}
                                {assignment.workflow.prerequisites.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        <p className="text-lg font-medium">Prerequisites:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {assignment.workflow.prerequisites.map((prereq, index) => (
                                                <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                                    <p className="text-base break-words">{prereq}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Deliverables */}
                                {assignment.workflow.deliverables.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-lg font-medium">Deliverables:</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {assignment.workflow.deliverables.map((deliverable, index) => (
                                                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                    <p className="text-base break-words">{deliverable}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Resources Section */}
                        {assignment.resources && (
                            <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <BookOpen className="h-6 w-6 text-green-500" />
                                    <h3 className="text-xl font-bold">Resources</h3>
                                </div>

                                <div className="space-y-6">
                                    {/* Online Resources */}
                                    {Object.entries(assignment.resources.online_resources).map(([category, links]) => (
                                        links.length > 0 && (
                                            <div key={category} className="space-y-3">
                                                <p className="text-lg font-medium">
                                                    {category.split('_').map(word => 
                                                        word.charAt(0).toUpperCase() + word.slice(1)
                                                    ).join(' ')}:
                                                </p>
                                                <div className="grid gap-3">
                                                    {links.map((link, index) => (
                                                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                            <a href={link} 
                                                               target="_blank" 
                                                               rel="noopener noreferrer"
                                                               className="text-base text-blue-500 hover:text-blue-600 flex items-center gap-2">
                                                                <Link2 className="h-4 w-4" />
                                                                {link}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
} 