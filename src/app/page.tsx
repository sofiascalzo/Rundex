import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoveRight, Zap } from "lucide-react";
import Logo from "@/components/logo";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-card">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Logo />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-block rounded-lg bg-card px-3 py-1 text-sm text-muted-foreground shadow-md">
            <Zap className="inline-block w-4 h-4 mr-2 text-primary" />
            Real-time Performance Metrics
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-primary">
            Rundex
          </h1>
          <p className="text-2xl font-headline font-medium md:text-3xl text-foreground">
            Run fearless.
          </p>
          <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
            Connect your sensor, track your every move, and unlock your true potential. Rundex provides cutting-edge analysis to elevate your performance.
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/login">
                Get Started
                <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Rundex. All rights reserved.</p>
      </footer>
    </div>
  );
}
