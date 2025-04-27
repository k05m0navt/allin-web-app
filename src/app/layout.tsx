import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNavigation } from "@/components/Navigation/main-navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "All In Poker Club",
  description: "Poker tournament management and tracking platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description as string} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background text-foreground")}>  
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <MainNavigation />
            <main className="min-h-[80vh] pb-8 pt-2 px-2 sm:px-0">{children}</main>
          </SessionProvider>
          <Toaster />
          <footer className="container mx-auto py-6 text-center text-xs text-muted-foreground px-2">
            &copy; {new Date().getFullYear()} All In Poker Club
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
