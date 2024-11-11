import { useState, useEffect } from "react"
import { AlertCircle, Calendar, CheckCircle2, Circle, Clock, FileText, GraduationCap, Key, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { createClient } from "@supabase/supabase-js"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AssignmentDetailsSheet } from "./AssignmentDetailsSheet"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Update the Assignment type to match the exact JSON structure
export type Assignment = {
    basic_info: {
        title: string;
        course_name: string;
        due_date: string;
        points: number;
        url: string;
    };
    time_management: {
        due_date_formatted: string;
        time_remaining: string;
        planned_time: number;
        task_breakdown: Record<string, number>;
        recommended_schedule: Record<string, string | Record<string, string | number>>;
        buffer_time: string;
    };
    analysis?: {
        summary: string;
        objectives?: string[];
        key_points?: string[];
        urgency_rating: number;
        importance_rating: number;
    };
    workflow?: {
        steps: string[];
        roadmap: string[];
        resources_needed: string[];
        prerequisites: string[];
        deliverables: string[];
        completion_criteria: string[];
        complexity_level: number;
    };
    resources?: {
        required: string[];
        recommended: string[];
        tools: string[];
        references: string[];
        online_resources: {
            documentation_links: string[];
            tutorial_links: string[];
            academic_resources: string[];
            code_repositories: string[];
            video_tutorials: string[];
            additional_readings: string[];
        };
        complexity_details: {
            level: number;
            justification: string;
            factors: {
                technical_difficulty: number;
                time_intensity: number;
                research_depth: number;
                prerequisites_complexity: number;
                deliverables_count: number;
            };
        };
    };
    description?: string;
    attached_files?: {
        count: number;
        files: string[];
    };
    id?: string | number;  // Added for UI purposes
    priority: "High" | "Medium" | "Low";  // Calculated field
};

// Update sample assignments to match the new type
const sampleAssignments: Assignment[] = [
    {
        id: 1,
        basic_info: {
            title: "Math Assignment 3",
            course_name: "Advanced Calculus",
            due_date: "2024-03-20",
            points: 100,
            url: "https://canvas.example.com/math3",
        },
        description: "Complex analysis and differential equations problem set",
        time_management: {
            due_date_formatted: "2024-03-20",
            time_remaining: "5 days",
            planned_time: 4,
            task_breakdown: {
                "Problem Solving": 2,
                "Review": 1,
                "Documentation": 1
            },
            recommended_schedule: {
                "Day 1": "Problem Solving",
                "Day 2": "Review and Documentation"
            },
            buffer_time: "1 day",
        },
        analysis: {
            summary: "Comprehensive problem set covering complex analysis",
            objectives: ["Complex integration", "Residue theorem"],
            key_points: ["Complex integration", "Residue theorem"],
            urgency_rating: 8,
            importance_rating: 9,
        },
        workflow: {
            steps: ["Review lecture notes"],
            roadmap: ["Understanding of basic concepts"],
            resources_needed: ["Textbook", "Calculator"],
            prerequisites: ["Basic calculus", "Complex numbers"],
            deliverables: ["Understanding of basic concepts"],
            completion_criteria: ["Clear explanations", "Correct calculations"],
            complexity_level: 4,
        },
        priority: "High"
    },
    {
        id: 2,
        basic_info: {
            title: "Literature Review Essay",
            course_name: "English Literature",
            due_date: "2024-04-15",
            points: 75,
            url: "https://canvas.example.com/english-lit",
        },
        description: "Write a comparative analysis of two modern novels",
        time_management: {
            due_date_formatted: "2024-04-15",
            time_remaining: "3 weeks",
            planned_time: 6,
            task_breakdown: {
                "Reading": 2,
                "Research": 1,
                "Writing": 2,
                "Editing": 1
            },
            recommended_schedule: {
                "Week 1": "Reading and Research",
                "Week 2": "Writing",
                "Week 3": "Editing and Final Review"
            },
            buffer_time: "3 days",
        },
        analysis: {
            summary: "Comparative analysis focusing on themes and writing styles",
            objectives: ["Literary analysis", "Critical thinking"],
            key_points: ["Theme comparison", "Style analysis"],
            urgency_rating: 6,
            importance_rating: 7,
        },
        workflow: {
            steps: ["Read both novels", "Research critical reviews", "Write analysis"],
            roadmap: ["Complete reading", "Draft outline", "Final essay"],
            resources_needed: ["Novels", "Critical essays"],
            prerequisites: ["Reading comprehension", "Academic writing skills"],
            deliverables: ["2000-word essay"],
            completion_criteria: ["Clear argument", "Proper citations"],
            complexity_level: 3,
        },
        priority: "Medium"
    },
    {
        id: 3,
        basic_info: {
            title: "Weekly Programming Quiz",
            course_name: "Introduction to Python",
            due_date: "2024-03-25",
            points: 25,
            url: "https://canvas.example.com/python-quiz",
        },
        description: "Multiple choice quiz covering basic Python concepts",
        time_management: {
            due_date_formatted: "2024-03-25",
            time_remaining: "1 week",
            planned_time: 2,
            task_breakdown: {
                "Review Notes": 1,
                "Practice Exercises": 0.5,
                "Take Quiz": 0.5
            },
            recommended_schedule: {
                "Day 1": "Review and Practice",
                "Day 2": "Take Quiz"
            },
            buffer_time: "1 day",
        },
        analysis: {
            summary: "Basic Python concepts including variables, loops, and functions",
            objectives: ["Test Python knowledge", "Practice coding concepts"],
            key_points: ["Syntax review", "Basic algorithms"],
            urgency_rating: 3,
            importance_rating: 4,
        },
        workflow: {
            steps: ["Review class notes", "Complete practice problems", "Take quiz"],
            roadmap: ["Study materials review", "Quiz completion"],
            resources_needed: ["Course notes", "Python IDE"],
            prerequisites: ["Basic Python syntax"],
            deliverables: ["Completed quiz"],
            completion_criteria: ["Pass with 70% or higher"],
            complexity_level: 2,
        },
        priority: "Low"
    }
];

