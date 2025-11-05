import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Footprints } from 'lucide-react';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-foreground", className)}>
      <Footprints className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold font-headline">Rundex</span>
    </Link>
  );
}
