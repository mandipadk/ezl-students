import { useState, useEffect } from "react";
import { TriangleAlert, AlertCircle, Mail, Sparkles, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';
import { EmailDetailsSheet } from "./EmailDetailsSheet";
import { toast } from "sonner";


// Updated Email type definition to include all fields from the JSON response
export type Email = {
  id: string | number;
  subject?: string; // Optional since it may not be present in the response
  sender?: string; // Optional since it may not be present in the response
  time?: string; // Optional since it may not be present in the response
  urgency?: "urgent" | "important" | "normal"; // Optional since it may not be present in the response
  draftContent?: string;
  requiresReply?: boolean;
  replyReason?: string;
  receivedTime?: string;
  finalEmail?: string;
  emailAnalysis?: {
    summary?: string;
    categories?: string[];
    urgency_rating?: number;
    time_estimate?: string;
    importance_rating?: number;
  };
  emailCategory?: string;
  researchInfo?: string[];
  draftEmailFeedback?: any;
  numSteps?: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EmailCard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [provider_token, setProviderToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchEmails(userId);
      const interval = setInterval(() => fetchEmails(userId), 120000); // Fetch emails every 20 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    const url = new URL(window.location.href.replace('#', '?'));
    const accessToken = url.searchParams.get("access_token");
    const refreshToken = url.searchParams.get("refresh_token");
    const provider_token = url.searchParams.get("provider_token");
    const provider_refresh_token = url.searchParams.get("provider_refresh_token");
    setProviderToken(provider_token);

    if ((accessToken && refreshToken) || (provider_token && provider_refresh_token)) {
      supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken!
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error setting session:", error);
        } else {
          const userId = data.session?.user?.id;
          if (userId) {
            setUserId(userId);
            const oauthData = {
              access_token: provider_token,
              user_id: userId,
            };
            sendOAuthDataToBackend(oauthData);
            setIsAuthenticated(true);
            router.push('/dashboard');
          } else {
            console.error("User ID not found in session data");
          }
        }
      });
    }
  }, []);

  const checkAuthentication = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking authentication:", error);
    } else {
      setIsAuthenticated(!!data.session);
      if (data.session?.user?.id) {
        setUserId(data.session.user.id);
      }
    }
  };

  const fetchEmails = async (user_id: string) => {
    try {
      console.log("fetching emails for user_id:", user_id);
      const { data, error } = await supabase.from("Emails").select("json_response").eq("user_id", user_id);
      if (error) {
        console.error("Error fetching emails:", error.message);
        setErrorMessage("Failed to fetch emails. Please try again later.");
      } else if (data) {
        console.log("data:", data);
        const parsedEmails = data.map((email: any) => {
          try {
            console.log("Trying to parse email:", email);
            // Check if json_response is an object
            console.log(typeof email.json_response)
            if (typeof email.json_response === 'object' && email.json_response !== null) {
              const jsonResponse = email.json_response;
              console.log("jsonResponse:", jsonResponse);
              setIsListening(false);
              return {
                id: user_id, // Use the user_id from the function parameter
                subject: jsonResponse.subject,
                sender: jsonResponse.sender,
                time: new Date(jsonResponse.received_time * 1000).toLocaleTimeString(),
                draftContent: jsonResponse.draft_content,
                requiresReply: jsonResponse.requires_reply,
                replyReason: jsonResponse.reply_reason,
                receivedTime: jsonResponse.received_time,
                finalEmail: jsonResponse.final_email,
                emailAnalysis: jsonResponse.email_analysis,
                emailCategory: jsonResponse.email_category,
                researchInfo: jsonResponse.research_info,
                draftEmailFeedback: jsonResponse.draft_email_feedback,
                numSteps: jsonResponse.num_steps,
                urgency: jsonResponse.email_analysis?.urgency_rating > 7 ? "urgent" : jsonResponse.email_analysis?.urgency_rating > 4 ? "important" : "normal"
              } as Email; // Ensure the returned object matches the Email type
            } else {
              console.error("Invalid JSON response:", email.json_response);
              return null;
            }
          } catch (parseError) {
            console.error("Error parsing email JSON response:", parseError);
            return null;
          }
        }).filter(email => email !== null) as Email[]; // Cast to Email[]
        setEmails(parsedEmails);
      } else {
        console.warn("No data returned from the database.");
      }
    } catch (error) {
      console.error("Unexpected error fetching emails:", error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'offline_access openid profile email https://outlook.office.com/mail.readwrite',
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        },
      });
      if (error) {
        console.error("Error logging in:", error);
      } else {
        if (data && data.url) {
          console.log(data.url);
        } else {
          console.warn("Data or data.url is undefined");
        }
      }
    } 
    catch (error) {
      console.error("Unexpected error during login:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
      } else {
        setIsAuthenticated(false);
        setIsListening(false);
        setErrorMessage("");
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
    }
  };

  const sendOAuthDataToBackend = async (oauthData: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/start-email-polling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(oauthData),
      });
      if (!response.ok) {
        throw new Error('Failed to send OAuth data to backend');
      } else {
        const responseData = await response.json();
        if (responseData.status === "success") {
          setIsListening(true);
        } else {
          setErrorMessage("Oops, some error occurred! Try logging out and logging in again.");
        }
      }
    } catch (error) {
      console.error("Error sending OAuth data to backend:", error);
      setErrorMessage("Oops, some error occurred! Try logging out and logging in again.");
    }
  };

  // Helper function to filter emails by urgency
  const filterEmailsByUrgency = (urgency: Email["urgency"]) =>
    emails.filter((email) => email.urgency === urgency);

  // Helper function to render email list
  const renderEmailList = (emailList: Email[]) => (
    <ScrollArea className="h-[250px]">
      {emailList.map((email) => (
        <div key={email.id} className="flex items-center gap-4 mt-4 mb-4">
          <Mail className="h-6 w-6 text-blue-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate">
              <p className="text-sm font-medium leading-none mb-1">{email.subject}</p>
              <p className="text-sm text-muted-foreground">{email.sender}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEmail(email);
              setSheetOpen(true);
            }}
            className="flex-shrink-0"
          >
            Details
          </Button>
          <span className="text-xs text-muted-foreground flex-shrink-0 w-16 text-right">{email.time}</span>
        </div>
      ))}
      {selectedEmail && (
        <EmailDetailsSheet 
          email={selectedEmail}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </ScrollArea>
  );

  // Sample emails to display when not authenticated
  const sampleEmails: Email[] = [
    { id: 1, subject: "Welcome to our service", sender: "noreply@service.com", time: "10:00 AM", urgency: "normal" },
    { id: 2, subject: "Important Update", sender: "updates@service.com", time: "11:00 AM", urgency: "important" },
    { id: 3, subject: "Urgent: Action Required", sender: "alerts@service.com", time: "12:00 PM", urgency: "urgent" },
    { id: 4, subject: "Weekly Newsletter", sender: "newsletter@service.com", time: "1:00 PM", urgency: "normal" },
    { id: 5, subject: "System Maintenance", sender: "support@service.com", time: "2:00 PM", urgency: "important" },
    { id: 6, subject: "Security Alert", sender: "security@service.com", time: "3:00 PM", urgency: "urgent" },
    { id: 7, subject: "New Features Released", sender: "features@service.com", time: "4:00 PM", urgency: "normal" },
    { id: 8, subject: "Account Verification", sender: "verify@service.com", time: "5:00 PM", urgency: "important" },
    { id: 9, subject: "Critical Bug Fix", sender: "bugs@service.com", time: "6:00 PM", urgency: "urgent" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Emails</CardTitle>
          <CardDescription>Your recent communications</CardDescription>
        </div>
        <div className="flex gap-2">
          {isAuthenticated && (
            <>
              <Button 
                variant="secondary" 
                // size="sm" 
                onClick={async () => {
                  try {
                    const token = provider_token;

                    if (!token) {
                      throw new Error("No access token found");
                    }
                    
                    toast(
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Training AI with your emails...
                      </div>
                    );

                    const response = await fetch('https://d8wpi37yt3.execute-api.us-east-1.amazonaws.com/create_vector_store', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        user_id: userId,
                        access_token: token,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || "Failed to start AI training");
                    }

                    toast.success("AI training started successfully!", {
                      description: "This process may take a few minutes.",
                      duration: 5000,
                    });
                  } catch (error) {
                    if (error instanceof Error) {
                      console.error("Error training AI:", error);
                      toast.error("Failed to start AI training", {
                        description: error.message || "Please try again later.",
                        duration: 5000,
                      });
                    }
                  }
                }}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Train Email AI
              </Button>
              {/* <Button onClick={handleLogout} variant="destructive">
            Logout
            </Button> */}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {!isAuthenticated && (
            <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm flex justify-center items-center z-10">
              <Button onClick={handleLogin} className="bg-opacity-50 backdrop-blur">
                Login with Outlook
              </Button>
            </div>
          )}
          <Tabs defaultValue="urgent" className="w-full">
            <TabsList className="grid w-full grid-cols-3 relative z-20">
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
              <ScrollArea className="h-[250px]">
                {isListening ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Listening for new emails....</p>
                  </div>
                ) : errorMessage ? (
                  <div className="flex justify-center items-center h-full">
                    <p>{errorMessage}</p>
                  </div>
                ) : (
                  renderEmailList(isAuthenticated ? filterEmailsByUrgency("urgent") : sampleEmails.filter(email => email.urgency === "urgent"))
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="important">
              <ScrollArea className="h-[250px]">
                {isListening ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Listening for new emails....</p>
                  </div>
                ) : errorMessage ? (
                  <div className="flex justify-center items-center h-full">
                    <p>{errorMessage}</p>
                  </div>
                ) : (
                  renderEmailList(isAuthenticated ? filterEmailsByUrgency("important") : sampleEmails.filter(email => email.urgency === "important"))
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="normal">
              <ScrollArea className="h-[250px]">
                {isListening ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Listening for new emails....</p>
                  </div>
                ) : errorMessage ? (
                  <div className="flex justify-center items-center h-full">
                    <p>{errorMessage}</p>
                  </div>
                ) : (
                  renderEmailList(isAuthenticated ? filterEmailsByUrgency("normal") : sampleEmails.filter(email => email.urgency === "normal"))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}