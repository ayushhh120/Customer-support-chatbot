import React from "react";

const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-primary-foreground">AI</span>
      </div>
      <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-typing-dot-1" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-typing-dot-2" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-typing-dot-3" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
