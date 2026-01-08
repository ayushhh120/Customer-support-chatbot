import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorState = ({ onRetry }) => {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl rounded-tl-md px-4 py-3">
          <p className="text-sm text-destructive font-medium mb-1">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            I'm having trouble processing your request. Please try again.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Try again
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
