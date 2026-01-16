import { Key } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-lg font-bold font-headline tracking-tighter text-primary", className)}>
      <Key className="h-6 w-6 text-accent" />
      <span>TVK</span>
    </Link>
  );
}