export default function AssignmentCard() {
    const [openAssignmentId, setOpenAssignmentId] = useState<number | null>(null)
    const [assignments, setAssignments] = useState<Assignment[]>(sampleAssignments)
    const [accessToken, setAccessToken] = useState("")
    const [userId, setUserId] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showTokenInput, setShowTokenInput] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tokenStatus, setTokenStatus] = useState<'unverified' | 'verified' | 'failed'>('unverified');
    const [isFetching, setIsFetching] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        checkAuthentication();
    }, []);

    useEffect(() => {
        if (isAuthenticated && userId) {
          fetchAssignments(userId);
          setTokenStatus('verified');
          const interval = setInterval(() => fetchAssignments(userId), 86400000); // Fetch assignments once a day
          return () => clearInterval(interval);
        }
      }, [isAuthenticated, userId]);

    const checkAuthentication = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Error checking authentication:", error);
        } else {
            setIsAuthenticated(!!data.session);
            if (data.session?.user?.id) {
                setUserId(data.session.user.id);
                console.log("User ID from AssignmentCard:", data.session.user.id);
            }
        }
    };

    const fetchAssignments = async (user_id: string) => {
        console.log("Fetching assignments for user:", user_id);
        try {
            const { data, error } = await supabase
                .from("CanvasEvent")
                .select("json_response")
                .eq("user_id", user_id);

            if (error) {
                console.error("Error fetching assignments:", error);
                setIsFetching(false);
                setErrorMessage("Failed to fetch assignments. Please try again.");
                return;
            }

            if (data && data.length > 0) {
                console.log("Assignments fetched:", data);
                const parsedAssignments = data.flatMap(item => {
                    try {
                        if (typeof item.json_response === 'object' && 
                            item.json_response !== null && 
                            Array.isArray(item.json_response.assignments)) {
                        
                            return item.json_response.assignments.map((assignment: {
                                    analysis: any; basic_info: any; time_management?: { due_date_formatted: string; time_remaining: string; planned_time: number; task_breakdown: Record<string, number>; recommended_schedule: Record<string, string | Record<string, string | number>>; buffer_time: string }; workflow?: { steps: string[]; roadmap: string[]; resources_needed: string[]; prerequisites: string[]; deliverables: string[]; completion_criteria: string[]; complexity_level: number }; resources?: {
                                        required: string[]; recommended: string[]; tools: string[]; references: string[]; online_resources: {
                                            documentation_links: string[]
                                            tutorial_links: string[]
                                            academic_resources: string[]
                                            code_repositories: string[]
                                            video_tutorials: string[]
                                            additional_readings: string[]
                                        }; complexity_details: {
                                            level: number
                                            justification: string
                                            factors: {
                                                technical_difficulty: number
                                                time_intensity: number
                                                research_depth: number
                                                prerequisites_complexity: number
                                                deliverables_count: number
                                            }
                                        }
                                    }; description?: string; attached_files?: { count: number; files: string[] }; id?: string | number | undefined; priority?: "High" | "Medium" | "Low"
                                }) => {
                                // Calculate priority based on urgency and importance ratings
                                const urgencyRating = assignment.analysis.urgency_rating || 0;
                                const importanceRating = assignment.analysis.importance_rating || 0;
                                let priority: "High" | "Medium" | "Low";
                                
                                if (urgencyRating >= 8 || importanceRating >= 8) {
                                    priority = "High";
                                } else if (urgencyRating >= 5 || importanceRating >= 5) {
                                    priority = "Medium";
                                } else {
                                    priority = "Low";
                                }

                                return {
                                    ...assignment,
                                    id: assignment.basic_info.url, // Using URL as unique identifier
                                    priority
                                } as Assignment;
                            });
                        }
                        return [];
                    } catch (parseError) {
                        console.error("Error parsing assignment:", parseError);
                        return [];
                    }
                }).filter(assignment => assignment !== null);

                // Sort assignments by urgency rating (descending)
                parsedAssignments.sort((a, b) => 
                    (b.analysis.urgency_rating || 0) - (a.analysis.urgency_rating || 0)
                );
                
                setAssignments(parsedAssignments);
                setIsFetching(false);
            }
            if (!data || data.length === 0) {
                setErrorMessage("No assignments found. Please try again.");
                setIsFetching(false);
            }
        } catch (error) {
            console.error("Error in fetchAssignments:", error);
            setIsFetching(false);
            setErrorMessage("An unexpected error occurred. Please try again.");
        }
    };

    const handleTokenSubmit = async () => {
        if (!accessToken || !userId) return;
        
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/canvas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: accessToken,
                    user_id: userId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === "success") {
                    setTokenStatus('verified');
                    setShowTokenInput(false);
                    setIsFetching(true);  // Start fetching state
                    await fetchAssignments(userId);
                    // setIsFetching(false); // End fetching state
                } else {
                    setTokenStatus('failed');
                    setShowTokenInput(false);
                }
            } else {
                setTokenStatus('failed');
                setShowTokenInput(false);
            }
        } catch (error) {
            console.error("Error sending access token:", error);
            setTokenStatus('failed');
            setShowTokenInput(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to render assignment list
    const renderAssignmentList = (assignmentList: Assignment[]) => (
        <div className="space-y-4">
            {assignmentList.map((assignment) => (
                <div key={assignment.id} className="flex items-center space-x-4">
                    {assignment.priority === "High" ? (
                        <Circle className="h-4 w-4 text-red-500" fill="currentColor"/>
                    ) : assignment.priority === "Medium" ? (
                        <Circle className="h-4 w-4 text-yellow-500"  />
                    ) : (
                        <Circle className="h-6 w-6 text-blue-500"/>
                    )}
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{assignment.basic_info.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Due: {new Date(assignment.basic_info.due_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            setSelectedAssignment(assignment);
                            setSheetOpen(true);
                        }}
                    >
                        View
                    </Button>
                    {/* <Button variant="secondary" size="sm">
                        Ask for Extension
                    </Button> */}
                </div>
            ))}
            {selectedAssignment && (
                <AssignmentDetailsSheet 
                    assignment={selectedAssignment}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                />
            )}
        </div>
    );

    return(
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Assignments</CardTitle>
                    <CardDescription>Your upcoming tasks</CardDescription>
                </div>
                {isAuthenticated && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setShowTokenInput(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Key className="h-4 w-4" />
                                    Set Canvas Token
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="w-80 p-4" side="left">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">How to get your Canvas token:</h4>
                                    <ol className="text-sm space-y-1 list-decimal list-inside">
                                        <li>Log in to your Canvas account</li>
                                        <li>Click on 'Account' in the global navigation</li>
                                        <li>Click on 'Settings'</li>
                                        <li>Scroll to 'Approved Integrations'</li>
                                        <li>Click 'New Access Token'</li>
                                        <li>Enter a purpose and click 'Generate Token'</li>
                                    </ol>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ScrollArea className="h-full">
                        {showTokenInput ? (
                            <div className="space-y-4 p-4">
                                <div className="space-y-2">
                                    <label htmlFor="token" className="text-sm font-medium">
                                        Enter your Canvas Access Token
                                    </label>
                                    <Input
                                        id="token"
                                        type="password"
                                        value={accessToken}
                                        onChange={(e) => setAccessToken(e.target.value)}
                                        placeholder="Enter your Canvas access token"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handleTokenSubmit} 
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Submitting..." : "Submit"}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowTokenInput(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {tokenStatus === 'verified' ? (
                                    isFetching ? (
                                        <div className="flex justify-center items-center h-full">
                                            <p>Waiting to fetch the assignments...</p>
                                        </div>
                                    ) : errorMessage ? (
                                        <div className="flex justify-center items-center h-full">
                                          <p>{errorMessage}</p>
                                        </div>
                                      ) : (
                                        renderAssignmentList(assignments)
                                    )
                                ) : (
                                    <>
                                        {renderAssignmentList(sampleAssignments)}
                                        <div className="mt-4 pt-2 border-t">
                                            <p className="text-sm text-muted-foreground text-center italic">
                                                {tokenStatus === 'failed' ? (
                                                    "Failed to verify the access token, please try again!"
                                                ) : (
                                                    "Sample data for reference, set canvas token to see your assignments!"
                                                )}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}