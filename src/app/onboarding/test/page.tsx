"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function OnboardingTest() {
  const router = useRouter();

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-sand-900 tracking-tighter mb-2">
          Test your agent
        </h1>
        <p className="text-sand-600">
          Try asking a question about the content you just added.
        </p>
      </div>

      <ChatInterface
        compact
        suggestions={[
          "What can you tell me?",
          "Summarize the knowledge base",
          "Help me understand the main topics",
        ]}
      />

      <div className="text-center mt-6">
        <Button size="lg" onClick={() => router.push("/onboarding/deploy")}>
          Continue to deploy <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
