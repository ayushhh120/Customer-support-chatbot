import React from "react";
import { MessageCircle, Zap, Shield, Clock } from "lucide-react";

const EmptyState = ({ onSuggestionClick, disabled = false }) => {
  const features = [
    { icon: Zap, label: "Instant Responses", description: "Get help in seconds" },
    { icon: Shield, label: "Secure & Private", description: "Your data is protected" },
    { icon: Clock, label: "24/7 Available", description: "Support anytime" },
  ];

  const suggestions = ["Track my order", "Refund request", "Account help"];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-1 animate-fade-in-up overflow-hidden">
      <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow">
        <MessageCircle className="w-10 h-10 text-primary-foreground" />
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 text-center">Welcome to Chat Support</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8 text-sm">
        How can I assist you today? I'm here to help with any issues you might have.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
        {features.map((feature, index) => (
          <div
            key={feature.label}
            className="glass rounded-xl p-4 text-center hover:shadow-soft transition-all duration-300 cursor-default"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <h3 className="text-sm font-medium text-foreground">{feature.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            type="button"
            disabled={disabled}
            onClick={() => onSuggestionClick?.(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
