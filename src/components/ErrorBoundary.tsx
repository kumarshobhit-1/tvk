'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry)
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // If too many errors, show critical error
    if (this.state.errorCount > 5) {
      console.error('Too many errors, page may be unstable');
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  We encountered an unexpected error. Please try again.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    <summary className="font-mono cursor-pointer mb-2">Error details</summary>
                    <p className="font-mono text-red-600">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <p className="font-mono text-gray-600 mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </p>
                    )}
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
              {this.state.errorCount > 2 && (
                <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                  Multiple errors detected. Please refresh the page or contact support.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simpler functional component version for use in server components
export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Error Loading Page</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Something went wrong while loading this page.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
