// src/components/topic-card.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface TopicCardProps {
  title: string;
  description: string;
  href: string;
  progress?: number;
  imageUrl?: string; // Changed from 'image' to 'imageUrl' and made it a string
}

export function TopicCard({ title, description, href, progress, imageUrl }: TopicCardProps) {
  const hasProgress = typeof progress === 'number';

  return (
    <Link href={href} className="group flex flex-col h-full bg-card rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-40 w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${title} cover image`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="bg-muted h-full w-full flex items-center justify-center">
             <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold font-headline mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 flex-grow">{description}</p>
        
        {hasProgress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-bold text-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
        
        <div className="mt-auto">
             <Button className="w-full">
                 Start Learning <ArrowRight className="ml-2 h-4 w-4" />
             </Button>
        </div>
      </div>
    </Link>
  );
}