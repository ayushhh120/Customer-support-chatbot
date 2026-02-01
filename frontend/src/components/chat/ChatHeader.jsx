import React from "react";
import { Bot, Sparkles, ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import StatusIndicator from "./StatusIndicator";

const ChatHeader = ({ onBack }) => {
  return (
    <header className="glass-strong border-b border-border/50 px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mr-1 inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Back</span>
            </button>
          )}
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent animate-bounce-subtle" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
              Customer Support Agent
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">AI-powered support assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <StatusIndicator status="online" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
