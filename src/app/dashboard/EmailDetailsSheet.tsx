import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain, Clock, MessageCircle } from "lucide-react";
import { Email } from "./EmailCard";

interface EmailDetailsSheetProps {
  email: Email;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDetailsSheet({ email, open, onOpenChange }: EmailDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:w-[600px] md:w-[800px]">
        <SheetHeader>
          <SheetTitle>{email.subject || "No Subject"}</SheetTitle>
          <SheetDescription>
            <p className="text-md text-bold text-muted-foreground">
              From: <span className="text-md font-semibold text-gray-900">{email.sender}</span>
            </p>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-6">
            {/* Time Estimate Section */}
            {email.emailAnalysis?.time_estimate && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-blue-500">Estimated Time Required</h3>
                </div>
                <p className="text-lg font-medium">{email.emailAnalysis.time_estimate}</p>
              </div>
            )}

            {/* Email Analysis Section */}
            {email.emailAnalysis && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 animate-pulse" />
                  <h3 className="text-lg font-bold">AI Email Analysis</h3>
                </div>
                <Separator />
                <div className="space-y-3 p-4">
                  <p className="text-sm leading-relaxed">{email.emailAnalysis.summary}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="font-medium">Urgency</p>
                      <p className="text-2xl font-bold text-orange-500">{email.emailAnalysis.urgency_rating}/10</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="font-medium">Importance</p>
                      <p className="text-2xl font-bold text-blue-500">{email.emailAnalysis.importance_rating}/10</p>
                    </div>
                  </div>
                  {email.emailAnalysis.categories && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {email.emailAnalysis.categories.map((category, index) => (
                          <span key={index} className="bg-muted px-2 py-1 rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reply Information */}
            {email.requiresReply !== undefined && (
              <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold">Is Reply Required?</h3>
                <p className="text-base font-medium">{email.requiresReply ? "Yes" : "No"}</p>
                {email.replyReason && (
                  <>
                    <p className="font-medium mt-2">Reason:</p>
                    <p className="text-sm">{email.replyReason}</p>
                  </>
                )}
              </div>
            )}

            {/* AI Generated Reply */}
            {email.finalEmail && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" /> {/* Changed Mail icon to MessageCircle */}
                  <h3 className="text-lg font-bold">AI Generated Reply</h3>
                </div>
                <Separator />
                <div className="bg-muted/20 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{email.finalEmail}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 