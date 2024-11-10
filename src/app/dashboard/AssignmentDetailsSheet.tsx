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

export function AssignmentDetailsSheet({ assignment, open, onOpenChange }: AssignmentDetailsSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90vw] sm:w-[600px] md:w-[800px]">
                <SheetHeader>
                    <SheetTitle>{assignment.basic_info.title}</SheetTitle>
                    <SheetDescription>
                        <div className="flex flex-col gap-1">
                            <p className="text-md text-bold text-muted-foreground">
                                Course: <span className="text-md font-semibold text-gray-900">{assignment.basic_info.course_name}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Points: {assignment.basic_info.points} • Due: {new Date(assignment.basic_info.due_date).toLocaleDateString()}
                            </p>
                            <a href={assignment.basic_info.url} target="_blank" rel="noopener noreferrer" 
                               className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                <Link2 className="h-3 w-3" /> View in Canvas
                            </a>
                        </div>
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-200px)] mt-6">
                    <div className="space-y-6">
                        {/* Time Management Section */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-bold">Time Management</h3>
                            </div>
                            <div className="space-y-2">
                                <p><span className="font-medium">Time Remaining:</span> {assignment.time_management.time_remaining}</p>
                                <p><span className="font-medium">Planned Time:</span> {assignment.time_management.planned_time} hours</p>
                                <p><span className="font-medium">Buffer Time:</span> {assignment.time_management.buffer_time}</p>
                                
                                {/* Task Breakdown */}
                                <div className="mt-4">
                                    <p className="font-medium mb-2">Task Breakdown:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {Object.entries(assignment.time_management.task_breakdown).map(([task, hours], index) => (
                                            <div key={index} className="bg-muted/30 p-2 rounded">
                                                <p className="text-sm">{task}: {hours} hours</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommended Schedule */}
                                <div className="mt-4">
                                    <p className="font-medium mb-2">Recommended Schedule:</p>
                                    <div className="space-y-2">
                                        {Object.entries(assignment.time_management.recommended_schedule).map(([day, tasks], index) => (
                                            <div key={index} className="bg-muted/30 p-2 rounded">
                                                <p className="text-sm font-medium">{day}:</p>
                                                {typeof tasks === 'string' ? (
                                                    <p className="text-sm ml-2">{tasks}</p>
                                                ) : (
                                                    <div className="ml-2">
                                                        {Object.entries(tasks).map(([task, time], i) => (
                                                            <p key={i} className="text-sm">• {task}: {time}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Section */}
                        {assignment.analysis && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-5 w-5" />
                                    <h3 className="text-lg font-bold">Assignment Analysis</h3>
                                </div>
                                <Separator />
                                <div className="space-y-4 p-4">
                                    <p className="text-sm leading-relaxed">{assignment.analysis.summary}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/30 p-3 rounded">
                                            <p className="font-medium">Urgency</p>
                                            <p className="text-2xl font-bold text-orange-500">
                                                {assignment.analysis.urgency_rating}/10
                                            </p>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded">
                                            <p className="font-medium">Importance</p>
                                            <p className="text-2xl font-bold text-blue-500">
                                                {assignment.analysis.importance_rating}/10
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Key Points */}
                                    {assignment.analysis.key_points && assignment.analysis.key_points.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium">Key Points:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {assignment.analysis.key_points.map((point, index) => (
                                                    <li key={index} className="text-sm">{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {/* Objectives */}
                                    {assignment.analysis.objectives && assignment.analysis.objectives.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium">Objectives:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {assignment.analysis.objectives.map((objective, index) => (
                                                    <li key={index} className="text-sm">{objective}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Workflow Section */}
                        {assignment.workflow && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Workflow className="h-5 w-5" />
                                    <h3 className="text-lg font-bold">Workflow</h3>
                                </div>
                                <Separator />
                                <div className="space-y-4 p-4">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">Complexity Level:</p>
                                        <p className="text-lg font-bold">{assignment.workflow.complexity_level}/10</p>
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-2">
                                        <p className="font-medium">Steps:</p>
                                        <div className="space-y-2">
                                            {assignment.workflow.steps.map((step, index) => (
                                                <div key={index} className="bg-muted/30 p-3 rounded">
                                                    <p className="text-sm">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prerequisites */}
                                    {assignment.workflow.prerequisites.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium">Prerequisites:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {assignment.workflow.prerequisites.map((prereq, index) => (
                                                    <li key={index} className="text-sm">{prereq}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Deliverables */}
                                    {assignment.workflow.deliverables.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium">Deliverables:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {assignment.workflow.deliverables.map((deliverable, index) => (
                                                    <li key={index} className="text-sm">{deliverable}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resources Section */}
                        {assignment.resources && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    <h3 className="text-lg font-bold">Resources</h3>
                                </div>
                                <Separator />
                                <div className="space-y-4 p-4">
                                    {/* Online Resources */}
                                    {Object.entries(assignment.resources.online_resources).map(([category, links]) => (
                                        links.length > 0 && (
                                            <div key={category} className="space-y-2">
                                                <p className="font-medium">{category.split('_').map(word => 
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                ).join(' ')}:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {links.map((link, index) => (
                                                        <li key={index}>
                                                            <a href={link} 
                                                               target="_blank" 
                                                               rel="noopener noreferrer"
                                                               className="text-sm text-blue-500 hover:text-blue-600">
                                                                {link}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
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