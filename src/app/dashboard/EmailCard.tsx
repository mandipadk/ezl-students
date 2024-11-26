import { useState, useEffect } from "react";
import { TriangleAlert, AlertCircle, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import { EmailDetailsSheet } from "./EmailDetailsSheet";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

// Improved type definitions with proper validation
export type EmailAnalysis = {
  summary?: string;
  categories?: string[];
  urgency_rating: number;
  time_estimate?: string;
  importance_rating?: number;
};

export type Email = {
  id: string;
  subject?: string;
  sender?: string;
  time?: string;
  urgency?: "urgent" | "important" | "normal";
  draftContent?: string;
  requiresReply?: boolean;
  replyReason?: string;
  receivedTime: number;
  finalEmail?: string;
  emailAnalysis?: EmailAnalysis;
  emailCategory?: string;
  researchInfo?: string[];
  draftEmailFeedback?: any;
  numSteps?: number;
};

// Type for Supabase response
type EmailResponse = {
  json_response: {
    subject: string;
    sender: string;
    received_time: number;
    draft_content: string;
    requires_reply: boolean;
    reply_reason: string;
    final_email: string;
    email_analysis: EmailAnalysis;
    email_category: string;
    research_info: string[];
    draft_email_feedback: any;
    num_steps: number;
  };
};

// Add sample emails at the top level
const sampleEmails: Email[] = [
  {
    id: "sample-1",
    subject: "Final Project Deadline Extension",
    sender: "Professor Smith",
    time: "10:30 AM",
    urgency: "urgent",
    receivedTime: Date.now(),
    emailAnalysis: {
      urgency_rating: 8,
      summary: "Professor offering deadline extension for final project",
      importance_rating: 8
    }
  },
  {
    id: "sample-2",
    subject: "Research Assistant Position Available",
    sender: "Department Head",
    time: "2:15 PM",
    urgency: "important",
    receivedTime: Date.now(),
    emailAnalysis: {
      urgency_rating: 6,
      summary: "New research position opening in the department",
      importance_rating: 7
    }
  },
  {
    id: "sample-3",
    subject: "Campus Newsletter",
    sender: "University Communications",
    time: "9:00 AM",
    urgency: "normal",
    receivedTime: Date.now(),
    emailAnalysis: {
      urgency_rating: 3,
      summary: "Weekly campus updates and events",
      importance_rating: 3
    }
  }
];

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchEmails(userId);
      const interval = setInterval(() => fetchEmails(userId), 120000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href.replace('#', '?'));
      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");
      const provider_token = url.searchParams.get("provider_token");
      const provider_refresh_token = url.searchParams.get("provider_refresh_token");
      
      if (provider_token) {
        setProviderToken(provider_token);
      }

      if ((accessToken && refreshToken) || (provider_token && provider_refresh_token)) {
        handleSessionSetup(accessToken!, refreshToken!, provider_token);
      }
    } catch (error) {
      console.error("Error processing URL parameters:", error);
      toast.error("Failed to process authentication tokens");
    }
  }, []);

  const handleSessionSetup = async (accessToken: string, refreshToken: string, providerToken: string | null) => {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) throw new Error("User ID not found in session data");

      setUserId(userId);
      setIsAuthenticated(true);

      if (providerToken) {
        await sendOAuthDataToBackend({
          access_token: providerToken,
          user_id: userId,
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error("Error setting up session:", error);
      toast.error("Failed to initialize session");
    }
  };

  const checkAuthentication = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      setIsAuthenticated(!!data.session);
      if (data.session?.user?.id) {
        setUserId(data.session.user.id);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      toast.error("Failed to verify authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmails = async (user_id: string) => {
    try {
      const { data, error } = await supabase
        .from("Emails")
        .select("json_response")
        .eq("user_id", user_id);

      if (error) throw error;

      if (data) {
        const parsedEmails = data
          .map((email: EmailResponse) => {
            try {
              if (typeof email.json_response === 'object' && email.json_response !== null) {
                const jsonResponse = email.json_response;
                const urgencyRating = jsonResponse.email_analysis.urgency_rating || 0;
                
                const parsedEmail: Email = {
                  id: user_id,
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
                  urgency: urgencyRating > 7 
                    ? "urgent" 
                    : urgencyRating > 4 
                      ? "important" 
                      : "normal"
                };
                
                return parsedEmail;
              }
              return null;
            } catch (parseError) {
              console.error("Error parsing email:", parseError);
              return null;
            }
          })
          .filter((email): email is Email => email !== null);

        setEmails(parsedEmails);
        setIsListening(false);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      setErrorMessage("Failed to fetch emails. Please try again later.");
      toast.error("Failed to fetch emails");
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

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL returned");

    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to initiate login");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setIsAuthenticated(false);
      setIsListening(false);
      setErrorMessage("");
      router.push('/dashboard');
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const sendOAuthDataToBackend = async (oauthData: { access_token: string; user_id: string }) => {
    try {
      const response = await api.email.startPolling({
        access_token: oauthData.access_token,
        user_id: oauthData.user_id
      });
      
      if (response.status === "success" || (response.data && response.data.status === "success")) {
        setIsListening(true);
        toast.success("Email polling started successfully");
      } else {
        throw new Error("Backend returned unsuccessful status");
      }
    } catch (error) {
      console.error("Backend communication error:", error);
      setErrorMessage("Failed to initialize email polling. Please try logging in again.");
      toast.error("Failed to initialize email service");
    }
  };

  const handleTrainAI = async () => {
    if (!provider_token || !userId) {
      toast.error("Missing required credentials");
      return;
    }

    try {
      toast(
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Training AI with your emails...
        </div>
      );

      await api.vectorDb.createStore({
        user_id: userId,
        access_token: provider_token,
        provider: "azure"
      });

      toast.success("AI training started successfully!", {
        description: "This process may take a few minutes.",
        duration: 5000,
      });
    } catch (error) {
      console.error("AI training error:", error);
      toast.error("Failed to start AI training", {
        description: error instanceof Error ? error.message : "Please try again later.",
        duration: 5000,
      });
    }
  };

  // Helper function to filter emails by urgency
  const filterEmailsByUrgency = (urgency: Email["urgency"]) =>
    isAuthenticated ? emails.filter((email) => email.urgency === urgency) : sampleEmails.filter((email) => email.urgency === urgency);

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
              if (isAuthenticated) {
                setSelectedEmail(email);
                setSheetOpen(true);
              } else {
                handleLogin();
              }
            }}
            className="flex-shrink-0"
          >
            Details
          </Button>
          <span className="text-xs text-muted-foreground flex-shrink-0 w-16 text-right">
            {email.time}
          </span>
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Emails</CardTitle>
            <CardDescription>Your recent communications</CardDescription>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <Button
                variant="secondary"
                onClick={handleTrainAI}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Train Email AI
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
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
              <div className="relative">
                <TabsContent value="urgent">
                  {renderEmailList(filterEmailsByUrgency("urgent"))}
                </TabsContent>
                <TabsContent value="important">
                  {renderEmailList(filterEmailsByUrgency("important"))}
                </TabsContent>
                <TabsContent value="normal">
                  {renderEmailList(filterEmailsByUrgency("normal"))}
                </TabsContent>
                {!isAuthenticated && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex justify-center items-center z-30">
                    <Button onClick={handleLogin} className="bg-opacity-50 backdrop-blur">
                      Login with Outlook...
                    </Button>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}