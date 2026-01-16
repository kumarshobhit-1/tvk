"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, Key } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          <div className="flex justify-center mb-4">
            <Key className="h-20 w-20 text-primary opacity-20" />
          </div>
          <h1 className="text-8xl md:text-9xl font-bold text-primary">404</h1>
          <h2 className="text-2xl md:text-4xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track!
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Link href="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/dsa">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4" />
              Browse DSA
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="ghost" 
            className="gap-2 w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        
        <div className="pt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Need help? Check out our{' '}
            <Link href="/about" className="text-primary hover:underline font-medium">
              About page
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-primary hover:underline font-medium">
              contact us
            </Link>
            .
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/cs" className="hover:text-primary transition-colors">CS Subjects</Link>
            <span>•</span>
            <Link href="/playground" className="hover:text-primary transition-colors">Playground</Link>
            <span>•</span>
            <Link href="/exam" className="hover:text-primary transition-colors">Exams</Link>
          </div>
        </div>
      </div>
    </div>
  );
}