import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain, Clock, MessageCircle, Sparkles, WandSparkles } from "lucide-react";
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
          <SheetTitle className="text-xl">{email.subject || "No Subject"}</SheetTitle>
          <SheetDescription>
            <div className="flex flex-col gap-2">
              <p className="text-lg text-bold">
                From: <span className="font-semibold text-gray-900">{email.sender}</span>
              </p>
            </div>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-8">
            {/* Priority Ratings Section */}
            {email.emailAnalysis && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-100">
                  <p className="text-lg font-medium text-orange-700 mb-2">Urgency Rating</p>
                  <p className="text-4xl font-bold text-orange-500">
                    {email.emailAnalysis.urgency_rating}
                    <span className="text-xl text-orange-400">/10</span>
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
                  <p className="text-lg font-medium text-blue-700 mb-2">Importance Rating</p>
                  <p className="text-4xl font-bold text-blue-500">
                    {email.emailAnalysis.importance_rating}
                    <span className="text-xl text-blue-400">/10</span>
                  </p>
                </div>
              </div>
            )}

            {/* Time Estimate Section */}
            {email.emailAnalysis?.time_estimate && (
              <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-bold">Time Estimate</h3>
                </div>
                <p className="text-lg">{email.emailAnalysis.time_estimate}</p>
              </div>
            )}

            {/* Email Analysis Section */}
            {email.emailAnalysis && (
              <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <WandSparkles className="h-6 w-6 text-indigo-500" />
                  <h3 className="text-xl font-bold">AI Email Analysis</h3>
                </div>
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-base leading-relaxed">{email.emailAnalysis.summary}</p>
                  </div>

                  {email.emailAnalysis.categories && (
                    <div className="space-y-3">
                      <p className="text-lg font-medium">Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {email.emailAnalysis.categories.map((category, index) => (
                          <span 
                            key={index} 
                            className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-base border border-indigo-100"
                          >
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
            <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="h-6 w-6 text-green-500" />
                <h3 className="text-xl font-bold">Reply Information</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-lg font-medium mb-2">Is Reply Required?</p>
                  <p className="text-base">{email.finalEmail ? "Yes" : "No"}</p>
                </div>

                {email.replyReason && email.finalEmail && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-lg font-medium mb-2">Reason:</p>
                    <p className="text-base">{email.replyReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Generated Reply */}
            {email.finalEmail && (
              <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                  <h3 className="text-xl font-bold">AI Generated Reply</h3>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{email.finalEmail}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 