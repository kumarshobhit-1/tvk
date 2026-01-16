import { Key } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Key className="h-12 w-12 text-primary animate-bounce" />
          <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading...
          </p>
          <div className="flex gap-1">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
