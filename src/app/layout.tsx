// File: src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNavigation } from "@/components/Navigation/main-navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "All In Poker Club",
  description: "Poker tournament management and tracking platform",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description as string} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(inter.className, "min-h-screen")}>
        <MainNavigation />
        <main>{children}</main>
        <footer className="container mx-auto py-6 text-center">
          &copy; {new Date().getFullYear()} All In Poker Club
        </footer>
      </body>
    </html>
  );
}
